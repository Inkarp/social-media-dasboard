import type { Metadata, Viewport } from 'next'
import { Inter_Tight, JetBrains_Mono } from 'next/font/google'
import type { ReactNode } from 'react'
import { EditorProvider } from '@/components/auth/editor-provider'
import { RealtimeRefresh } from '@/components/realtime/realtime-refresh'
import { AppShell } from '@/components/shell/app-shell'
import { getViewer } from '@/lib/auth'
import './globals.css'

/**
 * Two faces, no more. Inter Tight for interface text — a grotesque with tight
 * apertures that stays legible at 12px. JetBrains Mono for every figure, so
 * columns of numbers align on the digit; that alignment does more for the
 * instrument feel than any amount of shadow would.
 */
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter-tight',
  display: 'swap',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Inkarp · Social Dashboard',
    template: '%s · Inkarp Social Dashboard',
  },
  description:
    'Plan and track social media activity across all Inkarp principals, by brand, group and product manager.',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

/**
 * Nothing in this app is static — the greeting depends on the current hour, the
 * session comes from cookies, and every figure is live shared data. There is no
 * build-time snapshot worth caching.
 */
export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Resolved once per request, here, then handed to both the server shell and
  // the client context. One source of truth for "who is this".
  const viewer = await getViewer()

  return (
    <html lang="en-IN" className={`${interTight.variable} ${jetBrainsMono.variable}`}>
      <body>
        <EditorProvider viewer={viewer}>
          <RealtimeRefresh />
          <AppShell viewer={viewer}>{children}</AppShell>
        </EditorProvider>
      </body>
    </html>
  )
}
