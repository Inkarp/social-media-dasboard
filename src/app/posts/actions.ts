'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { CHANNELS, type Channel } from '@/lib/channels'
import { POST_STATUSES, type PostStatus } from '@/lib/status'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, ImportResult } from '@/lib/action-result'

/**
 * Every export here is an async function — see the note in
 * src/app/principals/actions.ts, which this file mirrors exactly. Validation
 * happens with Zod before the database is touched; row-level security is the
 * real backstop for authorisation.
 */

/* -------------------------------------------------------------------------- */
/* Schemas                                                                     */
/* -------------------------------------------------------------------------- */

const uuid = z.string().uuid('That post could not be identified.')
const principalUuid = z.string().uuid('Choose a brand.')
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.')

const postFields = {
  name: z.string().trim().min(1, 'Enter the post name.').max(200, 'That name is too long.'),
  description: z
    .string()
    .trim()
    .max(2000, 'That description is too long.')
    .transform((v) => (v === '' ? null : v)),
  principalId: principalUuid,
  productName: z
    .string()
    .trim()
    .max(120, 'That product name is too long.')
    .transform((v) => (v === '' ? null : v)),
  channels: z
    .array(z.enum(CHANNELS))
    .max(CHANNELS.length)
    .transform((v) => [...new Set(v)]),
  postDate: dateOnly,
  status: z.enum(POST_STATUSES, { message: 'Choose a status.' }),
}

const postSchema = z.object(postFields)

function readPostForm(formData: FormData) {
  return {
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    principalId: formData.get('principalId'),
    productName: formData.get('productName') ?? '',
    channels: formData.getAll('channels'),
    postDate: formData.get('postDate'),
    status: formData.get('status'),
  }
}

/* -------------------------------------------------------------------------- */
/* Single-post actions                                                        */
/* -------------------------------------------------------------------------- */

function revalidateEverywherePostsAppear(): void {
  revalidatePath('/posts')
  revalidatePath('/calendar')
  revalidatePath('/board')
  revalidatePath('/')
}

export async function createPostAction(formData: FormData): Promise<ActionResult> {
  const parsed = postSchema.safeParse(readPostForm(formData))
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again.' }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase.from('posts').insert({
    name: parsed.data.name,
    description: parsed.data.description,
    principal_id: parsed.data.principalId,
    product_name: parsed.data.productName,
    channels: parsed.data.channels,
    post_date: parsed.data.postDate,
    status: parsed.data.status,
  })

  if (error) return { ok: false, error: describe(error.message) }

  revalidateEverywherePostsAppear()
  return { ok: true }
}

export async function updatePostAction(formData: FormData): Promise<ActionResult> {
  const parsed = postSchema.extend({ id: uuid }).safeParse({ ...readPostForm(formData), id: formData.get('id') })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again.' }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase
    .from('posts')
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      principal_id: parsed.data.principalId,
      product_name: parsed.data.productName,
      channels: parsed.data.channels,
      post_date: parsed.data.postDate,
      status: parsed.data.status,
    })
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: describe(error.message) }

  revalidateEverywherePostsAppear()
  return { ok: true }
}

export async function deletePostAction(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ id: uuid }).safeParse({ id: formData.get('id') })
  if (!parsed.success) return { ok: false, error: 'That post could not be identified.' }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase.from('posts').delete().eq('id', parsed.data.id)
  if (error) return { ok: false, error: describe(error.message) }

  revalidateEverywherePostsAppear()
  return { ok: true }
}

/** Delete several posts at once, from the Posts list's multi-select. */
export async function bulkDeletePostsAction(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ id: z.array(uuid).min(1, 'Select at least one post.') }).safeParse({
    id: formData.getAll('id'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Select at least one post.' }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase.from('posts').delete().in('id', parsed.data.id)
  if (error) return { ok: false, error: describe(error.message) }

  revalidateEverywherePostsAppear()
  return { ok: true }
}

/** Status only — what dragging a card on the Board calls. */
export async function updatePostStatusAction(formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({ id: uuid, status: z.enum(POST_STATUSES, { message: 'Unknown status.' }) })
    .safeParse({ id: formData.get('id'), status: formData.get('status') })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'That move could not be saved.' }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase
    .from('posts')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: describe(error.message) }

  revalidateEverywherePostsAppear()
  return { ok: true }
}

