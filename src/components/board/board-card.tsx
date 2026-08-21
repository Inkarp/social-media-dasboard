'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ChannelIcons } from '@/components/ui/channel-icon'
import { cn } from '@/lib/cn'
import type { PostRow } from '@/lib/data/posts'

/**
 * One card. Dragging is disabled entirely for viewers — `useDraggable`'s
 * `disabled` flag means the pointer sensor never activates for them, so there
 * is nothing to accidentally trigger. A plain click still opens the post
 * (`PostClickTarget` decides editor vs read-only) for everyone, editor or not.
 */
export function BoardCard({
  post,
  draggable,
  onClick,
}: {
  post: PostRow
  draggable: boolean
  onClick: () => void
}) {
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
        'card relative flex cursor-pointer flex-col gap-2 p-3 text-left',
        'transition-colors duration-[120ms] ease-instrument hover:border-ink-grey',
        draggable && 'touch-none',
        isDragging && 'opacity-40',
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: post.brandColor ?? 'transparent' }}
      />
      <p className="truncate pl-2 text-sm font-medium text-ink-black">{post.name}</p>
      <p className="truncate pl-2 text-xs text-ink-grey">{post.principalName}</p>
      <div className="flex items-center justify-between pl-2">
        <ChannelIcons channels={post.channels} iconClassName="size-3.5" />
        <span className="num text-xs text-ink-grey">{post.postDate}</span>
      </div>
    </div>
  )
}
