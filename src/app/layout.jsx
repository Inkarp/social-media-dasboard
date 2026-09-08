import { EditorProvider } from '@/components/auth/editor-provider'
import { RealtimeRefresh } from '@/components/realtime/realtime-refresh'
import { AppShell } from '@/components/shell/app-shell'
import { RouteProgressProvider } from '@/components/shell/route-progress'
import { getViewer } from '@/lib/auth'
import './globals.css'

/** @type {import('next').Metadata} */
export const metadata = {
  title: {
    default: 'Inkarp · Social Dashboard',
    template: '%s · Inkarp Social Dashboard',
  },
  description:
    'Plan and track social media activity across all Inkarp principals, by brand, group and product manager.',
}

/** @type {import('next').Viewport} */
export const viewport = {
  themeColor: '#251939',
  width: 'device-width',
  initialScale: 1,
}

/**
 * Nothing in this app is static — the greeting depends on the current hour, the
 * session comes from cookies, and every figure is live shared data. There is no
 * build-time snapshot worth caching.
 */
export const dynamic = 'force-dynamic'

// Sets data-theme on <html> before first paint, so there's no flash of the
// wrong theme while React hydrates. Runs as a blocking inline script rather
// than a React effect specifically so it executes before the browser paints
// anything. Reads localStorage directly instead of the mounted ThemeToggle
// state because nothing has mounted yet at this point.
const THEME_INIT_SCRIPT = `
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
`

/** @param {{ children: import('react').ReactNode }} props */
export default async function RootLayout({ children }) {
  // Resolved once per request, here, then handed to both the server shell and
  // the client context. One source of truth for "who is this".
  const viewer = await getViewer()

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <RouteProgressProvider>
          <EditorProvider viewer={viewer}>
            <RealtimeRefresh />
            <AppShell viewer={viewer}>{children}</AppShell>
          </EditorProvider>
        </RouteProgressProvider>
      </body>
    </html>
  )
}
