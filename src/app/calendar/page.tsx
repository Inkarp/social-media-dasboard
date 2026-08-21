import type { Metadata } from 'next'
import { CalendarNav } from '@/components/calendar/calendar-nav'
import { MonthGrid, monthGridRange } from '@/components/calendar/month-grid'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { getActivePrincipalOptions } from '@/lib/data/principals'
import { getPosts } from '@/lib/data/posts'
import { currentFy, fyOf } from '@/lib/fy'
import { firstParam, intParam } from '@/lib/search-params'

export const metadata: Metadata = { title: 'Calendar' }

function resolveMonth(raw: string | undefined, fy: number): Date {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [year, monthNum] = raw.split('-').map(Number)
    return new Date(year!, monthNum! - 1, 1)
  }
  const now = new Date()
  if (fyOf(now) === fy) return new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(fy, 3, 1) // 1 April of the selected financial year
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const fy = intParam(params, 'fy') ?? currentFy()
  const month = resolveMonth(firstParam(params, 'month'), fy)
  const range = monthGridRange(month)

  const [{ rows, offline }, principals] = await Promise.all([
    getPosts({ from: range.start, to: range.end }),
    getActivePrincipalOptions(),
  ])

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Posts on their scheduled dates, one month at a time."
        actions={<CalendarNav month={month} />}
      />

      {offline ? (
        <EmptyState title="No database is connected yet. Add your Supabase URL and key to .env.local, then restart the dev server." />
      ) : (
        <MonthGrid month={month} posts={rows} principals={principals} />
      )}
    </>
  )
}
