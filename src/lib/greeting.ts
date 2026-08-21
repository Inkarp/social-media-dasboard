/**
 * The header greeting is computed in IST, not in the server's timezone and not
 * on the client. Deliberately:
 *
 *  - Computing it on the client means the server renders one greeting and the
 *    browser renders another, which React reports as a hydration mismatch.
 *  - Computing it in the server's local timezone means a Vercel box in Iowa
 *    tells a Hyderabad marketing team "Good evening" at 9am.
 *
 * Fixing the zone to Asia/Kolkata makes server and client agree and be correct
 * for the people actually using this.
 */

export const INKARP_TIME_ZONE = 'Asia/Kolkata'

/** The hour 0–23 in Inkarp's timezone. */
export function istHour(now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: INKARP_TIME_ZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(now)
  return Number.parseInt(hour, 10)
}

/** "Good morning" / "Good afternoon" / "Good evening". */
export function greetingFor(now: Date = new Date()): string {
  const hour = istHour(now)
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/** "Monday, 17 August 2026", in Inkarp's timezone. */
export function longDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: INKARP_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)
}
