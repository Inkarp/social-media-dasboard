// Importing this module from a client component is a mistake — it reads cookies.
// `server-only` turns that into a clear build error naming this file, instead of
// a confusing "you're importing next/headers" trace pointing at Supabase.
import 'server-only'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ANONYMOUS_VIEWER, type Viewer } from '@/lib/viewer'

export type { Viewer }
export { ANONYMOUS_VIEWER }

/**
 * Resolve the current viewer from the session cookie.
 *
 * Wrapped in React's `cache` so it runs at most once per request no matter how
 * many components ask. `getUser()` is a network round trip to Supabase, and both
 * the root layout and every <EditorOnly> on the page need the answer — without
 * memoisation a page with six editor-gated controls would make seven calls.
 *
 * `isEditor` means "signed in AND listed in admin_users" — being signed in on
 * its own is no longer enough, matching the `is_admin()` check that every write
 * RLS policy defers to (see migration 0005). There is only one write role right
 * now; if a scoped role is added later, this is the type that will carry it.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createClient()
  if (!supabase) return ANONYMOUS_VIEWER

  try {
    // getUser() revalidates the token with Supabase. getSession() only decodes
    // the cookie, which a client could have tampered with — never trust it for
    // an authorisation decision on the server.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Skip the extra round trip for the common case: no session, no need to
    // ask whether a nonexistent user is an admin.
    const isEditor = user !== null && (await supabase.rpc('is_admin')).data === true

    return {
      isEditor,
      hasSession: user !== null,
      email: user?.email ?? null,
      canSignIn: true,
    }
  } catch (error) {
    // This function runs in the root layout, so it runs on every route. An
    // unhandled throw here is not a failed login — it is a 500 on every page in
    // the app, including the ones that need no session at all.
    //
    // Anything that stops us reading a session means there is no usable session:
    // a corrupt or half-written auth cookie, Supabase unreachable, a network
    // blip. Degrading to "viewer" is both safe and correct. It can never grant
    // access, because being a viewer is the least-privileged state, and row-level
    // security would refuse a write regardless of what this returned.
    console.warn('[auth] could not read the session, treating as a viewer:', error)

    return { isEditor: false, hasSession: false, email: null, canSignIn: true }
  }
})
