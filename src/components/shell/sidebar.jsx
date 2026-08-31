import { InkarpLogo } from '@/components/brand/inkarp-logo'
import { ModeBadge } from '@/components/shell/mode-badge'
import { SidebarNav } from '@/components/shell/sidebar-nav'

/** @typedef {import('@/lib/viewer').Viewer} Viewer */

/**
 * Fixed 240px paper rail, ruled off from the content by a hairline rather
 * than a colour block. Hidden below the md breakpoint, where navigation
 * moves to a bottom bar instead.
 *
 * @param {{ viewer: Viewer }} props
 */
export function Sidebar({ viewer }) {
  return (
    <aside
      data-print="hide"
      className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-hairline bg-surface md:flex"
    >
      <div className="border-b border-hairline px-6 py-6">
        <InkarpLogo />
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>

      <div className="border-t border-hairline px-6 py-4">
        <ModeBadge editing={viewer.isEditor} />
        {viewer.email && (
          <p className="mt-2 truncate text-xs text-muted" title={viewer.email}>
            {viewer.email}
          </p>
        )}
      </div>
    </aside>
  )
}
