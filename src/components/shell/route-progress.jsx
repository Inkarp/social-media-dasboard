'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

const RouteProgressContext =
  /** @type {import('react').Context<((id: string, pending: boolean) => void) | null>} */
  (createContext(null))

/**
 * One thin forest bar, fixed to the top of the viewport, that fills whenever a
 * navigation is in flight — a sidebar `<Link>`, the FY switcher, a filter
 * dropdown, the calendar's prev/next. One visual language for "something is
 * loading" everywhere in the app, so a click gets an answer immediately, even
 * before a route's own `loading.jsx` skeleton has had a chance to mount.
 *
 * Two sources feed the same pending set:
 *   - a document-level click listener that fires the instant an internal
 *     `<a>` is clicked, which covers every `next/link` in the app for free
 *   - `useRoutePending`, called by client components that navigate via
 *     `router.push`/`replace` from a `<select>` or button rather than a link
 *
 * Both report into an id -> pending map keyed by caller, so overlapping
 * navigations still resolve to a single bar, and the bar clears the instant
 * the URL actually settles rather than after a guessed delay.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function RouteProgressProvider({ children }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, setPending] = useState(/** @type {ReadonlySet<string>} */ (new Set()))
  const linkTimeout = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))

  const report = useCallback(
    /** @param {string} id @param {boolean} isPending */
    (id, isPending) => {
      setPending((current) => {
        const has = current.has(id)
        if (isPending === has) return current
        const next = new Set(current)
        if (isPending) next.add(id)
        else next.delete(id)
        return next
      })
    },
    [],
  )

  useEffect(() => {
    /** @param {MouseEvent} event */
    function onClick(event) {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      const anchor = target instanceof Element ? target.closest('a') : null
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//')) return

      const url = new URL(anchor.href)
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      report('link', true)
      // A link whose target never actually changes the URL (an external
      // redirect, a route that errors before rendering) would otherwise pin
      // the bar on forever — this is the backstop, not the normal path out.
      if (linkTimeout.current) clearTimeout(linkTimeout.current)
      linkTimeout.current = setTimeout(() => report('link', false), 8000)
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [report])

  // The URL settling is what "navigation landed" means, regardless of
  // whether a link click or a startTransition triggered it.
  useEffect(() => {
    if (linkTimeout.current) clearTimeout(linkTimeout.current)
    report('link', false)
  }, [pathname, searchParams, report])

  return (
    <RouteProgressContext.Provider value={report}>
      <RouteProgressBar active={pending.size > 0} />
      {children}
    </RouteProgressContext.Provider>
  )
}

/**
 * Reports a component's own navigation-pending state (from its `useTransition`)
 * to the shared top bar. Call with the same `isPending` boolean already used
 * to dim the control locally — this doesn't replace that, it adds the same
 * signal to the global bar too.
 *
 * @param {boolean} pending
 */
export function useRoutePending(pending) {
  const report = useContext(RouteProgressContext)
  const id = useId()

  useEffect(() => {
    report?.(id, pending)
  }, [report, id, pending])

  useEffect(() => () => report?.(id, false), [report, id])
}

/** @param {{ active: boolean }} props */
function RouteProgressBar({ active }) {
  const [visible, setVisible] = useState(false)
  const [scale, setScale] = useState(0)
  const interval = useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null))
  const hide = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null))

  useEffect(() => {
    if (active) {
      if (hide.current) clearTimeout(hide.current)
      setVisible(true)
      setScale((current) => (current > 0 ? current : 0.08))

      interval.current = setInterval(() => {
        setScale((current) => (current >= 0.9 ? current : current + (0.9 - current) * 0.15))
      }, 200)

      return () => {
        if (interval.current) clearInterval(interval.current)
      }
    }

    if (interval.current) clearInterval(interval.current)
    setScale(1)
    hide.current = setTimeout(() => {
      setVisible(false)
      setScale(0)
    }, 200)

    return () => {
      if (hide.current) clearTimeout(hide.current)
    }
  }, [active])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        className={cn(
          'h-full origin-left bg-forest transition-[opacity,transform] duration-200 ease-standard',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transform: `scaleX(${scale})` }}
      />
    </div>
  )
}
