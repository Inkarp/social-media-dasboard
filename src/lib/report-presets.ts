/**
 * The Dashboard's date-range report presets (brief 5.1: this month, last
 * month, last two months, this quarter, year-to-date).
 *
 * Deliberately separate from src/lib/fy.ts, which owns financial-year and
 * quarter arithmetic exclusively — these are plain calendar-month presets,
 * a different concept, reusing `quarterRange`/`fyRange` only where a preset
 * genuinely means "the current FY quarter" or "since the FY started".
 */

import { endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { currentFy, currentQuarter, fyRange, quarterRange, type DateRange } from '@/lib/fy'

export type ReportPreset = {
  id: string
  label: string
  range: (now: Date) => DateRange
}

export const REPORT_PRESETS: readonly ReportPreset[] = [
  {
    id: 'this-month',
    label: 'This month',
    range: (now) => ({ start: startOfMonth(now), end: endOfMonth(now) }),
  },
  {
    id: 'last-month',
    label: 'Last month',
    range: (now) => {
      const month = subMonths(now, 1)
      return { start: startOfMonth(month), end: endOfMonth(month) }
    },
  },
  {
    id: 'last-two-months',
    label: 'Last two months',
    // The two most recently completed calendar months — not including the
    // current, still-in-progress one.
    range: (now) => ({ start: startOfMonth(subMonths(now, 2)), end: endOfMonth(subMonths(now, 1)) }),
  },
  {
    id: 'this-quarter',
    label: 'This quarter',
    range: (now) => quarterRange(currentFy(now), currentQuarter(now)),
  },
  {
    id: 'year-to-date',
    label: 'Year to date',
    range: (now) => ({ start: fyRange(currentFy(now)).start, end: now }),
  },
] as const

export function findReportPreset(id: string | undefined): ReportPreset | undefined {
  return REPORT_PRESETS.find((preset) => preset.id === id)
}
