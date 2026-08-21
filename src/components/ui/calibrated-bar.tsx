import { cn } from '@/lib/cn'
import { completionPct } from '@/lib/fy'

/**
 * The signature element: a calibrated gauge, not a rounded pastel pill.
 *
 * Anatomy
 *   · 6px track at 6% black, square ends, no gradient anywhere
 *   · red fill for implemented posts
 *   · 1px grey tick marks at 25 / 50 / 75 of the bar's width
 *   · 2px black marker at the target position
 *   · the percentage in tabular mono, right-aligned alongside
 *
 * The scale is `max(implemented, planned)`, which is what lets the target
 * marker slide inward when a brand overshoots: publish 60 against a target of
 * 40 and the fill runs full while the black marker sits two-thirds along,
 * showing both that the plan was met and by how much it was beaten. A bar that
 * simply clamped at 100% would throw that information away.
 */
export function CalibratedBar({
  implemented,
  planned,
  showPercentage = true,
  label,
  className,
}: {
  implemented: number
  planned: number
  /** Hide the numeral when the surrounding layout already states it. */
  showPercentage?: boolean
  /** Accessible name. Defaults to a plain description of the two figures. */
  label?: string
  className?: string
}) {
  const done = Math.max(0, implemented)
  const target = Math.max(0, planned)
  const scale = Math.max(done, target, 1)

  const fillPct = (done / scale) * 100
  const markerPct = (target / scale) * 100
  const percentage = completionPct(done, target)

  const description =
    label ?? `${done} of ${target} published — ${percentage} per cent of target`

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={description}
        aria-label={description}
        className="relative h-1.5 min-w-16 flex-1 overflow-hidden bg-track"
      >
        {/* Fill. Animated with scaleX so a server component can carry the
            motion without shipping any JavaScript to do it. */}
        <div
          className="absolute inset-y-0 left-0 origin-left bg-ink-red motion-safe:[animation:gauge-fill_var(--duration-gauge)_var(--ease-instrument)_both]"
          style={{ width: `${fillPct}%` }}
        />

        {/* Calibration ticks. */}
        {[25, 50, 75].map((tick) => (
          <span
            key={tick}
            aria-hidden
            className="absolute inset-y-0 w-px bg-tick"
            style={{ left: `${tick}%` }}
          />
        ))}

        {/* Target marker. Nudged half its width so it straddles the position
            rather than sitting to the right of it, and clamped inside the
            track so a 100% marker stays visible at the edge. */}
        {target > 0 && (
          <span
            aria-hidden
            className="absolute inset-y-0 w-0.5 bg-ink-black"
            style={{ left: `min(calc(${markerPct}% - 1px), calc(100% - 2px))` }}
          />
        )}
      </div>

      {showPercentage && (
        <span className="num w-10 shrink-0 text-right text-xs text-ink-black">
          {percentage}%
        </span>
      )}
    </div>
  )
}
