import { CheckCircle2, CircleGauge, Clock3, Flame, Target } from 'lucide-react'
import { CalibratedBar } from '@/components/ui/calibrated-bar'
import { completionPct, isOnTarget } from '@/lib/fy'

/** @typedef {import('@/lib/types').RollupRow} RollupRow */

/**
 * Planned / Implemented / Pending / On-target count / Completion % — brief
 * 5.1's five summary cards, computed from the `dimension === 'principal'`
 * rows of the same rollup the breakdown tables use, so the cards and the
 * "By Principal" table can never disagree.
 *
 * @param {{ principalRows: RollupRow[] }} props
 */
export function SummaryCards({ principalRows }) {
  const planned = principalRows.reduce((sum, row) => sum + row.planned, 0)
  const implemented = principalRows.reduce((sum, row) => sum + row.implemented, 0)
  const pending = principalRows.reduce((sum, row) => sum + row.pending, 0)
  const onTarget = principalRows.filter((row) => isOnTarget(row.implemented, row.planned)).length
  const completion = completionPct(implemented, planned)

  const cards = [
    { label: 'Target', figure: planned, bar: null, icon: Target, accent: 'border-t-slate text-slate bg-slate/10', figureClass: 'text-2xl' },
    { label: 'Implemented', figure: implemented, bar: { implemented, planned }, icon: Flame, accent: 'border-t-forest text-forest bg-forest/10', figureClass: 'text-2xl' },
    { label: 'Pending', figure: pending, bar: null, icon: Clock3, accent: 'border-t-danger text-danger bg-danger/10', figureClass: 'text-2xl' },
    {
      label: 'On target',
      figure: `${onTarget} / ${principalRows.length}`,
      bar: { implemented: onTarget, planned: principalRows.length },
      icon: CheckCircle2,
      accent: 'border-t-teal text-teal bg-teal/10',
      figureClass: 'text-xl',
    },
    { label: 'Completion', figure: `${completion}%`, bar: { implemented, planned }, icon: CircleGauge, accent: 'border-t-wine text-wine bg-wine/10', figureClass: 'text-xl' },
  ]

  return (
    <section aria-label="Summary" className="mb-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div key={card.label} className={`card flex min-h-40 flex-col justify-between gap-4 border-t-4 p-5 ${card.accent}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`num whitespace-nowrap font-semibold text-ink ${card.figureClass}`}>{card.figure}</p>
                  <p className="label mt-2 text-current">{card.label}</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-current/10">
                  <Icon aria-hidden strokeWidth={1.8} className="size-5" />
                </span>
              </div>
              {card.bar && (
                <CalibratedBar
                  implemented={card.bar.implemented}
                  planned={card.bar.planned}
                  showPercentage={false}
                  label={`${card.label}: ${card.bar.implemented} of ${card.bar.planned}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
