'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { PrincipalRow } from '@/components/principals/principal-row'
import { CalibratedBar } from '@/components/ui/calibrated-bar'
import { cn } from '@/lib/cn'

/** @typedef {import('@/lib/data/principals').ManagerOption} ManagerOption */
/** @typedef {import('@/lib/data/principals').PrincipalRow} Row */

/**
 * One collapsible group, with its own roll-up in the header so a collapsed
 * section still reports where the group stands.
 *
 * @param {{
 *   group: string,
 *   rows: Row[],
 *   fy: number,
 *   managers: ManagerOption[],
 *   defaultOpen?: boolean,
 * }} props
 */
export function GroupSection({ group, rows, fy, managers, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  const planned = rows.reduce((sum, row) => sum + row.planned, 0)
  const implemented = rows.reduce((sum, row) => sum + row.implemented, 0)

  return (
    <section className="card overflow-hidden border-t-4 border-t-slate">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn(
            'flex w-full items-center gap-4 bg-slate/10 px-4 py-4 text-left',
            'transition-colors duration-[120ms] ease-standard hover:bg-hover',
          )}
        >
          <ChevronDown
            aria-hidden
            strokeWidth={1.75}
            className={cn(
              'size-4 shrink-0 text-muted transition-transform duration-[120ms] ease-standard',
              !open && '-rotate-90',
            )}
          />

          <span className="flex-1 text-md font-semibold text-slate">{group}</span>

          <span className="num hidden text-xs text-muted sm:block">
            {rows.length} {rows.length === 1 ? 'brand' : 'brands'}
          </span>

          <span className="num text-xs text-muted">
            {implemented} / {planned}
          </span>

          <span className="hidden w-40 md:block">
            <CalibratedBar
              implemented={implemented}
              planned={planned}
              label={`${group}: ${implemented} published of ${planned} planned`}
            />
          </span>
        </button>
      </h3>

      {open && (
        <div className="border-t border-hairline">
          <div
            aria-hidden
            className="hidden border-b border-hairline bg-slate/12 pl-4 pr-4 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_7rem_3rem_minmax(0,1.4fr)_8.5rem] md:items-center md:gap-4 md:py-2"
          >
            <span className="label pl-6">Brand</span>
            <span className="label">Manager</span>
            <span className="label">Country</span>
            <span className="label text-right">Target</span>
            <span className="label text-right">Pub.</span>
            <span className="label">Progress</span>
            <span className="label text-right">Actions</span>
          </div>

          <ul>
            {rows.map((row, index) => (
              <PrincipalRow
                key={row.id}
                row={row}
                fy={fy}
                managers={managers}
                index={index}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
