import 'server-only'

import { getPrincipalIndex, type PrincipalIndexEntry } from '@/lib/data/principals'
import { toDateOnly } from '@/lib/fy'
import { createClient } from '@/lib/supabase/server'
import type { Channel } from '@/lib/channels'
import type { PostStatus } from '@/lib/status'

/**
 * One post as every page that lists them needs it: the raw row plus its
 * brand's name, group, manager and colour, resolved in memory against
 * `getPrincipalIndex()` — the same two-query shape `data/principals.ts` uses,
 * rather than a PostgREST embed. Covers retired brands too, so a post survives
 * its brand's removal with a correct label, per the brief's retention rule.
 */
export type PostRow = {
  id: string
  name: string
  description: string | null
  productName: string | null
  channels: Channel[]
  postDate: string
  status: PostStatus
  principalId: string
  principalName: string
  groupName: string | null
  managerName: string | null
  brandColor: string | null
  principalActive: boolean
}

export type PostsQuery = {
  from: Date
  to: Date
  search?: string
  channel?: Channel
  status?: PostStatus
  principalId?: string
}

const unknownPrincipal: PrincipalIndexEntry = {
  name: 'Unknown brand',
  groupName: '',
  managerName: null,
  brandColor: null,
  isActive: false,
}

function toRow(
  post: {
    id: string
    name: string
    description: string | null
    product_name: string | null
    channels: string[]
    post_date: string
    status: string
    principal_id: string
  },
  index: Map<string, PrincipalIndexEntry>,
): PostRow {
  const principal = index.get(post.principal_id) ?? unknownPrincipal
  return {
    id: post.id,
    name: post.name,
    description: post.description,
    productName: post.product_name,
    channels: post.channels as Channel[],
    postDate: post.post_date,
    status: post.status as PostStatus,
    principalId: post.principal_id,
    principalName: principal.name,
    groupName: principal.groupName,
    managerName: principal.managerName,
    brandColor: principal.brandColor,
    principalActive: principal.isActive,
  }
}

/**
 * Fetch posts in a date range, joined with brand identity.
 *
 * `from`/`to` are caller-supplied rather than an (fy, quarter) pair, because the
 * three callers need different spans: the Posts list uses `periodRange`, the
 * Calendar uses the visible month (which can spill outside the selected FY at
 * its edges), and the Board uses a whole FY.
 */
export async function getPosts(query: PostsQuery): Promise<{ rows: PostRow[]; offline: boolean }> {
  const supabase = await createClient()
  if (!supabase) return { rows: [], offline: true }

  let request = supabase
    .from('posts')
    .select('id, name, description, product_name, channels, post_date, status, principal_id')
    .gte('post_date', toDateOnly(query.from))
    .lte('post_date', toDateOnly(query.to))
    .order('post_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (query.status) request = request.eq('status', query.status)
  if (query.principalId) request = request.eq('principal_id', query.principalId)
  if (query.channel) request = request.contains('channels', [query.channel])

  const [postsResult, index] = await Promise.all([request, getPrincipalIndex()])
  if (postsResult.error) throw new Error(postsResult.error.message)

  let rows = (postsResult.data ?? []).map((post) => toRow(post, index))

  const search = query.search?.trim().toLowerCase() ?? ''
  if (search) {
    rows = rows.filter((row) => {
      const haystack = [row.name, row.principalName, row.productName, row.managerName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  }

  return { rows, offline: false }
}
