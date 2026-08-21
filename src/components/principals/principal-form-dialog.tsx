'use client'

import { ChevronDown, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { createPrincipalAction, updatePrincipalAction } from '@/app/principals/actions'
import { Button, buttonClasses } from '@/components/ui/button'
import { Field, inputClasses, selectClasses } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/cn'
import { GROUPS } from '@/lib/groups'
import type { ManagerOption, PrincipalRow } from '@/lib/data/principals'

/**
 * Add or edit a brand. One component for both, because the fields are identical
 * and keeping them together stops the two drifting apart.
 */
export function PrincipalFormDialog({
  managers,
  principal,
  trigger,
}: {
  managers: ManagerOption[]
  /** Provide to edit an existing brand; omit to create a new one. */
  principal?: PrincipalRow
  trigger?: 'button' | 'menuitem'
}) {
  const isEdit = principal !== undefined
  const router = useRouter()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [colour, setColour] = useState(principal?.brandColor ?? '#BE0010')
  const [isPending, startTransition] = useTransition()

  function submit(formData: FormData) {
    setError(null)
    formData.set('brandColor', colour)
    if (principal) formData.set('id', principal.id)

    startTransition(async () => {
      const result = principal
        ? await updatePrincipalAction(formData)
        : await createPrincipalAction(formData)

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
      {trigger === 'menuitem' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-control px-3 py-1.5 text-sm text-ink-grey transition-colors duration-[120ms] ease-instrument hover:bg-hover hover:text-ink-black"
        >
          Edit
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={buttonClasses()}>
          <Plus aria-hidden strokeWidth={1.75} className="size-4" />
          Add principal
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={`${id}-title`}
        title={isEdit ? `Edit ${principal.name}` : 'Add a principal'}
        description={
          isEdit
            ? 'Changes apply everywhere this brand appears.'
            : 'A new brand starts with no target. Set one on the directory afterwards.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <button type="submit" form={`${id}-form`} disabled={isPending} className={buttonClasses()}>
              {isPending
                ? isEdit
                  ? 'Saving…'
                  : 'Adding…'
                : isEdit
                  ? 'Save brand'
                  : 'Add brand'}
            </button>
          </>
        }
      >
        <form id={`${id}-form`} action={submit} className="flex flex-col gap-6">
          <Field label="Brand name" htmlFor={`${id}-name`}>
            <input
              id={`${id}-name`}
              name="name"
              required
              maxLength={120}
              defaultValue={principal?.name ?? ''}
              className={inputClasses}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Group" htmlFor={`${id}-group`}>
              <div className="relative">
                <select
                  id={`${id}-group`}
                  name="groupName"
                  required
                  defaultValue={principal?.groupName ?? GROUPS[0]}
                  className={selectClasses}
                >
                  {GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  strokeWidth={1.5}
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-grey"
                />
              </div>
            </Field>

            <Field label="Product manager" htmlFor={`${id}-manager`}>
              <div className="relative">
                <select
                  id={`${id}-manager`}
                  name="productManagerId"
                  defaultValue={principal?.managerId ?? ''}
                  className={selectClasses}
                >
                  <option value="">Unassigned</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  strokeWidth={1.5}
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-grey"
                />
              </div>
            </Field>
          </div>

          <Field label="Country" htmlFor={`${id}-country`} hint="Where the principal is based.">
            <input
              id={`${id}-country`}
              name="country"
              maxLength={120}
              defaultValue={principal?.country ?? ''}
              className={inputClasses}
            />
          </Field>

          <Field
            label="Brand colour"
            htmlFor={`${id}-colour`}
            hint="Used only as a 3px bar to identify this brand in lists — never as a background."
          >
            <div className="flex items-center gap-3">
              <input
                id={`${id}-colour`}
                type="color"
                value={colour}
                onChange={(event) => setColour(event.target.value.toUpperCase())}
                className="size-10 shrink-0 cursor-pointer rounded-control border border-hairline bg-ink-white p-1"
              />
              <input
                aria-label="Brand colour hex value"
                value={colour}
                onChange={(event) => setColour(event.target.value.toUpperCase())}
                pattern="#[0-9A-Fa-f]{6}"
                maxLength={7}
                className={cn(inputClasses, 'num w-32')}
              />
              <span
                aria-hidden
                className="h-10 w-[3px] shrink-0"
                style={{ backgroundColor: colour }}
              />
            </div>
          </Field>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-3 rounded-card border border-ink-red-12 bg-ink-red-06 px-4 py-3 text-base text-ink-black"
            >
              <span aria-hidden className="mt-1 block h-4 w-[3px] shrink-0 bg-ink-red" />
              {error}
            </p>
          )}
        </form>
      </Modal>
    </>
  )
}
