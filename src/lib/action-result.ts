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
 */
export type ActionResult = { ok: true } | { ok: false; error: string }

export const ACTION_IDLE: ActionResult | null = null

export function isFailure(result: ActionResult | null): result is { ok: false; error: string } {
  return result !== null && !result.ok
}
