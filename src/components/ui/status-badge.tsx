import { cn } from '@/lib/cn'
import { STATUS_LABELS, STATUS_SWATCH, type PostStatus } from '@/lib/status'

/**
 * Status shown as a weighted swatch plus its name. The text is not optional —
 * colour is never the sole carrier of meaning, and at 40% red vs 100% red the
 * difference is deliberately subtle.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: PostStatus
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)}>
      <span aria-hidden className={cn('size-2 shrink-0 rounded-chip', STATUS_SWATCH[status])} />
      <span className="text-sm text-ink-black">{STATUS_LABELS[status]}</span>
    </span>
  )
}
