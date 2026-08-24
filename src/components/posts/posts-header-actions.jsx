'use client'

import { usePostsList } from '@/components/posts/posts-list-context'
import { ImportDialog } from '@/components/posts/import-dialog'
import { PostFormDialog } from '@/components/posts/post-form-dialog'

/** @typedef {import('@/components/posts/post-form-dialog').PrincipalOption} PrincipalOption */

/**
 * "Import" and "Add post" in the page header. A client component specifically
 * so "Add post" can share `PostsListProvider`'s state with the table below it
 * — adding a post here has to appear in the same list the table renders from.
 *
 * @param {{ principals: PrincipalOption[] }} props
 */
export function PostsHeaderActions({ principals }) {
  const { upsert } = usePostsList()

  return (
    <>
      <ImportDialog principals={principals} />
      <PostFormDialog principals={principals} onSaved={upsert} />
    </>
  )
}
