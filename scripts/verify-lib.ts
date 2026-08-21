/**
 * Tests for the pure logic modules.
 *
 *   npm run verify:lib
 *
 * src/lib/fy.ts is the single most load-bearing file in the project: every
 * figure, filter, calendar cell and target derives from it, and its bugs are the
 * quiet kind that produce plausible wrong numbers rather than errors. The
 * financial-year boundary is also cross-checked against Postgres in
 * scripts/verify-schema.ts — here the concern is the arithmetic itself.
 */

import {
  completionPct,
  currentFy,
  currentQuarter,
  deriveQuarterTargets,
  fyLabel,
  fyMonths,
  fyOf,
  fyOptions,
  fyRange,
  isInFy,
  isOnTarget,
  isQuarter,
  parseDateOnly,
  periodRange,
  quarterFullLabel,
  quarterOf,
  quarterRange,
  resolveQuarterTargets,
  targetForPeriod,
  toDateOnly,
  type Quarter,
} from '../src/lib/fy'
import { channelListLabel } from '../src/lib/channels'
import { compareGroups, GROUPS } from '../src/lib/groups'
import { safeInternalPath } from '../src/lib/safe-path'
import { isPostStatus, POST_STATUSES } from '../src/lib/status'

let failures = 0
let checks = 0

function section(name: string): void {
  console.log(`\n${name}`)
}

function check(description: string, actual: unknown, expected: unknown): void {
  checks++
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    console.log(`  ok    ${description}`)
  } else {
    failures++
    console.log(`  FAIL  ${description}\n          expected ${e}\n          actual   ${a}`)
  }
}

/* -------------------------------------------------------------------------- */

section('fyOf / quarterOf — the April boundary')

const boundaryCases: [string, number, Quarter][] = [
  ['2025-01-01', 2024, 4],
  ['2025-03-01', 2024, 4],
  ['2025-03-31', 2024, 4], // last day of FY 2024
  ['2025-04-01', 2025, 1], // first day of FY 2025
  ['2025-05-15', 2025, 1],
  ['2025-06-30', 2025, 1],
  ['2025-07-01', 2025, 2],
  ['2025-09-30', 2025, 2],
  ['2025-10-01', 2025, 3],
  ['2025-12-31', 2025, 3],
  ['2026-01-01', 2025, 4],
  ['2026-02-28', 2025, 4],
  ['2026-03-31', 2025, 4], // last day of FY 2025
  ['2026-04-01', 2026, 1],
  ['2024-02-29', 2023, 4], // leap day
]

for (const [iso, fy, quarter] of boundaryCases) {
  const date = parseDateOnly(iso)
  check(`${iso} -> FY ${fy} Q${quarter}`, { fy: fyOf(date), quarter: quarterOf(date) }, { fy, quarter })
}

// Every month of a financial year must map back to that year and to a quarter
// that contains it. Exhaustive rather than sampled — it is only 12 cases.
section('fyOf / quarterOf — exhaustive over one financial year')

for (let offset = 0; offset < 12; offset++) {
  const month = ((3 + offset) % 12) + 1
  const year = month >= 4 ? 2025 : 2026
  const iso = `${year}-${String(month).padStart(2, '0')}-15`
  const date = parseDateOnly(iso)
  const quarter = quarterOf(date)
  const range = quarterRange(2025, quarter)
  const inside = date >= range.start && date <= range.end
  check(`${iso} is in FY 2025 Q${quarter}, and that quarter contains it`, { fy: fyOf(date), inside }, { fy: 2025, inside: true })
}

section('parseDateOnly / toDateOnly — no timezone drift')

// The classic bug: `new Date('2025-04-01')` is UTC midnight, which is 31 March
// in any negative-offset zone — and 31 Mar vs 1 Apr decides the financial year.
for (const iso of ['2025-04-01', '2025-03-31', '2026-01-01', '2024-02-29']) {
  check(`${iso} round-trips`, toDateOnly(parseDateOnly(iso)), iso)
}
check(
  '2025-04-01 parses as local midnight, not UTC',
  (() => {
    const d = parseDateOnly('2025-04-01')
    return { month: d.getMonth() + 1, day: d.getDate(), hours: d.getHours() }
  })(),
  { month: 4, day: 1, hours: 0 },
)

