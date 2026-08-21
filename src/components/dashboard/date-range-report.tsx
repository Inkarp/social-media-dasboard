'use client'

import { CalendarRange, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { inputClasses } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import { toDateOnly } from '@/lib/fy'
import { REPORT_PRESETS } from '@/lib/report-presets'
import { hrefWith } from '@/lib/search-params'

/**
 * The date-range report (brief 5.1): quick presets plus a custom range, both
 * writing `from`/`to` (and `preset`, only so the matching button can show as
 * active on reload). Narrows which posts count within whatever `fy`/`period`
 * is selected — it does not itself change the financial year or quarter.
 */
export function DateRangeReport({ from, to, preset }: { from: string | null; to: string | null; preset: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(Boolean(from || to))

  function apply(patch: { from: string | null; to: string | null; preset: string | null }) {
    startTransition(() => {
      router.push(hrefWith(pathname, searchParams, patch))
    })
  }

  function applyPreset(id: string) {
    const definition = REPORT_PRESETS.find((p) => p.id === id)
    if (!definition) return
    const range = definition.range(new Date())
    apply({ from: toDateOnly(range.start), to: toDateOnly(range.end), preset: id })
  }

  const hasRange = Boolean(from || to)

  return (
    <div data-print="hide" className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'inline-flex items-center gap-2 self-start rounded-control border border-hairline px-3 py-2 text-sm',
          'transition-colors duration-[120ms] ease-instrument hover:border-ink-grey',
          hasRange ? 'border-ink-red text-ink-red' : 'text-ink-grey hover:text-ink-black',
        )}
      >
        <CalendarRange aria-hidden strokeWidth={1.5} className="size-4" />
        {hasRange ? `${from} – ${to}` : 'Date-range report'}
      </button>

      {expanded && (
        <div className={cn('flex flex-wrap items-end gap-4 rounded-card border border-hairline bg-ink-white p-4', isPending && 'opacity-60')}>
          <div className="flex flex-wrap gap-2">
            {REPORT_PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => applyPreset(option.id)}
                className={cn(
                  'rounded-control border px-3 py-1.5 text-sm transition-colors duration-[120ms] ease-instrument',
                  preset === option.id
                    ? 'border-ink-red bg-ink-red-06 text-ink-red'
                    : 'border-hairline text-ink-grey hover:border-ink-grey hover:text-ink-black',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-grey">
              From
              <input
                type="date"
                defaultValue={from ?? ''}
                onChange={(event) => apply({ from: event.target.value || null, to, preset: null })}
                className={cn(inputClasses, 'num w-40')}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink-grey">
              To
              <input
                type="date"
                defaultValue={to ?? ''}
                onChange={(event) => apply({ from, to: event.target.value || null, preset: null })}
                className={cn(inputClasses, 'num w-40')}
              />
            </label>
          </div>

          {hasRange && (
            <button
              type="button"
              onClick={() => apply({ from: null, to: null, preset: null })}
              className="flex items-center gap-1.5 rounded-control px-2 py-2 text-sm text-ink-grey transition-colors duration-[120ms] ease-instrument hover:text-ink-black"
            >
              <X aria-hidden strokeWidth={1.75} className="size-4" />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
