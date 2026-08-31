import { addDays, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { DayCell } from '@/components/calendar/day-cell'
import { toDateOnly } from '@/lib/fy'

/** @typedef {import('@/components/posts/post-form-dialog').PrincipalOption} PrincipalOption */
/** @typedef {import('@/lib/data/posts').PostRow} PostRow */

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * The date span the 6x7 grid actually covers for a month — including the
 * leading/trailing days from adjacent months that fill out complete weeks.
 * Exported so the page can fetch posts for exactly what's on screen, not just
 * the calendar month itself.
 *
 * @param {Date} month
 * @returns {{ start: Date, end: Date }}
 */
export function monthGridRange(month) {
  return {
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  }
}

/**
 * The full 6x7 grid for a month, including the leading/trailing days that fill out complete weeks.
 * @param {{ month: Date, posts: PostRow[], principals: PrincipalOption[] }} props
 */
export function MonthGrid({ month, posts, principals }) {
  const { start: gridStart, end: gridEnd } = monthGridRange(month)

  /** @type {Date[]} */
  const days = []
  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) days.push(day)

  /** @type {Map<string, PostRow[]>} */
  const byDate = new Map()
  for (const post of posts) {
    const list = byDate.get(post.postDate)
    if (list) list.push(post)
    else byDate.set(post.postDate, [post])
  }

  const today = toDateOnly(new Date())

  return (
    <div className="card overflow-hidden border-t-4 border-t-wine">
      <div className="grid grid-cols-7 border-b border-hairline bg-wine/12">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="label px-2 py-2 text-center">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const iso = toDateOnly(day)
          return (
            <DayCell
              key={iso}
              date={iso}
              dayNumber={Number(format(day, 'd'))}
              inCurrentMonth={isSameMonth(day, month)}
              isToday={iso === today}
              posts={byDate.get(iso) ?? []}
              principals={principals}
            />
          )
        })}
      </div>
    </div>
  )
}