section('fyLabel / quarter labels')

check('2025 -> 2025-26', fyLabel(2025), '2025-26')
check('2026 -> 2026-27', fyLabel(2026), '2026-27')
check('1999 -> 1999-00 (century roll)', fyLabel(1999), '1999-00')
check('2009 -> 2009-10', fyLabel(2009), '2009-10')
check('Q1 full label', quarterFullLabel(1), 'Q1 · Apr–Jun')
check('Q4 full label', quarterFullLabel(4), 'Q4 · Jan–Mar')

section('fyRange / quarterRange / periodRange')

check('FY 2025 runs 1 Apr 2025 to 31 Mar 2026', {
  start: toDateOnly(fyRange(2025).start),
  end: toDateOnly(fyRange(2025).end),
}, { start: '2025-04-01', end: '2026-03-31' })

const expectedQuarters: [Quarter, string, string][] = [
  [1, '2025-04-01', '2025-06-30'],
  [2, '2025-07-01', '2025-09-30'],
  [3, '2025-10-01', '2025-12-31'],
  [4, '2026-01-01', '2026-03-31'],
]
for (const [quarter, start, end] of expectedQuarters) {
  const range = quarterRange(2025, quarter)
  check(`FY 2025 Q${quarter}`, { start: toDateOnly(range.start), end: toDateOnly(range.end) }, { start, end })
}

// A leap year must not shorten or lengthen Q4.
check('FY 2023 Q4 ends 31 Mar 2024 (leap year)', toDateOnly(quarterRange(2023, 4).end), '2024-03-31')
check('FY 2023 Q4 starts 1 Jan 2024', toDateOnly(quarterRange(2023, 4).start), '2024-01-01')

check('periodRange(fy, null) is the whole year', {
  start: toDateOnly(periodRange(2025, null).start),
  end: toDateOnly(periodRange(2025, null).end),
}, { start: '2025-04-01', end: '2026-03-31' })

// The four quarters must tile the year exactly: no gap, no overlap.
section('quarters tile the financial year exactly')

const tiled = ([1, 2, 3, 4] as Quarter[]).map((q) => quarterRange(2025, q))
check('Q1 starts where the year starts', toDateOnly(tiled[0]!.start), toDateOnly(fyRange(2025).start))
check('Q4 ends where the year ends', toDateOnly(tiled[3]!.end), toDateOnly(fyRange(2025).end))
// Compared as calendar dates, not timestamps: a range's `end` is 23:59:59.999
// on its last day, so the raw millisecond gap to the next start is ~1ms, not a
// day. What must hold is that the dates are consecutive — no gap, no overlap.
for (let i = 0; i < 3; i++) {
  const endDay = toDateOnly(tiled[i]!.end)
  const nextStartDay = toDateOnly(tiled[i + 1]!.start)
  const dayAfterEnd = toDateOnly(new Date(tiled[i]!.end.getTime() + 86_400_000))
  check(
    `Q${i + 1} ends the day before Q${i + 2} starts (${endDay} -> ${nextStartDay})`,
    dayAfterEnd,
    nextStartDay,
  )
}

// And the end really is the final instant of its day, which is what makes
// `date <= range.end` safe for a date that carries a time component.
check('a range end is the last instant of its day, not midnight', {
  hours: fyRange(2025).end.getHours(),
  minutes: fyRange(2025).end.getMinutes(),
  ms: fyRange(2025).end.getMilliseconds(),
}, { hours: 23, minutes: 59, ms: 999 })
check(
  'a post timestamped late on 31 Mar 2026 still counts in FY 2025',
  isInFy(new Date(2026, 2, 31, 22, 30), 2025),
  true,
)

check('FY 2025 has 12 months, April first, March last', {
  count: fyMonths(2025).length,
  first: toDateOnly(fyMonths(2025)[0]!),
  last: toDateOnly(fyMonths(2025)[11]!),
}, { count: 12, first: '2025-04-01', last: '2026-03-01' })

section('isInFy')

