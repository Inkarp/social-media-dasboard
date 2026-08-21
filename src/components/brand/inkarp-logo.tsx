import { cn } from '@/lib/cn'

/**
 * Placeholder wordmark. No official Inkarp logo asset was supplied with the
 * brief — drop the real SVG in `public/inkarp-logo.svg` and swap the markup
 * here for an <Image>; nothing else references the mark.
 *
 * Until then the wordmark reuses the app's own motif: a 3px red rule, the same
 * rule that marks the active nav item and fills the calibrated gauges.
 */
export function InkarpLogo({
  tone = 'light',
  className,
}: {
  /** 'light' = white text for the black sidebar. 'dark' = black text on white. */
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span aria-hidden className="block h-8 w-[3px] shrink-0 bg-ink-red" />
      <span className="flex flex-col gap-1">
        <span
          className={cn(
            'text-md font-semibold leading-none tracking-[0.14em]',
            tone === 'light' ? 'text-ink-white' : 'text-ink-black',
          )}
        >
          INKARP
        </span>
        <span
          className={cn(
            'text-xs uppercase leading-none tracking-[0.1em]',
            tone === 'light' ? 'text-[color:var(--color-sidebar-muted)]' : 'text-ink-grey',
          )}
        >
          Social Dashboard
        </span>
      </span>
    </span>
  )
}
