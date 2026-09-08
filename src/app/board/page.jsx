import { FormatFilter } from '@/components/posts/format-filter'
import { parseFormatFilter } from '@/lib/post-formats'
import { Board } from '@/components/board/board'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { getActivePrincipalOptions } from '@/lib/data/principals'
import { getPosts } from '@/lib/data/posts'
import { currentFy, fyLabel, fyRange } from '@/lib/fy'
import { firstParam, intParam } from '@/lib/search-params'

/** @type {import('next').Metadata} */
export const metadata = { title: 'Board' }

/**
 * @param {{ searchParams: Promise<Record<string, string | string[] | undefined>> }} props
 */
export default async function BoardPage({ searchParams }) {
  const params = await searchParams
  const fy = intParam(params, 'fy') ?? currentFy()
  const range = fyRange(fy)

  const [{ rows, offline }, principals] = await Promise.all([
    getPosts({ format: parseFormatFilter(firstParam(params, 'format')), from: range.start, to: range.end }),
    getActivePrincipalOptions(),
  ])

  return (
    <>
      <PageHeader
        accent="teal"
        title="Board"
        description={`Move posts from planned through to published, for ${fyLabel(fy)}.`}
      />

      <div className="mb-6 flex"><FormatFilter /></div>
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
