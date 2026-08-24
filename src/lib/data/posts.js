import 'server-only'

import { getPrincipalIndex } from '@/lib/data/principals'
import { toDateOnly } from '@/lib/fy'
import { createClient } from '@/lib/supabase/server'

/** @typedef {import('@/lib/channels').Channel} Channel */
/** @typedef {import('@/lib/status').PostStatus} PostStatus */
/** @typedef {import('@/lib/data/principals').PrincipalIndexEntry} PrincipalIndexEntry */

/**
 * One post as every page that lists them needs it: the raw row plus its
 * brand's name, group, manager and colour, resolved in memory against
 * `getPrincipalIndex()` — the same two-query shape `data/principals.js` uses,
 * rather than a PostgREST embed. Covers retired brands too, so a post survives
 * its brand's removal with a correct label, per the brief's retention rule.
 *
 * @typedef {Object} PostRow
 * @property {string} id
 * @property {string} name
 * @property {string | null} description
 * @property {string | null} productName
 * @property {Channel[]} channels
 * @property {string} postDate
 * @property {PostStatus} status
 * @property {string} principalId
 * @property {string} principalName
 * @property {string | null} groupName
 * @property {string | null} managerName
 * @property {string | null} brandColor
 * @property {boolean} principalActive
 */

/**
 * @typedef {Object} PostsQuery
 * @property {Date} from
 * @property {Date} to
 * @property {string} [search]
 * @property {Channel} [channel]
 * @property {PostStatus} [status]
 * @property {string} [principalId]
 */

/** @type {PrincipalIndexEntry} */
const unknownPrincipal = {
  name: 'Unknown brand',
  groupName: '',
  managerName: null,
  brandColor: null,
  isActive: false,
}

/**
 * @param {{
 *   id: string, name: string, description: string | null, product_name: string | null,
 *   channels: string[], post_date: string, status: string, principal_id: string
 * }} post
 * @param {Map<string, PrincipalIndexEntry>} index
 * @returns {PostRow}
 */
function toRow(post, index) {
  const principal = index.get(post.principal_id) ?? unknownPrincipal
  return {
    id: post.id,
    name: post.name,
    description: post.description,
    productName: post.product_name,
    channels: /** @type {Channel[]} */ (post.channels),
    postDate: post.post_date,
    status: /** @type {PostStatus} */ (post.status),
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
 *
 * @param {PostsQuery} query
 * @returns {Promise<{ rows: PostRow[], offline: boolean }>}
 */
export async function getPosts(query) {
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
