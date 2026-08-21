'use client'

import { ChevronDown, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState, useTransition } from 'react'
import { createPostAction, updatePostAction } from '@/app/posts/actions'
import { Button, buttonClasses } from '@/components/ui/button'
import { ChannelIcon } from '@/components/ui/channel-icon'
import { Field, inputClasses, selectClasses } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/cn'
import { CHANNEL_LABELS, CHANNEL_PRESETS, CHANNELS, type Channel } from '@/lib/channels'
import { toDateOnly } from '@/lib/fy'
import { POST_STATUSES, STATUS_LABELS, type PostStatus } from '@/lib/status'
import type { PostRow } from '@/lib/data/posts'

export type PrincipalOption = {
  id: string
  name: string
  groupName: string
  brandColor: string | null
  managerName: string | null
}

/**
 * Add or edit a post. One dialog for both — this is the form the brief
 * describes in 5.6, shared by Posts, Calendar, Board and the Dashboard's
 * "Add post" button so the fields never drift between the four places a post
 * can be created.
 */
export function PostFormDialog({
  principals,
  post,
  defaultDate,
  trigger = 'button',
  triggerLabel = 'Add post',
  open: controlledOpen,
  onOpenChange,
}: {
  principals: PrincipalOption[]
  /** Provide to edit an existing post; omit to create a new one. */
  post?: PostRow
  /** Pre-fills the date field when creating from a specific day (Calendar). */
  defaultDate?: string
  trigger?: 'button' | 'menuitem' | 'none'
  triggerLabel?: string
  /** Controlled open state, for callers that open this from their own click handler (a calendar chip, a board card). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = post !== undefined
  const router = useRouter()
  const id = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen

  const [error, setError] = useState<string | null>(null)
  const [principalId, setPrincipalId] = useState(post?.principalId ?? principals[0]?.id ?? '')
  const [channels, setChannels] = useState<Channel[]>(post?.channels ?? [])
  const [isPending, startTransition] = useTransition()

  const manager = useMemo(
    () => principals.find((p) => p.id === principalId)?.managerName ?? null,
    [principals, principalId],
  )

  function toggleChannel(channel: Channel) {
    setChannels((current) =>
      current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel],
    )
  }

  function submit(formData: FormData) {
    setError(null)
    formData.delete('channels')
    for (const channel of channels) formData.append('channels', channel)
    if (post) formData.set('id', post.id)

    startTransition(async () => {
      const result = post ? await updatePostAction(formData) : await createPostAction(formData)

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
      {trigger === 'menuitem' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-control px-3 py-1.5 text-sm text-ink-grey transition-colors duration-[120ms] ease-instrument hover:bg-hover hover:text-ink-black"
        >
          Edit
        </button>
      )}
      {trigger === 'button' && (
        <button type="button" onClick={() => setOpen(true)} className={buttonClasses()}>
          <Plus aria-hidden strokeWidth={1.75} className="size-4" />
          {triggerLabel}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={`${id}-title`}
        title={isEdit ? `Edit ${post.name}` : 'Add a post'}
        description={
          isEdit ? 'Changes apply everywhere this post appears.' : 'Recorded against the selected brand and date.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <button type="submit" form={`${id}-form`} disabled={isPending} className={buttonClasses()}>
              {isPending ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save post' : 'Add post'}
            </button>
          </>
        }
      >
        <form id={`${id}-form`} action={submit} className="flex flex-col gap-6">
          <Field label="Post name" htmlFor={`${id}-name`}>
            <input
              id={`${id}-name`}
              name="name"
              required
              maxLength={200}
              defaultValue={post?.name ?? ''}
              className={inputClasses}
            />
          </Field>

          <Field label="Description" htmlFor={`${id}-description`} hint="Optional.">
            <textarea
              id={`${id}-description`}
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={post?.description ?? ''}
              className={cn(inputClasses, 'resize-y')}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Brand" htmlFor={`${id}-principal`}>
              <div className="relative">
                <select
                  id={`${id}-principal`}
                  name="principalId"
                  required
                  value={principalId}
                  onChange={(event) => setPrincipalId(event.target.value)}
                  className={selectClasses}
                >
                  {principals.length === 0 && <option value="">No active brands</option>}
                  {principals.map((principal) => (
                    <option key={principal.id} value={principal.id}>
                      {principal.name}
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

            <Field label="Product manager" htmlFor={`${id}-manager`} hint="Filled in from the brand.">
              <input
                id={`${id}-manager`}
                readOnly
                disabled
                value={manager ?? 'Unassigned'}
                className={cn(inputClasses, 'cursor-not-allowed text-ink-grey')}
              />
            </Field>
          </div>

          <Field label="Product" htmlFor={`${id}-product`} hint="Optional.">
            <input
              id={`${id}-product`}
              name="productName"
              maxLength={120}
              defaultValue={post?.productName ?? ''}
              className={inputClasses}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Date" htmlFor={`${id}-date`}>
              <input
                id={`${id}-date`}
                name="postDate"
                type="date"
                required
                defaultValue={post?.postDate ?? defaultDate ?? toDateOnly(new Date())}
                className={cn(inputClasses, 'num')}
              />
            </Field>

            <Field label="Status" htmlFor={`${id}-status`}>
              <div className="relative">
                <select
                  id={`${id}-status`}
                  name="status"
                  required
                  defaultValue={post?.status ?? ('planned' satisfies PostStatus)}
                  className={selectClasses}
                >
                  {POST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
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

          <div className="flex flex-col gap-3">
            <p className="label">Channels</p>

            <div className="flex flex-wrap gap-2">
              {CHANNEL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setChannels([...preset.channels])}
                  className="rounded-control border border-hairline px-3 py-1.5 text-sm text-ink-grey transition-colors duration-[120ms] ease-instrument hover:border-ink-grey hover:text-ink-black"
                >
                  {preset.label}
                </button>
              ))}
              {CHANNELS.map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setChannels([channel])}
                  className="rounded-control border border-hairline px-3 py-1.5 text-sm text-ink-grey transition-colors duration-[120ms] ease-instrument hover:border-ink-grey hover:text-ink-black"
                >
                  {CHANNEL_LABELS[channel]} only
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              {CHANNELS.map((channel) => (
                <label key={channel} className="flex items-center gap-2 text-base text-ink-black">
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    className="size-4 accent-[color:var(--color-ink-red)]"
                  />
                  <ChannelIcon channel={channel} className="size-4 text-ink-grey" />
                  {CHANNEL_LABELS[channel]}
                </label>
              ))}
            </div>
          </div>

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
