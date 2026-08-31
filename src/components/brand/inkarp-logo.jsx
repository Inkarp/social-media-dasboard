import { cn } from '@/lib/cn'

/**
 * Placeholder wordmark. No official Inkarp logo asset was supplied with the
 * brief — drop the real SVG in `public/inkarp-logo.svg` and swap the markup
 * here for an <Image>; nothing else references the mark.
 *
 * Reuses the app's own motif: a 3px forest rule, the same rule that marks the
 * active nav item and fills the calibrated gauges.
 *
 * @param {{ className?: string }} props
 */
export function InkarpLogo({ className }) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span aria-hidden className="block h-8 w-[3px] shrink-0 bg-forest" />
      <span className="flex flex-col gap-1">
        <span className="text-md font-semibold leading-none tracking-[0.14em] text-ink">INKARP</span>
        <span className="text-xs uppercase leading-none tracking-[0.1em] text-muted">Social Dashboard</span>
      </span>
    </span>
  )
}
