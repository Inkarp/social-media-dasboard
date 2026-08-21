/**
 * Helpers for URL-as-state. Every filter and view setting in this app lives in
 * search params — that makes filtered views shareable, the back button work,
 * and date-range presets plain links instead of click handlers.
 */

export type ParamPatch = Record<string, string | number | null | undefined>

/**
 * Apply a patch to a set of search params. `null` and `undefined` delete a key,
 * which keeps URLs clean rather than accumulating `?status=&group=`.
 */
export function patchParams(
  current: URLSearchParams | ReadonlyURLSearchParamsLike,
  patch: ParamPatch,
): URLSearchParams {
  const next = new URLSearchParams(current.toString())
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === '') next.delete(key)
    else next.set(key, String(value))
  }
  return next
}

/** Build an href for a route with a patched query string. */
export function hrefWith(
  pathname: string,
  current: URLSearchParams | ReadonlyURLSearchParamsLike,
  patch: ParamPatch,
): string {
  const query = patchParams(current, patch).toString()
  return query ? `${pathname}?${query}` : pathname
}

/** Minimal shape shared by URLSearchParams and Next's ReadonlyURLSearchParams. */
type ReadonlyURLSearchParamsLike = { toString(): string }

/** Read a single search param out of Next's `searchParams` object. */
export function firstParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

/** Read a search param as a positive integer, or undefined if unparseable. */
export function intParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): number | undefined {
  const raw = firstParam(params, key)
  if (raw === undefined) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}
