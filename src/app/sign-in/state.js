/**
 * Form state for the sign-in action.
 *
 * Deliberately NOT in actions.js. A `'use server'` file may only export async
 * functions — every export becomes a callable server endpoint, so a plain object
 * or a constant is rejected outright. Next reports this at runtime rather than at
 * build time, which means the failure surfaces as a broken page rather than a
 * failed build.
 *
 * @typedef {Object} SignInState
 * @property {string | null} error
 * @property {string} email Echoed back so a failed attempt does not clear the field the user typed.
 */

/** @type {SignInState} */
export const SIGN_IN_INITIAL_STATE = { error: null, email: '' }
