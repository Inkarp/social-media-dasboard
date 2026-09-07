'use client'

import { CalendarRange, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { inputClasses } from '@/components/ui/field'
import { useRoutePending } from '@/components/shell/route-progress'
import { cn } from '@/lib/cn'
import { toDateOnly } from '@/lib/fy'
import { REPORT_PRESETS } from '@/lib/report-presets'
import { hrefWith } from '@/lib/search-params'

/**
 * The date-range report (brief 5.1): quick presets plus a custom range, both
 * writing `from`/`to` (and `preset`, only so the matching button can show as
 * active on reload). Narrows which posts count within whatever `fy`/`period`
 * is selected — it does not itself change the financial year or quarter.
 *
 * @param {{ from: string | null, to: string | null, preset: string | null }} props
 */
export function DateRangeReport({ from, to, preset }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  useRoutePending(isPending)
  const [expanded, setExpanded] = useState(Boolean(from || to))

  /** @param {{ from: string | null, to: string | null, preset: string | null }} patch */
  function apply(patch) {
    startTransition(() => {
      router.push(hrefWith(pathname, searchParams, patch))
    })
  }

  /** @param {string} id */
  function applyPreset(id) {
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
          'bg-surface/85 shadow-card transition-colors duration-[120ms] ease-standard hover:border-teal',
          hasRange ? 'border-forest text-forest' : 'text-muted hover:text-ink',
        )}
      >
        <CalendarRange aria-hidden strokeWidth={1.5} className="size-4" />
        {hasRange ? `${from} – ${to}` : 'Date-range report'}
      </button>

      {expanded && (
        <div className={cn('card flex flex-wrap items-end gap-4 border-teal/40 bg-teal/10 p-4', isPending && 'opacity-60')}>
          <div className="flex flex-wrap gap-2">
            {REPORT_PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => applyPreset(option.id)}
                className={cn(
                  'rounded-control border px-3 py-1.5 text-sm transition-colors duration-[120ms] ease-standard',
                  preset === option.id
                    ? 'border-forest bg-forest-06 text-forest'
                    : 'border-hairline bg-bg/30 text-muted hover:border-teal hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted">
              From
              <input
                type="date"
                defaultValue={from ?? ''}
                onChange={(event) => apply({ from: event.target.value || null, to, preset: null })}
                className={cn(inputClasses, 'num w-40')}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
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
              className="flex items-center gap-1.5 rounded-control px-2 py-2 text-sm text-muted transition-colors duration-[120ms] ease-standard hover:text-ink"
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
