'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { bulkDeletePostsAction } from '@/app/posts/actions'
import { Button, buttonClasses } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

/**
 * Floating bar for the Posts list's multi-select delete. Sits fixed at the
 * bottom of the viewport so it stays reachable regardless of scroll position —
 * the same reason mobile navigation is a fixed bottom bar rather than living in
 * the flow.
 *
 * @param {{
 *   selectedIds: string[],
 *   onDone: () => void,
 *   onDeleted: (ids: readonly string[]) => void,
 * }} props
 */
export function BulkDeleteBar({ selectedIds, onDone, onDeleted }) {
  const router = useRouter()
  const id = useId()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [isPending, startTransition] = useTransition()

  if (selectedIds.length === 0) return null

  function run() {
    setError(null)
    const formData = new FormData()
    for (const postId of selectedIds) formData.append('id', postId)

    startTransition(async () => {
      const result = await bulkDeletePostsAction(formData)
      if (result.ok) {
        setConfirmOpen(false)
        onDeleted(selectedIds)
        onDone()
        // Best-effort background sync; the visible removal above does not depend on it.
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <div
        data-print="hide"
        className="fixed inset-x-0 bottom-16 z-20 flex justify-center px-4 md:bottom-6"
      >
        <div className="flex items-center gap-4 rounded-card border border-hairline bg-ink px-5 py-3 text-surface shadow-overlay">
          <span className="num text-sm">
            {selectedIds.length} selected
          </span>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 rounded-control bg-danger px-3 py-1.5 text-sm font-medium text-on-accent transition-colors duration-[120ms] ease-standard hover:bg-danger-40"
          >
            <Trash2 aria-hidden strokeWidth={1.75} className="size-4" />
            Delete selected
          </button>
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-surface/70 transition-colors duration-[120ms] ease-standard hover:text-surface"
          >
            Clear
          </button>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        labelledBy={`${id}-title`}
        title={`Delete ${selectedIds.length} post${selectedIds.length === 1 ? '' : 's'}?`}
        description="This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <button type="button" onClick={run} disabled={isPending} className={buttonClasses({ variant: 'danger' })}>
              {isPending ? 'Deleting…' : 'Delete posts'}
            </button>
          </>
        }
      >
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </Modal>
    </>
  )
}
