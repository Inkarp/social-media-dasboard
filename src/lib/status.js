/**
 * Post status. The four values are a Postgres check constraint, so this list is
 * the single client-side mirror of it.
 *
 * Status is differentiated by weight, fill and position — never by hue. These
 * four values are stages of one workflow, not a judgement, so they share the
 * one accent rather than reaching for a traffic-light palette:
 *
 *   published    solid forest fill
 *   in_review    forest at 40% opacity
 *   in_progress  forest hairline outline, no fill
 *   planned      muted hairline outline
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
  published: 'bg-forest',
  in_review: 'bg-forest-40',
  in_progress: 'border border-forest bg-transparent',
  planned: 'border border-muted bg-transparent',
}

/**
 * Only published posts count as implemented. Everything else is pending.
 * @param {PostStatus} status
 * @returns {boolean}
 */
export function isImplemented(status) {
  return status === 'published'
}
