import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Empty states direct rather than apologise: say what isn't here and what to do
 * about it, in that order.
 */
export function EmptyState({
  title,
  action,
  className,
}: {
  title: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-4 border border-dashed border-hairline px-6 py-12',
        'rounded-card bg-ink-white',
        className,
      )}
    >
      <p className="max-w-md text-base text-ink-grey">{title}</p>
      {action}
    </div>
  )
}
