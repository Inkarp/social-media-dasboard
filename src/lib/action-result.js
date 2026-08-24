/**
 * The result every Server Action returns.
 *
 * Kept out of the `'use server'` modules on purpose: each export of such a
 * module becomes a callable server endpoint, so a type or constant declared
 * alongside the actions is rejected at runtime. Types are erased at compile
 * time, but the rule is easier to hold to when the shared shapes simply live
 * somewhere else.
 *
 * Actions return failures rather than throwing them. A thrown error in a Server
 * Action reaches the client as an opaque "an error occurred" with the message
 * stripped in production, which is useless to someone trying to fix their input.
 * Returning a result keeps the reason intact and lets the form show it in place.
 *
 * @typedef {{ ok: true }} ActionSuccess
 * @typedef {{ ok: false, error: string }} ActionFailure
 * @typedef {ActionSuccess | ActionFailure} ActionResult
 */

/** @type {ActionResult | null} */
export const ACTION_IDLE = null

/**
 * @param {ActionResult | null} result
 * @returns {result is ActionFailure}
 */
export function isFailure(result) {
  return result !== null && !result.ok
}

/**
 * The result of a bulk import. Richer than `ActionResult` because a spreadsheet
 * of fifty rows failing on one bad brand name is not the same event as the
 * whole import failing — the caller needs to know what landed and what to fix.
 *
 * @typedef {{ ok: true, inserted: number, skipped: { row: number, reason: string }[] } | ActionFailure} ImportResult
 */

/**
 * What creating a post returns. Richer than `ActionResult` because the caller
 * needs the new row's id to add it to a local list without a page reload —
 * see the `onSaved` prop on `PostFormDialog`.
 *
 * @typedef {{ ok: true, id: string } | ActionFailure} CreatePostResult
 */

export {}
