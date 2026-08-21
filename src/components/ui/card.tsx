import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Flat white surface. Elevation comes from a 1px hairline and 24px of internal
 * padding — there is no drop shadow anywhere on a card, by design.
 */
export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  /** Turn off for tables, which manage their own cell padding. */
  padded?: boolean
}) {
  return (
    <section className={cn('card', padded && 'p-6', className)}>{children}</section>
  )
}

export function CardHeader({
  title,
  hint,
  actions,
  className,
}: {
  title: string
  hint?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-md text-ink-black">{title}</h2>
        {hint && <p className="mt-1 text-sm text-ink-grey">{hint}</p>}
      </div>
      {actions}
    </div>
  )
}
