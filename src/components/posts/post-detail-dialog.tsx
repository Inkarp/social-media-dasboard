'use client'

import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { ChannelIcons } from '@/components/ui/channel-icon'
import { Modal } from '@/components/ui/modal'
import { StatusBadge } from '@/components/ui/status-badge'
import type { PostRow } from '@/lib/data/posts'

/**
 * Read-only view of a post, for viewers on the Calendar and Board — they can
 * see everything about a post but the editing form is withheld, since any save
 * from it would fail row-level security anyway. Editors get `PostFormDialog`
 * instead, at the same click.
 */
export function PostDetailDialog({
  post,
  open,
  onClose,
}: {
  post: PostRow
  open: boolean
  onClose: () => void
}) {
  const id = useId()

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={`${id}-title`}
      title={post.name}
      description={post.principalName}
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <dl className="flex flex-col gap-4 text-base">
        {post.description && (
          <div>
            <dt className="label">Description</dt>
            <dd className="mt-1 text-ink-black">{post.description}</dd>
          </div>
        )}
        <div className="flex flex-wrap gap-6">
          <div>
            <dt className="label">Date</dt>
            <dd className="num mt-1 text-ink-black">{post.postDate}</dd>
          </div>
          <div>
            <dt className="label">Status</dt>
            <dd className="mt-1">
              <StatusBadge status={post.status} />
            </dd>
          </div>
          {post.productName && (
            <div>
              <dt className="label">Product</dt>
              <dd className="mt-1 text-ink-black">{post.productName}</dd>
            </div>
          )}
          <div>
            <dt className="label">Manager</dt>
            <dd className="mt-1 text-ink-black">{post.managerName ?? 'Unassigned'}</dd>
          </div>
        </div>
        <div>
          <dt className="label">Channels</dt>
          <dd className="mt-2">
            <ChannelIcons channels={post.channels} iconClassName="size-5" />
          </dd>
        </div>
      </dl>
    </Modal>
  )
}
