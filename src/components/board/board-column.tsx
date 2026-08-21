'use client'

import { useDroppable } from '@dnd-kit/core'
import { BoardCard } from '@/components/board/board-card'
import { cn } from '@/lib/cn'
import { STATUS_LABELS, type PostStatus } from '@/lib/status'
import type { PostRow } from '@/lib/data/posts'

export function BoardColumn({
  status,
  posts,
  draggable,
  onCardClick,
}: {
  status: PostStatus
  posts: PostRow[]
  draggable: boolean
  onCardClick: (post: PostRow) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-medium text-ink-black">{STATUS_LABELS[status]}</h3>
        <span className="num text-xs text-ink-grey">{posts.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-32 flex-1 flex-col gap-2 rounded-card border border-dashed border-hairline p-2',
          'transition-colors duration-[120ms] ease-instrument',
          isOver && 'border-ink-red bg-ink-red-06',
        )}
      >
        {posts.map((post) => (
          <BoardCard key={post.id} post={post} draggable={draggable} onClick={() => onCardClick(post)} />
        ))}
      </div>
    </div>
  )
}
