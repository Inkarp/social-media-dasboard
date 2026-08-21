import type { Metadata } from 'next'
import { EditorOnly } from '@/components/auth/editor-only'
import { BreakdownTable } from '@/components/dashboard/breakdown-table'
import { DashboardFilters } from '@/components/dashboard/dashboard-filters'
import { DateRangeReport } from '@/components/dashboard/date-range-report'
import { ExportButtons } from '@/components/dashboard/export-buttons'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { TimeSelector } from '@/components/dashboard/time-selector'
import { PostFormDialog } from '@/components/posts/post-form-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { getDashboardData } from '@/lib/data/dashboard'
import { getActivePrincipalOptions } from '@/lib/data/principals'
import { currentFy, fyLabel, isQuarter, parseDateOnly, quarterFullLabel } from '@/lib/fy'
import { firstParam, intParam } from '@/lib/search-params'
import { isPostStatus } from '@/lib/status'

export const metadata: Metadata = { title: 'Overview' }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  const fy = intParam(params, 'fy') ?? currentFy()
  const rawPeriod = intParam(params, 'period')
  const quarter = isQuarter(rawPeriod) ? rawPeriod : null

  const group = firstParam(params, 'group')
  const managerId = firstParam(params, 'pm')
  const rawStatus = firstParam(params, 'status')
  const status = isPostStatus(rawStatus) ? rawStatus : undefined

  const rawFrom = firstParam(params, 'from')
  const rawTo = firstParam(params, 'to')
  const from = rawFrom && rawTo ? parseDateOnly(rawFrom) : undefined
  const to = rawFrom && rawTo ? parseDateOnly(rawTo) : undefined

  const [{ rows, groups, managers, offline }, principals] = await Promise.all([
    getDashboardData({ fy, quarter, group, managerId, status, from, to }),
    getActivePrincipalOptions(),
  ])

  const principalRows = rows.filter((row) => row.dimension === 'principal')
  const groupRows = rows.filter((row) => row.dimension === 'group')
  const managerRows = rows.filter((row) => row.dimension === 'manager')
  const productRows = rows.filter((row) => row.dimension === 'product')
  const campaignRows = rows.filter((row) => row.dimension === 'campaign')

  const periodLabel = quarter ? `${fyLabel(fy)} · ${quarterFullLabel(quarter)}` : fyLabel(fy)
  const filename = `inkarp-dashboard-${fyLabel(fy)}${quarter ? `-Q${quarter}` : ''}`

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Planned against published activity across every principal, for ${periodLabel}.`}
        actions={
          <>
            <ExportButtons rows={rows} filename={filename} />
            <EditorOnly>
              <PostFormDialog principals={principals} />
            </EditorOnly>
          </>
        }
      />

      {offline ? (
        <EmptyState title="No database is connected yet. Add your Supabase URL and key to .env.local, then restart the dev server." />
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <TimeSelector quarter={quarter} />
              <DateRangeReport from={rawFrom ?? null} to={rawTo ?? null} preset={firstParam(params, 'preset') ?? null} />
            </div>
            <DashboardFilters groups={groups} managers={managers} />
          </div>

          <SummaryCards principalRows={principalRows} />

          <div className="flex flex-col gap-6">
            <BreakdownTable title="By Principal" rows={principalRows} showAccent />
            <BreakdownTable title="By Group" rows={groupRows} searchable={false} />
            <BreakdownTable title="By Product Manager" rows={managerRows} searchable={false} />
            <BreakdownTable title="By Product" rows={productRows} />
            <BreakdownTable title="By Campaign" rows={campaignRows} />
          </div>
        </>
      )}
    </>
  )
}
