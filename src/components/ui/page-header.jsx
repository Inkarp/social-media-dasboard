import { cn } from '@/lib/cn'
import { ACCENT_BG } from '@/lib/nav'

/**
 * @param {{
 *   title: string,
 *   description?: string,
 *   actions?: import('react').ReactNode,
 *   accent?: import('@/lib/nav').SectionAccent,
 * }} props
 */
export function PageHeader({ title, description, actions, accent }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {accent && <span aria-hidden className={cn('mt-1.5 block h-5 w-[3px] shrink-0', ACCENT_BG[accent])} />}
        <div className="min-w-0">
          <h2 className="text-lg text-ink">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-base text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
