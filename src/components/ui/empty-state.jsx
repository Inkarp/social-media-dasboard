import { cn } from '@/lib/cn'

/**
 * Empty states direct rather than apologise: say what isn't here and what to do
 * about it, in that order.
 *
 * @param {{
 *   title: string,
 *   action?: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export function EmptyState({ title, action, className }) {
  return (
    <div
      className={cn(
        'card flex flex-col items-start gap-4 border border-dashed border-teal px-6 py-12',
        'bg-teal/10',
        className,
      )}
    >
      <p className="max-w-md text-base text-muted">{title}</p>
      {action}
    </div>
  )
}
