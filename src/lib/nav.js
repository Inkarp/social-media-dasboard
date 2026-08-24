import { CalendarDays, Columns3, Gauge, ListChecks, Microscope } from 'lucide-react'

/**
 * @typedef {Object} NavItem
 * @property {string} href
 * @property {string} label
 * @property {import('lucide-react').LucideIcon} icon
 * @property {string} short Short form for the mobile bottom bar, where 240px of width isn't there.
 */

/** @type {readonly NavItem[]} */
export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', short: 'Dash', icon: Gauge },
  { href: '/principals', label: 'Principals', short: 'Brands', icon: Microscope },
  { href: '/posts', label: 'Posts', short: 'Posts', icon: ListChecks },
  { href: '/calendar', label: 'Calendar', short: 'Cal', icon: CalendarDays },
  { href: '/board', label: 'Board', short: 'Board', icon: Columns3 },
]

/**
 * Exact match for the dashboard, prefix match for everything else.
 * @param {string} pathname
 * @param {string} href
 * @returns {boolean}
 */
export function isNavActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}
