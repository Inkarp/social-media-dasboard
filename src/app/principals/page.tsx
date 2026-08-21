import type { Metadata } from 'next'
import { EditorOnly } from '@/components/auth/editor-only'
import { GroupSection } from '@/components/principals/group-section'
import { PrincipalFormDialog } from '@/components/principals/principal-form-dialog'
import { PrincipalsFilters } from '@/components/principals/principals-filters'
import { CalibratedBar } from '@/components/ui/calibrated-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { getPrincipals } from '@/lib/data/principals'
import { currentFy, fyLabel, isQuarter, quarterFullLabel } from '@/lib/fy'
import { compareGroups } from '@/lib/groups'
import { firstParam, intParam } from '@/lib/search-params'

export const metadata: Metadata = { title: 'Principals' }

export default async function PrincipalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  // Every view setting comes out of the URL, never React state — so a filtered
  // view is a shareable link and the back button behaves.
  //
  // Param names are shared across the whole app, so they are kept distinct:
  // `fy` the year, `period` the quarter, `q` the search text. Using `q` for both
  // search and quarter would make a search for "3" silently switch to Q3.
  const fy = intParam(params, 'fy') ?? currentFy()
  const rawPeriod = intParam(params, 'period')
  const quarter = isQuarter(rawPeriod) ? rawPeriod : null

  const { rows, managers, groups, offline } = await getPrincipals({
    fy,
    quarter,
    search: firstParam(params, 'q'),
    group: firstParam(params, 'group'),
    managerId: firstParam(params, 'pm'),
    includeInactive: firstParam(params, 'retired') === '1',
  })

  const totalPlanned = rows.reduce((sum, row) => sum + row.planned, 0)
  const totalImplemented = rows.reduce((sum, row) => sum + row.implemented, 0)

  const byGroup = new Map<string, typeof rows>()
  for (const row of rows) {
    const existing = byGroup.get(row.groupName)
    if (existing) existing.push(row)
    else byGroup.set(row.groupName, [row])
  }
  const orderedGroups = [...byGroup.keys()].sort(compareGroups)

  return (
    <>
      <PageHeader
        title="Principals"
        description={`The plan for ${fyLabel(fy)}${quarter ? ` · ${quarterFullLabel(quarter)}` : ''}. Set a yearly target per brand; expand a row to override a quarter.`}
        actions={
          <EditorOnly
            fallback={
              <span className="text-sm text-ink-grey">
                Sign in to edit — viewing needs no account.
              </span>
            }
          >
            <PrincipalFormDialog managers={managers} />
          </EditorOnly>
        }
      />

      {offline ? (
        <EmptyState title="No database is connected yet. Add your Supabase URL and key to .env.local, then restart the dev server." />
      ) : (
        <>
          <PrincipalsFilters managers={managers} groups={groups} />

          {rows.length === 0 ? (
            <EmptyState title="No brands match these filters. Clear them to see the full directory." />
          ) : (
            <>
              <div className="card mb-6 flex flex-wrap items-center gap-6 p-6">
                <div>
                  <p className="num text-xl font-medium text-ink-black">{rows.length}</p>
                  <p className="label mt-1">Brands</p>
                </div>
                <div>
                  <p className="num text-xl font-medium text-ink-black">{totalPlanned}</p>
                  <p className="label mt-1">Planned</p>
                </div>
                <div>
                  <p className="num text-xl font-medium text-ink-black">{totalImplemented}</p>
                  <p className="label mt-1">Published</p>
                </div>
                <div className="min-w-48 flex-1">
                  <CalibratedBar
                    implemented={totalImplemented}
                    planned={totalPlanned}
                    label={`Across the brands shown: ${totalImplemented} published of ${totalPlanned} planned`}
                  />
                  <p className="label mt-2">Against plan</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {orderedGroups.map((group) => (
                  <GroupSection
                    key={group}
                    group={group}
                    rows={byGroup.get(group) ?? []}
                    fy={fy}
                    managers={managers}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
