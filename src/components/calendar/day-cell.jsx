'use client'

import { FormatBadge } from '@/components/ui/format-badge'
import { useState } from 'react'
import { useIsEditor } from '@/components/auth/editor-provider'
import { DayListModal } from '@/components/calendar/day-list-modal'
import { PostClickTarget } from '@/components/posts/post-click-target'
import { PostFormDialog } from '@/components/posts/post-form-dialog'
import { cn } from '@/lib/cn'

/** @typedef {import('@/components/posts/post-form-dialog').PrincipalOption} PrincipalOption */
/** @typedef {import('@/lib/data/posts').PostRow} PostRow */

const MAX_VISIBLE = 3

/**
 * @param {{
 *   date: string,
 *   dayNumber: number,
 *   inCurrentMonth: boolean,
 *   isToday: boolean,
 *   posts: PostRow[],
 *   principals: PrincipalOption[],
 * }} props
 */
export function DayCell({ date, dayNumber, inCurrentMonth, isToday, posts, principals }) {
  const isEditor = useIsEditor()
  const [selected, setSelected] = useState(/** @type {PostRow | null} */ (null))
  const [showAll, setShowAll] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const visible = posts.slice(0, MAX_VISIBLE)
  const overflow = posts.length - visible.length

  return (
    <div
      className={cn(
        'studio-day flex min-h-24 flex-col gap-1 border-b border-r border-hairline-soft p-2 transition-colors duration-[120ms] ease-standard hover:bg-hover',
        !inCurrentMonth && 'bg-zebra',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'num flex size-6 items-center justify-center rounded-full text-sm',
            isToday ? 'bg-wine text-on-accent shadow-[0_0_18px_rgba(255,79,216,0.45)]' : inCurrentMonth ? 'text-ink' : 'text-muted',
          )}
        >
          {dayNumber}
        </span>
        {isEditor && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label={`Add a post on ${date}`}
            className="rounded-control px-1.5 text-sm leading-none text-teal transition-colors duration-[120ms] ease-standard hover:bg-teal/10 hover:text-ink"
          >
            +
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {visible.map((post) => (
          <button
            key={post.id}
            type="button"
            onClick={() => setSelected(post)}
            className="flex items-center gap-1.5 truncate rounded-control border border-transparent bg-bg/35 px-1.5 py-1 text-left text-xs transition-colors duration-[120ms] ease-standard hover:border-hairline hover:bg-hover"
            title={post.name}
          >
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: post.brandColor ?? 'transparent' }}
            />
            <span className="truncate text-ink">{post.name}</span>
                  <FormatBadge format={post.format} compact />
          </button>
        ))}

        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="px-1.5 text-left text-xs text-muted transition-colors duration-[120ms] ease-standard hover:text-ink"
          >
            +{overflow} more
          </button>
        )}
      </div>

      {selected && (
        <PostClickTarget post={selected} principals={principals} open onClose={() => setSelected(null)} />
      )}

      {showAll && (
        <DayListModal
          date={date}
          posts={posts}
          onClose={() => setShowAll(false)}
          onSelect={(post) => {
            setShowAll(false)
            setSelected(post)
          }}
        />
      )}

      {isEditor && addOpen && (
        <PostFormDialog
          principals={principals}
          defaultDate={date}
          trigger="none"
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      )}
    </div>
  )
}
