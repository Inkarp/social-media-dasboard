/**
 * Financial-year arithmetic. Inkarp runs April–March.
 *
 * This is the ONLY place in the codebase allowed to do month arithmetic for
 * financial years or quarters. Components, server actions and route handlers
 * import from here. The Postgres generated columns on `posts.fy` and
 * `posts.quarter` mirror these exact rules — if you change one, change both.
 *
 *   fy      = month >= 4 ? year : year - 1        (April starts the year)
 *   quarter = Q1 Apr–Jun · Q2 Jul–Sep · Q3 Oct–Dec · Q4 Jan–Mar
 *
 * So 2025-04-01 through 2026-03-31 are all fy 2025, labelled "2025-26".
 */

import {
  addMonths,
  eachMonthOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns'

/** The month April, 1-indexed. The financial year pivots here. */
export const FY_START_MONTH = 4

/** @type {readonly [1, 2, 3, 4]} */
export const QUARTERS = [1, 2, 3, 4]

/** @typedef {(typeof QUARTERS)[number]} Quarter */

/**
 * @param {unknown} value
 * @returns {value is Quarter}
 */
export function isQuarter(value) {
  return value === 1 || value === 2 || value === 3 || value === 4
}

/* -------------------------------------------------------------------------- */
/* Date-only handling                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Parse a Postgres `date` string ("2025-04-01") into a local-midnight Date.
 *
 * `new Date('2025-04-01')` parses as UTC midnight, which lands on 31 March in
 * any timezone west of Greenwich — and 31 March vs 1 April is exactly the
 * boundary that decides the financial year. `parseISO` on a date-only string
 * treats it as local time, which is what we want.
 *
 * @param {string} value
 * @returns {Date}
 */
export function parseDateOnly(value) {
  return startOfDay(parseISO(value))
}

/**
 * Format a Date as a Postgres `date` string, free of timezone drift.
 * @param {Date} date
 * @returns {string}
 */
export function toDateOnly(date) {
  return format(date, 'yyyy-MM-dd')
}

/* -------------------------------------------------------------------------- */
/* Core derivation                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The financial year a date falls in, named by its starting calendar year.
 * @param {Date} date
 * @returns {number}
 */
export function fyOf(date) {
  const month = date.getMonth() + 1
  return month >= FY_START_MONTH ? date.getFullYear() : date.getFullYear() - 1
}

/**
 * The financial quarter a date falls in. Q1 begins in April.
 * @param {Date} date
 * @returns {Quarter}
 */
export function quarterOf(date) {
  const month = date.getMonth() + 1
  const offset = (month - FY_START_MONTH + 12) % 12
  return /** @type {Quarter} */ (Math.floor(offset / 3) + 1)
}

/**
 * The financial year containing today.
 * @param {Date} [now]
 * @returns {number}
 */
export function currentFy(now = new Date()) {
  return fyOf(now)
}

/**
 * The financial quarter containing today.
 * @param {Date} [now]
 * @returns {Quarter}
 */
export function currentQuarter(now = new Date()) {
  return quarterOf(now)
}

/* -------------------------------------------------------------------------- */
/* Labels                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 2025 -> "2025-26".
 * @param {number} fy
 * @returns {string}
 */
export function fyLabel(fy) {
  return `${fy}-${String((fy + 1) % 100).padStart(2, '0')}`
}

/**
 * 1 -> "Q1".
 * @param {Quarter} quarter
 * @returns {string}
 */
export function quarterLabel(quarter) {
  return `Q${quarter}`
}

/**
 * 1 -> "Apr–Jun". An en dash, not a hyphen.
 * @param {Quarter} quarter
 * @returns {string}
 */
export function quarterMonths(quarter) {
  /** @type {Record<Quarter, string>} */
  const spans = {
    1: 'Apr–Jun',
    2: 'Jul–Sep',
    3: 'Oct–Dec',
    4: 'Jan–Mar',
  }
  return spans[quarter]
}

/**
 * 1 -> "Q1 · Apr–Jun".
 * @param {Quarter} quarter
 * @returns {string}
 */
export function quarterFullLabel(quarter) {
  return `${quarterLabel(quarter)} · ${quarterMonths(quarter)}`
}

/* -------------------------------------------------------------------------- */
/* Ranges                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * An inclusive span.
 *
 * `start` is midnight on the first day. `end` is 23:59:59.999 on the last day,
 * not midnight — so `date <= range.end` includes everything that happened on the
 * final day, however a caller got hold of the date. Comparing a Date for exact
 * equality with `end` will therefore never match; compare with `<=`, or use
 * `toDateOnly(end)` when you want the calendar date.
 *
 * @typedef {Object} DateRange
 * @property {Date} start
 * @property {Date} end
 */

/**
 * 1 April of `fy` to 31 March of `fy + 1`, inclusive.
 * @param {number} fy
 * @returns {DateRange}
 */
export function fyRange(fy) {
  return {
    start: new Date(fy, FY_START_MONTH - 1, 1),
    end: endOfMonth(new Date(fy + 1, FY_START_MONTH - 2, 1)),
  }
}

/**
 * The inclusive three-month span of one quarter within a financial year.
 * @param {number} fy
 * @param {Quarter} quarter
 * @returns {DateRange}
 */
export function quarterRange(fy, quarter) {
  const start = addMonths(new Date(fy, FY_START_MONTH - 1, 1), (quarter - 1) * 3)
  return { start, end: endOfMonth(addMonths(start, 2)) }
}

/**
 * The span to query for a financial year, optionally narrowed to one quarter.
 * Pass `null` for the whole year.
 * @param {number} fy
 * @param {Quarter | null} quarter
 * @returns {DateRange}
 */
export function periodRange(fy, quarter) {
  return quarter === null ? fyRange(fy) : quarterRange(fy, quarter)
}

/**
 * Every month in a financial year, in order, April first.
 * @param {number} fy
 * @returns {Date[]}
 */
export function fyMonths(fy) {
  return eachMonthOfInterval(fyRange(fy))
}

/**
 * @param {Date} date
 * @param {number} fy
 * @returns {boolean}
 */
export function isInFy(date, fy) {
  const { start, end } = fyRange(fy)
  return !isBefore(date, start) && !isAfter(date, end)
}

/**
 * @param {Date} date
 * @param {DateRange} range
 * @returns {boolean}
 */
export function isInRange(date, range) {
  return !isBefore(date, range.start) && !isAfter(date, range.end)
}

/**
 * Financial years to offer in the switcher: a few behind the current one and
 * one ahead, so next year's plan can be entered before April arrives.
 * @param {Date} [now]
 * @param {number} [back]
 * @param {number} [forward]
 * @returns {number[]}
 */
export function fyOptions(now = new Date(), back = 3, forward = 1) {
  const current = currentFy(now)
  /** @type {number[]} */
  const years = []
  for (let fy = current + forward; fy >= current - back; fy--) years.push(fy)
  return years
}

/* -------------------------------------------------------------------------- */
/* Targets                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} QuarterTargets
 * @property {number} q1
 * @property {number} q2
 * @property {number} q3
 * @property {number} q4
 */
/**
 * @typedef {Object} QuarterOverrides
 * @property {number | null} q1
 * @property {number | null} q2
 * @property {number | null} q3
 * @property {number | null} q4
 */

/**
 * Split a yearly target evenly across four quarters, remainder to Q4.
 * 50 -> 12 / 12 / 12 / 14. This is the derived value shown as placeholder
 * text wherever a quarter has no explicit override.
 * @param {number} yearly
 * @returns {QuarterTargets}
 */
export function deriveQuarterTargets(yearly) {
  const safe = Math.max(0, Math.trunc(yearly))
  const base = Math.floor(safe / 4)
  return { q1: base, q2: base, q3: base, q4: safe - base * 3 }
}

/**
 * Resolve the effective quarter targets: an explicit override wins, otherwise
 * the even split. Null means "derive", including null 0 vs 0 — an explicit 0
 * is a real target of zero and is honoured.
 * @param {number} yearly
 * @param {Partial<QuarterOverrides>} [overrides]
 * @returns {QuarterTargets}
 */
export function resolveQuarterTargets(yearly, overrides = {}) {
  const derived = deriveQuarterTargets(yearly)
  return {
    q1: overrides.q1 ?? derived.q1,
    q2: overrides.q2 ?? derived.q2,
    q3: overrides.q3 ?? derived.q3,
    q4: overrides.q4 ?? derived.q4,
  }
}

/**
 * The target that applies to a period: the yearly figure for a full year, or
 * the resolved quarter figure for a single quarter.
 * @param {number} yearly
 * @param {Quarter | null} quarter
 * @param {Partial<QuarterOverrides>} [overrides]
 * @returns {number}
 */
export function targetForPeriod(yearly, quarter, overrides = {}) {
  if (quarter === null) return Math.max(0, Math.trunc(yearly))
  return resolveQuarterTargets(yearly, overrides)[`q${quarter}`]
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Completion as a percentage, rounded. A zero target with published posts is
 * reported as 100 rather than Infinity — the plan is met, trivially.
 * @param {number} implemented
 * @param {number} planned
 * @returns {number}
 */
export function completionPct(implemented, planned) {
  if (planned <= 0) return implemented > 0 ? 100 : 0
  return Math.round((implemented / planned) * 100)
}

/**
 * A brand is on target once it has published at least its planned count.
 * @param {number} implemented
 * @param {number} planned
 * @returns {boolean}
 */
export function isOnTarget(implemented, planned) {
  return planned > 0 && implemented >= planned
}
