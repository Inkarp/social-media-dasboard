/**
 * Who is looking at the page — the shape only, with no server dependencies.
 *
 * Kept separate from src/lib/auth.ts deliberately. That module reads cookies via
 * `next/headers`, so anything importing it becomes server-only; the client-side
 * <EditorProvider> needs this type and needs to stay a client component. Putting
 * the type here lets both sides share one definition.
 */

export type Viewer = {
  /**
   * True when the session belongs to a user listed in `admin_users` — see
   * `is_admin()` in migration 0005. Being signed in is not sufficient on its
   * own; there is no other write role yet, so this is a plain admin check, not
   * a permissions model to keep in sync. If this is true, writes will succeed;
   * if it is false, they would be refused by RLS, so the controls are hidden.
   */
  isEditor: boolean
  /**
   * True whenever there is a valid Supabase session, admin or not. Now that
   * `isEditor` can be false for a signed-in non-admin, the sign-in page needs
   * this to tell "not signed in" apart from "signed in, not authorised" —
   * otherwise the latter looks identical to never having signed in at all.
   */
  hasSession: boolean
  email: string | null
  /** False when no Supabase project is attached — signing in is impossible. */
  canSignIn: boolean
}

export const ANONYMOUS_VIEWER: Viewer = {
  isEditor: false,
  hasSession: false,
  email: null,
  canSignIn: false,
}
