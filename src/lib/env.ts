/**
 * Environment access, in one place.
 *
 * The app is designed to boot with no Supabase project attached: the shell and
 * every route render, and data reads come back empty. That keeps `npm run dev`
 * useful before the keys are filled in, and turns a missing variable into a
 * visible empty state rather than a stack trace on a white screen.
 *
 * Both key namings are accepted. Supabase renamed its API keys partway through
 * 2025 — older projects show `anon` / `service_role`, newer ones show
 * Publishable / Secret — and the dashboard hands you a variable name matching
 * whichever era your project is from. Reading both means nobody has to notice
 * which one they were given.
 *
 * IMPORTANT: every reference below is a literal `process.env.NAME`. Next.js
 * replaces `NEXT_PUBLIC_*` variables by scanning the source text at build time,
 * so a computed lookup like `process.env[name]` is never substituted and comes
 * back undefined in the browser — the server would work and the client would
 * silently have no credentials.
 */

const CANDIDATE_URLS = [process.env.NEXT_PUBLIC_SUPABASE_URL]

const CANDIDATE_ANON_KEYS = [
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
]

function firstPresent(values: (string | undefined)[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

export const SUPABASE_URL = firstPresent(CANDIDATE_URLS)
export const SUPABASE_ANON_KEY = firstPresent(CANDIDATE_ANON_KEYS)

/** True once both public Supabase variables are present. */
export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
