'use client'

import { useState } from 'react'
import { useIsEditor } from '@/components/auth/editor-provider'
import { DayListModal } from '@/components/calendar/day-list-modal'
import { PostClickTarget } from '@/components/posts/post-click-target'
import { PostFormDialog, type PrincipalOption } from '@/components/posts/post-form-dialog'
import { cn } from '@/lib/cn'
import type { PostRow } from '@/lib/data/posts'

const MAX_VISIBLE = 3

export function DayCell({
  date,
  dayNumber,
  inCurrentMonth,
  isToday,
  posts,
  principals,
}: {
  /** ISO date, "YYYY-MM-DD". */
  date: string
  dayNumber: number
  inCurrentMonth: boolean
  isToday: boolean
  posts: PostRow[]
  principals: PrincipalOption[]
}) {
  const isEditor = useIsEditor()
  const [selected, setSelected] = useState<PostRow | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const visible = posts.slice(0, MAX_VISIBLE)
  const overflow = posts.length - visible.length

  return (
    <div
      className={cn(
        'flex min-h-24 flex-col gap-1 border-b border-r border-hairline-soft p-2',
        !inCurrentMonth && 'bg-zebra',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'num flex size-6 items-center justify-center rounded-full text-sm',
            isToday ? 'bg-ink-red text-ink-white' : inCurrentMonth ? 'text-ink-black' : 'text-ink-grey',
          )}
        >
          {dayNumber}
        </span>
        {isEditor && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label={`Add a post on ${date}`}
            className="rounded-control px-1.5 text-sm leading-none text-ink-grey transition-colors duration-[120ms] ease-instrument hover:bg-hover hover:text-ink-black"
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
            className="flex items-center gap-1.5 truncate rounded-control px-1.5 py-1 text-left text-xs transition-colors duration-[120ms] ease-instrument hover:bg-hover"
            title={post.name}
          >
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: post.brandColor ?? 'transparent' }}
            />
            <span className="truncate text-ink-black">{post.name}</span>
          </button>
        ))}

        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="px-1.5 text-left text-xs text-ink-grey transition-colors duration-[120ms] ease-instrument hover:text-ink-black"
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
