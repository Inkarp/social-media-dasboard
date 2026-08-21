/**
 * Generate supabase/seed.sql from data/principals.seed.json.
 *
 *   npm run build:seed-sql
 *
 * An alternative to `npm run seed` that needs no service-role key. The SQL
 * Editor in the Supabase dashboard already runs with privileges that bypass
 * row-level security, so pasting SQL there does the same job as the script
 * without a secret ever leaving the dashboard. Useful when the secret key is
 * awkward to find, and useful in general — one fewer credential to handle.
 *
 * The output is idempotent, matching scripts/seed.ts rule for rule:
 *   · managers and principals are matched by name and updated in place
 *   · brand_color and is_active are only set when the row is new, so recolouring
 *     or retiring a brand in the app survives a re-run
 *   · targets are never touched
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { currentFy, fyLabel, fyOptions } from '../src/lib/fy'

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

/** Single-quote a SQL string literal, or emit NULL. */
function lit(value: string | null): string {
  if (value === null) return 'null'
  return `'${value.replace(/'/g, "''")}'`
}

const seed = JSON.parse(
  readFileSync(resolve(process.cwd(), 'data/principals.seed.json'), 'utf8'),
) as SeedFile

const fyNow = currentFy()
const years = fyOptions(new Date(), 3, 1).sort((a, b) => a - b)

const lines: string[] = []

lines.push(`-- =============================================================================
-- Inkarp Social Dashboard · seed data
--
-- GENERATED FILE — do not edit. Regenerate with: npm run build:seed-sql
-- Source of truth: data/principals.seed.json
--
-- Run supabase/setup.sql FIRST, then paste this into:
--   Supabase dashboard -> SQL Editor -> New query -> Run
--
-- Loads ${seed.principals.length} principals and ${seed.product_managers.length} product managers, plus ${years.length} financial years.
--
-- Safe to run more than once. Names, groups, countries and manager assignments
-- are refreshed from the source sheet; brand colours and is_active flags are set
-- only on first insert, so changes you make in the app are not overwritten.
-- Targets are never touched.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Financial years
-- -----------------------------------------------------------------------------
-- Inserted as not-current first: a partial unique index permits only one current
-- row, so switching the new one on while an old one is still true would violate
-- it mid-statement.`)

lines.push('')
lines.push('insert into public.financial_years (id, label, is_current) values')
lines.push(years.map((fy) => `  (${fy}, ${lit(fyLabel(fy))}, false)`).join(',\n'))
lines.push('on conflict (id) do update set label = excluded.label;')
lines.push('')
lines.push(`update public.financial_years set is_current = false where id <> ${fyNow};`)
lines.push(`update public.financial_years set is_current = true  where id = ${fyNow};`)

lines.push(`
-- -----------------------------------------------------------------------------
-- Product managers
-- -----------------------------------------------------------------------------
-- Emails are unknown — they appear in neither the source sheet nor the brief —
-- and are deliberately left null rather than invented. The column is nullable
-- and unique; fill them in from the Principals page when you have them.`)
lines.push('')
lines.push('insert into public.product_managers (name, email) values')
lines.push(
  seed.product_managers.map((m) => `  (${lit(m.name)}, ${lit(m.email)})`).join(',\n'),
)
lines.push('on conflict (name) do nothing;')

lines.push(`
-- -----------------------------------------------------------------------------
-- Principals
-- -----------------------------------------------------------------------------
-- product_manager_id is resolved by name so this file carries no UUIDs and stays
-- readable and re-runnable against any database.`)
lines.push('')
lines.push(
  'insert into public.principals (name, group_name, product_manager_id, country, brand_color, is_active) values',
)
lines.push(
  seed.principals
    .map((p) => {
      const manager = p.product_manager
        ? `(select id from public.product_managers where name = ${lit(p.product_manager)})`
        : 'null'
      return `  (${lit(p.name)}, ${lit(p.group_name)}, ${manager}, ${lit(p.country)}, ${lit(p.brand_color)}, ${p.is_active})`
    })
    .join(',\n'),
)
lines.push(`on conflict (name) do update set
  group_name         = excluded.group_name,
  product_manager_id = excluded.product_manager_id,
  country            = excluded.country;
-- Note: brand_color and is_active are intentionally absent from the update list.`)

lines.push(`
commit;

-- -----------------------------------------------------------------------------
-- What landed
-- -----------------------------------------------------------------------------
select
  (select count(*) from public.principals)       as principals,
  (select count(*) from public.product_managers) as product_managers,
  (select count(*) from public.financial_years)  as financial_years,
  (select label from public.financial_years where is_current) as current_fy;
`)

const output = `${lines.join('\n')}`
writeFileSync(resolve(process.cwd(), 'supabase/seed.sql'), output)

console.log('Wrote supabase/seed.sql')
console.log(`  ${seed.principals.length} principals`)
console.log(`  ${seed.product_managers.length} product managers`)
console.log(`  ${years.length} financial years, current = ${fyLabel(fyNow)}`)
