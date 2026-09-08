import { Atom, FlaskConical, Microscope } from 'lucide-react'

/** @param {{ rows: import('@/lib/data/principals').PrincipalRow[] }} props */
export function PrincipalCharts({ rows }) {
  const reached = rows.filter((row) => row.planned > 0 && row.implemented >= row.planned).length
  const below = rows.filter((row) => row.planned > 0 && row.implemented < row.planned).length
  const noTarget = rows.filter((row) => row.planned === 0).length
  const total = rows.length
  const firstStop = total ? reached / total * 100 : 0
  const secondStop = total ? (reached + below) / total * 100 : 0
  const activity = [...rows].sort((a, b) => b.implemented - a.implemented || b.pending - a.pending || a.name.localeCompare(b.name)).slice(0, 5)
  const maxActivity = Math.max(1, ...activity.map((row) => row.implemented + row.pending))
  const targets = [...rows].filter((row) => row.planned > 0)
    .sort((a, b) => Math.max(0, b.planned - b.implemented) - Math.max(0, a.planned - a.implemented) || a.name.localeCompare(b.name)).slice(0, 5)
  const maxTarget = Math.max(1, ...targets.map((row) => Math.max(row.planned, row.implemented)))

  return (
    <section aria-labelledby="principal-charts-heading" className="mb-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id="principal-charts-heading" className="text-lg">Principal performance</h2>
        <p className="text-xs text-muted">Selected period · filtered brands only</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <article className="card min-w-0 p-6">
          <div className="flex items-center justify-between"><h3 className="text-md">Target distribution</h3><Atom className="size-5 text-slate" aria-hidden="true" /></div>
          <p className="mt-1 text-xs text-muted">How brands stand against their period targets</p>
          <div className="my-6 flex justify-center">
            <div className="insight-donut" role="img" aria-label={`${reached} target reached, ${below} below target, ${noTarget} without a target`}
              style={{ background: `conic-gradient(var(--donut-a) 0% ${firstStop}%, var(--donut-b) ${firstStop}% ${secondStop}%, var(--donut-none) ${secondStop}% 100%)` }}>
              <div><strong className="num text-2xl">{total}</strong><span className="text-xs text-muted">Brands shown</span></div>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Target reached', value: reached, color: 'var(--donut-a)' },
              { label: 'Below target', value: below, color: 'var(--donut-b)' },
              { label: 'Without a target', value: noTarget, color: 'var(--donut-none)' },
            ].map((item) => <div key={item.label} className="flex justify-between gap-3"><dt className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</dt><dd className="num font-semibold">{item.value}</dd></div>)}
          </dl>
          <p className="mt-5 border-t border-hairline pt-4 text-xs leading-relaxed text-muted">Zero targets are shown separately. Below target describes the selected period’s total, not whether a brand is late.</p>
        </article>

        <article className="card min-w-0 p-6">
          <div className="flex items-center justify-between"><h3 className="text-md">Publishing leaders</h3><FlaskConical className="size-5 text-slate" aria-hidden="true" /></div>
          <p className="mt-1 text-xs text-muted">Top 5 by published posts, then pending activity</p>
          <div className="mt-6 space-y-5">
            {activity.map((row) => (
              <div key={row.id}>
                <div className="mb-2 flex justify-between gap-3 text-sm"><span className="truncate font-medium" title={row.name}>{row.name}</span><span className="num shrink-0">{row.implemented} published</span></div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate/5" role="img" aria-label={`${row.name}: ${row.implemented} published, ${row.pending} pending`}>
                  <span className="bg-slate" style={{ width: `${row.implemented / maxActivity * 100}%` }} />
                  <span className="bg-slate/20" style={{ width: `${row.pending / maxActivity * 100}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted">{row.pending} pending · {row.implemented + row.pending} recorded posts</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 border-t border-hairline pt-4 text-xs text-muted"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate" />Published</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate/20" />Pending</span></div>
        </article>

        <article className="card min-w-0 p-6">
          <div className="flex items-center justify-between"><h3 className="text-md">Target vs. published</h3><Microscope className="size-5 text-slate" aria-hidden="true" /></div>
          <p className="mt-1 text-xs text-muted">Top 5 target gaps · largest shortfalls first</p>
          <div className="mt-6 space-y-5">
            {targets.map((row) => (
              <div key={row.id}>
                <div className="mb-2 flex justify-between gap-3 text-sm"><span className="truncate font-medium" title={row.name}>{row.name}</span><span className="num shrink-0">{Math.max(0, row.planned - row.implemented)} gap</span></div>
                <div className="space-y-1.5" role="img" aria-label={`${row.name}: target ${row.planned}, published ${row.implemented}`}>
                  <div className="h-2 overflow-hidden rounded-full bg-slate/5"><div className="h-full rounded-full bg-slate/20" style={{ width: `${row.planned / maxTarget * 100}%` }} /></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate/5"><div className="h-full rounded-full bg-slate" style={{ width: `${row.implemented / maxTarget * 100}%` }} /></div>
                </div>
                <p className="mt-1.5 text-xs text-muted">{row.planned} target · {row.implemented} published</p>
              </div>
            ))}
            {!targets.length && <div className="rounded-card bg-slate/5 px-5 py-10 text-center"><Microscope className="mx-auto mb-3 size-8 text-slate" aria-hidden="true" /><p className="text-sm font-medium">No targets to compare yet</p><p className="mt-2 text-xs leading-relaxed text-muted">Set targets for these brands to see their publishing progress here.</p></div>}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 border-t border-hairline pt-4 text-xs text-muted"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate/20" />Target</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate" />Published</span></div>
        </article>
      </div>
    </section>
  )
}
