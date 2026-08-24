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

/**
 * @typedef {Object} RequestCookie
 * @property {string} name
 * @property {string} value
 */

/**
 * Remove cookies with empty values. An empty auth cookie carries no session and
 * can only fail to decode, so treating it as absent is strictly better than
 * handing it over.
 * @param {RequestCookie[]} cookies
 * @returns {RequestCookie[]}
 */
export function usableCookies(cookies) {
  return cookies.filter((cookie) => typeof cookie.value === 'string' && cookie.value.length > 0)
}
