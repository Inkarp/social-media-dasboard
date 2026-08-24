/**
 * Helpers for URL-as-state. Every filter and view setting in this app lives in
 * search params — that makes filtered views shareable, the back button work,
 * and date-range presets plain links instead of click handlers.
 */

/** @typedef {Record<string, string | number | null | undefined>} ParamPatch */

/** @typedef {{ toString(): string }} ReadonlyURLSearchParamsLike Minimal shape shared by URLSearchParams and Next's ReadonlyURLSearchParams. */

/**
 * Apply a patch to a set of search params. `null` and `undefined` delete a key,
 * which keeps URLs clean rather than accumulating `?status=&group=`.
 * @param {URLSearchParams | ReadonlyURLSearchParamsLike} current
 * @param {ParamPatch} patch
 * @returns {URLSearchParams}
 */
export function patchParams(current, patch) {
  const next = new URLSearchParams(current.toString())
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === '') next.delete(key)
    else next.set(key, String(value))
  }
  return next
}

/**
 * Build an href for a route with a patched query string.
 * @param {string} pathname
 * @param {URLSearchParams | ReadonlyURLSearchParamsLike} current
 * @param {ParamPatch} patch
 * @returns {string}
 */
export function hrefWith(pathname, current, patch) {
  const query = patchParams(current, patch).toString()
  return query ? `${pathname}?${query}` : pathname
}

/**
 * Read a single search param out of Next's `searchParams` object.
 * @param {Record<string, string | string[] | undefined>} params
 * @param {string} key
 * @returns {string | undefined}
 */
export function firstParam(params, key) {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

/**
 * Read a search param as a positive integer, or undefined if unparseable.
 * @param {Record<string, string | string[] | undefined>} params
 * @param {string} key
 * @returns {number | undefined}
 */
export function intParam(params, key) {
  const raw = firstParam(params, key)
  if (raw === undefined) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}
