'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'

/** The tables whose changes anyone on the dashboard should see immediately. */
const WATCHED_TABLES = ['posts', 'principals', 'targets'] as const

/**
 * Keeps every open dashboard current.
 *
 * On any change to posts, principals or targets this calls `router.refresh()`,
 * which re-runs the server components and re-queries. It deliberately does NOT
 * patch local state from the change payload: that would create a second way for
 * data to arrive, and the two paths would disagree the first time a payload
 * arrived out of order or a filter excluded the changed row. One data path,
 * always the server.
 *
 * Subscribed for viewers as well as editors — the brief requires that what one
 * editor changes, everyone sees.
 */
export function RealtimeRefresh() {
  const router = useRouter()

  useEffect(() => {
    const supabase = getBrowserClient()
    if (!supabase) return

    const channel = supabase.channel('dashboard-changes')

    for (const table of WATCHED_TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        router.refresh()
      })
    }

    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [router])

  return null
}
