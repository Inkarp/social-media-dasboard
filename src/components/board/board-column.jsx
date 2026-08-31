'use client'

import { useDroppable } from '@dnd-kit/core'
import { BoardCard } from '@/components/board/board-card'
import { cn } from '@/lib/cn'
import { STATUS_LABELS } from '@/lib/status'

/** @typedef {import('@/lib/status').PostStatus} PostStatus */
/** @typedef {import('@/lib/data/posts').PostRow} PostRow */

/**
 * @param {{
 *   status: PostStatus,
 *   posts: PostRow[],
 *   draggable: boolean,
 *   onCardClick: (post: PostRow) => void,
 * }} props
 */
export function BoardColumn({ status, posts, draggable, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="card flex min-w-0 flex-col gap-3 border-t-4 border-t-teal p-3">
      <div className="flex items-center justify-between border-b border-hairline px-1 pb-3">
        <h3 className="text-base font-semibold text-teal">{STATUS_LABELS[status]}</h3>
        <span className="num rounded-chip bg-teal/10 px-2 py-1 text-xs font-semibold text-teal">{posts.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-32 flex-1 flex-col gap-2 rounded-card border border-dashed border-hairline bg-bg/30 p-2',
          'transition-colors duration-[120ms] ease-standard',
          isOver && 'border-teal bg-teal/12',
        )}
      >
        {posts.map((post) => (
          <BoardCard key={post.id} post={post} draggable={draggable} onClick={() => onCardClick(post)} />
        ))}
      </div>
    </div>
  )
}
