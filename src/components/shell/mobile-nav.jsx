'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'
import { isNavActive, NAV_ITEMS } from '@/lib/nav'

/**
 * Below md the sidebar becomes a bottom bar. The active marker rotates from a
 * left rule to a top rule so the motif survives the change in axis.
 */
export function MobileNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fy = searchParams.get('fy')

  return (
    <nav
      aria-label="Sections"
      data-print="hide"
      className="on-black fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--color-sidebar-hairline)] bg-ink-black pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href)
          const href = fy ? `${item.href}?fy=${fy}` : item.href

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-1 py-3',
                  'text-xs transition-colors duration-[120ms] ease-instrument',
                  active
                    ? 'font-medium text-ink-white'
                    : 'text-[color:var(--color-sidebar-muted)]',
                )}
              >
                {active && (
                  <span aria-hidden className="absolute inset-x-3 top-0 h-[3px] bg-ink-red" />
                )}
                <item.icon
                  aria-hidden
                  strokeWidth={active ? 2 : 1.5}
                  className={cn('size-4', active ? 'text-ink-red' : 'text-current')}
                />
                {item.short}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
