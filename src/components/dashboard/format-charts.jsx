import { FormatBadge } from '@/components/ui/format-badge'
import { FORMAT_KEYS, FORMAT_LABELS, FORMAT_COLORS } from '@/lib/post-formats'

/** @param {{ rows: import('@/lib/post-formats').FormatRollup[], principals?: { id: string, name: string }[] }} props */
export function FormatCharts({ rows, principals }) {
  const summaries = FORMAT_KEYS.map((format) => {
    const matching = rows.filter((row) => row.format === format)
    return { format, published: matching.reduce((n, row) => n + row.implemented, 0), pending: matching.reduce((n, row) => n + row.pending, 0) }
  })
  const brands = principals ?? [...new Map(rows.map((row) => [row.principal_id, { id: row.principal_id, name: row.principal_name }])).values()]
  const max = Math.max(1, ...brands.map((brand) => rows.filter((row) => row.principal_id === brand.id).reduce((n, row) => n + row.implemented + row.pending, 0)))
  return (
    <section className="mb-8" aria-label="Post format insights">
      <h2 className="mb-1 text-lg">Content by format</h2>
      <p className="mb-4 text-xs text-muted">Selected period and filters · targets remain overall brand targets, not format targets.</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaries.map(({ format, published, pending }) => <article className="card p-5" key={format} style={{ borderTop: `3px solid ${FORMAT_COLORS[format]}` }}>
          <FormatBadge format={format === 'unclassified' ? null : format} />
          <p className="num my-3 text-2xl font-semibold">{published + pending}</p>
          <p className="text-xs text-muted">{published} published · {pending} pending</p>
        </article>)}
      </div>
      <div className="card p-6">
        <h3 className="text-md">Format mix by principal</h3>
        <p className="mb-5 mt-1 text-xs text-muted">Each bar shows recorded posts. Counts below separate published (P) and pending (W).</p>
        <div className="mb-5 flex flex-wrap gap-3">{FORMAT_KEYS.map((format) => <span key={format} className="flex items-center gap-1.5 text-xs"><span className="size-2 rounded-full" style={{ background: FORMAT_COLORS[format] }} />{FORMAT_LABELS[format]}</span>)}</div>
        <div className="max-h-96 space-y-5 overflow-y-auto pr-2">
          {brands.map((brand) => {
            const segments = FORMAT_KEYS.map((format) => {
              const counts = rows.filter((row) => row.principal_id === brand.id && row.format === format)
              return { format, published: counts.reduce((n, row) => n + row.implemented, 0), pending: counts.reduce((n, row) => n + row.pending, 0) }
            })
            return <div key={brand.id}>
              <p className="mb-2 text-sm font-medium">{brand.name}</p>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate/5" role="img" aria-label={`${brand.name}: ${segments.map((s) => `${FORMAT_LABELS[s.format]} ${s.published} published ${s.pending} pending`).join(', ')}`}>
                {segments.map((s) => <span key={s.format} style={{ width: `${(s.published + s.pending) / max * 100}%`, background: FORMAT_COLORS[s.format] }} />)}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{segments.map((s) => <span className="text-xs text-muted" key={s.format}>{FORMAT_LABELS[s.format]}: {s.published} P / {s.pending} W</span>)}</div>
            </div>
          })}
          {!brands.length && <p className="py-5 text-sm text-muted">No posts match this selection.</p>}
        </div>
      </div>
    </section>
  )
}
