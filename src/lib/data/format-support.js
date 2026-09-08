import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/** Keep existing data readable while the database migration is being applied. */
export const hasPostFormats = cache(async () => {
  const supabase = await createClient()
  if (!supabase) return false
  const { error } = await supabase.rpc('post_format_rollup', { p_fy: 0 })
  if (!error) return true
  if (error.code === 'PGRST202' || error.code === '42883') return false
  throw new Error(error.message)
})