check('1 Apr 2025 is in FY 2025', isInFy(parseDateOnly('2025-04-01'), 2025), true)
check('31 Mar 2026 is in FY 2025', isInFy(parseDateOnly('2026-03-31'), 2025), true)
check('1 Apr 2026 is NOT in FY 2025', isInFy(parseDateOnly('2026-04-01'), 2025), false)
check('31 Mar 2025 is NOT in FY 2025', isInFy(parseDateOnly('2025-03-31'), 2025), false)

section('currentFy / currentQuarter / fyOptions')

check('17 Aug 2026 is FY 2026 Q2', {
  fy: currentFy(new Date(2026, 7, 17)),
  quarter: currentQuarter(new Date(2026, 7, 17)),
}, { fy: 2026, quarter: 2 })
check('1 Jan 2027 is still FY 2026, Q4', {
  fy: currentFy(new Date(2027, 0, 1)),
  quarter: currentQuarter(new Date(2027, 0, 1)),
}, { fy: 2026, quarter: 4 })

const options = fyOptions(new Date(2026, 7, 17))
check('offers next year first, then back three', options, [2027, 2026, 2025, 2024, 2023])
check('includes the current year', options.includes(2026), true)

section('deriveQuarterTargets — even split, remainder to Q4')

check('0 -> 0/0/0/0', deriveQuarterTargets(0), { q1: 0, q2: 0, q3: 0, q4: 0 })
check('1 -> 0/0/0/1', deriveQuarterTargets(1), { q1: 0, q2: 0, q3: 0, q4: 1 })
check('3 -> 0/0/0/3', deriveQuarterTargets(3), { q1: 0, q2: 0, q3: 0, q4: 3 })
check('4 -> 1/1/1/1', deriveQuarterTargets(4), { q1: 1, q2: 1, q3: 1, q4: 1 })
check('50 -> 12/12/12/14', deriveQuarterTargets(50), { q1: 12, q2: 12, q3: 12, q4: 14 })
check('24 -> 6/6/6/6', deriveQuarterTargets(24), { q1: 6, q2: 6, q3: 6, q4: 6 })
check('negative clamps to zero', deriveQuarterTargets(-8), { q1: 0, q2: 0, q3: 0, q4: 0 })
check('fractional truncates', deriveQuarterTargets(10.9), { q1: 2, q2: 2, q3: 2, q4: 4 })

// The invariant that actually matters: the split must never lose or invent posts.
for (const yearly of [0, 1, 2, 3, 4, 5, 7, 10, 11, 23, 24, 50, 51, 99, 100, 1000]) {
  const t = deriveQuarterTargets(yearly)
  check(`split of ${yearly} sums back to ${yearly}`, t.q1 + t.q2 + t.q3 + t.q4, yearly)
}

section('resolveQuarterTargets — overrides win, including zero')

check('no overrides derives all four', resolveQuarterTargets(24), { q1: 6, q2: 6, q3: 6, q4: 6 })
check('one override, rest derived', resolveQuarterTargets(24, { q1: 10 }), { q1: 10, q2: 6, q3: 6, q4: 6 })
check('an explicit 0 is honoured, not treated as absent', resolveQuarterTargets(24, { q2: 0 }), {
  q1: 6, q2: 0, q3: 6, q4: 6,
})
check('null means derive', resolveQuarterTargets(24, { q3: null }), { q1: 6, q2: 6, q3: 6, q4: 6 })
check('all four overridden', resolveQuarterTargets(24, { q1: 1, q2: 2, q3: 3, q4: 4 }), {
  q1: 1, q2: 2, q3: 3, q4: 4,
})

section('targetForPeriod')

check('full year returns the yearly figure', targetForPeriod(50, null), 50)
check('Q1 of 50 derives 12', targetForPeriod(50, 1), 12)
check('Q4 of 50 derives 14', targetForPeriod(50, 4), 14)
check('Q1 with an override of 7', targetForPeriod(10, 1, { q1: 7 }), 7)
check('an override of 0 returns 0', targetForPeriod(24, 2, { q2: 0 }), 0)

section('completionPct / isOnTarget')

