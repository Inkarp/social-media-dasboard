/** @param {import('./types').RollupRow[]} rows */
export function dashboardInsights(rows) {
  const principals = rows.filter((row) => row.dimension === 'principal')
  const published = principals.reduce((sum, row) => sum + row.implemented, 0)
  const pending = principals.reduce((sum, row) => sum + row.pending, 0)
  const total = published + pending
  const covered = principals.filter((row) => row.implemented > 0).length
  const targetGap = principals.reduce((sum, row) => sum + Math.max(0, row.planned - row.implemented), 0)
  const withoutTarget = principals.filter((row) => row.planned === 0).length
  const priorities = principals
    .map((row) => ({ ...row, gap: Math.max(0, row.planned - row.implemented) }))
    .filter((row) => row.gap > 0 || row.pending > 0)
    .sort((a, b) => b.gap - a.gap || b.pending - a.pending || a.label.localeCompare(b.label))
    .slice(0, 5)

  return {
    published, pending, total, covered, targetGap, withoutTarget,
    principalCount: principals.length,
    publicationRate: total > 0 ? Math.round(published / total * 100) : null,
    coverage: principals.length > 0 ? Math.round(covered / principals.length * 100) : null,
    priorities,
    groups: rows.filter((row) => row.dimension === 'group')
      .sort((a, b) => (b.implemented + b.pending) - (a.implemented + a.pending) || a.label.localeCompare(b.label)),
  }
}
