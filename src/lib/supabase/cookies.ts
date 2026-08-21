/**
 * Defensive cookie handling for @supabase/ssr.
 *
 * Supabase stores the session in cookies that may be chunked across several
 * entries (`sb-<ref>-auth-token.0`, `.1`, …) and base64-encoded. If the browser
 * ends up holding an empty or half-written entry — a response committed before
 * all Set-Cookie headers were flushed, a partially cleared session, or a cookie
 * left behind by a different project on the same localhost — the SDK can throw
 * while decoding it.
 *
 * That matters more than it sounds: `getViewer()` runs in the root layout, so a
 * throw there is not a broken login, it is a 500 on every page of the app.
 * Dropping empty entries before the SDK ever sees them removes the most common
 * cause.
 */
export type RequestCookie = { name: string; value: string }

/**
 * Remove cookies with empty values. An empty auth cookie carries no session and
 * can only fail to decode, so treating it as absent is strictly better than
 * handing it over.
 */
export function usableCookies(cookies: RequestCookie[]): RequestCookie[] {
  return cookies.filter((cookie) => typeof cookie.value === 'string' && cookie.value.length > 0)
}
