'use client'

import { format, parseISO } from 'date-fns'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { ChannelIcons } from '@/components/ui/channel-icon'
import { StatusBadge } from '@/components/ui/status-badge'
import { Modal } from '@/components/ui/modal'
import type { PostRow } from '@/lib/data/posts'

/** Every post on one day, for the "+n more" overflow. */
export function DayListModal({
  date,
  posts,
  onClose,
  onSelect,
}: {
  date: string
  posts: PostRow[]
  onClose: () => void
  onSelect: (post: PostRow) => void
}) {
  const id = useId()

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy={`${id}-title`}
      title={format(parseISO(date), 'EEEE, d MMMM yyyy')}
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <ul className="flex flex-col gap-1">
        {posts.map((post) => (
          <li key={post.id}>
            <button
              type="button"
              onClick={() => onSelect(post)}
              className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-left transition-colors duration-[120ms] ease-instrument hover:bg-hover"
            >
              <span
                aria-hidden
                className="h-6 w-[3px] shrink-0"
                style={{ backgroundColor: post.brandColor ?? 'transparent' }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base text-ink-black">{post.name}</span>
                <span className="block truncate text-sm text-ink-grey">{post.principalName}</span>
              </span>
              <ChannelIcons channels={post.channels} className="shrink-0" />
              <StatusBadge status={post.status} className="shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
