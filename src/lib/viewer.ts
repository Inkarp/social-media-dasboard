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
   * True when the request carries a valid Supabase session.
   *
   * "Editor" means nothing more than "logged in", because that is exactly what
   * the row-level security policies check. There is no second permission model
   * to drift out of step with the database: if this is true, writes will
   * succeed; if it is false, they would be refused, so the controls are hidden.
   */
  isEditor: boolean
  email: string | null
  /** False when no Supabase project is attached — signing in is impossible. */
  canSignIn: boolean
}

export const ANONYMOUS_VIEWER: Viewer = {
  isEditor: false,
  email: null,
  canSignIn: false,
}
