'use client'

import { ChevronDown, Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { selectClasses } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import type { ManagerOption } from '@/lib/data/principals'
import { compareGroups } from '@/lib/groups'
import { hrefWith } from '@/lib/search-params'

/**
 * Filters, all of which live in the URL rather than in React state — so a
 * filtered view can be shared, the back button works, and the server components
 * below re-query rather than the browser re-filtering.
 *
 * The search box is debounced: it writes to the URL 300ms after typing stops,
 * because pushing a navigation on every keystroke would queue a server round
 * trip per character.
 */
export function PrincipalsFilters({
  managers,
  groups,
}: {
  managers: ManagerOption[]
  groups: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(currentSearch)

  // Keep the box in step when the URL changes from elsewhere — a cleared filter,
  // the back button — without fighting what is being typed.
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

  const group = searchParams.get('group') ?? ''
  const manager = searchParams.get('pm') ?? ''
  const showRetired = searchParams.get('retired') === '1'
  const hasFilters = Boolean(currentSearch || group || manager || showRetired)

  return (
    <div
      data-print="hide"
      className={cn(
        'mb-6 flex flex-wrap items-end gap-4 transition-opacity duration-[120ms]',
        isPending && 'opacity-60',
      )}
    >
      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <label htmlFor="principal-search" className="label">
          Search
        </label>
        <div className="relative">
          <Search
            aria-hidden
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-grey"
          />
          <input
            id="principal-search"
            type="search"
            value={search}
            placeholder="Brand, group, manager or country"
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
        <label htmlFor="principal-group" className="label">
          Group
        </label>
        <div className="relative">
          <select
            id="principal-group"
            value={group}
            onChange={(event) => set({ group: event.target.value || null })}
            className={cn(selectClasses, 'w-44')}
          >
            <option value="">All groups</option>
            {[...groups].sort(compareGroups).map((name) => (
              <option key={name} value={name}>
                {name}
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
        <label htmlFor="principal-manager" className="label">
          Product manager
        </label>
        <div className="relative">
          <select
            id="principal-manager"
            value={manager}
            onChange={(event) => set({ pm: event.target.value || null })}
            className={cn(selectClasses, 'w-52')}
          >
            <option value="">All managers</option>
            {managers.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
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

      <label className="flex items-center gap-2 py-2 text-base text-ink-black">
        <input
          type="checkbox"
          checked={showRetired}
          onChange={(event) => set({ retired: event.target.checked ? '1' : null })}
          className="size-4 accent-[color:var(--color-ink-red)]"
        />
        Show retired
      </label>

      {hasFilters && (
        <button
          type="button"
          onClick={() => set({ q: null, group: null, pm: null, retired: null })}
          className="flex items-center gap-2 rounded-control px-3 py-2 text-base text-ink-grey transition-colors duration-[120ms] ease-instrument hover:bg-hover hover:text-ink-black"
        >
          <X aria-hidden strokeWidth={1.75} className="size-4" />
          Clear filters
        </button>
      )}
    </div>
  )
}
