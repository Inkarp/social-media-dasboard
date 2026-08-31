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
    { label: 'Target', figure: planned, bar: null },
    { label: 'Implemented', figure: implemented, bar: { implemented, planned } },
    { label: 'Pending', figure: pending, bar: null },
    {
      label: 'On target',
      figure: `${onTarget} / ${principalRows.length}`,
      bar: { implemented: onTarget, planned: principalRows.length },
    },
    { label: 'Completion', figure: `${completion}%`, bar: { implemented, planned } },
  ]

  return (
    <section aria-label="Summary" className="mb-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="card flex flex-col gap-4 border-t-4 border-t-forest p-6">
            <div>
              <p className="num text-2xl font-medium text-ink">{card.figure}</p>
              <p className="label mt-2">{card.label}</p>
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
        ))}
      </div>
    </section>
  )
}
