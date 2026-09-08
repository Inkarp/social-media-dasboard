'use client'

import { FormatBadge } from '@/components/ui/format-badge'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ChannelIcons } from '@/components/ui/channel-icon'
import { cn } from '@/lib/cn'

/** @typedef {import('@/lib/data/posts').PostRow} PostRow */

/**
 * One card. Dragging is disabled entirely for viewers — `useDraggable`'s
 * `disabled` flag means the pointer sensor never activates for them, so there
 * is nothing to accidentally trigger. A plain click still opens the post
 * (`PostClickTarget` decides editor vs read-only) for everyone, editor or not.
 *
 * @param {{ post: PostRow, draggable: boolean, onClick: () => void }} props
 */
export function BoardCard({ post, draggable, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    disabled: !draggable,
  })

  return (
    <div
      ref={setNodeRef}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      onClick={onClick}
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      className={cn(
        'relative flex cursor-pointer flex-col gap-2 rounded-card border border-hairline bg-surface/85 p-3 text-left shadow-card',
        'transition-all duration-[120ms] ease-standard hover:border-teal hover:bg-hover',
        draggable && 'touch-none',
        isDragging && 'opacity-40',
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-2 left-0 w-1 rounded-r-full"
        style={{ backgroundColor: post.brandColor ?? 'transparent' }}
      />
      <p className="truncate pl-2 text-sm font-medium text-ink">{post.name}</p>
      <p className="truncate pl-2 text-xs text-muted">{post.principalName}</p>
                  <FormatBadge format={post.format} />
      <div className="flex items-center justify-between pl-2">
        <ChannelIcons channels={post.channels} iconClassName="size-3.5" />
        <span className="num text-xs text-muted">{post.postDate}</span>
      </div>
    </div>
  )
}
