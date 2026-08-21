import type { Metadata } from 'next'
import { EditorOnly } from '@/components/auth/editor-only'
import { ImportDialog } from '@/components/posts/import-dialog'
import { PostFormDialog } from '@/components/posts/post-form-dialog'
import { PostsFilters } from '@/components/posts/posts-filters'
import { PostsTable } from '@/components/posts/posts-table'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { getActivePrincipalOptions } from '@/lib/data/principals'
import { getPosts } from '@/lib/data/posts'
import { isChannel } from '@/lib/channels'
import { currentFy, fyLabel, periodRange } from '@/lib/fy'
import { firstParam, intParam } from '@/lib/search-params'
import { isPostStatus } from '@/lib/status'

export const metadata: Metadata = { title: 'Posts' }

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const fy = intParam(params, 'fy') ?? currentFy()
  const range = periodRange(fy, null)

  const rawChannel = firstParam(params, 'channel')
  const channel = isChannel(rawChannel) ? rawChannel : undefined
  const rawStatus = firstParam(params, 'status')
  const status = isPostStatus(rawStatus) ? rawStatus : undefined

  const [{ rows, offline }, principals] = await Promise.all([
    getPosts({
      from: range.start,
      to: range.end,
      search: firstParam(params, 'q'),
      channel,
      status,
    }),
    getActivePrincipalOptions(),
  ])

  return (
    <>
      <PageHeader
        title="Posts"
        description={`Every individual post and campaign for ${fyLabel(fy)}.`}
        actions={
          <EditorOnly
            fallback={
              <span className="text-sm text-ink-grey">
                Sign in to edit — viewing needs no account.
              </span>
            }
          >
            <ImportDialog principals={principals} />
            <PostFormDialog principals={principals} />
          </EditorOnly>
        }
      />

      {offline ? (
        <EmptyState title="No database is connected yet. Add your Supabase URL and key to .env.local, then restart the dev server." />
      ) : (
        <>
          <PostsFilters />

          {rows.length === 0 ? (
            <EmptyState title="No posts match these filters. Clear them, or add the first post for this year." />
          ) : (
            <PostsTable rows={rows} principals={principals} />
          )}
        </>
      )}
    </>
  )
}
