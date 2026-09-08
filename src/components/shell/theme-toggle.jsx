'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buttonClasses } from '@/components/ui/button'

/**
 * Light/dark switch. The actual theme is applied instantly by an inline
 * script in the root layout (before hydration, so there's no flash) — this
 * component only needs to flip the attribute it already set and persist the
 * choice. Both icons render on every load and are toggled with CSS
 * (`.theme-toggle-sun` / `.theme-toggle-moon` in globals.css) rather than
 * JS state, so there's nothing here that can mismatch between server and
 * client on first paint.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggle() {
    const next = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Private browsing or storage disabled — the theme still applies for
      // this session, it just won't be remembered next visit.
    }
    setIsDark(!isDark)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={buttonClasses({ variant: 'secondary', className: 'size-9 px-0 rounded-full' })}
    >
      <Sun aria-hidden strokeWidth={1.75} className="theme-toggle-sun size-4" />
      <Moon aria-hidden strokeWidth={1.75} className="theme-toggle-moon size-4" />
    </button>
  )
}
