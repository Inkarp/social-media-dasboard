import { InkarpLogo } from '@/components/brand/inkarp-logo'
import { ModeBadge } from '@/components/shell/mode-badge'
import { SidebarNav } from '@/components/shell/sidebar-nav'
import type { Viewer } from '@/lib/viewer'

/**
 * Fixed 240px black rail. Hidden below the md breakpoint, where navigation
 * moves to a bottom bar instead.
 */
export function Sidebar({ viewer }: { viewer: Viewer }) {
  return (
    <aside
      data-print="hide"
      className="on-black fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink-black md:flex"
    >
      <div className="border-b border-[color:var(--color-sidebar-hairline)] px-6 py-6">
        <InkarpLogo tone="light" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>

      <div className="border-t border-[color:var(--color-sidebar-hairline)] px-6 py-4">
        <ModeBadge editing={viewer.isEditor} tone="light" />
        {viewer.email && (
          <p className="mt-2 truncate text-xs text-[color:var(--color-sidebar-muted)]" title={viewer.email}>
            {viewer.email}
          </p>
        )}
      </div>
    </aside>
  )
}
