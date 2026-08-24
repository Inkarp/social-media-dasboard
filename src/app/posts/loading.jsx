/**
 * Skeleton matching the real layout — header, the filter row, then a table
 * with the same seven columns the real one renders.
 */
export default function PostsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading posts">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="h-6 w-20 rounded-chip bg-hairline" />
          <div className="mt-2 h-4 w-72 max-w-full rounded-chip bg-hairline-soft" />
        </div>
        <div className="flex shrink-0 gap-3">
          <div className="h-9 w-24 rounded-control bg-hairline" />
          <div className="h-9 w-28 rounded-control bg-hairline" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="h-16 min-w-56 flex-1 rounded-control bg-hairline-soft" />
        <div className="h-16 w-44 rounded-control bg-hairline-soft" />
        <div className="h-16 w-44 rounded-control bg-hairline-soft" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-hairline bg-zebra px-4 py-3">
          <div className="size-4 rounded-chip bg-hairline" />
          {[28, 16, 20, 20, 20, 16, 16].map((w, i) => (
            <div key={i} className="h-3 rounded-chip bg-hairline" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b border-hairline-soft px-4 py-3 last:border-0"
          >
            <div className="size-4 rounded-chip bg-hairline-soft" />
            <div className="h-4 w-28 rounded-chip bg-hairline-soft" />
            <div className="h-4 w-16 rounded-chip bg-hairline-soft" />
            <div className="h-4 w-20 rounded-chip bg-hairline-soft" />
            <div className="h-4 w-20 rounded-chip bg-hairline-soft" />
            <div className="h-4 w-20 rounded-chip bg-hairline-soft" />
            <div className="h-4 w-16 rounded-chip bg-hairline-soft" />
            <div className="ml-auto h-5 w-20 rounded-chip bg-hairline-soft" />
          </div>
        ))}
      </div>
    </div>
  )
}
