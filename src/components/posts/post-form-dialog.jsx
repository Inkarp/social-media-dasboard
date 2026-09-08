'use client'

import { ChevronDown, Plus } from 'lucide-react'
import { useId, useMemo, useState, useTransition } from 'react'
import { createPostAction, updatePostAction } from '@/app/posts/actions'
import { Button, buttonClasses } from '@/components/ui/button'
import { ChannelIcon } from '@/components/ui/channel-icon'
import { Field, inputClasses, selectClasses } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/cn'
import { CHANNEL_LABELS, CHANNEL_PRESETS, CHANNELS } from '@/lib/channels'
import { toDateOnly } from '@/lib/fy'
import { POST_FORMATS, FORMAT_LABELS } from '@/lib/post-formats'
import { POST_STATUSES, STATUS_LABELS } from '@/lib/status'

/** @typedef {import('@/lib/channels').Channel} Channel */
/** @typedef {import('@/lib/status').PostStatus} PostStatus */
/** @typedef {import('@/lib/data/posts').PostRow} PostRow */

/**
 * @typedef {Object} PrincipalOption
 * @property {string} id
 * @property {string} name
 * @property {string} groupName
 * @property {string | null} brandColor
 * @property {string | null} managerName
 */

/**
 * Add or edit a post. One dialog for both — this is the form the brief
 * describes in 5.6, shared by Posts, Calendar, Board and the Dashboard's
 * "Add post" button so the fields never drift between the four places a post
 * can be created.
 *
 * @param {{
 *   principals: PrincipalOption[],
 *   post?: PostRow,
 *   defaultDate?: string,
 *   trigger?: 'button' | 'menuitem' | 'none',
 *   triggerLabel?: string,
 *   open?: boolean,
 *   onOpenChange?: (open: boolean) => void,
 *   onSaved?: (post: PostRow) => void,
 * }} props
 */
export function PostFormDialog({
  principals,
  post,
  defaultDate,
  trigger = 'button',
  triggerLabel = 'Add post',
  open: controlledOpen,
  onOpenChange,
  onSaved,
}) {
  const isEdit = post !== undefined
  const id = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setUncontrolledOpen

  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [principalId, setPrincipalId] = useState(post?.principalId ?? principals[0]?.id ?? '')
  const [channels, setChannels] = useState(/** @type {Channel[]} */ (post?.channels ?? []))
  const [isPending, startTransition] = useTransition()

  const manager = useMemo(
    () => principals.find((p) => p.id === principalId)?.managerName ?? null,
    [principals, principalId],
  )

  /** @param {Channel} channel */
  function toggleChannel(channel) {
    setChannels((current) =>
      current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel],
    )
  }

  /**
   * Everything except the id is already known client-side — the values just
   * came out of this form, and `principals` already carries the joined brand
   * fields (name, group, colour, manager) the list needs to render a row.
   * Reading it back from `formData` rather than component state means every
   * field (including uncontrolled ones like name/date) is captured with a
   * single source of truth: what was actually submitted.
   *
   * @param {FormData} formData
   * @param {string} savedId
   * @returns {PostRow}
   */
  function buildSavedPost(formData, savedId) {
    const principal = principals.find((p) => p.id === principalId)
    const description = String(formData.get('description') ?? '')
    const productName = String(formData.get('productName') ?? '')

    return {
      id: savedId,
      name: String(formData.get('name') ?? ''),
      description: description === '' ? null : description,
      productName: productName === '' ? null : productName,
      channels: [...channels],
      postDate: String(formData.get('postDate') ?? ''),
      format: /** @type {import('@/lib/post-formats').PostFormat} */ (formData.get('format')),
      status: /** @type {PostStatus} */ (formData.get('status')),
      principalId,
      principalName: principal?.name ?? 'Unknown brand',
      groupName: principal?.groupName ?? '',
      managerName: principal?.managerName ?? null,
      brandColor: principal?.brandColor ?? null,
      principalActive: true,
    }
  }

  /** @param {FormData} formData */
  function submit(formData) {
    setError(null)
    formData.delete('channels')
    for (const channel of channels) formData.append('channels', channel)
    if (post) formData.set('id', post.id)

    startTransition(async () => {
      if (post) {
        const result = await updatePostAction(formData)
        if (!result.ok) {
          setError(result.error)
          return
        }
        setOpen(false)
        if (onSaved) onSaved(buildSavedPost(formData, post.id))
        else window.location.reload()
        return
      }

      const result = await createPostAction(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setOpen(false)
      if (onSaved) onSaved(buildSavedPost(formData, result.id))
      else window.location.reload()
    })
  }

  return (
    <>
      {trigger === 'menuitem' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-control px-3 py-1.5 text-sm text-muted transition-colors duration-[120ms] ease-standard hover:bg-hover hover:text-ink"
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

          <Field label="Post format" htmlFor={`${id}-format`} hint="Choose the content format. Reels and regular videos are tracked separately.">
            <select id={`${id}-format`} name="format" required defaultValue={post?.format ?? ''} className={selectClasses}>
              <option value="" disabled>{post ? 'Not classified ? choose a format' : 'Choose a format'}</option>
              {POST_FORMATS.map((format) => <option key={format} value={format}>{FORMAT_LABELS[format]}</option>)}
            </select>
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
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                />
              </div>
            </Field>

            <Field label="Product manager" htmlFor={`${id}-manager`} hint="Filled in from the brand.">
              <input
                id={`${id}-manager`}
                readOnly
                disabled
                value={manager ?? 'Unassigned'}
                className={cn(inputClasses, 'cursor-not-allowed text-muted')}
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
                  defaultValue={post?.status ?? /** @type {PostStatus} */ ('planned')}
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
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
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
                  className="rounded-control border border-hairline bg-bg/30 px-3 py-1.5 text-sm text-muted transition-colors duration-[120ms] ease-standard hover:border-teal hover:text-ink"
                >
                  {preset.label}
                </button>
              ))}
              {CHANNELS.map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setChannels([channel])}
                  className="rounded-control border border-hairline bg-bg/30 px-3 py-1.5 text-sm text-muted transition-colors duration-[120ms] ease-standard hover:border-teal hover:text-ink"
                >
                  {CHANNEL_LABELS[channel]} only
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              {CHANNELS.map((channel) => (
                <label key={channel} className="flex items-center gap-2 text-base text-ink">
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    className="size-4 accent-[color:var(--color-forest)]"
                  />
                  <ChannelIcon channel={channel} className="size-4 text-muted" />
                  {CHANNEL_LABELS[channel]}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-3 rounded-card border border-danger-12 bg-danger-06 px-4 py-3 text-base text-ink"
            >
              <span aria-hidden className="mt-1 block h-4 w-[3px] shrink-0 bg-danger" />
              {error}
            </p>
          )}
        </form>
      </Modal>
    </>
  )
}
