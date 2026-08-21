/**
 * Canonical group names offered when adding a principal.
 *
 * `principals.group_name` is free text in the database — groups are a label on
 * the brand, not a table, which keeps the schema flat and the roll-ups simple.
 * This list is what the pickers offer.
 *
 * Group 1–8 are the groups Inkarp's principals actually sit in. Marketing and
 * Learning & Development are named in the brief but currently hold no brands;
 * they are offered so that when a brand is assigned to one, nothing has to
 * change here first.
 */
/**
 * Listed in the order `compareGroups` sorts them — numbered groups first, then
 * the named ones alphabetically. Keeping the two in step means a picker and a
 * sorted table never disagree about where Marketing sits. (The brief lists
 * "Marketing and Learning & Development" in the other order; that reads as prose,
 * not as a display requirement.)
 */
export const GROUPS = [
  'Group 1',
  'Group 2',
  'Group 3',
  'Group 4',
  'Group 5',
  'Group 6',
  'Group 7',
  'Group 8',
  'Learning & Development',
  'Marketing',
] as const

export type Group = (typeof GROUPS)[number]

/**
 * Sort groups for display: the numbered groups in order, then the named ones
 * alphabetically, then anything unrecognised. Plain string sort would put
 * "Group 10" between "Group 1" and "Group 2" the day a tenth group appears.
 */
export function compareGroups(a: string, b: string): number {
  const rank = (g: string) => {
    const match = /^Group (\d+)$/.exec(g)
    if (match) return Number.parseInt(match[1] ?? '0', 10)
    return Number.MAX_SAFE_INTEGER
  }
  const ra = rank(a)
  const rb = rank(b)
  return ra === rb ? a.localeCompare(b) : ra - rb
}
