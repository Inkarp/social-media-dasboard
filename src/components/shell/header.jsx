import { Suspense } from 'react'
import { SignInLink } from '@/components/auth/sign-in-link'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { InkarpLogo } from '@/components/brand/inkarp-logo'
import { FySwitcher } from '@/components/shell/fy-switcher'
import { ModeBadge } from '@/components/shell/mode-badge'
import { ThemeToggle } from '@/components/shell/theme-toggle'
import { currentFy, fyOptions } from '@/lib/fy'
import { greetingFor, longDate } from '@/lib/greeting'

/** @typedef {import('@/lib/viewer').Viewer} Viewer */

/**
 * The greeting, the year switcher, and the way in and out of editing. On mobile
 * this also carries the wordmark, since the sidebar is hidden there.
 *
 * @param {{ viewer: Viewer }} props
 */
export function Header({ viewer }) {
  const now = new Date()
  const options = fyOptions(now)
  const current = currentFy(now)

  return (
    <header
      data-print="hide"
      className="studio-topbar sticky top-0 z-20 border-b border-hairline bg-bg/75 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-4 pt-4 md:hidden">
        <InkarpLogo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <ModeBadge editing={viewer.isEditor} />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
        <div className="min-w-0">
          <h1 className="text-lg text-ink">{greetingFor(now)}</h1>
          <p className="mt-1 text-sm font-medium text-teal">{longDate(now)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Suspense fallback={<div className="h-9 w-32 rounded-control border border-hairline" />}>
            <FySwitcher options={options} currentFy={current} />
          </Suspense>

          <span className="hidden md:block">
            <ThemeToggle />
          </span>

          {viewer.isEditor ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:block">
                <ModeBadge editing />
              </span>
              <SignOutButton />
            </div>
          ) : (
            <Suspense fallback={<div className="h-9 w-32 rounded-control border border-hairline" />}>
              <SignInLink />
            </Suspense>
          )}
        </div>
      </div>
    </header>
  )
}
