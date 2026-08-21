/**
 * Sanitise a caller-supplied redirect target.
 *
 * The sign-in flow carries a `next` parameter so you land back where you were.
 * Anything reflected out of the URL into a redirect is an open-redirect risk: a
 * link like `/sign-in?next=https://evil.example/login` would authenticate
 * someone and then hand them straight to an attacker's lookalike page.
 *
 * Only same-site absolute paths pass. Everything else collapses to the fallback.
 *
 * Rejected, and why each one matters:
 *   'https://evil.example'   absolute URL to another origin
 *   '//evil.example'         protocol-relative — browsers treat it as cross-origin
 *   '/\evil.example'         backslash; some browsers normalise \ to /
 *   'javascript:alert(1)'    scheme-relative script execution
 *   'posts'                  relative, so it resolves against the current page
 *   '/posts' + newline + ... control characters, used to smuggle header content
 */
export function safeInternalPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback

  const trimmed = value.trim()
  if (trimmed.length === 0) return fallback

  // Must be an absolute path on this site.
  if (!trimmed.startsWith('/')) return fallback

  // Protocol-relative ('//host') and its backslash variants ('/\host') both
  // escape the origin. A backslash anywhere is refused outright — it is never
  // needed in a legitimate in-app path.
  if (trimmed.includes('\\')) return fallback
  if (trimmed.startsWith('//')) return fallback

  // Control characters, checked by code point rather than by regex so there is
  // no escaping ambiguity to get wrong. Covers C0, DEL and C1.
  for (let index = 0; index < trimmed.length; index++) {
    const code = trimmed.charCodeAt(index)
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return fallback
  }

  return trimmed
}
