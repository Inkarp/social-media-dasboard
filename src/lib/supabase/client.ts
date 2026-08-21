'use client'

import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env'
import type { Database } from '@/lib/types'

export type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>

let cached: SupabaseBrowserClient | null = null

/**
 * Supabase client for the browser. Used only for the realtime subscription —
 * every read goes through a server component and every write through a server
 * action, so there is no second data path to keep in sync.
 *
 * Memoised because `createBrowserClient` opens its own auth listener; making a
 * fresh one on every render would leak them.
 */
export function getBrowserClient(): SupabaseBrowserClient | null {
  if (!isSupabaseConfigured) return null
  cached ??= createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
  return cached
}
