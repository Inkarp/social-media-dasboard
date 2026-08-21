'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { GROUPS } from '@/lib/groups'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/action-result'

/**
 * Every export here is an async function. A `'use server'` module turns each
 * export into a callable server endpoint, so constants and types live elsewhere
 * — see src/lib/action-result.ts. `npm run verify:actions` enforces it.
 *
 * Each action validates with Zod before touching the database. Row-level
 * security would refuse an unauthenticated write anyway, so these run as the
 * caller: if the session is missing, Postgres rejects it and the error surfaces
 * here rather than being decided by application code.
 */

/* -------------------------------------------------------------------------- */
/* Schemas                                                                     */
/* -------------------------------------------------------------------------- */

const uuid = z.string().uuid('That brand id is not valid.')

const hexColour = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Pick a colour in the form #RRGGBB.')

/** A quarter override: a number, or null meaning "derive from the yearly plan". */
const optionalCount = z
  .union([z.literal(''), z.coerce.number().int().min(0).max(100_000)])
  .transform((value) => (value === '' ? null : value))

const targetSchema = z.object({
  principalId: uuid,
  fy: z.coerce.number().int().min(2000).max(2100),
  yearlyTarget: z.coerce
    .number({ message: 'Enter a whole number of posts.' })
    .int('Enter a whole number of posts.')
    .min(0, 'A target cannot be negative.')
    .max(100_000, 'That target looks too large.'),
  q1: optionalCount,
  q2: optionalCount,
  q3: optionalCount,
  q4: optionalCount,
})

const createPrincipalSchema = z.object({
  name: z.string().trim().min(1, 'Enter the brand name.').max(120, 'That name is too long.'),
  groupName: z.enum(GROUPS, { message: 'Choose a group.' }),
  productManagerId: z
    .union([z.literal(''), uuid])
    .transform((value) => (value === '' ? null : value)),
  country: z
    .string()
    .trim()
    .max(120, 'That country name is too long.')
    .transform((value) => (value === '' ? null : value)),
  brandColor: hexColour,
})

/* -------------------------------------------------------------------------- */
/* Actions                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Save a brand's plan for one financial year.
 *
 * Upserts on (principal_id, fy) so setting a target for the first time and
 * changing it later are the same operation — there is no "has a target yet"
 * state for the interface to track.
 */
export async function saveTargetAction(formData: FormData): Promise<ActionResult> {
  const parsed = targetSchema.safeParse({
    principalId: formData.get('principalId'),
    fy: formData.get('fy'),
    yearlyTarget: formData.get('yearlyTarget'),
    q1: formData.get('q1') ?? '',
    q2: formData.get('q2') ?? '',
    q3: formData.get('q3') ?? '',
    q4: formData.get('q4') ?? '',
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the figures and try again.' }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase.from('targets').upsert(
    {
      principal_id: parsed.data.principalId,
      fy: parsed.data.fy,
      yearly_target: parsed.data.yearlyTarget,
      q1_target: parsed.data.q1,
      q2_target: parsed.data.q2,
      q3_target: parsed.data.q3,
      q4_target: parsed.data.q4,
    },
    { onConflict: 'principal_id,fy' },
  )

  if (error) return { ok: false, error: describe(error.message) }

  revalidatePath('/principals')
  revalidatePath('/')
  return { ok: true }
}

export async function createPrincipalAction(formData: FormData): Promise<ActionResult> {
  const parsed = createPrincipalSchema.safeParse({
    name: formData.get('name'),
    groupName: formData.get('groupName'),
    productManagerId: formData.get('productManagerId') ?? '',
    country: formData.get('country') ?? '',
    brandColor: formData.get('brandColor'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again.' }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase.from('principals').insert({
    name: parsed.data.name,
    group_name: parsed.data.groupName,
    product_manager_id: parsed.data.productManagerId,
    country: parsed.data.country,
    brand_color: parsed.data.brandColor,
  })

  if (error) return { ok: false, error: describe(error.message, parsed.data.name) }

  revalidatePath('/principals')
  revalidatePath('/')
  return { ok: true }
}

export async function updatePrincipalAction(formData: FormData): Promise<ActionResult> {
  const parsed = createPrincipalSchema.extend({ id: uuid }).safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    groupName: formData.get('groupName'),
    productManagerId: formData.get('productManagerId') ?? '',
    country: formData.get('country') ?? '',
    brandColor: formData.get('brandColor'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again.' }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase
    .from('principals')
    .update({
      name: parsed.data.name,
      group_name: parsed.data.groupName,
      product_manager_id: parsed.data.productManagerId,
      country: parsed.data.country,
      brand_color: parsed.data.brandColor,
    })
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: describe(error.message, parsed.data.name) }

  revalidatePath('/principals')
  revalidatePath('/')
  return { ok: true }
}

/**
 * Retire a brand.
 *
 * A soft delete, always. The brief requires that posts recorded against a brand
 * survive its removal, and `posts.principal_id` is ON DELETE RESTRICT, so a hard
 * delete would be refused by the database anyway. Setting is_active = false
 * removes it from every picker while leaving history intact.
 */
export async function retirePrincipalAction(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ id: uuid }).safeParse({ id: formData.get('id') })
  if (!parsed.success) return { ok: false, error: 'That brand could not be identified.' }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase
    .from('principals')
    .update({ is_active: false })
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: describe(error.message) }

  revalidatePath('/principals')
  revalidatePath('/')
  return { ok: true }
}

export async function restorePrincipalAction(formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ id: uuid }).safeParse({ id: formData.get('id') })
  if (!parsed.success) return { ok: false, error: 'That brand could not be identified.' }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: 'No database is connected.' }

  const { error } = await supabase
    .from('principals')
    .update({ is_active: true })
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: describe(error.message) }

  revalidatePath('/principals')
  revalidatePath('/')
  return { ok: true }
}

/* -------------------------------------------------------------------------- */

/**
 * Turn a Postgres error into something worth reading. Errors should say what
 * went wrong and what to do about it — "duplicate key value violates unique
 * constraint principals_name_key" does neither.
 *
 * Not exported, so the `'use server'` async-only rule does not apply to it.
 */
function describe(message: string, subject?: string): string {
  if (/duplicate key|already exists|unique constraint/i.test(message)) {
    return subject
      ? `A brand called "${subject}" already exists. Brand names have to be unique.`
      : 'That already exists.'
  }
  if (/row-level security/i.test(message)) {
    return 'Your account is not authorised to make changes. Ask an administrator for access.'
  }
  if (/violates foreign key/i.test(message)) {
    return 'That product manager no longer exists. Reload the page and pick again.'
  }
  if (/brand_color/i.test(message)) {
    return 'The brand colour must be a hex value like #BE0010.'
  }
  return message
}
