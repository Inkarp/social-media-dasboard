/**
 * Post status. The four values are a Postgres check constraint, so this list is
 * the single client-side mirror of it.
 *
 * Status is differentiated by weight, fill and position — never by hue. The
 * palette has exactly one accent, so "at risk amber" and "on target green" are
 * not available and are not missed:
 *
 *   published    solid red fill
 *   in_review    red at 40% opacity
 *   in_progress  red hairline outline, no fill
 *   planned      grey hairline outline
 */

/** @type {readonly ['planned', 'in_progress', 'in_review', 'published']} */
export const POST_STATUSES = ['planned', 'in_progress', 'in_review', 'published']

/** @typedef {(typeof POST_STATUSES)[number]} PostStatus */

/**
 * @param {unknown} value
 * @returns {value is PostStatus}
 */
export function isPostStatus(value) {
  return typeof value === 'string' && /** @type {readonly string[]} */ (POST_STATUSES).includes(value)
}

/** @type {Record<PostStatus, string>} */
export const STATUS_LABELS = {
  planned: 'Planned',
  in_progress: 'In progress',
  in_review: 'In review',
  published: 'Published',
}

/** Tailwind classes for the status swatch, ordered by visual weight. */
/** @type {Record<PostStatus, string>} */
export const STATUS_SWATCH = {
  published: 'bg-ink-red',
  in_review: 'bg-ink-red-40',
  in_progress: 'border border-ink-red bg-transparent',
  planned: 'border border-ink-grey bg-transparent',
}

/**
 * Only published posts count as implemented. Everything else is pending.
 * @param {PostStatus} status
 * @returns {boolean}
 */
export function isImplemented(status) {
  return status === 'published'
}
