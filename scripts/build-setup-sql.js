/**
 * Concatenate the migrations into a single supabase/setup.sql.
 *
 *   npm run build:setup
 *
 * There is no Supabase CLI on this machine, so migrations are applied by pasting
 * them into the dashboard SQL Editor. Three files pasted in order is three
 * chances to paste out of order; one file is none. The migrations remain the
 * source of truth — this output is generated and should never be hand-edited.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase/migrations')
const OUTPUT = resolve(process.cwd(), 'supabase/setup.sql')

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  console.error(`No .sql files found in ${MIGRATIONS_DIR}`)
  process.exit(1)
}

const header = `-- =============================================================================
-- Inkarp Social Dashboard · complete database setup
--
-- GENERATED FILE — do not edit. Regenerate with: npm run build:setup
-- Source of truth: supabase/migrations/
--
-- Apply this once, in the Supabase dashboard:
--   1. Open your project -> SQL Editor -> New query
--   2. Paste this entire file
--   3. Run
--
-- Safe to run more than once: every statement is idempotent (create ... if not
-- exists, create or replace, drop policy if exists before create).
--
-- Concatenated from:
${files.map((f) => `--   ${f}`).join('\n')}
-- =============================================================================

`

const body = files
  .map((file) => {
    const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8').trimEnd()
    return `-- >>> ${file} ${'>'.repeat(Math.max(0, 72 - file.length))}\n\n${sql}\n`
  })
  .join('\n\n')

writeFileSync(OUTPUT, `${header}${body}\n`)

console.log(`Wrote supabase/setup.sql from ${files.length} migrations:`)
for (const file of files) console.log(`  ${file}`)
