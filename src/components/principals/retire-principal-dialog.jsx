'use client'

import { useId, useState, useTransition } from 'react'
import { restorePrincipalAction, retirePrincipalAction } from '@/app/principals/actions'
import { Button, buttonClasses } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

/** @typedef {import('@/lib/data/principals').PrincipalRow} PrincipalRow */

/**
 * Retiring a brand, with the consequence stated plainly.
 *
 * The brief requires posts to survive removal, so this is a soft delete and the
 * dialog says so outright rather than asking "are you sure?" — the useful thing
 * to know is what happens to the history, not whether the click was deliberate.
 *
 * @param {{ principal: PrincipalRow }} props
 */
export function RetirePrincipalDialog({ principal }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [isPending, startTransition] = useTransition()

  const retired = !principal.isActive

  function run() {
    setError(null)
    const formData = new FormData()
    formData.set('id', principal.id)

    startTransition(async () => {
      const result = retired
        ? await restorePrincipalAction(formData)
        : await retirePrincipalAction(formData)

      if (result.ok) {
        setOpen(false)
        // A full reload rather than router.refresh() — see the same note in
        // post-form-dialog.jsx: guaranteed to show the change regardless of
        // client router-cache behaviour in a given browser/environment.
        window.location.reload()
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
        className="rounded-control px-3 py-1.5 text-sm text-muted transition-colors duration-[120ms] ease-standard hover:bg-hover hover:text-ink"
      >
        {retired ? 'Restore' : 'Retire'}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={`${id}-title`}
        title={retired ? `Restore ${principal.name}?` : `Retire ${principal.name}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={run}
              disabled={isPending}
              className={buttonClasses({ variant: retired ? 'primary' : 'danger' })}
            >
              {isPending
                ? retired
                  ? 'Restoring…'
                  : 'Retiring…'
                : retired
                  ? 'Restore brand'
                  : 'Retire brand'}
            </button>
          </>
        }
      >
        {retired ? (
          <p className="text-base text-muted">
            {principal.name} will appear in the brand pickers again and can have new posts and
            targets recorded against it.
          </p>
        ) : (
          <div className="flex flex-col gap-4 text-base text-muted">
            <p>
              <span className="text-ink">Every post already recorded against{' '}
              {principal.name} is kept.</span>{' '}
              They stay in the calendar, on the board, and in every historical breakdown, so past
              figures do not change.
            </p>
            <p>
              What changes is that {principal.name} stops appearing in the brand pickers, so no new
              posts can be filed against it. You can restore it at any time.
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
      </Modal>
    </>
  )
}
