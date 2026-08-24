/**
 * Skeleton matching the real layout — header with the month nav, then the
 * 7x6 grid the month view always renders regardless of which month loads.
 */
export default function CalendarLoading() {
  return (
    <div aria-busy="true" aria-label="Loading calendar">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="h-6 w-28 rounded-chip bg-hairline" />
          <div className="mt-2 h-4 w-72 max-w-full rounded-chip bg-hairline-soft" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="size-9 rounded-control bg-hairline" />
          <div className="h-4 w-24 rounded-chip bg-hairline-soft" />
          <div className="size-9 rounded-control bg-hairline" />
          <div className="ml-2 h-9 w-16 rounded-control bg-hairline" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-hairline bg-zebra">
          {Array.from({ length: 7 }).map((_, day) => (
            <div key={day} className="flex justify-center px-2 py-2">
              <div className="h-3 w-8 rounded-chip bg-hairline" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }).map((_, cell) => (
            <div
              key={cell}
              className="flex min-h-24 flex-col gap-2 border-b border-r border-hairline-soft p-2"
            >
              <div className="size-6 rounded-full bg-hairline-soft" />
              {cell % 5 === 0 && <div className="h-3 w-4/5 rounded-chip bg-hairline-soft" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
