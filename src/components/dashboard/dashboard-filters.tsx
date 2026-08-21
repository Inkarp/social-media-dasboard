'use client'

import { ChevronDown, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { selectClasses } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import type { ManagerOption } from '@/lib/data/principals'
import { compareGroups } from '@/lib/groups'
import { hrefWith } from '@/lib/search-params'
import { POST_STATUSES, STATUS_LABELS } from '@/lib/status'

/** Group, product manager and status — narrows every card and table below. */
export function DashboardFilters({ groups, managers }: { groups: string[]; managers: ManagerOption[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function set(patch: Record<string, string | null>) {
    startTransition(() => {
      router.push(hrefWith(pathname, searchParams, patch))
    })
  }

  const group = searchParams.get('group') ?? ''
  const manager = searchParams.get('pm') ?? ''
  const status = searchParams.get('status') ?? ''
  const hasFilters = Boolean(group || manager || status)

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
          <ChevronDown aria-hidden strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-grey" />
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
          <ChevronDown aria-hidden strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-grey" />
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
          <ChevronDown aria-hidden strokeWidth={1.5} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-grey" />
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => set({ group: null, pm: null, status: null })}
          className="flex items-center gap-2 rounded-control px-3 py-2 text-base text-ink-grey transition-colors duration-[120ms] ease-instrument hover:bg-hover hover:text-ink-black"
        >
          <X aria-hidden strokeWidth={1.75} className="size-4" />
          Clear filters
        </button>
      )}
    </div>
  )
}
