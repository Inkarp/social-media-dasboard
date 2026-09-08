import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { CHANNELS } from '../src/lib/channels.js'
import { POST_STATUSES } from '../src/lib/status.js'
import { POST_FORMATS } from '../src/lib/post-formats.js'

async function main() {
  const principalId = '00000000-0000-4000-8000-000000000001'
  /** @type {unknown[]} */
  const writes = []
  const client = {
    from() {
      return {
        /** @param {unknown} values */
        insert(values) { writes.push(values); return { error: null, select: () => ({ single: async () => ({ data: { id: principalId }, error: null }) }) } },
        /** @param {unknown} values */
        update(values) { writes.push(values); return { eq: async () => ({ error: null }) } },
        select() { return { eq: async () => ({ data: [{ id: principalId, name: 'Brand' }], error: null }) } },
      }
    },
  }
  // Execute the actual action implementation with only its framework/database dependencies replaced.
  const source = readFileSync('src/app/posts/actions.js', 'utf8').replace(/^import .*$/gm, '').replace(/export async function/g, 'async function')
  const load = new Function('z', 'CHANNELS', 'POST_STATUSES', 'POST_FORMATS', 'createClient', 'hasPostFormats', 'revalidatePath', `${source}\nreturn { createPostAction, updatePostAction, updatePostStatusAction, importPostsAction }`)
  const actions = load(z, CHANNELS, POST_STATUSES, POST_FORMATS, async () => client, async () => true, () => {})
  /** @param {string} [format] */
  function form(format) {
    const data = new FormData()
    for (const [key, value] of Object.entries({ id: principalId, name: 'Test post', principalId, postDate: '2026-04-02', status: 'planned' })) data.set(key, value)
    if (format !== undefined) data.set('format', format)
    return data
  }
  assert.equal((await actions.createPostAction(form())).ok, false)
  assert.equal((await actions.createPostAction(form('unclassified'))).ok, false)
  assert.equal((await actions.updatePostAction(form())).ok, false)
  assert.equal(writes.length, 0)
  for (const format of POST_FORMATS) {
    assert.equal((await actions.createPostAction(form(format))).ok, true)
    assert.equal(/** @type {{ format: string }} */ (writes.at(-1)).format, format)
  }
  assert.equal((await actions.updatePostAction(form('reel'))).ok, true)
  assert.equal(/** @type {{ format: string }} */ (writes.at(-1)).format, 'reel')
  assert.equal((await actions.updatePostStatusAction(form())).ok, true)
  assert.deepEqual(writes.at(-1), { status: 'planned' })
  const imported = new FormData()
  const base = { name: 'Import', description: '', brand: 'Brand', product: '', channels: [], date: '2026-04-02', status: 'planned' }
  imported.set('rows', JSON.stringify([{ ...base, format: 'video' }, { ...base, format: '' }, { ...base, format: 'unknown' }]))
  const result = await actions.importPostsAction(imported)
  assert.equal(result.ok, true)
  assert.equal(result.inserted, 1)
  assert.equal(result.skipped.length, 2)
  assert.equal(/** @type {{format: string}[]} */ (writes.at(-1))[0]?.format, 'video')
  console.log('Create, edit, status-only update, and import format validation passed.')
}
main().catch((error) => { console.error(error); process.exit(1) })
