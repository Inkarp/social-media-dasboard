import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env'
import { usableCookies } from '@/lib/supabase/cookies'

/**
 * Refresh the Supabase session on every navigation.
 *
 * Access tokens are short-lived. Without this, an editor's session expires
 * silently while they are part-way through a form and the next save fails for
 * no visible reason. Touching `getUser()` here rotates the token and writes the
 * refreshed cookies onto the outgoing response.
 *
 * Note the cookie dance below: cookies must be set on BOTH the request (so
 * server components rendering this same request see the new token) and the
 * response (so the browser keeps it). Setting only one of the two is the usual
 * cause of "logged in, then randomly logged out".
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // No project attached yet — pass straight through rather than throwing on
  // every request. The app is built to run read-only without credentials.
  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return usableCookies(request.cookies.getAll())
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  try {
    await supabase.auth.getUser()
  } catch (error) {
    // A corrupt or half-written session cookie must not 500 every navigation.
    // Leaving it unrefreshed simply means the request is treated as signed out.
    console.warn('[middleware] session refresh failed, continuing as a viewer:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files. Running the refresh on
     * a favicon request is wasted work on every page load.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
