'use client'

import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useIsEditor } from '@/components/auth/editor-provider'
import { PrincipalFormDialog } from '@/components/principals/principal-form-dialog'
import { RetirePrincipalDialog } from '@/components/principals/retire-principal-dialog'
import {
  QuarterTargetInputs,
  useTargetEditor,
  YearlyTargetInput,
} from '@/components/principals/target-editor'
import { CalibratedBar } from '@/components/ui/calibrated-bar'
import { cn } from '@/lib/cn'
import type { ManagerOption, PrincipalRow as Row } from '@/lib/data/principals'
import { completionPct, resolveQuarterTargets } from '@/lib/fy'

/**
 * One brand.
 *
 * The 3px bar on the left edge is the only place a brand's own colour appears —
 * never as a fill, never as text.
 *
 * The target editor's state is held here rather than inside a self-contained
 * component, because the yearly figure renders in the row and the quarter
 * overrides render in the panel below it. One hook, two render sites, one value.
 */
export function PrincipalRow({
  row,
  fy,
  managers,
  index,
}: {
  row: Row
  fy: number
  managers: ManagerOption[]
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const isEditor = useIsEditor()
  const editor = useTargetEditor(row.id, fy, row.yearlyTarget, row.overrides)

  const percentage = completionPct(row.implemented, row.planned)
  const resolved = resolveQuarterTargets(row.yearlyTarget, row.overrides)

  return (
    <li
      className={cn(
        'relative border-b border-hairline-soft last:border-0',
        index % 2 === 1 && 'bg-zebra',
        !row.isActive && 'opacity-60',
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: row.brandColor ?? 'transparent' }}
      />

      <div className="flex flex-col gap-3 py-3 pl-4 pr-4 md:grid md:min-h-[52px] md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_7rem_3rem_minmax(0,1.4fr)_8.5rem] md:items-center md:gap-4 md:py-2">
        {/* Name + expander ------------------------------------------------ */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Hide' : 'Show'} quarter targets for ${row.name}`}
            className="-ml-1 shrink-0 rounded-control p-1 text-ink-grey transition-colors duration-[120ms] ease-instrument hover:bg-hover hover:text-ink-black"
          >
            <ChevronRight
              aria-hidden
              strokeWidth={1.75}
              className={cn(
                'size-4 transition-transform duration-[120ms] ease-instrument',
                expanded && 'rotate-90',
              )}
            />
          </button>
          <span className="min-w-0">
            <span className="block truncate text-base font-medium text-ink-black">{row.name}</span>
            {!row.isActive && <span className="text-xs text-ink-grey">Retired</span>}
          </span>
        </div>

        {/* Manager -------------------------------------------------------- */}
        <span className="truncate text-sm text-ink-grey">
          <span className="md:hidden">Manager: </span>
          {row.managerName ?? 'Unassigned'}
        </span>

        {/* Country -------------------------------------------------------- */}
        <span className="truncate text-sm text-ink-grey">{row.country ?? '—'}</span>

        {/* Yearly target -------------------------------------------------- */}
        <div className="flex items-center gap-3">
          <span className="label md:hidden">Target</span>
          {isEditor ? (
            <YearlyTargetInput editor={editor} />
          ) : (
            <span className="num py-1.5 text-base text-ink-black md:w-20 md:text-right">
              {row.yearlyTarget}
            </span>
          )}
        </div>

        {/* Published ------------------------------------------------------ */}
        <div className="flex items-center gap-2">
          <span className="label md:hidden">Published</span>
          <span className="num text-base text-ink-black md:w-full md:text-right">
            {row.implemented}
          </span>
        </div>

        {/* Progress ------------------------------------------------------- */}
        <CalibratedBar
          implemented={row.implemented}
          planned={row.planned}
          label={`${row.name}: ${row.implemented} published of ${row.planned} planned, ${percentage} per cent`}
        />

        {/* Actions -------------------------------------------------------- */}
        {isEditor ? (
          <div className="flex shrink-0 items-center justify-start gap-1 md:justify-end">
            <PrincipalFormDialog managers={managers} principal={row} trigger="menuitem" />
            <RetirePrincipalDialog principal={row} />
          </div>
        ) : (
          <span className="hidden md:block" />
        )}
      </div>

      {/* Quarter detail --------------------------------------------------- */}
      {expanded && (
        <div className="border-t border-hairline-soft px-4 py-4 md:pl-11">
          {isEditor ? (
            <QuarterTargetInputs editor={editor} />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="label">Quarter targets</p>
              <dl className="flex flex-wrap gap-6">
                {([1, 2, 3, 4] as const).map((quarter) => (
                  <div key={quarter} className="flex flex-col gap-1">
                    <dt className="text-xs text-ink-grey">Q{quarter}</dt>
                    <dd className="num text-base text-ink-black">
                      {resolved[`q${quarter}`]}
                      {row.overrides[`q${quarter}`] === null && (
                        <span className="ml-1 text-xs text-ink-grey">derived</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
