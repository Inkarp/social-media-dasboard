import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

async function main() {
const db = new PGlite()
try {
  await db.exec(`create role anon; create role authenticated;`)
  await db.exec(readFileSync('supabase/migrations/0001_core_schema.sql', 'utf8'))
  await db.exec(readFileSync('supabase/migrations/0003_dashboard_rollup.sql', 'utf8'))
  await db.exec(`
    insert into principals (id, name, group_name) values ('00000000-0000-4000-8000-000000000001', 'Format test', 'Lab');
    insert into financial_years (id,label) values (2026,'2026-27');
    insert into targets (principal_id,fy,yearly_target) values ('00000000-0000-4000-8000-000000000001',2026,12);
    insert into posts (name,principal_id,post_date,status) values ('Legacy','00000000-0000-4000-8000-000000000001','2026-04-01','planned');
  `)
  const migration = readFileSync('supabase/migrations/0006_post_formats.sql', 'utf8')
  await db.exec(migration)
  await db.exec(migration)
  const legacy = await db.query(`select format from posts where name='Legacy'`)
  assert.equal(legacy.rows[0]?.format, null)
  for (const format of ['static', 'carousel', 'reel', 'video']) {
    await db.query(`insert into posts (name,principal_id,post_date,status,format) values ($1,'00000000-0000-4000-8000-000000000001','2026-04-02','published',$1)`, [format])
  }
  await assert.rejects(db.exec(`insert into posts (name,principal_id,post_date,status) values ('Missing','00000000-0000-4000-8000-000000000001','2026-04-01','planned')`))
  await assert.rejects(db.exec(`update posts set format='invalid' where name='reel'`))
  await assert.rejects(db.exec(`update posts set format=null where name='reel'`))
  await db.exec(`update posts set status='in_review' where name='Legacy'`)
  let result = await db.query(`select format,implemented,pending from post_format_rollup(2026) order by format`)
  assert.deepEqual(result.rows, [
    {format:'carousel',implemented:1,pending:0}, {format:'reel',implemented:1,pending:0},
    {format:'static',implemented:1,pending:0}, {format:'unclassified',implemented:0,pending:1}, {format:'video',implemented:1,pending:0},
  ])
  result = await db.query(`select planned,implemented,pending from dashboard_rollup(2026,p_format=>'reel') where dimension='principal'`)
  assert.deepEqual(result.rows, [{planned:12,implemented:1,pending:0}])
  result = await db.query(`select * from post_format_rollup(2026,p_quarter=>2)`)
  assert.equal(result.rows.length,0)
  result = await db.query(`select * from post_format_rollup(2026,p_group=>'Other')`)
  assert.equal(result.rows.length,0)
  result = await db.query(`select format from post_format_rollup(2026,p_status=>'in_review')`)
  assert.deepEqual(result.rows,[{format:'unclassified'}])
  result = await db.query(`select * from post_format_rollup(2026,p_from=>'2026-04-03')`)
  assert.equal(result.rows.length,0)
  await db.exec(`update posts set format='reel' where name='Legacy'`)
  result = await db.query(`select implemented,pending from post_format_rollup(2026,p_format=>'reel')`)
  assert.deepEqual(result.rows,[{implemented:1,pending:1}])
  console.log('Post format migration, legacy preservation, constraints, aggregation and filters passed.')
} finally { await db.close() }

}
main().catch((error) => { console.error(error); process.exit(1) })
