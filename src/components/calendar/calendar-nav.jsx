'use client'

import { format, parse } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useRoutePending } from '@/components/shell/route-progress'
import { cn } from '@/lib/cn'
import { toDateOnly } from '@/lib/fy'
import { hrefWith } from '@/lib/search-params'

/**
 * Prev / next / today, writing the `month` (YYYY-MM) URL param.
 * @param {{ month: Date }} props
 */
export function CalendarNav({ month }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  useRoutePending(isPending)

  /** @param {Date} next */
  function go(next) {
    startTransition(() => {
      router.push(hrefWith(pathname, searchParams, { month: format(next, 'yyyy-MM') }))
    })
  }

  const previous = new Date(month.getFullYear(), month.getMonth() - 1, 1)
  const next = new Date(month.getFullYear(), month.getMonth() + 1, 1)

  return (
    <div className={cn('flex items-center gap-2', isPending && 'opacity-60')}>
      <button
        type="button"
        onClick={() => go(previous)}
        aria-label="Previous month"
        className="rounded-control border border-hairline p-2 text-ink-grey transition-colors duration-[120ms] ease-instrument hover:border-ink-grey hover:text-ink-black"
      >
        <ChevronLeft aria-hidden strokeWidth={1.75} className="size-4" />
      </button>

      <span className="num min-w-32 text-center text-base font-medium text-ink-black">
        {format(month, 'MMMM yyyy')}
      </span>

      <button
        type="button"
        onClick={() => go(next)}
        aria-label="Next month"
        className="rounded-control border border-hairline p-2 text-ink-grey transition-colors duration-[120ms] ease-instrument hover:border-ink-grey hover:text-ink-black"
      >
        <ChevronRight aria-hidden strokeWidth={1.75} className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => go(parse(toDateOnly(new Date()), 'yyyy-MM-dd', new Date()))}
        className="ml-2 rounded-control border border-hairline px-3 py-2 text-sm text-ink-grey transition-colors duration-[120ms] ease-instrument hover:border-ink-grey hover:text-ink-black"
      >
        Today
      </button>
    </div>
  )
}
