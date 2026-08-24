'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useRoutePending } from '@/components/shell/route-progress'
import { cn } from '@/lib/cn'
import { QUARTERS, quarterLabel } from '@/lib/fy'
import { hrefWith } from '@/lib/search-params'

/** @typedef {import('@/lib/fy').Quarter} Quarter */

/**
 * Full year / Q1–Q4, a segmented control writing `period`. Choosing a quarter
 * here clears any custom date range from `date-range-report.jsx` — the two
 * controls would otherwise disagree about which is authoritative for "what
 * period is this".
 *
 * @param {{ quarter: Quarter | null }} props
 */
export function TimeSelector({ quarter }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  useRoutePending(isPending)

  /** @param {Quarter | null} next */
  function select(next) {
    startTransition(() => {
      router.push(
        hrefWith(pathname, searchParams, {
          period: next,
          from: null,
          to: null,
          preset: null,
        }),
      )
    })
  }

  /** @type {{ value: Quarter | null, label: string }[]} */
  const options = [
    { value: null, label: 'Full year' },
    ...QUARTERS.map((q) => ({ value: q, label: quarterLabel(q) })),
  ]

  return (
    <div
      data-print="hide"
      role="tablist"
      aria-label="Time period"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-control border border-hairline bg-ink-white p-1',
        isPending && 'opacity-60',
      )}
    >
      {options.map((option) => {
        const active = option.value === quarter
        return (
          <button
            key={option.label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => select(option.value)}
            className={cn(
              'rounded-chip px-3 py-1.5 text-sm transition-colors duration-[120ms] ease-instrument',
              active ? 'bg-ink-black text-ink-white' : 'text-ink-grey hover:text-ink-black',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
