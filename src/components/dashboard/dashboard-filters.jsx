'use client'

import { FormatFilter } from '@/components/posts/format-filter'
import { ChevronDown, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { selectClasses } from '@/components/ui/field'
import { useRoutePending } from '@/components/shell/route-progress'
import { cn } from '@/lib/cn'
import { compareGroups } from '@/lib/groups'
import { hrefWith } from '@/lib/search-params'
import { POST_STATUSES, STATUS_LABELS } from '@/lib/status'

/** @typedef {import('@/lib/data/principals').ManagerOption} ManagerOption */

/**
 * Group, product manager and status — narrows every card and table below.
 * @param {{ groups: string[], managers: ManagerOption[] }} props
 */
export function DashboardFilters({ groups, managers }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  useRoutePending(isPending)

  /** @param {Record<string, string | null>} patch */
  function set(patch) {
    startTransition(() => {
      router.push(hrefWith(pathname, searchParams, patch))
    })
  }

  const group = searchParams.get('group') ?? ''
  const manager = searchParams.get('pm') ?? ''
  const status = searchParams.get('status') ?? ''
  const hasFilters = Boolean(searchParams.get('format') || group || manager || status)

  return (
    <div
      data-print="hide"
      className={cn('flex flex-wrap items-end gap-4', isPending && 'opacity-60')}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="dash-group" className="label">
          Group
        </label>
        <div className="relative">
          <select
            id="dash-group"
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
          <ChevronDown aria-hidden strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="dash-pm" className="label">
          Product manager
        </label>
        <div className="relative">
          <select
            id="dash-pm"
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
          <ChevronDown aria-hidden strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="dash-status" className="label">
          Status
        </label>
        <div className="relative">
          <select
            id="dash-status"
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
          <ChevronDown aria-hidden strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </div>
      </div>

      <FormatFilter />

      {hasFilters && (
        <button
          type="button"
          onClick={() => set({ group: null, pm: null, status: null, format: null })}
          className="flex items-center gap-2 rounded-control px-3 py-2 text-base text-muted transition-colors duration-[120ms] ease-standard hover:bg-hover hover:text-ink"
        >
          <X aria-hidden strokeWidth={1.75} className="size-4" />
          Clear filters
        </button>
      )}
    </div>
  )
}
