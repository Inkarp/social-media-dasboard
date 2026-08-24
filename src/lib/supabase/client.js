'use client'

import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env'

/** @typedef {import('@/lib/types').Database} Database */
/** @typedef {ReturnType<typeof createBrowserClient<Database>>} SupabaseBrowserClient */

/** @type {SupabaseBrowserClient | null} */
let cached = null

/**
 * Supabase client for the browser. Used only for the realtime subscription —
 * every read goes through a server component and every write through a server
 * action, so there is no second data path to keep in sync.
 *
 * Memoised because `createBrowserClient` opens its own auth listener; making a
 * fresh one on every render would leak them.
 *
 * @returns {SupabaseBrowserClient | null}
 */
export function getBrowserClient() {
  if (!isSupabaseConfigured) return null
  cached ??= /** @type {SupabaseBrowserClient} */ (createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY))
  return cached
}
