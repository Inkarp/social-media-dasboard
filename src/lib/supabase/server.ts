import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env'
import { usableCookies } from '@/lib/supabase/cookies'
import type { Database } from '@/lib/types'

export type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>

/**
 * Supabase client for server components, server actions and route handlers.
 *
 * Returns `null` when no project is configured, rather than throwing. That keeps
 * `npm run dev` usable before the keys are filled in: callers treat null as
 * "no data yet" and render an empty state, which is a far better failure mode
 * than a stack trace on every route.
 */
export async function createClient(): Promise<SupabaseServerClient | null> {
  if (!isSupabaseConfigured) return null

  const cookieStore = await cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return usableCookies(cookieStore.getAll())
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Cookies cannot be written while rendering a Server Component. This
          // is expected and harmless: src/middleware.ts refreshes the session on
          // every navigation, so the token stays current regardless.
        }
      },
    },
  })
}
