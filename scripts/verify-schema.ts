/**
 * Run the migrations against an embedded Postgres and assert the behaviour the
 * schema is supposed to guarantee.
 *
 *   npm run verify:schema
 *
 * This exists because the two most important rules in this project are enforced
 * in SQL rather than in TypeScript — the generated fy/quarter columns and the
 * post-retention FK — and "the migration file looks right" is not evidence that
 * either works. PGlite is real Postgres compiled to WASM, so the generated
 * column expressions, the check constraints and the dashboard_rollup function
 * are all executed for real, with no Docker and no cloud project needed.
 *
 * What it cannot check: Supabase's own auth machinery. `auth.role()` is stubbed
 * below, so the RLS policies are verified for shape and for the anon/editor
 * split, but the real `auth.role()` behaviour is Supabase's to provide.
 */

import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { deriveQuarterTargets, fyOf, quarterOf, parseDateOnly } from '../src/lib/fy'

let failures = 0
let checks = 0

function check(description: string, actual: unknown, expected: unknown): void {
  checks++
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    console.log(`  ok    ${description}`)
  } else {
    failures++
    console.log(`  FAIL  ${description}\n          expected ${e}\n          actual   ${a}`)
  }
}

function checkThrows(description: string, ran: boolean, message?: string): void {
  checks++
  if (!ran) {
    console.log(`  ok    ${description}`)
  } else {
    failures++
    console.log(`  FAIL  ${description} — expected the database to refuse it${message ? `, got: ${message}` : ''}`)
  }
}

function migration(file: string): string {
  return readFileSync(resolve(process.cwd(), 'supabase/migrations', file), 'utf8')
}

