import 'server-only'

import type { Quarter } from '@/lib/fy'
import { toDateOnly } from '@/lib/fy'
import type { ManagerOption } from '@/lib/data/principals'
import { createClient } from '@/lib/supabase/server'
import type { PostStatus } from '@/lib/status'
import type { RollupRow } from '@/lib/types'

export type DashboardQuery = {
  fy: number
  quarter: Quarter | null
  group?: string
  managerId?: string
  status?: PostStatus
  /** A custom date range. Narrows which posts count; never widens past the fy/quarter. */
  from?: Date
  to?: Date
}

export type DashboardData = {
  rows: RollupRow[]
  groups: string[]
  managers: ManagerOption[]
  offline: boolean
}

/**
 * Every figure on the Dashboard, from the same `dashboard_rollup` RPC the
 * Principals directory already calls (see src/lib/data/principals.ts) — one
 * server-side aggregation, so a brand's progress never reads differently on
 * the two pages.
 */
export async function getDashboardData(query: DashboardQuery): Promise<DashboardData> {
  const supabase = await createClient()
  if (!supabase) return { rows: [], groups: [], managers: [], offline: true }

  const [rollupResult, principalsResult, managersResult] = await Promise.all([
    supabase.rpc('dashboard_rollup', {
      p_fy: query.fy,
      p_quarter: query.quarter,
      p_group: query.group ?? null,
      p_pm: query.managerId ?? null,
      p_status: query.status ?? null,
      p_from: query.from ? toDateOnly(query.from) : null,
      p_to: query.to ? toDateOnly(query.to) : null,
    }),
    supabase.from('principals').select('group_name'),
    supabase.from('product_managers').select('id, name').order('name'),
  ])

  if (rollupResult.error) throw new Error(rollupResult.error.message)
  if (principalsResult.error) throw new Error(principalsResult.error.message)
  if (managersResult.error) throw new Error(managersResult.error.message)

  const groups = [...new Set((principalsResult.data ?? []).map((p) => p.group_name))]

  return {
    rows: (rollupResult.data ?? []) as RollupRow[],
    groups,
    managers: managersResult.data ?? [],
    offline: false,
  }
}
