import type { Metadata } from 'next'
import { Board } from '@/components/board/board'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { getActivePrincipalOptions } from '@/lib/data/principals'
import { getPosts } from '@/lib/data/posts'
import { currentFy, fyLabel, fyRange } from '@/lib/fy'
import { intParam } from '@/lib/search-params'

export const metadata: Metadata = { title: 'Board' }

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const fy = intParam(params, 'fy') ?? currentFy()
  const range = fyRange(fy)

  const [{ rows, offline }, principals] = await Promise.all([
    getPosts({ from: range.start, to: range.end }),
    getActivePrincipalOptions(),
  ])

  return (
    <>
      <PageHeader
        title="Board"
        description={`Move posts from planned through to published, for ${fyLabel(fy)}.`}
      />

      {offline ? (
        <EmptyState title="No database is connected yet. Add your Supabase URL and key to .env.local, then restart the dev server." />
      ) : rows.length === 0 ? (
        <EmptyState title="No posts yet for this year. Add one from the Posts page to see it here." />
      ) : (
        <Board posts={rows} principals={principals} />
      )}
    </>
  )
}
