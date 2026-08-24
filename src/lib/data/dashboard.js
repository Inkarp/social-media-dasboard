import 'server-only'

import { toDateOnly } from '@/lib/fy'
import { createClient } from '@/lib/supabase/server'

/** @typedef {import('@/lib/fy').Quarter} Quarter */
/** @typedef {import('@/lib/data/principals').ManagerOption} ManagerOption */
/** @typedef {import('@/lib/status').PostStatus} PostStatus */
/** @typedef {import('@/lib/types').RollupRow} RollupRow */

/**
 * @typedef {Object} DashboardQuery
 * @property {number} fy
 * @property {Quarter | null} quarter
 * @property {string} [group]
 * @property {string} [managerId]
 * @property {PostStatus} [status]
 * @property {Date} [from] A custom date range. Narrows which posts count; never widens past the fy/quarter.
 * @property {Date} [to]
 */

/**
 * @typedef {Object} DashboardData
 * @property {RollupRow[]} rows
 * @property {string[]} groups
 * @property {ManagerOption[]} managers
 * @property {boolean} offline
 */

/**
 * Every figure on the Dashboard, from the same `dashboard_rollup` RPC the
 * Principals directory already calls (see src/lib/data/principals.js) — one
 * server-side aggregation, so a brand's progress never reads differently on
 * the two pages.
 *
 * @param {DashboardQuery} query
 * @returns {Promise<DashboardData>}
 */
export async function getDashboardData(query) {
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
    rows: /** @type {RollupRow[]} */ (rollupResult.data ?? []),
    groups,
    managers: managersResult.data ?? [],
    offline: false,
  }
}
