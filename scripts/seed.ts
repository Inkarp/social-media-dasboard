/**
 * Seed product managers, principals and financial years.
 *
 *   npm run seed
 *
 * Idempotent by design — run it as often as you like. Specifically:
 *
 *   · Managers and principals are matched by name and updated in place, so
 *     re-running never creates duplicates.
 *
 *   · A principal's `brand_color` and `is_active` are only written when the row
 *     is new. If you recolour a brand or retire one through the Principals page,
 *     re-seeding will not undo that. Names, groups, countries and manager
 *     assignments do get refreshed from the seed file, because those come from
 *     the source sheet and the sheet is authoritative.
 *
 *   · Targets are never touched. Those are the plan, and the plan is yours.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY: row-level security means the anon key
 * cannot write, which is the point of it. This script runs on your machine only.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { currentFy, fyLabel, fyOptions } from '../src/lib/fy'
import type { Database } from '../src/lib/types'

/* -------------------------------------------------------------------------- */
/* Environment                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Read .env.local ourselves. `tsx` does not load it, and relying on
 * `node --env-file` would tie the npm script to one Node version.
 */
function loadEnvLocal(): void {
  let contents: string
  try {
    contents = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  } catch {
    return
  }
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (!match) continue
    const [, key, rawValue] = match
    if (!key || process.env[key]) continue
    process.env[key] = (rawValue ?? '').trim().replace(/^(['"])(.*)\1$/, '$2')
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL

// Supabase renamed its keys partway through 2025: older projects issue a
// `service_role` key, newer ones a Secret key. Accept whichever name the
// dashboard gave you.
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? ''

if (!url || !serviceKey) {
  console.error(
    [
      'Missing credentials.',
      '',
      'scripts/seed.ts needs these in .env.local:',
      '  NEXT_PUBLIC_SUPABASE_URL',
      '  SUPABASE_SERVICE_ROLE_KEY   (or SUPABASE_SECRET_KEY on newer projects)',
      '',
      'Both are in the Supabase dashboard under Project Settings -> API.',
      'Look for the key labelled "service_role" or "Secret" — you may have to',
      'click Reveal to see it.',
      '',
      'That key bypasses row-level security, which is exactly why the seed can',
      'write and the browser cannot. Keep it out of NEXT_PUBLIC_ and out of git.',
    ].join('\n'),
  )
  process.exit(1)
}

const db = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/* -------------------------------------------------------------------------- */
/* Seed file                                                                   */
/* -------------------------------------------------------------------------- */

type SeedFile = {
  product_managers: { name: string; email: string | null }[]
  principals: {
    name: string
    group_name: string
    product_manager: string | null
    country: string | null
    brand_color: string
    is_active: boolean
  }[]
}

function readSeedFile(): SeedFile {
  const path = resolve(process.cwd(), 'data/principals.seed.json')
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as SeedFile
  if (!Array.isArray(parsed.principals) || !Array.isArray(parsed.product_managers)) {
    throw new Error(`${path} is missing "principals" or "product_managers"`)
  }
  return parsed
}

/** Fail loudly rather than half-seeding and leaving you to guess what landed. */
function assertOk(step: string, error: { message: string; details?: string | null } | null): void {
  if (!error) return
  console.error(`\n✗ ${step}\n  ${error.message}${error.details ? `\n  ${error.details}` : ''}`)
  process.exit(1)
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                       */
/* -------------------------------------------------------------------------- */

async function seedFinancialYears(): Promise<number> {
  const fyNow = currentFy()
  const years = fyOptions(new Date(), 3, 1).sort((a, b) => a - b)

  // Write every year as not-current first. `financial_years` carries a partial
  // unique index allowing at most one current row, so flipping the new one on
  // while an old one is still true would violate it.
  const { error: upsertError } = await db
    .from('financial_years')
    .upsert(
      years.map((fy) => ({ id: fy, label: fyLabel(fy), is_current: false })),
      { onConflict: 'id' },
    )
  assertOk('upsert financial_years', upsertError)

  const { error: clearError } = await db
    .from('financial_years')
    .update({ is_current: false })
    .neq('id', fyNow)
  assertOk('clear previous current financial year', clearError)

  const { error: markError } = await db
    .from('financial_years')
    .update({ is_current: true })
    .eq('id', fyNow)
  assertOk('mark current financial year', markError)

  console.log(
    `  financial years   ${years.length} rows (${fyLabel(years[0] ?? fyNow)} … ${fyLabel(
      years[years.length - 1] ?? fyNow,
    )}), current = ${fyLabel(fyNow)}`,
  )
  return fyNow
}

async function seedProductManagers(seed: SeedFile): Promise<Map<string, string>> {
  const { data, error } = await db
    .from('product_managers')
    .upsert(
      seed.product_managers.map((m) => ({ name: m.name, email: m.email })),
      { onConflict: 'name' },
    )
    .select('id, name')
  assertOk('upsert product_managers', error)

  const byName = new Map<string, string>()
  for (const row of data ?? []) byName.set(row.name, row.id)

  console.log(`  product managers  ${byName.size} rows`)
  return byName
}

async function seedPrincipals(seed: SeedFile, managers: Map<string, string>): Promise<void> {
  // Read what already exists so we can preserve locally-edited colours and
  // is_active flags instead of stamping over them.
  const { data: existing, error: readError } = await db
    .from('principals')
    .select('name, brand_color, is_active')
  assertOk('read existing principals', readError)

  const known = new Map((existing ?? []).map((p) => [p.name, p]))

  const rows = seed.principals.map((p) => {
    const current = known.get(p.name)
    return {
      name: p.name,
      group_name: p.group_name,
      product_manager_id: p.product_manager ? (managers.get(p.product_manager) ?? null) : null,
      country: p.country,
      brand_color: current?.brand_color ?? p.brand_color,
      is_active: current?.is_active ?? p.is_active,
    }
  })

  const unresolved = seed.principals.filter(
    (p) => p.product_manager && !managers.has(p.product_manager),
  )
  if (unresolved.length > 0) {
    console.warn(
      `  ! ${unresolved.length} principal(s) name a manager missing from the seed file: ` +
        unresolved.map((p) => `${p.name} -> ${p.product_manager}`).join(', '),
    )
  }

  const { error } = await db.from('principals').upsert(rows, { onConflict: 'name' })
  assertOk('upsert principals', error)

  const created = rows.filter((r) => !known.has(r.name)).length
  console.log(
    `  principals        ${rows.length} rows (${created} new, ${rows.length - created} updated)`,
  )
}

/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  const seed = readSeedFile()

  console.log(`\nSeeding ${url}\n`)

  const fyNow = await seedFinancialYears()
  const managers = await seedProductManagers(seed)
  await seedPrincipals(seed, managers)

  const { count, error } = await db
    .from('principals')
    .select('*', { count: 'exact', head: true })
  assertOk('count principals', error)

  console.log(`\n✓ Done. ${count ?? 0} principals in the database.`)
  console.log(`  Set targets for ${fyLabel(fyNow)} on the Principals page.\n`)
}

main().catch((error: unknown) => {
  console.error('\n✗ Seed failed\n', error)
  process.exit(1)
})
