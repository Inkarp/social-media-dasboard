import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { Header } from '@/components/shell/header'
import { MobileNav } from '@/components/shell/mobile-nav'
import { Sidebar } from '@/components/shell/sidebar'
import type { Viewer } from '@/lib/viewer'

export function AppShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-4 z-50 rounded-control bg-ink-black px-4 py-2 text-base text-ink-white"
      >
        Skip to content
      </a>

      <Sidebar viewer={viewer} />

      <div className="flex min-h-dvh flex-col md:pl-60">
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
