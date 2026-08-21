'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { CalibratedBar } from '@/components/ui/calibrated-bar'
import { cn } from '@/lib/cn'
import { completionPct } from '@/lib/fy'
import type { RollupRow } from '@/lib/types'

/**
 * One breakdown table (brief 5.1: By Principal / Group / Product Manager /
 * Product / Campaign). Search is a client-side filter over the already-fetched
 * rows rather than a URL param round trip — `dashboard_rollup` returns at most
 * a few hundred rows for a financial year, so filtering in the browser is
 * instant and doesn't need a server re-query.
 */
export function BreakdownTable({
  title,
  rows,
  searchable = true,
  showAccent = false,
}: {
  title: string
  rows: RollupRow[]
  searchable?: boolean
  showAccent?: boolean
}) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? rows.filter((row) => row.label.toLowerCase().includes(search.trim().toLowerCase()))
    : rows

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline px-6 py-4">
        <h2 className="text-md text-ink-black">{title}</h2>
        {searchable && rows.length > 0 && (
          <div className="relative">
            <Search
              aria-hidden
              strokeWidth={1.5}
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-grey"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              aria-label={`Search ${title}`}
              className="w-44 rounded-control border border-hairline bg-ink-white py-1.5 pl-8 pr-3 text-sm text-ink-black placeholder:text-ink-grey transition-colors duration-[120ms] ease-instrument hover:border-ink-grey focus:border-ink-red"
            />
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-6 py-8 text-base text-ink-grey">No activity in this period.</p>
      ) : filtered.length === 0 ? (
        <p className="px-6 py-8 text-base text-ink-grey">Nothing matches “{search}”.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline bg-zebra">
                <th className="label px-6 py-3">Name</th>
                <th className="label px-4 py-3 text-right">Planned</th>
                <th className="label px-4 py-3 text-right">Implemented</th>
                <th className="label px-4 py-3 text-right">Pending</th>
                <th className="label px-4 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr
                  key={row.key}
                  className={cn('border-b border-hairline-soft last:border-0', index % 2 === 1 && 'bg-zebra')}
                >
                  <td className="px-6 py-3 text-base text-ink-black">
                    <span className="flex items-center gap-2">
                      {showAccent && (
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: row.accent ?? 'transparent' }}
                        />
                      )}
                      <span className="truncate">{row.label}</span>
                    </span>
                  </td>
                  <td className="num px-4 py-3 text-right text-base text-ink-black">{row.planned}</td>
                  <td className="num px-4 py-3 text-right text-base text-ink-black">{row.implemented}</td>
                  <td className="num px-4 py-3 text-right text-base text-ink-black">{row.pending}</td>
                  <td className="px-4 py-3">
                    <CalibratedBar
                      implemented={row.implemented}
                      planned={row.planned}
                      label={`${row.label}: ${row.implemented} of ${row.planned}, ${completionPct(row.implemented, row.planned)} per cent`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
