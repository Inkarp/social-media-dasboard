import { cn } from '@/lib/cn'
import { ACCENT_BORDER, ACCENT_TEXT, ACCENT_WASH } from '@/lib/nav'

/**
 * The masthead. When a section accent is given it bleeds full-width, edge to
 * edge with `<main>`'s own padding cancelled out — a coloured band at the top
 * of every page, not just a hint of colour next to the title. This is the
 * one place the "which section am I in" answer is unmissable.
 *
 * @param {{
 *   title: string,
 *   description?: string,
 *   actions?: import('react').ReactNode,
 *   accent?: import('@/lib/nav').SectionAccent,
 * }} props
 */
export function PageHeader({ title, description, actions, accent }) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        accent &&
          cn(
            '-mx-4 -mt-6 border-b px-4 pb-6 pt-7 md:-mx-8 md:-mt-8 md:px-8 md:pb-7 md:pt-9',
            ACCENT_BORDER[accent],
            ACCENT_WASH[accent],
          ),
      )}
    >
      <div className="min-w-0">
        <h2 className={cn('text-xl text-ink', accent && ACCENT_TEXT[accent])}>{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-base font-medium text-ink">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
