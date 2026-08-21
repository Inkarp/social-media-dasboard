'use client'

import { useMemo, useState } from 'react'
import { useIsEditor } from '@/components/auth/editor-provider'
import { BulkDeleteBar } from '@/components/posts/bulk-delete-bar'
import { DeletePostDialog } from '@/components/posts/delete-post-dialog'
import { PostFormDialog, type PrincipalOption } from '@/components/posts/post-form-dialog'
import { ChannelIcons } from '@/components/ui/channel-icon'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/cn'
import type { PostRow } from '@/lib/data/posts'

/**
 * The Posts list (brief 5.3): every field the brief names, plus multi-select
 * delete. A real <table> rather than the div-grid Principals uses — this is
 * genuinely tabular, spreadsheet-like data, and a table is what lets it scroll
 * horizontally on a phone without every row folding into a stack.
 */
export function PostsTable({ rows, principals }: { rows: PostRow[]; principals: PrincipalOption[] }) {
  const isEditor = useIsEditor()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id))
  const someSelected = rows.some((row) => selected.has(row.id))

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedIds = useMemo(() => [...selected].filter((id) => rows.some((row) => row.id === id)), [selected, rows])

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline bg-zebra">
              {isEditor && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all posts"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected
                    }}
                    onChange={toggleAll}
                    className="size-4 accent-[color:var(--color-ink-red)]"
                  />
                </th>
              )}
              <th className="label px-4 py-3">Post</th>
              <th className="label px-4 py-3">Channels</th>
              <th className="label px-4 py-3">Brand</th>
              <th className="label px-4 py-3">Product</th>
              <th className="label px-4 py-3">Manager</th>
              <th className="label px-4 py-3">Date</th>
              <th className="label px-4 py-3">Status</th>
              {isEditor && <th className="label px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-hairline-soft last:border-0',
                  index % 2 === 1 && 'bg-zebra',
                  selected.has(row.id) && 'bg-ink-red-06',
                )}
              >
                {isEditor && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.name}`}
                      checked={selected.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      className="size-4 accent-[color:var(--color-ink-red)]"
                    />
                  </td>
                )}
                <td className="max-w-64 truncate px-4 py-3 text-base text-ink-black">{row.name}</td>
                <td className="px-4 py-3">
                  <ChannelIcons channels={row.channels} />
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-ink-black">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.brandColor ?? 'transparent' }}
                    />
                    <span className="truncate">
                      {row.principalName}
                      {!row.principalActive && <span className="ml-1 text-xs text-ink-grey">Retired</span>}
                    </span>
                  </span>
                </td>
                <td className="max-w-40 truncate px-4 py-3 text-sm text-ink-grey">{row.productName ?? '—'}</td>
                <td className="max-w-40 truncate px-4 py-3 text-sm text-ink-grey">{row.managerName ?? 'Unassigned'}</td>
                <td className="num whitespace-nowrap px-4 py-3 text-sm text-ink-black">{row.postDate}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                {isEditor && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <PostFormDialog principals={principals} post={row} trigger="menuitem" />
                      <DeletePostDialog id={row.id} name={row.name} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditor && <BulkDeleteBar selectedIds={selectedIds} onDone={() => setSelected(new Set())} />}
    </div>
  )
}
