/**
 * Diagnose the editor sign-in setup.
 *
 *   npm run check:auth
 *
 * Answers the questions that actually block someone signing in, none of which
 * are visible from the app itself:
 *
 *   · does the account exist, and is it confirmed?
 *     An unconfirmed account fails sign-in with the same "Invalid login
 *     credentials" message as a wrong password, which is impossible to tell
 *     apart from the outside.
 *
 *   · is public signup still open?
 *     The RLS policy grants write access to any authenticated user, so an open
 *     signup means anyone can self-register into edit rights.
 *
 * Reads the secret key from .env.local and never prints it.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {}
  let contents: string
  try {
    contents = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  } catch {
    return out
  }
  for (const raw of contents.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf('=')
    if (index < 0) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
    if (key && value) out[key] = value
  }
  return out
}

type AdminUser = {
  id: string
  email?: string
  email_confirmed_at?: string | null
  confirmed_at?: string | null
  last_sign_in_at?: string | null
  banned_until?: string | null
}

async function main(): Promise<void> {
  const env = loadEnvLocal()
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const secret = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const publishable =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!url) {
    console.error('\n✗ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local\n')
    process.exit(1)
  }
  if (!secret) {
    console.error('\n✗ No secret key in .env.local (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)\n')
    process.exit(1)
  }

  console.log(`\nChecking ${url}\n`)

  /* -- Accounts ----------------------------------------------------------- */

  const usersResponse = await fetch(`${url}/auth/v1/admin/users`, {
    headers: { apikey: secret, Authorization: `Bearer ${secret}` },
  })

  if (!usersResponse.ok) {
    console.error(`✗ Could not list users: HTTP ${usersResponse.status}`)
    console.error(`  ${(await usersResponse.text()).slice(0, 300)}`)
    process.exit(1)
  }

  const payload = (await usersResponse.json()) as { users?: AdminUser[] }
  const users = payload.users ?? []

  console.log(`Editor accounts: ${users.length}`)
  if (users.length === 0) {
    console.log('  none — create one at Authentication -> Users -> Add user')
  }

  for (const user of users) {
    const confirmed = user.email_confirmed_at ?? user.confirmed_at
    console.log(`\n  ${user.email ?? '(no email)'}`)
    console.log(`    confirmed     ${confirmed ? `yes (${confirmed})` : 'NO  <- sign-in will be refused'}`)
    console.log(`    last sign-in  ${user.last_sign_in_at ?? 'never'}`)
    console.log(`    banned        ${user.banned_until ? `yes until ${user.banned_until}` : 'no'}`)

    if (!confirmed) {
      console.log('')
      console.log('    An unconfirmed account is rejected with the SAME message as a wrong')
      console.log('    password, so this is invisible from the sign-in page. Fix it in the')
      console.log('    dashboard: Authentication -> Users -> (the user) -> Confirm email.')
    }
  }

  /* -- Is signup still open? ---------------------------------------------- */

  console.log('\nPublic signup')

  if (!publishable) {
    console.log('  ? no publishable key in .env.local, cannot probe')
  } else {
    // Attempt to register a throwaway address. If it is accepted, anyone can
    // self-register — and RLS grants every authenticated user write access.
    //
    // The domain has to look real: Supabase rejects reserved TLDs like .invalid
    // with `email_address_invalid` BEFORE it ever consults the signup setting,
    // which tells us nothing. example.com passes format validation.
    const probeEmail = `inkarp-signup-probe-${Date.now()}@example.com`
    const signupResponse = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: publishable, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: probeEmail, password: 'Probe-Password-9271!' }),
    })

    const body = (await signupResponse.text()).slice(0, 300)

    if (/signup.*disabled|signups not allowed|not allowed for this instance/i.test(body)) {
      console.log('  closed — good. Only accounts you create can edit.')
    } else if (signupResponse.ok) {
      console.log('  *** OPEN *** anyone can register and gain edit rights.')
      console.log('  Turn it off: Authentication -> Sign In / Providers -> Email ->')
      console.log('               "Allow new users to sign up" -> off')

      // Do not leave the probe account behind — under the current RLS policy it
      // would be a working editor login.
      const created = await fetch(`${url}/auth/v1/admin/users`, {
        headers: { apikey: secret, Authorization: `Bearer ${secret}` },
      })
        .then((r) => r.json() as Promise<{ users?: AdminUser[] }>)
        .then((d) => (d.users ?? []).find((u) => u.email === probeEmail))
        .catch(() => undefined)

      if (created) {
        const deleted = await fetch(`${url}/auth/v1/admin/users/${created.id}`, {
          method: 'DELETE',
          headers: { apikey: secret, Authorization: `Bearer ${secret}` },
        })
        console.log(
          deleted.ok
            ? '  (probe account cleaned up)'
            : `  (could not delete probe account ${probeEmail} — remove it by hand)`,
        )
      }
    } else {
      console.log(`  inconclusive: HTTP ${signupResponse.status} ${body}`)
    }
  }

  console.log('')
}

main().catch((error: unknown) => {
  console.error('\n✗ check failed\n', error)
  process.exit(1)
})
