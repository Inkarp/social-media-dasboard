'use client'

import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/cn'
import { fyLabel } from '@/lib/fy'
import { hrefWith } from '@/lib/search-params'

/**
 * Financial-year switcher. Writes `?fy=` and lets the server components below
 * re-query — the year is never held in React state.
 *
 * It reads the selected year from the URL itself rather than taking it as a
 * prop, because this control lives in the root layout and layouts don't receive
 * `searchParams`. `options` and `currentFy` still come from the server so that
 * "which year is now" is decided once, in one timezone, instead of differing
 * between the rendered HTML and the browser that hydrates it.
 */
export function FySwitcher({
  options,
  currentFy,
}: {
  options: readonly number[]
  currentFy: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const requested = Number.parseInt(searchParams.get('fy') ?? '', 10)
  const selected = options.includes(requested) ? requested : currentFy

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="fy-switcher" className="label hidden shrink-0 whitespace-nowrap sm:block">
        Financial year
      </label>

      <div className="relative">
        <select
          id="fy-switcher"
          value={selected}
          disabled={isPending}
          onChange={(event) => {
            const next = event.target.value
            startTransition(() => {
              router.push(hrefWith(pathname, searchParams, { fy: next }))
            })
          }}
          className={cn(
            'num appearance-none rounded-control border border-hairline bg-ink-white',
            'py-2 pl-3 pr-9 text-base font-medium text-ink-black',
            'transition-colors duration-[120ms] ease-instrument',
            'hover:border-ink-grey disabled:opacity-60',
          )}
        >
          {options.map((fy) => (
            <option key={fy} value={fy}>
              {fyLabel(fy)}
              {fy === currentFy ? ' · current' : ''}
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
  )
}
