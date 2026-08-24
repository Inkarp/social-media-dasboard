'use client'

import { format } from 'date-fns'
import { Download, Upload } from 'lucide-react'
import { useId, useRef, useState, useTransition } from 'react'
import * as XLSX from 'xlsx'
import { importPostsAction } from '@/app/posts/actions'
import { Button, buttonClasses } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { CHANNEL_LABELS, CHANNELS } from '@/lib/channels'
import { POST_STATUSES, STATUS_LABELS } from '@/lib/status'

/** @typedef {import('@/lib/channels').Channel} Channel */
/** @typedef {import('@/lib/action-result').ImportResult} ImportResult */
/** @typedef {{ name: string }} PrincipalName */

/** Lower-cased channel id/label -> channel id, so "Twitter/X", "twitter" and "x" all resolve. */
/** @type {Record<string, Channel>} */
const CHANNEL_ALIASES = {}
for (const channel of CHANNELS) {
  CHANNEL_ALIASES[channel] = channel
  CHANNEL_ALIASES[CHANNEL_LABELS[channel].toLowerCase()] = channel
}
CHANNEL_ALIASES.x = 'twitter'

/**
 * @param {Record<string, unknown>} row
 * @param {string[]} keys
 * @returns {unknown}
 */
function pick(row, keys) {
  const byLowerKey = new Map(Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v]))
  for (const key of keys) {
    const value = byLowerKey.get(key)
    if (value !== undefined) return value
  }
  return ''
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeDate(value) {
  if (value instanceof Date) return format(value, 'yyyy-MM-dd')
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd')
    return trimmed
  }
  return ''
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeChannels(value) {
  const text = String(value ?? '').trim()
  if (text === '') return []
  return text
    .split(/[,;]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .map((token) => CHANNEL_ALIASES[token] ?? token)
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeStatus(value) {
  const text = String(value ?? '').trim().toLowerCase()
  if (text === '') return ''
  return text.replace(/[\s-]+/g, '_')
}

/** @param {Record<string, unknown>[]} json */
function rowsFromSheet(json) {
  return json.map((row) => ({
    name: String(pick(row, ['post name', 'name', 'post']) ?? '').trim(),
    description: String(pick(row, ['description']) ?? '').trim(),
    brand: String(pick(row, ['brand', 'principal']) ?? '').trim(),
    product: String(pick(row, ['product', 'product name']) ?? '').trim(),
    channels: normalizeChannels(pick(row, ['channels', 'channel'])),
    date: normalizeDate(pick(row, ['date', 'post date'])),
    status: normalizeStatus(pick(row, ['status'])),
  }))
}

/** @param {PrincipalName[]} principals */
function downloadTemplate(principals) {
  const workbook = XLSX.utils.book_new()

  const postsSheet = XLSX.utils.aoa_to_sheet([
    ['Post name', 'Description', 'Brand', 'Product', 'Channels', 'Date', 'Status'],
    [
      'Spring campaign launch',
      'Optional — free text',
      principals[0]?.name ?? 'Brand name, exactly as in Principals',
      'Optional — product name',
      'Facebook, Instagram',
      '2026-04-15',
      'Planned',
    ],
  ])
  postsSheet['!cols'] = [{ wch: 28 }, { wch: 30 }, { wch: 24 }, { wch: 20 }, { wch: 26 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(workbook, postsSheet, 'Posts')

  const referenceSheet = XLSX.utils.aoa_to_sheet([
    ['Valid brand names', 'Valid channels', 'Valid statuses'],
    ...Array.from(
      { length: Math.max(principals.length, CHANNELS.length, POST_STATUSES.length) },
      (_, i) => [
        principals[i]?.name ?? '',
        i < CHANNELS.length ? CHANNEL_LABELS[/** @type {Channel} */ (CHANNELS[i])] : '',
        i < POST_STATUSES.length
          ? STATUS_LABELS[/** @type {import('@/lib/status').PostStatus} */ (POST_STATUSES[i])]
          : '',
      ],
    ),
  ])
  referenceSheet['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(workbook, referenceSheet, 'Reference')

  XLSX.writeFile(workbook, 'inkarp-posts-template.xlsx')
}

/**
 * Bulk-import posts from a spreadsheet (brief 5.3). Parsing happens entirely in
 * the browser with the `xlsx` library already in package.json; only the
 * already-normalised rows go to the server, which validates each one again with
 * Zod before writing anything.
 *
 * @param {{ principals: PrincipalName[] }} props
 */
export function ImportDialog({ principals }) {
  const id = useId()
  const fileInput = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [result, setResult] = useState(/** @type {ImportResult | null} */ (null))
  const [isPending, startTransition] = useTransition()
  // Tracked outside React state on purpose: closing the dialog reloads the
  // page when this is true, so it doesn't need to survive a re-render, only
  // the life of this one dialog session.
  const importedSomething = useRef(false)

  function reset() {
    setError(null)
    setResult(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  /**
   * Close the dialog. If anything was actually imported, reload rather than
   * just closing — a full reload is what's guaranteed to show the new posts
   * everywhere on the page, regardless of client router-cache behaviour.
   * Shown-but-not-yet-closed results (the "N imported, N skipped" summary)
   * stay on screen until the user dismisses the dialog themselves, so they
   * get to read it before the page reloads out from under them.
   */
  function close() {
    if (importedSomething.current) {
      window.location.reload()
      return
    }
    setOpen(false)
    reset()
  }

  /** @param {File} file */
  async function handleFile(file) {
    setError(null)
    setResult(null)

    /** @type {Record<string, unknown>[]} */
    let json
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames.find((n) => n.toLowerCase() !== 'reference') ?? workbook.SheetNames[0]
      if (!sheetName) throw new Error('empty workbook')
      const sheet = workbook.Sheets[sheetName]
      if (!sheet) throw new Error('empty sheet')
      json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    } catch {
      setError('That file could not be read. Use the template and try again.')
      return
    }

    if (json.length === 0) {
      setError('That sheet has no rows.')
      return
    }

    const rows = rowsFromSheet(json)
    const formData = new FormData()
    formData.set('rows', JSON.stringify(rows))

    startTransition(async () => {
      const outcome = await importPostsAction(formData)
      setResult(outcome)
      if (outcome.ok && outcome.inserted > 0) importedSomething.current = true
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses({ variant: 'secondary' })}
      >
        <Upload aria-hidden strokeWidth={1.75} className="size-4" />
        Import
      </button>

      <Modal
        open={open}
        onClose={close}
        labelledBy={`${id}-title`}
        title="Import posts from a spreadsheet"
        description="Download the template, fill in a row per post, then upload it here."
        footer={
          <Button variant="secondary" onClick={close}>
            {importedSomething.current ? 'Close and refresh' : 'Close'}
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => downloadTemplate(principals)}
            className={buttonClasses({ variant: 'secondary' })}
          >
            <Download aria-hidden strokeWidth={1.75} className="size-4" />
            Download template
          </button>

          <div className="flex flex-col gap-2">
            <label htmlFor={`${id}-file`} className="label">
              Upload filled-in spreadsheet
            </label>
            <input
              ref={fileInput}
              id={`${id}-file`}
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={isPending}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleFile(file)
              }}
              className="text-sm text-ink-grey file:mr-3 file:rounded-control file:border file:border-hairline file:bg-ink-white file:px-3 file:py-1.5 file:text-sm file:text-ink-black"
            />
          </div>

          {isPending && <p className="text-sm text-ink-grey">Importing…</p>}

          {error && (
            <p
              role="alert"
              className="flex items-start gap-3 rounded-card border border-ink-red-12 bg-ink-red-06 px-4 py-3 text-base text-ink-black"
            >
              <span aria-hidden className="mt-1 block h-4 w-[3px] shrink-0 bg-ink-red" />
              {error}
            </p>
          )}

          {result && !result.ok && (
            <p role="alert" className="text-sm text-ink-red">
              {result.error}
            </p>
          )}

          {result && result.ok && (
            <div className="flex flex-col gap-3">
              <p className="text-base text-ink-black">
                <span className="num font-medium">{result.inserted}</span> post
                {result.inserted === 1 ? '' : 's'} imported.
              </p>
              {result.skipped.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="label">
                    {result.skipped.length} row{result.skipped.length === 1 ? '' : 's'} skipped
                  </p>
                  <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-control border border-hairline p-3">
                    {result.skipped.map((row) => (
                      <li key={row.row} className="text-sm text-ink-grey">
                        <span className="num text-ink-black">Row {row.row}</span> — {row.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
