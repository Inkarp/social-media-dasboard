import { cn } from '@/lib/cn'

/**
 * Flat white surface. Elevation comes from a 1px hairline and 24px of internal
 * padding — there is no drop shadow anywhere on a card, by design.
 *
 * @param {{
 *   children: import('react').ReactNode,
 *   className?: string,
 *   padded?: boolean,
 * }} props
 */
export function Card({ children, className, padded = true }) {
  return <section className={cn('card', padded && 'p-6', className)}>{children}</section>
}

/**
 * @param {{
 *   title: string,
 *   hint?: string,
 *   actions?: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export function CardHeader({ title, hint, actions, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-md text-ink">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </div>
      {actions}
    </div>
  )
}
