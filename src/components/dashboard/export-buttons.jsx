'use client'

import { FORMAT_LABELS } from '@/lib/post-formats'
import { Download, Printer } from 'lucide-react'
import * as XLSX from 'xlsx'
import { buttonClasses } from '@/components/ui/button'

/** @typedef {import('@/lib/types').RollupDimension} RollupDimension */
/** @typedef {import('@/lib/types').RollupRow} RollupRow */

/** @type {{ dimension: RollupDimension, name: string }[]} */
const SHEETS = [
  { dimension: 'principal', name: 'By Principal' },
  { dimension: 'group', name: 'By Group' },
  { dimension: 'manager', name: 'By Product Manager' },
  { dimension: 'product', name: 'By Product' },
  { dimension: 'campaign', name: 'By Campaign' },
]

/**
 * "Download as a spreadsheet and as a printable PDF" (brief 5.1). Both are
 * viewer-facing — exporting a report is not an editing action, so unlike "Add
 * post" these are never gated behind `EditorOnly`.
 *
 * The spreadsheet is built client-side from the rows already on the page —
 * no extra round trip. The PDF path is `window.print()` against the print
 * stylesheet already in globals.css: every piece of chrome not meant for
 * paper carries `data-print="hide"`.
 *
 * @param {{ rows: RollupRow[], filename: string, formats?: import('@/lib/post-formats').FormatRollup[] }} props
 */
export function ExportButtons({ rows, filename, formats = [] }) {
  function exportSpreadsheet() {
    const workbook = XLSX.utils.book_new()

    for (const sheet of SHEETS) {
      const sheetRows = rows
        .filter((row) => row.dimension === sheet.dimension)
        .map((row) => ({
          Name: row.label,
          Target: row.planned,
          Implemented: row.implemented,
          Pending: row.pending,
        }))
      const worksheet = XLSX.utils.json_to_sheet(
        sheetRows.length > 0 ? sheetRows : [{ Name: 'No activity in this period', Target: '', Implemented: '', Pending: '' }],
      )
      worksheet['!cols'] = [{ wch: 32 }, { wch: 10 }, { wch: 12 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
    }

    const formatSheet = XLSX.utils.json_to_sheet(formats.map((row) => ({ Principal: row.principal_name, Format: FORMAT_LABELS[row.format], Published: row.implemented, Pending: row.pending })), { header: ['Principal', 'Format', 'Published', 'Pending'] })
    XLSX.utils.book_append_sheet(workbook, formatSheet, 'Post formats')
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  return (
    <div data-print="hide" className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={exportSpreadsheet} className={buttonClasses({ variant: 'secondary' })}>
        <Download aria-hidden strokeWidth={1.75} className="size-4" />
        Export spreadsheet
      </button>
      <button type="button" onClick={() => window.print()} className={buttonClasses({ variant: 'secondary' })}>
        <Printer aria-hidden strokeWidth={1.75} className="size-4" />
        Download PDF
      </button>
    </div>
  )
}
