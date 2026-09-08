'use client'

import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { InkarpLogo } from '@/components/brand/inkarp-logo'
import { ModeBadge } from '@/components/shell/mode-badge'
import { SidebarNav } from '@/components/shell/sidebar-nav'

/** @typedef {import('@/lib/viewer').Viewer} Viewer */

/**
 * Collapsible desktop navigation. Mobile navigation uses a bottom bar.
 *
 * @param {{ viewer: Viewer }} props
 */
export function Sidebar({ viewer }) {
  const [collapsed, setCollapsed] = useState(false)
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <aside
      data-print="hide"
      data-collapsed={collapsed}
      className="studio-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col md:flex"
    >
      <div className="sidebar-topbar">
        <div className="sidebar-card">
          <InkarpLogo className="sidebar-logo" />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="sidebar-navigation"
          className="sidebar-toggle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ToggleIcon className="size-4.5" aria-hidden="true" />
        </button>
      </div>

      <div id="sidebar-navigation" className="min-h-0 flex-1 overflow-y-auto">
        <p className="studio-nav-label">YOUR WORKSPACE</p>
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className="studio-sidebar-note" aria-hidden="true">
      </div>

      <div className="border-t border-hairline bg-surface/60 px-6 py-4">
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
