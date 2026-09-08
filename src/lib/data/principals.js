import 'server-only'
import { hasPostFormats } from '@/lib/data/format-support'

import { targetForPeriod } from '@/lib/fy'
import { createClient } from '@/lib/supabase/server'

/** @typedef {import('@/lib/fy').Quarter} Quarter */
/** @typedef {import('@/lib/fy').QuarterOverrides} QuarterOverrides */
/** @typedef {import('@/lib/types').RollupRow} RollupRow */

/**
 * One brand as the Principals directory needs it: identity, plan and progress
 * in a single row.
 *
 * @typedef {Object} PrincipalRow
 * @property {string} id
 * @property {string} name
 * @property {string} groupName
 * @property {string | null} managerId
 * @property {string | null} managerName
 * @property {string | null} country
 * @property {string | null} brandColor
 * @property {boolean} isActive
 * @property {number} yearlyTarget The yearly plan. 0 when no target has been set for this financial year.
 * @property {QuarterOverrides} overrides Explicit per-quarter overrides. null means "derive from the yearly figure".
 * @property {number} implemented Published posts in the selected period.
 * @property {number} pending Everything in the period that is not published.
 * @property {number} planned The target that applies to the selected period.
 */

/** @typedef {{ id: string, name: string }} ManagerOption */

/**
 * @typedef {Object} PrincipalsData
 * @property {import('@/lib/post-formats').FormatRollup[]} formats
 * @property {PrincipalRow[]} rows
 * @property {ManagerOption[]} managers
 * @property {string[]} groups
 * @property {boolean} offline True when no Supabase project is configured — the caller shows a setup hint.
 */

/**
 * @typedef {Object} PrincipalsQuery
 * @property {number} fy
 * @property {Quarter | null} quarter
 * @property {string} [search]
 * @property {string} [group]
 * @property {string} [managerId]
 * @property {import('@/lib/post-formats').FormatKey} [format]
 * @property {boolean} [includeInactive]
 */

/**
 * Fetch the directory.
 *
 * Three queries rather than one nested select: PostgREST's embedded-resource
 * syntax would fold managers into the principals query, but the join then has to
 * be expressed in the generated types too, and 14 managers is far too little
 * data to justify that coupling. Joining in memory here is simpler and the cost
 * is nil.
 *
 * Counts come from `dashboard_rollup` — the same function the dashboard uses —
 * so a brand's progress can never read differently on two pages.
 *
 * @param {PrincipalsQuery} query
 * @returns {Promise<PrincipalsData>}
 */
