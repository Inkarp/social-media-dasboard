'use client'

import { useMemo, useState } from 'react'
import { useIsEditor } from '@/components/auth/editor-provider'
import { BulkDeleteBar } from '@/components/posts/bulk-delete-bar'
import { DeletePostDialog } from '@/components/posts/delete-post-dialog'
import { PostFormDialog } from '@/components/posts/post-form-dialog'
import { usePostsList } from '@/components/posts/posts-list-context'
import { ChannelIcons } from '@/components/ui/channel-icon'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/cn'

/** @typedef {import('@/components/posts/post-form-dialog').PrincipalOption} PrincipalOption */

/**
 * The Posts list (brief 5.3): every field the brief names, plus multi-select
 * delete. A real <table> rather than the div-grid Principals uses — this is
 * genuinely tabular, spreadsheet-like data, and a table is what lets it scroll
 * horizontally on a phone without every row folding into a stack.
 *
 * Reads its rows from `PostsListProvider` (see posts-list-context.jsx) rather
 * than a prop, so a delete, an edit, or the header's "Add post" all update the
 * exact same list the instant the server confirms — no page reload, no
 * dependency on a background refresh landing in time.
 *
 * @param {{ principals: PrincipalOption[] }} props
 */
export function PostsTable({ principals }) {
  const isEditor = useIsEditor()
  const { items, upsert, remove } = usePostsList()
  const [selected, setSelected] = useState(/** @type {Set<string>} */ (new Set()))

  /** @param {readonly string[]} ids */
  function removeItems(ids) {
    remove(ids)
    setSelected((current) => {
      const next = new Set(current)
      for (const id of ids) next.delete(id)
      return next
    })
  }

  const allSelected = items.length > 0 && items.every((row) => selected.has(row.id))
  const someSelected = items.some((row) => selected.has(row.id))

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((row) => row.id)))
  }

  /** @param {string} id */
  function toggleOne(id) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedIds = useMemo(
    () => [...selected].filter((id) => items.some((row) => row.id === id)),
    [selected, items],
  )

  if (items.length === 0) {
    return (
      <div className="card overflow-hidden px-6 py-8">
        <p className="text-base text-muted">
          No posts match these filters. Clear them, or add the first post for this year.
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden border-t-4 border-t-ochre-ink">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline bg-ochre-ink/10">
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
                    className="size-4 accent-[color:var(--color-forest)]"
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
            {items.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-hairline-soft last:border-0',
                  index % 2 === 1 && 'bg-zebra',
                  selected.has(row.id) && 'bg-forest-06',
                )}
              >
                {isEditor && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.name}`}
                      checked={selected.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      className="size-4 accent-[color:var(--color-forest)]"
                    />
                  </td>
                )}
                <td className="max-w-64 truncate px-4 py-3 text-base text-ink">{row.name}</td>
                <td className="px-4 py-3">
                  <ChannelIcons channels={row.channels} />
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.brandColor ?? 'transparent' }}
                    />
                    <span className="truncate">
                      {row.principalName}
                      {!row.principalActive && <span className="ml-1 text-xs text-muted">Retired</span>}
                    </span>
                  </span>
                </td>
                <td className="max-w-40 truncate px-4 py-3 text-sm text-muted">{row.productName ?? '—'}</td>
                <td className="max-w-40 truncate px-4 py-3 text-sm text-muted">{row.managerName ?? 'Unassigned'}</td>
                <td className="num whitespace-nowrap px-4 py-3 text-sm text-ink">{row.postDate}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                {isEditor && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <PostFormDialog principals={principals} post={row} trigger="menuitem" onSaved={upsert} />
                      <DeletePostDialog id={row.id} name={row.name} onDeleted={() => removeItems([row.id])} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditor && (
        <BulkDeleteBar
          selectedIds={selectedIds}
          onDone={() => setSelected(new Set())}
          onDeleted={removeItems}
        />
      )}
    </div>
  )
}
