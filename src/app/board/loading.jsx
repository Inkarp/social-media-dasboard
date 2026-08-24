/**
 * Skeleton matching the real layout — header, then the four status columns
 * the board always renders (planned / in progress / in review / published).
 */
export default function BoardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading board">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="h-6 w-20 rounded-chip bg-hairline" />
          <div className="mt-2 h-4 w-72 max-w-full rounded-chip bg-hairline-soft" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[3, 2, 2, 4].map((cards, column) => (
          <div key={column} className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="h-4 w-24 rounded-chip bg-hairline" />
              <div className="h-3 w-4 rounded-chip bg-hairline-soft" />
            </div>
            <div className="flex min-h-32 flex-1 flex-col gap-2 rounded-card border border-dashed border-hairline p-2">
              {Array.from({ length: cards }).map((_, card) => (
                <div key={card} className="card flex flex-col gap-2 p-3">
                  <div className="h-4 w-4/5 rounded-chip bg-hairline-soft" />
                  <div className="h-3 w-2/3 rounded-chip bg-hairline-soft" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-10 rounded-chip bg-hairline-soft" />
                    <div className="h-3 w-14 rounded-chip bg-hairline-soft" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