async function main(): Promise<void> {
  const db = new PGlite()

  /* ---------------------------------------------------------------------- */
  /* Stand in for the pieces Supabase provides                              */
  /* ---------------------------------------------------------------------- */

  await db.exec(`
    create schema if not exists auth;
    create role anon;
    create role authenticated;
    -- Supabase derives this from the request JWT. Here it follows the session
    -- role, which is enough to exercise the read-open / write-closed split.
    create or replace function auth.role() returns text language sql stable as $fn$
      select current_setting('role', true);
    $fn$;
    grant usage on schema auth to anon, authenticated;
  `)

  /* ---------------------------------------------------------------------- */
  /* Migrations                                                             */
  /* ---------------------------------------------------------------------- */

  console.log('\nMigrations')
  for (const file of ['0001_core_schema.sql', '0002_row_level_security.sql', '0003_dashboard_rollup.sql']) {
    await db.exec(migration(file))
    console.log(`  ok    ${file} applied`)
    checks++
  }

  /* ---------------------------------------------------------------------- */
  /* Generated columns: fy and quarter                                      */
  /* ---------------------------------------------------------------------- */

  console.log('\nGenerated columns (fy / quarter) — and agreement with src/lib/fy.ts')

  await db.exec(`
    insert into financial_years (id, label, is_current) values
      (2024, '2024-25', false), (2025, '2025-26', true), (2026, '2026-27', false);
    insert into product_managers (id, name) values
      ('11111111-1111-1111-1111-111111111111', 'Praveen Reddy'),
      ('22222222-2222-2222-2222-222222222222', 'K Sreedhar');
    insert into principals (id, name, group_name, product_manager_id, country, brand_color) values
      ('aaaaaaaa-0000-0000-0000-000000000001', 'Heidolph',  'Group 1', '11111111-1111-1111-1111-111111111111', 'Germany', '#C938DC'),
      ('aaaaaaaa-0000-0000-0000-000000000002', 'Radleys',   'Group 1', '11111111-1111-1111-1111-111111111111', 'United Kingdom', '#2A5479'),
      ('aaaaaaaa-0000-0000-0000-000000000003', 'ThalesNano','Group 1', '22222222-2222-2222-2222-222222222222', 'Hungary', '#452A79'),
      ('aaaaaaaa-0000-0000-0000-000000000004', 'Maccor',    'Group 3', '22222222-2222-2222-2222-222222222222', 'United States of America', '#2BB632');
  `)

  // Every financial-year and quarter boundary, plus the leap-day edge.
  const boundaries = [
    '2025-03-31', // last day of FY 2024, Q4
    '2025-04-01', // first day of FY 2025, Q1
    '2025-06-30', // Q1 end
    '2025-07-01', // Q2 start
    '2025-09-30', // Q2 end
    '2025-10-01', // Q3 start
    '2025-12-31', // Q3 end
    '2026-01-01', // Q4 start
    '2026-02-29', // leap day — 2026 is not a leap year, so this is invalid
    '2026-03-31', // last day of FY 2025
    '2026-04-01', // first day of FY 2026
  ]

  for (const date of boundaries) {
    if (date === '2026-02-29') continue // not a real date; Postgres rejects it
    await db.query(
      `insert into posts (name, principal_id, post_date, status, channels)
       values ($1, 'aaaaaaaa-0000-0000-0000-000000000001', $2, 'planned', array['linkedin'])`,
      [`boundary ${date}`, date],
    )
  }

  const generated = await db.query<{ post_date: string; fy: number; quarter: number }>(
    `select to_char(post_date, 'YYYY-MM-DD') as post_date, fy, quarter
     from posts order by post_date`,
  )

  for (const row of generated.rows) {
    const local = parseDateOnly(row.post_date)
    check(
      `${row.post_date} -> fy ${row.fy}, Q${row.quarter}`,
      { fy: row.fy, quarter: row.quarter },
      { fy: fyOf(local), quarter: quarterOf(local) },
    )
  }

  // The generated columns must be unwritable, not merely defaulted.
  let wroteGenerated = false
  let genMessage: string | undefined
  try {
    await db.exec(`
      insert into posts (name, principal_id, post_date, status, fy)
      values ('forged', 'aaaaaaaa-0000-0000-0000-000000000001', '2025-05-01', 'planned', 1999)
    `)
    wroteGenerated = true
  } catch (error) {
    genMessage = error instanceof Error ? error.message : String(error)
  }
  checkThrows('a client cannot supply posts.fy', wroteGenerated, genMessage)

  /* ---------------------------------------------------------------------- */
  /* Constraints                                                            */
  /* ---------------------------------------------------------------------- */

  console.log('\nConstraints')

  const attempts: { description: string; sql: string }[] = [
    {
      description: 'rejects an unknown status',
      sql: `insert into posts (name, principal_id, post_date, status)
            values ('bad', 'aaaaaaaa-0000-0000-0000-000000000001', '2025-05-01', 'archived')`,
    },
    {
      description: 'rejects an unknown channel',
      sql: `insert into posts (name, principal_id, post_date, status, channels)
            values ('bad', 'aaaaaaaa-0000-0000-0000-000000000001', '2025-05-01', 'planned', array['tiktok'])`,
    },
    {
      description: 'rejects a malformed brand colour',
      sql: `insert into principals (name, group_name, brand_color)
            values ('Bad Colour', 'Group 1', 'red')`,
    },
    {
      description: 'rejects a negative yearly target',
      sql: `insert into targets (principal_id, fy, yearly_target)
            values ('aaaaaaaa-0000-0000-0000-000000000001', 2025, -5)`,
    },
    {
      description: 'rejects a blank post name',
      sql: `insert into posts (name, principal_id, post_date, status)
            values ('   ', 'aaaaaaaa-0000-0000-0000-000000000001', '2025-05-01', 'planned')`,
    },
    {
      description: 'rejects two targets for the same principal and year',
      sql: `insert into targets (principal_id, fy, yearly_target) values
              ('aaaaaaaa-0000-0000-0000-000000000002', 2025, 10),
              ('aaaaaaaa-0000-0000-0000-000000000002', 2025, 20)`,
    },
    {
      description: 'rejects a second current financial year',
      sql: `update financial_years set is_current = true where id = 2026`,
    },
    {
      description: 'REFUSES to delete a principal that has posts (retention)',
      sql: `delete from principals where id = 'aaaaaaaa-0000-0000-0000-000000000001'`,
    },
  ]

  for (const attempt of attempts) {
    let ran = false
    let message: string | undefined
    try {
      await db.exec(attempt.sql)
      ran = true
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    checkThrows(attempt.description, ran, message)
  }

  /* ---------------------------------------------------------------------- */
  /* The seed script's upsert conflict targets must actually exist           */
  /* ---------------------------------------------------------------------- */

  // scripts/seed.ts upserts with `onConflict: 'name'` on both tables and
  // `onConflict: 'id'` on financial_years. PostgREST turns those into
  // ON CONFLICT (name) — which fails at runtime unless a matching unique
  // constraint exists. Proving it here means the seed cannot be broken by a
  // schema change without this test going red.
  for (const table of ['principals', 'product_managers'] as const) {
    let ran = false
    let message: string | undefined
    try {
      if (table === 'principals') {
        await db.exec(`insert into principals (name, group_name) values ('Heidolph', 'Group 9')`)
      } else {
        await db.exec(`insert into product_managers (name) values ('Praveen Reddy')`)
      }
      ran = true
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    checkThrows(`${table} rejects a duplicate name`, ran, message)

    // And the upsert form the seed actually issues must succeed.
    let upserted = false
    try {
      if (table === 'principals') {
        await db.exec(`
          insert into principals (name, group_name, country)
          values ('Heidolph', 'Group 1', 'Germany')
          on conflict (name) do update set group_name = excluded.group_name,
                                           country    = excluded.country
        `)
      } else {
        await db.exec(`
          insert into product_managers (name, email)
          values ('Praveen Reddy', null)
          on conflict (name) do update set email = excluded.email
        `)
      }
      upserted = true
    } catch (error) {
      console.log(`          ${error instanceof Error ? error.message : String(error)}`)
    }
    check(`${table} upsert on (name) works — seed.ts conflict target is valid`, upserted, true)
  }

  let fyUpserted = false
  try {
    await db.exec(`
      insert into financial_years (id, label, is_current)
      values (2025, '2025-26', false)
      on conflict (id) do update set label = excluded.label, is_current = excluded.is_current
    `)
    fyUpserted = true
  } catch (error) {
    console.log(`          ${error instanceof Error ? error.message : String(error)}`)
  }
  check('financial_years upsert on (id) works', fyUpserted, true)

  // Restore the row the seed-target checks flipped off.
  await db.exec(`update financial_years set is_current = true where id = 2025`)

  // Soft delete is the supported path and must work.
  await db.exec(
    `update principals set is_active = false where id = 'aaaaaaaa-0000-0000-0000-000000000001'`,
  )
  const softDeleted = await db.query<{ count: number }>(
    `select count(*)::int as count from posts where principal_id = 'aaaaaaaa-0000-0000-0000-000000000001'`,
  )
  check('soft delete keeps the brand’s posts', softDeleted.rows[0]?.count, 10)

  /* ---------------------------------------------------------------------- */
  /* Quarter target derivation must match fy.ts exactly                     */
  /* ---------------------------------------------------------------------- */

  console.log('\nQuarter target derivation — SQL against deriveQuarterTargets()')

  await db.exec(`delete from posts; update principals set is_active = true;`)

  for (const yearly of [0, 1, 2, 3, 4, 7, 10, 50, 51, 99, 100]) {
    const sql = await db.query<{ q1: number; q2: number; q3: number; q4: number }>(
      `select
         ($1::int / 4) as q1,
         ($1::int / 4) as q2,
         ($1::int / 4) as q3,
         ($1::int - ($1::int / 4) * 3) as q4`,
      [yearly],
    )
    const row = sql.rows[0]
    check(
      `yearly ${yearly} splits the same in SQL and TypeScript`,
      { q1: row?.q1, q2: row?.q2, q3: row?.q3, q4: row?.q4 },
      deriveQuarterTargets(yearly),
    )
  }

  /* ---------------------------------------------------------------------- */
  /* dashboard_rollup                                                       */
  /* ---------------------------------------------------------------------- */

  console.log('\ndashboard_rollup')

  await db.exec(`
    insert into targets (principal_id, fy, yearly_target, q1_target) values
      ('aaaaaaaa-0000-0000-0000-000000000001', 2025, 24, null),   -- derives 6/6/6/6
      ('aaaaaaaa-0000-0000-0000-000000000002', 2025, 10, 7),      -- Q1 overridden to 7
      ('aaaaaaaa-0000-0000-0000-000000000003', 2025, 4,  null),   -- derives 1/1/1/1
      ('aaaaaaaa-0000-0000-0000-000000000004', 2025, 0,  null);   -- no plan

    insert into posts (name, principal_id, product_name, post_date, status, channels) values
      -- Heidolph, Q1: 3 published, 1 pending
      ('Rotavapor launch',  'aaaaaaaa-0000-0000-0000-000000000001', 'Hei-VAP',  '2025-04-10', 'published',   array['linkedin']),
      ('Rotavapor launch',  'aaaaaaaa-0000-0000-0000-000000000001', 'Hei-VAP',  '2025-05-10', 'published',   array['instagram']),
      ('Hotplate feature',  'aaaaaaaa-0000-0000-0000-000000000001', 'Hei-Tec',  '2025-06-10', 'published',   array['facebook']),
      ('Hotplate feature',  'aaaaaaaa-0000-0000-0000-000000000001', 'Hei-Tec',  '2025-06-20', 'in_review',   array['facebook']),
      -- Heidolph, Q3: 1 published (must not count toward Q1)
      ('Year end recap',    'aaaaaaaa-0000-0000-0000-000000000001', 'Hei-VAP',  '2025-11-05', 'published',   array['linkedin']),
      -- Radleys, Q1: 1 published, 2 pending
      ('Carousel demo',     'aaaaaaaa-0000-0000-0000-000000000002', 'Carousel', '2025-04-15', 'published',   array['youtube']),
      ('Carousel demo',     'aaaaaaaa-0000-0000-0000-000000000002', 'Carousel', '2025-05-15', 'planned',     array['youtube']),
      ('Reactor-Ready',     'aaaaaaaa-0000-0000-0000-000000000002', null,       '2025-06-15', 'in_progress', array['linkedin']),
      -- ThalesNano, Q1: overshoots its derived target of 1
      ('H-Cube webinar',    'aaaaaaaa-0000-0000-0000-000000000003', 'H-Cube',   '2025-04-20', 'published',   array['linkedin']),
      ('H-Cube webinar',    'aaaaaaaa-0000-0000-0000-000000000003', 'H-Cube',   '2025-05-20', 'published',   array['linkedin']),
      ('H-Cube webinar',    'aaaaaaaa-0000-0000-0000-000000000003', 'H-Cube',   '2025-06-25', 'published',   array['linkedin']),
      -- Maccor, Q1: activity with no plan at all
      ('Cycler spotlight',  'aaaaaaaa-0000-0000-0000-000000000004', 'Series 4', '2025-05-05', 'published',   array['linkedin']),
      -- A post in the NEXT financial year, which must never leak into FY 2025
      ('Next year teaser',  'aaaaaaaa-0000-0000-0000-000000000001', 'Hei-VAP',  '2026-04-05', 'published',   array['linkedin']);
  `)

  type Row = {
    dimension: string
    key: string
    label: string
    accent: string | null
    planned: number
    implemented: number
    pending: number
  }

  const rollup = async (args: string) =>
    (await db.query<Row>(`select * from dashboard_rollup(${args})`)).rows

  // --- Full year ---------------------------------------------------------
  const fullYear = await rollup('2025')
  const byPrincipal = fullYear.filter((r) => r.dimension === 'principal')

  check(
    'full year · Heidolph = 24 planned / 4 published / 1 pending',
    byPrincipal.find((r) => r.label === 'Heidolph'),
    {
      dimension: 'principal',
      key: 'aaaaaaaa-0000-0000-0000-000000000001',
      label: 'Heidolph',
      accent: '#C938DC',
      planned: 24,
      implemented: 4,
      pending: 1,
    },
  )
  check(
    'full year · Radleys = 10 planned / 1 published / 2 pending',
    (({ planned, implemented, pending }) => ({ planned, implemented, pending }))(
      byPrincipal.find((r) => r.label === 'Radleys') ?? ({} as Row),
    ),
    { planned: 10, implemented: 1, pending: 2 },
  )
  check(
    'full year · Maccor appears on activity alone, with planned 0',
    (({ planned, implemented, pending }) => ({ planned, implemented, pending }))(
      byPrincipal.find((r) => r.label === 'Maccor') ?? ({} as Row),
    ),
    { planned: 0, implemented: 1, pending: 0 },
  )
  check(
    'full year · next-FY post excluded (Heidolph published is 4, not 5)',
    byPrincipal.find((r) => r.label === 'Heidolph')?.implemented,
    4,
  )

  const groups = fullYear.filter((r) => r.dimension === 'group')
  check(
    'full year · Group 1 rolls up its three brands',
    groups.find((r) => r.label === 'Group 1'),
    {
      dimension: 'group',
      key: 'Group 1',
      label: 'Group 1',
      accent: null,
      planned: 38, // 24 + 10 + 4
      implemented: 8, // 4 + 1 + 3
      pending: 3, // 1 + 2 + 0
    },
  )

  const managers = fullYear.filter((r) => r.dimension === 'manager')
  check(
    'full year · Praveen Reddy rolls up Heidolph + Radleys',
    (({ planned, implemented, pending }) => ({ planned, implemented, pending }))(
      managers.find((r) => r.label === 'Praveen Reddy') ?? ({} as Row),
    ),
    { planned: 34, implemented: 5, pending: 3 },
  )
  check(
    'full year · K Sreedhar rolls up ThalesNano + Maccor',
    (({ planned, implemented, pending }) => ({ planned, implemented, pending }))(
      managers.find((r) => r.label === 'K Sreedhar') ?? ({} as Row),
    ),
    { planned: 4, implemented: 4, pending: 0 },
  )

  const products = fullYear.filter((r) => r.dimension === 'product')
  check(
    'full year · products carry no target',
    products.every((r) => r.planned === 0),
    true,
  )
  check(
    'full year · Hei-VAP counted 3 times, excluding the next-FY post',
    (({ implemented, pending }) => ({ implemented, pending }))(
      products.find((r) => r.label === 'Hei-VAP') ?? ({} as Row),
    ),
    { implemented: 3, pending: 0 },
  )
  check(
    'full year · a post with no product name is omitted from By Product',
    products.some((r) => r.label === null || r.label === ''),
    false,
  )

  const campaigns = fullYear.filter((r) => r.dimension === 'campaign')
  check(
    'full year · repeated campaign name groups into one row',
    (({ implemented, pending }) => ({ implemented, pending }))(
      campaigns.find((r) => r.label === 'Carousel demo') ?? ({} as Row),
    ),
    { implemented: 1, pending: 1 },
  )

  // --- Q1 ----------------------------------------------------------------
  const q1 = await rollup('2025, 1')
  const q1Principals = q1.filter((r) => r.dimension === 'principal')

  check(
    'Q1 · Heidolph target derives to 6 and excludes the Q3 post',
    (({ planned, implemented, pending }) => ({ planned, implemented, pending }))(
      q1Principals.find((r) => r.label === 'Heidolph') ?? ({} as Row),
    ),
    { planned: 6, implemented: 3, pending: 1 },
  )
  check(
    'Q1 · Radleys uses its explicit override of 7, not the derived 2',
    q1Principals.find((r) => r.label === 'Radleys')?.planned,
    7,
  )
  check(
    'Q1 · ThalesNano overshoots (3 published against a derived target of 1)',
    (({ planned, implemented }) => ({ planned, implemented }))(
      q1Principals.find((r) => r.label === 'ThalesNano') ?? ({} as Row),
    ),
    { planned: 1, implemented: 3 },
  )

  const q3 = await rollup('2025, 3')
  check(
    'Q3 · Heidolph has only the November post',
    (({ planned, implemented, pending }) => ({ planned, implemented, pending }))(
      q3.filter((r) => r.dimension === 'principal').find((r) => r.label === 'Heidolph') ??
        ({} as Row),
    ),
    { planned: 6, implemented: 1, pending: 0 },
  )

  // --- Filters -----------------------------------------------------------
  const group1Only = await rollup(`2025, null, 'Group 1'`)
  check(
    'group filter · Maccor (Group 3) drops out entirely',
    group1Only.some((r) => r.label === 'Maccor'),
    false,
  )
  check(
    'group filter · only Group 1 remains on the group dimension',
    group1Only.filter((r) => r.dimension === 'group').map((r) => r.label),
    ['Group 1'],
  )

  const pmOnly = await rollup(`2025, null, null, '22222222-2222-2222-2222-222222222222'`)
  check(
    'manager filter · keeps only that manager’s brands',
    pmOnly
      .filter((r) => r.dimension === 'principal')
      .map((r) => r.label)
      .sort(),
    ['Maccor', 'ThalesNano'],
  )

  const publishedOnly = await rollup(`2025, null, null, null, 'published'`)
  check(
    'status filter · pending is zero everywhere when filtering to published',
    publishedOnly.every((r) => r.pending === 0),
    true,
  )
  check(
    'status filter · target still reported (planned is not filtered by status)',
    publishedOnly.filter((r) => r.dimension === 'principal').find((r) => r.label === 'Heidolph')
      ?.planned,
    24,
  )

  // --- Custom date range -------------------------------------------------
  const aprilOnly = await rollup(`2025, null, null, null, null, '2025-04-01', '2025-04-30'`)
  check(
    'date range · April only counts the three April posts',
    aprilOnly
      .filter((r) => r.dimension === 'principal')
      .reduce((sum, r) => sum + r.implemented + r.pending, 0),
    3,
  )

  // A range far wider than the selected quarter must be clamped to it, which is
  // the same thing as saying it should return exactly the unfiltered Q1 result.
  // Comparing the two rollups tests the clamp directly; a hand-written total
  // would only test my arithmetic.
  const clamped = await rollup(`2025, 1, null, null, null, '2020-01-01', '2030-12-31'`)
  check(
    'date range · a range wider than the quarter is clamped to exactly Q1',
    clamped,
    q1,
  )
  check(
    'date range · clamping still excludes the next-FY post',
    clamped
      .filter((r) => r.dimension === 'principal')
      .reduce((sum, r) => sum + r.implemented + r.pending, 0),
    11, // every Q1 post; the April 2026 post is outside FY 2025 and stays out
  )

  let badQuarter = false
  try {
    await rollup('2025, 9')
    badQuarter = true
  } catch {
    /* expected */
  }
  checkThrows('an out-of-range quarter is rejected', badQuarter)

  /* ---------------------------------------------------------------------- */
  /* Row-level security                                                     */
  /* ---------------------------------------------------------------------- */

  console.log('\nRow-level security')

  await db.exec(`set role anon`)

  const anonRead = await db.query<{ count: number }>(
    `select count(*)::int as count from principals`,
  )
  check('anon can read principals', (anonRead.rows[0]?.count ?? 0) > 0, true)

  const anonPosts = await db.query<{ count: number }>(`select count(*)::int as count from posts`)
  check('anon can read posts', (anonPosts.rows[0]?.count ?? 0) > 0, true)

  const anonRollup = await db.query<Row>(`select * from dashboard_rollup(2025)`)
  check('anon can execute dashboard_rollup', anonRollup.rows.length > 0, true)

  const anonWrites: { description: string; sql: string }[] = [
    {
      description: 'anon cannot insert a post',
      sql: `insert into posts (name, principal_id, post_date, status)
            values ('sneaky', 'aaaaaaaa-0000-0000-0000-000000000001', '2025-05-01', 'planned')`,
    },
    { description: 'anon cannot update a post', sql: `update posts set status = 'published'` },
    { description: 'anon cannot delete a post', sql: `delete from posts` },
    { description: 'anon cannot update a target', sql: `update targets set yearly_target = 999` },
    {
      description: 'anon cannot insert a principal',
      sql: `insert into principals (name, group_name) values ('Rogue', 'Group 1')`,
    },
  ]

  for (const attempt of anonWrites) {
    let ran = false
    let message: string | undefined
    try {
      await db.exec(attempt.sql)
      ran = true
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    checkThrows(attempt.description, ran, message)
  }

  await db.exec(`reset role; set role authenticated`)

  let editorWrote = false
  try {
    await db.exec(
      `insert into posts (name, principal_id, post_date, status)
       values ('editor post', 'aaaaaaaa-0000-0000-0000-000000000001', '2025-05-02', 'planned')`,
    )
    editorWrote = true
  } catch (error) {
    console.log(`          ${error instanceof Error ? error.message : String(error)}`)
  }
  check('an authenticated editor can insert a post', editorWrote, true)

  await db.exec(`reset role`)
  await db.close()

  /* ---------------------------------------------------------------------- */
  /* supabase/setup.sql — the file that actually gets pasted into Supabase   */
  /* ---------------------------------------------------------------------- */

  console.log('\nsupabase/setup.sql')

  // With no Supabase CLI available, setup.sql is what gets applied to the real
  // project — so it, not the migrations directory, is what must be correct. A
  // stale copy would apply an older schema and the mismatch would only show up
  // as puzzling runtime errors. Applying it to a clean database twice proves it
  // is both complete and safe to re-run.
  let setupSql: string
  try {
    setupSql = readFileSync(resolve(process.cwd(), 'supabase/setup.sql'), 'utf8')
  } catch {
    failures++
    checks++
    console.log('  FAIL  supabase/setup.sql is missing — run: npm run build:setup')
    console.log(`\n✗ ${checks - failures}/${checks} checks passed\n`)
    process.exit(1)
  }

  const fresh = new PGlite()
  await fresh.exec(`
    create schema if not exists auth;
    create role anon;
    create role authenticated;
    create or replace function auth.role() returns text language sql stable as $fn$
      select current_setting('role', true);
    $fn$;
    grant usage on schema auth to anon, authenticated;
  `)

  let applied = false
  try {
    await fresh.exec(setupSql)
    applied = true
  } catch (error) {
    console.log(`          ${error instanceof Error ? error.message : String(error)}`)
  }
  check('applies to a clean database', applied, true)

  let reapplied = false
  try {
    await fresh.exec(setupSql)
    reapplied = true
  } catch (error) {
    console.log(`          ${error instanceof Error ? error.message : String(error)}`)
  }
  check('is idempotent — safe to run twice', reapplied, true)

  const tables = await fresh.query<{ tablename: string }>(
    `select tablename from pg_tables where schemaname = 'public' order by tablename`,
  )
  check(
    'creates all five tables',
    tables.rows.map((r) => r.tablename),
    ['financial_years', 'posts', 'principals', 'product_managers', 'targets'],
  )

  const policies = await fresh.query<{ count: number }>(
    `select count(*)::int as count from pg_policies where schemaname = 'public'`,
  )
  check('creates two policies per table', policies.rows[0]?.count, 10)

  const secured = await fresh.query<{ n: number }>(
    `select count(*)::int as n from pg_class
     where relname in ('posts','principals','targets','product_managers','financial_years')
       and relrowsecurity and relforcerowsecurity`,
  )
  check('enables and forces RLS on all five tables', secured.rows[0]?.n, 5)

  const fn = await fresh.query<{ proname: string }>(
    `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'dashboard_rollup'`,
  )
  check('creates dashboard_rollup', fn.rows.length, 1)

  /* ---------------------------------------------------------------------- */
  /* supabase/seed.sql — the no-secret-key path to loading the seed data     */
  /* ---------------------------------------------------------------------- */

  console.log('\nsupabase/seed.sql')

  // Pasting SQL into the dashboard's SQL Editor loads the seed without a
  // service-role key ever leaving Supabase. That makes this file the easier
  // route for a fresh environment, so it has to be as trustworthy as the script.
  let seedSql: string | null = null
  try {
    seedSql = readFileSync(resolve(process.cwd(), 'supabase/seed.sql'), 'utf8')
  } catch {
    failures++
    checks++
    console.log('  FAIL  supabase/seed.sql is missing — run: npm run build:seed-sql')
  }

  if (seedSql !== null) {
    let seeded = false
    try {
      await fresh.exec(seedSql)
      seeded = true
    } catch (error) {
      console.log(`          ${error instanceof Error ? error.message : String(error)}`)
    }
    check('applies on top of setup.sql', seeded, true)

    const counts = await fresh.query<{
      principals: number
      managers: number
      years: number
      current: string | null
    }>(
      `select
         (select count(*)::int from public.principals)       as principals,
         (select count(*)::int from public.product_managers) as managers,
         (select count(*)::int from public.financial_years)  as years,
         (select label from public.financial_years where is_current) as current`,
    )
    check(
      'loads 46 principals, 14 managers, 5 years with one current',
      counts.rows[0],
      { principals: 46, managers: 14, years: 5, current: '2026-27' },
    )

    const unassigned = await fresh.query<{ n: number }>(
      `select count(*)::int as n from public.principals where product_manager_id is null`,
    )
    check('every principal resolves to a manager by name', unassigned.rows[0]?.n, 0)

    const colours = await fresh.query<{ n: number }>(
      `select count(distinct brand_color)::int as n from public.principals`,
    )
    check('all 46 brand colours are distinct', colours.rows[0]?.n, 46)

    // Re-running must not duplicate, and must not clobber a colour edited in the
    // app — the same guarantee scripts/seed.ts makes.
    await fresh.exec(`update public.principals set brand_color = '#ABCDEF' where name = 'Heidolph'`)
    let reseeded = false
    try {
      await fresh.exec(seedSql)
      reseeded = true
    } catch (error) {
      console.log(`          ${error instanceof Error ? error.message : String(error)}`)
    }
    check('is idempotent — safe to run twice', reseeded, true)

    const afterRerun = await fresh.query<{ principals: number; heidolph: string | null }>(
      `select
         (select count(*)::int from public.principals) as principals,
         (select brand_color from public.principals where name = 'Heidolph') as heidolph`,
    )
    check(
      're-running creates no duplicates and preserves an edited brand colour',
      afterRerun.rows[0],
      { principals: 46, heidolph: '#ABCDEF' },
    )
  }

  await fresh.close()

  /* ---------------------------------------------------------------------- */

  console.log(
    `\n${failures === 0 ? '✓' : '✗'} ${checks - failures}/${checks} checks passed\n`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error: unknown) => {
  console.error('\n✗ Verification crashed\n', error)
  process.exit(1)
})
