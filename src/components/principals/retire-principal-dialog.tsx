'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { restorePrincipalAction, retirePrincipalAction } from '@/app/principals/actions'
import { Button, buttonClasses } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { PrincipalRow } from '@/lib/data/principals'

/**
 * Retiring a brand, with the consequence stated plainly.
 *
 * The brief requires posts to survive removal, so this is a soft delete and the
 * dialog says so outright rather than asking "are you sure?" — the useful thing
 * to know is what happens to the history, not whether the click was deliberate.
 */
export function RetirePrincipalDialog({ principal }: { principal: PrincipalRow }) {
  const router = useRouter()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
          <p className="text-base text-ink-grey">
            {principal.name} will appear in the brand pickers again and can have new posts and
            targets recorded against it.
          </p>
        ) : (
          <div className="flex flex-col gap-4 text-base text-ink-grey">
            <p>
              <span className="text-ink-black">Every post already recorded against{' '}
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
          <p role="alert" className="mt-4 text-sm text-ink-red">
            {error}
          </p>
        )}
      </Modal>
    </>
  )
}
