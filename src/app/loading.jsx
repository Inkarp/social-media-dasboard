/**
 * Skeleton matching the real layout — header, time controls, filters, summary
 * cards, then the five breakdown tables. Shown automatically during
 * navigation to `/` while the rollup query is in flight.
 */
export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="h-6 w-28 rounded-chip bg-hairline" />
          <div className="mt-2 h-4 w-80 max-w-full rounded-chip bg-hairline-soft" />
        </div>
        <div className="flex shrink-0 gap-3">
          <div className="h-9 w-24 rounded-control bg-hairline" />
          <div className="h-9 w-28 rounded-control bg-hairline" />
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-9 w-72 rounded-control bg-hairline-soft" />
          <div className="h-9 w-32 rounded-control bg-hairline-soft" />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="h-14 w-44 rounded-control bg-hairline-soft" />
          <div className="h-14 w-52 rounded-control bg-hairline-soft" />
          <div className="h-14 w-44 rounded-control bg-hairline-soft" />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, card) => (
          <div key={card} className="card flex flex-col gap-4 p-6">
            <div>
              <div className="h-7 w-12 rounded-chip bg-hairline" />
              <div className="mt-2 h-3 w-20 rounded-chip bg-hairline-soft" />
            </div>
            <div className="h-1.5 w-full rounded-chip bg-hairline-soft" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {['By Principal', 'By Group', 'By Product Manager', 'By Product', 'By Campaign'].map(
          (title, section) => (
            <div key={title} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                <div className="h-4 w-32 rounded-chip bg-hairline" />
                {section === 0 && <div className="h-7 w-32 rounded-control bg-hairline-soft" />}
              </div>
              <div>
                {Array.from({ length: section === 0 ? 5 : 3 }).map((_, row) => (
                  <div
                    key={row}
                    className="flex min-h-[52px] items-center gap-4 border-b border-hairline-soft px-6 last:border-0"
                  >
                    <div className="h-4 w-32 rounded-chip bg-hairline-soft" />
                    <div className="ml-auto h-4 w-8 rounded-chip bg-hairline-soft" />
                    <div className="h-4 w-8 rounded-chip bg-hairline-soft" />
                    <div className="h-4 w-8 rounded-chip bg-hairline-soft" />
                    <div className="h-1.5 w-24 rounded-chip bg-hairline-soft" />
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