export async function getPrincipals(query) {
  const supabase = await createClient()
  if (!supabase) return { formats: [], rows: [], managers: [], groups: [], offline: true }

  const formatsReady = await hasPostFormats()
  const [principalsResult, managersResult, targetsResult, rollupResult, formatsResult] = await Promise.all([
    supabase
      .from('principals')
      .select('id, name, group_name, country, brand_color, is_active, product_manager_id')
      .order('group_name')
      .order('name'),
    supabase.from('product_managers').select('id, name').order('name'),
    supabase
      .from('targets')
      .select('principal_id, yearly_target, q1_target, q2_target, q3_target, q4_target')
      .eq('fy', query.fy),
    supabase.rpc('dashboard_rollup', {
      p_fy: query.fy,
      p_quarter: query.quarter,
      ...(formatsReady ? { p_format: query.format ?? null } : {}),
    }),
    formatsReady ? supabase.rpc('post_format_rollup', { p_fy: query.fy, p_quarter: query.quarter, p_format: query.format ?? null }) : Promise.resolve({ data: [], error: null }),
  ])

  if (principalsResult.error) throw new Error(principalsResult.error.message)
  if (managersResult.error) throw new Error(managersResult.error.message)
  if (targetsResult.error) throw new Error(targetsResult.error.message)
  if (formatsResult.error) throw new Error(formatsResult.error.message)
  if (rollupResult.error) throw new Error(rollupResult.error.message)

  const managers = managersResult.data ?? []
  const managerNames = new Map(managers.map((m) => [m.id, m.name]))

  const targets = new Map(
    (targetsResult.data ?? []).map((t) => [
      t.principal_id,
      {
        yearly: t.yearly_target,
        /** @type {QuarterOverrides} */
        overrides: {
          q1: t.q1_target,
          q2: t.q2_target,
          q3: t.q3_target,
          q4: t.q4_target,
        },
      },
    ]),
  )

  const counts = new Map(
    /** @type {RollupRow[]} */ (rollupResult.data ?? [])
      .filter((row) => row.dimension === 'principal')
      .map((row) => [row.key, row]),
  )

  const all = principalsResult.data ?? []

  /** @type {PrincipalRow[]} */
  const rows = all.map((principal) => {
    const target = targets.get(principal.id)
    const yearlyTarget = target?.yearly ?? 0
    /** @type {QuarterOverrides} */
    const overrides = target?.overrides ?? {
      q1: null,
      q2: null,
      q3: null,
      q4: null,
    }
    const count = !formatsReady && query.format && query.format !== 'unclassified' ? undefined : counts.get(principal.id)

    return {
      id: principal.id,
      name: principal.name,
      groupName: principal.group_name,
      managerId: principal.product_manager_id,
      managerName: principal.product_manager_id
        ? (managerNames.get(principal.product_manager_id) ?? null)
        : null,
      country: principal.country,
      brandColor: principal.brand_color,
      isActive: principal.is_active,
      yearlyTarget,
      overrides,
      implemented: count?.implemented ?? 0,
      pending: count?.pending ?? 0,
      planned: targetForPeriod(yearlyTarget, query.quarter, overrides),
    }
  })

  // Every group that exists in the data, for the filter — derived from the rows
  // rather than the canonical list so a group nobody uses is not offered.
  const groups = [...new Set(all.map((p) => p.group_name))]

  const search = query.search?.trim().toLowerCase() ?? ''

  const filtered = rows.filter((row) => {
    if (!query.includeInactive && !row.isActive) return false
    if (query.group && row.groupName !== query.group) return false
    if (query.managerId && row.managerId !== query.managerId) return false
    if (search) {
      const haystack = [row.name, row.groupName, row.managerName, row.country]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })

  return { formats: formatsReady ? (formatsResult.data ?? []).filter((row) => filtered.some((principal) => principal.id === row.principal_id)) : filtered.map((row) => ({ principal_id: row.id, principal_name: row.name, format: 'unclassified', implemented: row.implemented, pending: row.pending })), rows: filtered, managers, groups, offline: false }
}

/**
 * @typedef {Object} PrincipalIndexEntry
 * @property {string} name
 * @property {string} groupName
 * @property {string | null} managerName
 * @property {string | null} brandColor
 * @property {boolean} isActive
 */

/**
 * Every brand — active and retired — keyed by id. Posts, Calendar and Board all
 * need to label a post with its brand's name, group, manager and colour, and a
 * post against a retired brand must keep displaying correctly (the brief
 * requires posts to survive their brand's removal). `getActivePrincipalOptions`
 * below deliberately excludes retired brands because it feeds pickers where a
 * retired brand should not be selectable; this is the un-filtered counterpart
 * for display.
 *
 * @returns {Promise<Map<string, PrincipalIndexEntry>>}
 */
export async function getPrincipalIndex() {
  const supabase = await createClient()
  if (!supabase) return new Map()

  const [principals, managers] = await Promise.all([
    supabase
      .from('principals')
      .select('id, name, group_name, brand_color, is_active, product_manager_id'),
    supabase.from('product_managers').select('id, name'),
  ])

  if (principals.error) throw new Error(principals.error.message)
  if (managers.error) throw new Error(managers.error.message)

  const managerNames = new Map((managers.data ?? []).map((m) => [m.id, m.name]))

  return new Map(
    (principals.data ?? []).map((p) => [
      p.id,
      {
        name: p.name,
        groupName: p.group_name,
        managerName: p.product_manager_id ? (managerNames.get(p.product_manager_id) ?? null) : null,
        brandColor: p.brand_color,
        isActive: p.is_active,
      },
    ]),
  )
}

/**
 * Active brands only, for the pickers on the post form.
 * @returns {Promise<{ id: string, name: string, groupName: string, brandColor: string | null, managerName: string | null }[]>}
 */
export async function getActivePrincipalOptions() {
  const supabase = await createClient()
  if (!supabase) return []

  const [principals, managers] = await Promise.all([
    supabase
      .from('principals')
      .select('id, name, group_name, brand_color, product_manager_id')
      .eq('is_active', true)
      .order('name'),
    supabase.from('product_managers').select('id, name'),
  ])

  if (principals.error) throw new Error(principals.error.message)
  if (managers.error) throw new Error(managers.error.message)

  const names = new Map((managers.data ?? []).map((m) => [m.id, m.name]))

  return (principals.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    groupName: p.group_name,
    brandColor: p.brand_color,
    managerName: p.product_manager_id ? (names.get(p.product_manager_id) ?? null) : null,
  }))
}
