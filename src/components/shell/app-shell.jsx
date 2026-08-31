import { Suspense } from 'react'
import { Header } from '@/components/shell/header'
import { MobileNav } from '@/components/shell/mobile-nav'
import { Sidebar } from '@/components/shell/sidebar'

/** @typedef {import('@/lib/viewer').Viewer} Viewer */

/**
 * @param {{ viewer: Viewer, children: import('react').ReactNode }} props
 */
export function AppShell({ viewer, children }) {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-4 z-50 rounded-control bg-ink px-4 py-2 text-base text-surface"
      >
        Skip to content
      </a>

      <Sidebar viewer={viewer} />

      <div className="flex min-h-dvh flex-col md:pl-64">
        <Header viewer={viewer} />

        <main id="main" className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-8">
          {children}
        </main>
      </div>

      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  )
}
