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

export const POST_STATUSES = ['planned', 'in_progress', 'in_review', 'published'] as const

export type PostStatus = (typeof POST_STATUSES)[number]

export function isPostStatus(value: unknown): value is PostStatus {
  return typeof value === 'string' && (POST_STATUSES as readonly string[]).includes(value)
}

export const STATUS_LABELS: Record<PostStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  in_review: 'In review',
  published: 'Published',
}

/** Tailwind classes for the status swatch, ordered by visual weight. */
export const STATUS_SWATCH: Record<PostStatus, string> = {
  published: 'bg-ink-red',
  in_review: 'bg-ink-red-40',
  in_progress: 'border border-ink-red bg-transparent',
  planned: 'border border-ink-grey bg-transparent',
}

/** Only published posts count as implemented. Everything else is pending. */
export function isImplemented(status: PostStatus): boolean {
  return status === 'published'
}
