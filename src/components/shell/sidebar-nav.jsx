'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'
import { isNavActive, NAV_ITEMS } from '@/lib/nav'

/**
 * Sidebar navigation. The active item is marked by a 3px red left rule and
 * white text — not a filled background block, which would read as a button.
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
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item.href)
        const href = fy ? `${item.href}?fy=${fy}` : item.href

        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-control px-4 py-3',
              'text-base transition-colors duration-[120ms] ease-instrument',
              active
                ? 'font-medium text-ink-white'
                : 'text-[color:var(--color-sidebar-muted)] hover:bg-[color:var(--color-sidebar-hover)] hover:text-ink-white',
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute inset-y-1 left-0 w-[3px] rounded-chip bg-ink-red"
              />
            )}
            <item.icon
              aria-hidden
              strokeWidth={active ? 2 : 1.5}
              className={cn('size-4 shrink-0', active ? 'text-ink-red' : 'text-current')}
            />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