check('0 of 10 is 0%', completionPct(0, 10), 0)
check('5 of 10 is 50%', completionPct(5, 10), 50)
check('10 of 10 is 100%', completionPct(10, 10), 100)
check('15 of 10 is 150% — overshoot is not clamped', completionPct(15, 10), 150)
check('1 of 3 rounds to 33%', completionPct(1, 3), 33)
check('2 of 3 rounds to 67%', completionPct(2, 3), 67)
check('0 of 0 is 0%, not NaN', completionPct(0, 0), 0)
check('3 of 0 is 100%, not Infinity', completionPct(3, 0), 100)

check('meeting the target is on target', isOnTarget(10, 10), true)
check('beating the target is on target', isOnTarget(11, 10), true)
check('missing the target is not', isOnTarget(9, 10), false)
check('no plan is never on target, even with activity', isOnTarget(5, 0), false)

section('isQuarter / isPostStatus guards')

check('isQuarter accepts 1-4', [1, 2, 3, 4].every(isQuarter), true)
check('isQuarter rejects 0, 5, "1", null', [0, 5, '1', null].some(isQuarter), false)
check('isPostStatus accepts all four', POST_STATUSES.every(isPostStatus), true)
check('isPostStatus rejects an unknown value', isPostStatus('archived'), false)

section('safeInternalPath — open-redirect guard')

check('a plain path passes', safeInternalPath('/posts'), '/posts')
check('a path with a query passes', safeInternalPath('/posts?fy=2025&status=published'), '/posts?fy=2025&status=published')
check('absolute https is refused', safeInternalPath('https://evil.example/login'), '/')
check('absolute http is refused', safeInternalPath('http://evil.example'), '/')
check('protocol-relative is refused', safeInternalPath('//evil.example'), '/')
check('backslash-relative is refused', safeInternalPath('/\\evil.example'), '/')
check('a backslash anywhere is refused', safeInternalPath('/posts\\..\\admin'), '/')
check('javascript: is refused', safeInternalPath('javascript:alert(1)'), '/')
check('a relative path is refused', safeInternalPath('posts'), '/')
check('an embedded newline is refused', safeInternalPath('/posts\nSet-Cookie: a=b'), '/')
check('an embedded carriage return is refused', safeInternalPath('/posts' + String.fromCharCode(13) + 'Location: x'), '/')
check('an embedded NUL is refused', safeInternalPath('/posts' + String.fromCharCode(0)), '/')
check('a DEL character is refused', safeInternalPath('/posts' + String.fromCharCode(127)), '/')
check('a C1 control character is refused', safeInternalPath('/posts' + String.fromCharCode(0x9b)), '/')
check('a tab is refused', safeInternalPath('/po' + String.fromCharCode(9) + 'sts'), '/')
check('undefined falls back', safeInternalPath(undefined), '/')
check('a non-string falls back', safeInternalPath(42), '/')
check('empty falls back', safeInternalPath('   '), '/')
check('a custom fallback is honoured', safeInternalPath('https://evil.example', '/board'), '/board')

section('compareGroups — numeric order, not lexical')

check(
  'Group 10 sorts after Group 9, not between 1 and 2',
  ['Group 10', 'Group 2', 'Group 1', 'Group 9'].sort(compareGroups),
  ['Group 1', 'Group 2', 'Group 9', 'Group 10'],
)
check(
  'named groups follow the numbered ones',
  ['Marketing', 'Group 3', 'Learning & Development', 'Group 1'].sort(compareGroups),
  ['Group 1', 'Group 3', 'Learning & Development', 'Marketing'],
)
check('the canonical list is already in display order', [...GROUPS].sort(compareGroups), [...GROUPS])

section('channelListLabel')

check('none', channelListLabel([]), 'No channels')
check('one', channelListLabel(['linkedin']), 'LinkedIn')
check('two', channelListLabel(['linkedin', 'instagram']), 'LinkedIn and Instagram')
check('three', channelListLabel(['facebook', 'linkedin', 'youtube']), 'Facebook, LinkedIn and YouTube')

/* -------------------------------------------------------------------------- */

console.log(`\n${failures === 0 ? '✓' : '✗'} ${checks - failures}/${checks} checks passed\n`)
process.exit(failures === 0 ? 0 : 1)
