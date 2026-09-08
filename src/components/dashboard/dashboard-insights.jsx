import { Atom, FlaskConical, Microscope, ScanLine, TestTubes } from 'lucide-react'
import { dashboardInsights } from '@/lib/dashboard-insights'

/** @param {{ rows: import('@/lib/types').RollupRow[] }} props */
export function DashboardInsights({ rows }) {
  const data = dashboardInsights(rows)
  const maxGroup = Math.max(1, ...data.groups.map((row) => row.implemented + row.pending))
  const metrics = [
    { label: 'Publication rate', value: data.publicationRate === null ? '—' : `${data.publicationRate}%`, detail: `${data.published} published of ${data.total} recorded posts`, icon: FlaskConical },
    { label: 'Principal coverage', value: data.coverage === null ? '—' : `${data.coverage}%`, detail: `${data.covered} of ${data.principalCount} principals have published posts`, icon: Atom },
    { label: 'Remaining target gap', value: data.targetGap, detail: 'Posts still needed across individual principal targets', icon: ScanLine },
    { label: 'Without a target', value: data.withoutTarget, detail: 'Principals with a zero target for this period', icon: Microscope },
  ]

  return (
    <section aria-labelledby="insights-heading" className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="label mb-1 text-slate">THE BIGGER PICTURE</p>
          <h2 id="insights-heading" className="text-lg">Publishing insights</h2>
        </div>
        <p className="text-xs text-muted">Based on your selected period and filters</p>
      </div>

      <div className="insight-metrics mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="insight-metric card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{label}</span>
              <span className="insight-icon"><Icon className="size-5" aria-hidden="true" strokeWidth={1.5} /></span>
            </div>
            <p className="num text-2xl font-semibold">{value}</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">{detail}</p>
          </article>
        ))}
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-3">
        <article className="card min-w-0 p-6">
          <h3 className="text-md">Publishing balance</h3>
          <p className="mt-1 text-xs text-muted">Published versus pending posts</p>
          <div className="my-6 flex justify-center">
            <div
              className="insight-donut"
              role="img"
              aria-label={`${data.published} published and ${data.pending} pending posts`}
              style={{ background: data.total ? `conic-gradient(#7350a5 0% ${data.published / data.total * 100}%, #eadff5 ${data.published / data.total * 100}% 100%)` : '#eee7f5' }}
            >
              <div><strong className="num text-2xl">{data.total}</strong><span className="text-xs text-muted">Recorded posts</span></div>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><dt className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-slate" />Published</dt><dd className="num font-semibold">{data.published}</dd></div>
            <div className="flex items-center justify-between"><dt className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-slate/20" />Pending</dt><dd className="num font-semibold">{data.pending}</dd></div>
          </dl>
          <p className="mt-5 border-t border-hairline pt-4 text-xs leading-relaxed text-muted">{data.total ? 'Pending includes planned posts, work in progress, and posts in review.' : 'No posts match these filters. Try another period or filter.'}</p>
        </article>

        <article className="card min-w-0 p-6">
          <h3 className="text-md">Activity by group</h3>
          <p className="mt-1 text-xs text-muted">Recorded post volume · largest first</p>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted"><span>● Published</span><span className="text-slate">○ Pending</span></div>
          <div className="mt-5 max-h-72 space-y-5 overflow-y-auto pr-1">
            {data.groups.map((row) => (
              <div key={row.key}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="truncate" title={row.label}>{row.label}</span><span className="num shrink-0">{row.implemented + row.pending}</span></div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate/5" role="img" aria-label={`${row.label}: ${row.implemented} published, ${row.pending} pending`}>
                  <span className="h-full bg-slate" style={{ width: `${row.implemented / maxGroup * 100}%` }} />
                  <span className="h-full bg-slate/20" style={{ width: `${row.pending / maxGroup * 100}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted">{row.implemented} published · {row.pending} pending</p>
              </div>
            ))}
            {!data.groups.length && <p className="py-8 text-sm text-muted">No groups match these filters.</p>}
          </div>
        </article>

        <article className="insight-priorities card min-w-0 p-6">
          <div className="flex items-center justify-between gap-3"><h3 className="text-md">Focus list</h3><TestTubes aria-hidden="true" className="size-5 text-slate" /></div>
          <p className="mt-1 text-xs text-muted">Top 5 by target gap, then pending work</p>
          <ol className="mt-4 divide-y divide-hairline">
            {data.priorities.map((row, index) => (
              <li key={row.key} className="flex items-center gap-3 py-4">
                <span className="insight-rank num">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={row.label}>{row.label}</p><p className="mt-1 text-xs text-muted">{row.pending} pending · {row.implemented} published</p></div>
                <span className="shrink-0 text-right"><strong className="num text-md">{row.gap}</strong><span className="block text-xs text-muted">gap</span></span>
              </li>
            ))}
          </ol>
          {!data.priorities.length && <p className="py-10 text-sm leading-relaxed text-muted">{data.principalCount ? 'No target gaps or pending posts in this selection.' : 'No principals match these filters.'}</p>}
          <p className="mt-3 text-xs leading-relaxed text-muted">Target gaps are calculated per principal, so exceeding one target does not hide another principal’s shortfall.</p>
        </article>
      </div>
    </section>
  )
}