/* -------------------------------------------------------------------------- */
/* Bulk import                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * One row as the client hands it over, already normalised from whatever the
 * spreadsheet contained (see src/components/posts/import-dialog.tsx): dates as
 * "YYYY-MM-DD" strings, channels as an array of channel ids, blanks as ''.
 */
const importRowSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim(),
  brand: z.string().trim().min(1),
  product: z.string().trim(),
  channels: z.array(z.string()),
  date: z.string(),
  status: z.string().trim(),
})

/**
 * Insert many posts from a parsed spreadsheet.
 *
 * Runs row-by-row validation before any insert, so one malformed row does not
 * abort the rows that were fine — the caller sees exactly what landed and what
 * to fix, by row number (1-indexed, matching what someone sees in Excel).
 */
export async function importPostsAction(formData: FormData): Promise<ImportResult> {
  const raw = formData.get('rows')
  if (typeof raw !== 'string') return { ok: false, error: 'No rows were submitted.' }

  let rows: unknown[]
  try {
    rows = JSON.parse(raw)
    if (!Array.isArray(rows)) throw new Error('not an array')
  } catch {
    return { ok: false, error: 'The uploaded file could not be read.' }
  }
  if (rows.length === 0) return { ok: false, error: 'The sheet has no rows to import.' }
  if (rows.length > 1000) return { ok: false, error: 'Import at most 1000 rows at a time.' }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { data: principals, error: principalsError } = await supabase
    .from('principals')
    .select('id, name')
    .eq('is_active', true)
  if (principalsError) return { ok: false, error: describe(principalsError.message) }

  const byName = new Map((principals ?? []).map((p) => [p.name.toLowerCase(), p.id]))

  const toInsert: {
    name: string
    description: string | null
    principal_id: string
    product_name: string | null
    channels: Channel[]
    post_date: string
    status: PostStatus
  }[] = []
  const skipped: { row: number; reason: string }[] = []

  rows.forEach((raw, index) => {
    const rowNumber = index + 2 // header is row 1 in the sheet the user sees
    const parsed = importRowSchema.safeParse(raw)
    if (!parsed.success) {
      skipped.push({ row: rowNumber, reason: parsed.error.issues[0]?.message ?? 'Could not read this row.' })
      return
    }

    const principalId = byName.get(parsed.data.brand.toLowerCase())
    if (!principalId) {
      skipped.push({ row: rowNumber, reason: `Unknown brand "${parsed.data.brand}".` })
      return
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.data.date)) {
      skipped.push({ row: rowNumber, reason: `Unrecognised date "${parsed.data.date}".` })
      return
    }

    const invalidChannel = parsed.data.channels.find((c) => !CHANNELS.includes(c as (typeof CHANNELS)[number]))
    if (invalidChannel) {
      skipped.push({ row: rowNumber, reason: `Unknown channel "${invalidChannel}".` })
      return
    }

    const status = parsed.data.status || 'planned'
    if (!POST_STATUSES.includes(status as (typeof POST_STATUSES)[number])) {
      skipped.push({ row: rowNumber, reason: `Unknown status "${status}".` })
      return
    }

    toInsert.push({
      name: parsed.data.name,
      description: parsed.data.description || null,
      principal_id: principalId,
      product_name: parsed.data.product || null,
      channels: parsed.data.channels as Channel[],
      post_date: parsed.data.date,
      status: status as PostStatus,
    })
  })

  if (toInsert.length > 0) {
    const { error } = await supabase.from('posts').insert(toInsert)
    if (error) return { ok: false, error: describe(error.message) }
  }

  revalidateEverywherePostsAppear()
  return { ok: true, inserted: toInsert.length, skipped }
}

/* -------------------------------------------------------------------------- */

/** Same purpose as the twin in principals/actions.ts: turn a raw Postgres error into something worth reading. */
function describe(message: string): string {
  if (/row-level security/i.test(message)) {
    return 'Your account is not authorised to make changes. Ask an administrator for access.'
  }
  if (/violates foreign key/i.test(message)) {
    return 'That brand no longer exists. Reload the page and pick again.'
  }
  if (/channels/i.test(message)) {
    return 'One of the channels is not supported.'
  }
  return message
}
