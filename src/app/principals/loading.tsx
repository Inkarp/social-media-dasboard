/**
 * Skeleton matching the real layout — the filter bar, the summary card, then
 * group sections with rows. A spinner would tell you nothing about what is
 * arriving; this holds the shape so the page does not jump when it does.
 */
export default function PrincipalsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading principals">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-6 w-40 rounded-chip bg-hairline" />
          <div className="mt-2 h-4 w-96 max-w-full rounded-chip bg-hairline-soft" />
        </div>
        <div className="h-9 w-36 rounded-control bg-hairline" />
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="h-16 min-w-56 flex-1 rounded-control bg-hairline-soft" />
        <div className="h-16 w-44 rounded-control bg-hairline-soft" />
        <div className="h-16 w-52 rounded-control bg-hairline-soft" />
      </div>

      <div className="card mb-6 h-24 p-6" />

      <div className="flex flex-col gap-4">
        {[9, 4, 4].map((rows, section) => (
          <div key={section} className="card overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="size-4 rounded-chip bg-hairline" />
              <div className="h-4 w-24 rounded-chip bg-hairline" />
            </div>
            <div className="border-t border-hairline">
              {Array.from({ length: rows }).map((_, row) => (
                <div
                  key={row}
                  className="flex min-h-[52px] items-center gap-4 border-b border-hairline-soft px-4 last:border-0"
                >
                  <div className="h-4 w-40 rounded-chip bg-hairline-soft" />
                  <div className="h-4 w-28 rounded-chip bg-hairline-soft" />
                  <div className="ml-auto h-1.5 w-40 rounded-chip bg-hairline-soft" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
