'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'
import { ACCENT_BG, ACCENT_TEXT, isNavActive, NAV_ITEMS } from '@/lib/nav'

/**
 * Sidebar navigation, styled as a tabbed ledger index rather than a generic
 * icon rail. Each section carries its own accent — the same idea as a
 * binder's colour-coded divider tabs — surfaced two ways: a numbered chip
 * (outlined at rest, solid-filled in that section's colour when active) and
 * a thin bar flush against the sidebar's inner edge on the active row.
 *
 * Section colour never touches shared meaning elsewhere in the app — a
 * button, a post's status, the calibrated gauge — only wayfinding. Only one
 * thing changes what "forest" or "wine" means depending on where you are:
 * which tab you're standing on.
 *
 * The financial year travels with you between sections: switch to Q3 of 2024-25
 * on the dashboard, click Posts, and you're still in 2024-25. Section-specific
 * filters (status, channel, group) are intentionally dropped at the boundary.
 */
export function SidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fy = searchParams.get('fy')

  return (
    <nav aria-label="Sections" className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item, index) => {
        const active = isNavActive(pathname, item.href)
        const href = fy ? `${item.href}?fy=${fy}` : item.href
        const number = String(index + 1).padStart(2, '0')

        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-control py-2.5 pl-2.5 pr-4',
              'text-base transition-colors duration-[120ms] ease-standard',
              active ? cn('font-medium', ACCENT_TEXT[item.accent]) : 'text-muted hover:bg-hover hover:text-ink',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'num flex size-7 shrink-0 items-center justify-center rounded-chip text-xs transition-colors duration-[120ms] ease-standard',
                active
                  ? cn(ACCENT_BG[item.accent], 'text-on-accent')
                  : 'border border-hairline text-faint group-hover:border-muted group-hover:text-muted',
              )}
            >
              {number}
            </span>
            <item.icon aria-hidden strokeWidth={active ? 2 : 1.5} className="size-4 shrink-0" />
            {item.label}
            {active && (
              <span aria-hidden className={cn('absolute inset-y-1 right-0 w-1 rounded-l-chip', ACCENT_BG[item.accent])} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
