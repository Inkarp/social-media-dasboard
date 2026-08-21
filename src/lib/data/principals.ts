import 'server-only'

import { targetForPeriod, type Quarter, type QuarterOverrides } from '@/lib/fy'
import { createClient } from '@/lib/supabase/server'
import type { RollupRow } from '@/lib/types'

/**
 * One brand as the Principals directory needs it: identity, plan and progress
 * in a single row.
 */
export type PrincipalRow = {
  id: string
  name: string
  groupName: string
  managerId: string | null
  managerName: string | null
  country: string | null
  brandColor: string | null
  isActive: boolean
  /** The yearly plan. 0 when no target has been set for this financial year. */
  yearlyTarget: number
  /** Explicit per-quarter overrides. null means "derive from the yearly figure". */
  overrides: QuarterOverrides
  /** Published posts in the selected period. */
  implemented: number
  /** Everything in the period that is not published. */
  pending: number
  /** The target that applies to the selected period. */
  planned: number
}

export type ManagerOption = { id: string; name: string }

export type PrincipalsData = {
  rows: PrincipalRow[]
  managers: ManagerOption[]
  groups: string[]
  /** True when no Supabase project is configured — the caller shows a setup hint. */
  offline: boolean
}

export type PrincipalsQuery = {
  fy: number
  quarter: Quarter | null
  search?: string
  group?: string
  managerId?: string
  includeInactive?: boolean
}

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
 */
export async function getPrincipals(query: PrincipalsQuery): Promise<PrincipalsData> {
  const supabase = await createClient()
  if (!supabase) return { rows: [], managers: [], groups: [], offline: true }

  const [principalsResult, managersResult, targetsResult, rollupResult] = await Promise.all([
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
    }),
  ])

  if (principalsResult.error) throw new Error(principalsResult.error.message)
  if (managersResult.error) throw new Error(managersResult.error.message)
  if (targetsResult.error) throw new Error(targetsResult.error.message)
  if (rollupResult.error) throw new Error(rollupResult.error.message)

  const managers = managersResult.data ?? []
  const managerNames = new Map(managers.map((m) => [m.id, m.name]))

  const targets = new Map(
    (targetsResult.data ?? []).map((t) => [
      t.principal_id,
      {
        yearly: t.yearly_target,
        overrides: {
          q1: t.q1_target,
          q2: t.q2_target,
          q3: t.q3_target,
          q4: t.q4_target,
        } satisfies QuarterOverrides,
      },
    ]),
  )

  const counts = new Map(
    ((rollupResult.data ?? []) as RollupRow[])
      .filter((row) => row.dimension === 'principal')
      .map((row) => [row.key, row]),
  )

  const all = principalsResult.data ?? []

  const rows: PrincipalRow[] = all.map((principal) => {
    const target = targets.get(principal.id)
    const yearlyTarget = target?.yearly ?? 0
    const overrides: QuarterOverrides = target?.overrides ?? {
      q1: null,
      q2: null,
      q3: null,
      q4: null,
    }
    const count = counts.get(principal.id)

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

  return { rows: filtered, managers, groups, offline: false }
}

export type PrincipalIndexEntry = {
  name: string
  groupName: string
  managerName: string | null
  brandColor: string | null
  isActive: boolean
}

/**
 * Every brand — active and retired — keyed by id. Posts, Calendar and Board all
 * need to label a post with its brand's name, group, manager and colour, and a
 * post against a retired brand must keep displaying correctly (the brief
 * requires posts to survive their brand's removal). `getActivePrincipalOptions`
 * below deliberately excludes retired brands because it feeds pickers where a
 * retired brand should not be selectable; this is the un-filtered counterpart
 * for display.
 */
export async function getPrincipalIndex(): Promise<Map<string, PrincipalIndexEntry>> {
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

/** Active brands only, for the pickers on the post form. */
export async function getActivePrincipalOptions(): Promise<
  { id: string; name: string; groupName: string; brandColor: string | null; managerName: string | null }[]
> {
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
