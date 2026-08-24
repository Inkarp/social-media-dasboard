'use client'

import { useIsEditor } from '@/components/auth/editor-provider'
import { PostDetailDialog } from '@/components/posts/post-detail-dialog'
import { PostFormDialog } from '@/components/posts/post-form-dialog'

/** @typedef {import('@/components/posts/post-form-dialog').PrincipalOption} PrincipalOption */
/** @typedef {import('@/lib/data/posts').PostRow} PostRow */

/**
 * What clicking a post opens, decided once. Editors get the editable form
 * (`PostFormDialog`); viewers get a read-only detail view (`PostDetailDialog`),
 * since a viewer's save would only fail at the database. Shared by Calendar and
 * Board so the two places a post can be clicked from behave identically.
 *
 * @param {{
 *   post: PostRow,
 *   principals: PrincipalOption[],
 *   open: boolean,
 *   onClose: () => void,
 *   onSaved?: (post: PostRow) => void,
 * }} props
 */
export function PostClickTarget({ post, principals, open, onClose, onSaved }) {
  const isEditor = useIsEditor()

  if (isEditor) {
    return (
      <PostFormDialog
        principals={principals}
        post={post}
        trigger="none"
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose()
        }}
        onSaved={onSaved}
      />
    )
  }

  return <PostDetailDialog post={post} open={open} onClose={onClose} />
}
