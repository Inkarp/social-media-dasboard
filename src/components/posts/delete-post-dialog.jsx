'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { deletePostAction } from '@/app/posts/actions'
import { Button, buttonClasses } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

/**
 * Deleting a post is a hard delete, unlike retiring a principal — a post has no
 * history to protect once it's gone; it *is* the history. Still behind a
 * confirmation, since it cannot be undone.
 *
 * @param {{
 *   id: string,
 *   name: string,
 *   onDeleted: () => void,
 * }} props
 */
export function DeletePostDialog({ id, name, onDeleted }) {
  const router = useRouter()
  const dialogId = useId()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [isPending, startTransition] = useTransition()

  function run() {
    setError(null)
    const formData = new FormData()
    formData.set('id', id)

    startTransition(async () => {
      const result = await deletePostAction(formData)
      if (result.ok) {
        setOpen(false)
        onDeleted()
        // Best-effort background sync for other data derived from this route
        // (filters, counts). The visible removal above does not depend on it.
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-control px-3 py-1.5 text-sm text-ink-grey transition-colors duration-[120ms] ease-instrument hover:bg-hover hover:text-ink-black"
      >
        Delete
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={`${dialogId}-title`}
        title={`Delete "${name}"?`}
        description="This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <button type="button" onClick={run} disabled={isPending} className={buttonClasses({ variant: 'danger' })}>
              {isPending ? 'Deleting…' : 'Delete post'}
            </button>
          </>
        }
      >
        {error && (
          <p role="alert" className="text-sm text-ink-red">
            {error}
          </p>
        )}
      </Modal>
    </>
  )
}
