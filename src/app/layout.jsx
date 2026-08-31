import { IBM_Plex_Mono, Inter, Source_Serif_4 } from 'next/font/google'
import { EditorProvider } from '@/components/auth/editor-provider'
import { RealtimeRefresh } from '@/components/realtime/realtime-refresh'
import { AppShell } from '@/components/shell/app-shell'
import { RouteProgressProvider } from '@/components/shell/route-progress'
import { getViewer } from '@/lib/auth'
import './globals.css'

/**
 * Three faces. Inter for interface text and body copy — a workhorse
 * grotesque that stays legible at 12px. Source Serif 4 for the masthead
 * only (page-title h1s) — the one place the print-register concept shows
 * up in type, never body copy or numbers. IBM Plex Mono for every figure,
 * so columns of numbers align on the digit the way a ruled ledger does.
 */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-source-serif',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

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
  themeColor: '#060812',
  width: 'device-width',
  initialScale: 1,
}

/**
 * Nothing in this app is static — the greeting depends on the current hour, the
 * session comes from cookies, and every figure is live shared data. There is no
 * build-time snapshot worth caching.
 */
export const dynamic = 'force-dynamic'

/** @param {{ children: import('react').ReactNode }} props */
export default async function RootLayout({ children }) {
  // Resolved once per request, here, then handed to both the server shell and
  // the client context. One source of truth for "who is this".
  const viewer = await getViewer()

  return (
    <html lang="en-IN" className={`${inter.variable} ${sourceSerif.variable} ${ibmPlexMono.variable}`}>
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
