'use client'

import { ChevronDown, Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { selectClasses } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import { CHANNEL_LABELS, CHANNELS } from '@/lib/channels'
import { hrefWith } from '@/lib/search-params'
import { POST_STATUSES, STATUS_LABELS } from '@/lib/status'

/**
 * Search, channel and status — the two filters the brief asks for (5.3) plus a
 * free-text search, all in the URL like every other filter set in this app.
 * Same debounced-search pattern as principals-filters.tsx.
 */
export function PostsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(currentSearch)

  useEffect(() => {
    setSearch(currentSearch)
  }, [currentSearch])

  useEffect(() => {
    if (search === currentSearch) return
    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(hrefWith(pathname, searchParams, { q: search || null }))
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, currentSearch, pathname, router, searchParams])

  function set(patch: Record<string, string | null>) {
    startTransition(() => {
      router.replace(hrefWith(pathname, searchParams, patch))
    })
  }

  const channel = searchParams.get('channel') ?? ''
  const status = searchParams.get('status') ?? ''
  const hasFilters = Boolean(currentSearch || channel || status)

  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap items-end gap-4 transition-opacity duration-[120ms]',
        isPending && 'opacity-60',
      )}
    >
      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <label htmlFor="post-search" className="label">
          Search
        </label>
        <div className="relative">
          <Search
            aria-hidden
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-grey"
          />
          <input
            id="post-search"
            type="search"
            value={search}
            placeholder="Post, brand or product"
            onChange={(event) => setSearch(event.target.value)}
            className={cn(
              'w-full rounded-control border border-hairline bg-ink-white py-2 pl-9 pr-3',
              'text-base text-ink-black placeholder:text-ink-grey',
              'transition-colors duration-[120ms] ease-instrument hover:border-ink-grey focus:border-ink-red',
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="post-channel" className="label">
          Channel
        </label>
        <div className="relative">
          <select
            id="post-channel"
            value={channel}
            onChange={(event) => set({ channel: event.target.value || null })}
            className={cn(selectClasses, 'w-44')}
          >
            <option value="">All channels</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {CHANNEL_LABELS[c]}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            strokeWidth={1.5}
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-grey"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="post-status" className="label">
          Status
        </label>
        <div className="relative">
          <select
            id="post-status"
            value={status}
            onChange={(event) => set({ status: event.target.value || null })}
            className={cn(selectClasses, 'w-44')}
          >
            <option value="">All statuses</option>
            {POST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            strokeWidth={1.5}
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-grey"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => set({ q: null, channel: null, status: null })}
          className="flex items-center gap-2 rounded-control px-3 py-2 text-base text-ink-grey transition-colors duration-[120ms] ease-instrument hover:bg-hover hover:text-ink-black"
        >
          <X aria-hidden strokeWidth={1.75} className="size-4" />
          Clear filters
        </button>
      )}
    </div>
  )
}
