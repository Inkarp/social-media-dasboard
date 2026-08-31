import { CalendarDays, Columns3, Gauge, ListChecks, Microscope } from 'lucide-react'

/** @typedef {'forest' | 'slate' | 'ochre' | 'wine' | 'teal'} SectionAccent */

/**
 * @typedef {Object} NavItem
 * @property {string} href
 * @property {string} label
 * @property {import('lucide-react').LucideIcon} icon
 * @property {string} short Short form for the mobile bottom bar, where 240px of width isn't there.
 * @property {SectionAccent} accent Section identity colour — sidebar tab, mobile top rule, page masthead.
 *   Never used for shared meaning (buttons, post status, the calibrated gauge): those stay forest/danger
 *   everywhere so their meaning doesn't shift depending on which page you're looking at.
 */

/** @type {readonly NavItem[]} */
export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', short: 'Dash', icon: Gauge, accent: 'forest' },
  { href: '/principals', label: 'Principals', short: 'Brands', icon: Microscope, accent: 'slate' },
  { href: '/posts', label: 'Posts', short: 'Posts', icon: ListChecks, accent: 'ochre' },
  { href: '/calendar', label: 'Calendar', short: 'Cal', icon: CalendarDays, accent: 'wine' },
  { href: '/board', label: 'Board', short: 'Board', icon: Columns3, accent: 'teal' },
]

/**
 * Static class strings, one full literal per accent — never built from a
 * template string, so Tailwind's compiler can actually see them.
 * @type {Record<SectionAccent, string>}
 */
export const ACCENT_BG = {
  forest: 'bg-forest',
  slate: 'bg-slate',
  ochre: 'bg-ochre-ink',
  wine: 'bg-wine',
  teal: 'bg-teal',
}

/** @type {Record<SectionAccent, string>} */
export const ACCENT_TEXT = {
  forest: 'text-forest',
  slate: 'text-slate',
  ochre: 'text-ochre-ink',
  wine: 'text-wine',
  teal: 'text-teal',
}

/** @type {Record<SectionAccent, string>} */
export const ACCENT_BORDER = {
  forest: 'border-forest',
  slate: 'border-slate',
  ochre: 'border-ochre-ink',
  wine: 'border-wine',
  teal: 'border-teal',
}

/**
 * Exact match for the dashboard, prefix match for everything else.
 * @param {string} pathname
 * @param {string} href
 * @returns {boolean}
 */
export function isNavActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

/**
 * The section accent for a given route, falling back to forest for routes
 * that aren't a primary nav destination (sign-in, error pages).
 * @param {string} href
 * @returns {SectionAccent}
 */
export function accentFor(href) {
  return NAV_ITEMS.find((item) => item.href === href)?.accent ?? 'forest'
}
