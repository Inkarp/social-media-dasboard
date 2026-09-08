'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'
import { ACCENT_BG, ACCENT_TEXT, isNavActive, NAV_ITEMS } from '@/lib/nav'

/**
 * Sidebar navigation, styled as a tabbed ledger index rather than a generic
 * icon rail. Each section carries its own accent — the same idea as a
 * binder's colour-coded divider tabs — surfaced three ways on the active
 * row: a solid-filled numbered chip, a wash across the whole row, and a
 * bar flush against the sidebar's inner edge.
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
export function SidebarNav({ collapsed = false }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fy = searchParams.get('fy')

  return (
    <nav aria-label="Sections" className="flex flex-col gap-2 px-3 py-4">
      {NAV_ITEMS.map((item, index) => {
        const active = isNavActive(pathname, item.href)
        const href = fy ? `${item.href}?fy=${fy}` : item.href
        const number = String(index + 1).padStart(2, '0')

        return (
          <Link
            key={item.href}
            href={href}
            aria-label={item.label}
            title={collapsed ? item.label : undefined}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-control border py-3 pl-2.5 pr-4',
              'text-base transition-all duration-[120ms] ease-standard',
              active
                ? cn('border-current bg-surface font-semibold text-ink shadow-card', ACCENT_TEXT[item.accent])
                : 'border-transparent text-muted hover:border-hairline hover:bg-hover hover:text-ink',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'sidebar-number num flex size-8 shrink-0 items-center justify-center rounded-chip text-xs transition-colors duration-[120ms] ease-standard',
                active
                  ? cn(ACCENT_BG[item.accent], 'text-on-accent')
                  : 'border border-hairline bg-surface/60 text-faint group-hover:border-muted group-hover:text-muted',
              )}
            >
              {number}
            </span>
            <item.icon aria-hidden strokeWidth={active ? 2 : 1.5} className="size-4 shrink-0" />
            <span className="sidebar-link-label">{item.label}</span>
            {active && <span aria-hidden className={cn('sidebar-active-marker absolute inset-y-2 right-2 w-1 rounded-full', ACCENT_BG[item.accent])} />}
          </Link>
        )
      })}
    </nav>
  )
}
