import {
  CalendarDays,
  Columns3,
  Gauge,
  ListChecks,
  Microscope,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Short form for the mobile bottom bar, where 240px of width isn't there. */
  short: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Dashboard', short: 'Dash', icon: Gauge },
  { href: '/principals', label: 'Principals', short: 'Brands', icon: Microscope },
  { href: '/posts', label: 'Posts', short: 'Posts', icon: ListChecks },
  { href: '/calendar', label: 'Calendar', short: 'Cal', icon: CalendarDays },
  { href: '/board', label: 'Board', short: 'Board', icon: Columns3 },
] as const

/** Exact match for the dashboard, prefix match for everything else. */
export function isNavActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
