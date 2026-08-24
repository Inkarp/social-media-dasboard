'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/** @typedef {import('@/lib/data/posts').PostRow} PostRow */

/**
 * @typedef {Object} PostsListContextValue
 * @property {PostRow[]} items
 * @property {(post: PostRow) => void} upsert Add a new row, or replace an existing one by id — both a create and an edit call this.
 * @property {(ids: readonly string[]) => void} remove
 */

const PostsListContext = createContext(/** @type {PostsListContextValue | null} */ (null))

/**
 * Shared post-list state for the Posts page, so the "Add post" button in the
 * header and the table below it — two separate places in the component tree
 * — can both update the same list the instant a write succeeds, with no page
 * reload and no dependency on the server re-fetching in time.
 *
 * `rows` still resyncs `items` on every real server refetch (a filter change,
 * a different financial year) — this only replaces waiting on that refetch
 * for the specific row this browser tab just wrote itself.
 *
 * @param {{ rows: PostRow[], children: import('react').ReactNode }} props
 */
export function PostsListProvider({ rows, children }) {
  const [items, setItems] = useState(rows)

  useEffect(() => setItems(rows), [rows])

  /** @param {PostRow} post */
  function upsert(post) {
    setItems((current) => {
      const exists = current.some((row) => row.id === post.id)
      return exists ? current.map((row) => (row.id === post.id ? post : row)) : [post, ...current]
    })
  }

  /** @param {readonly string[]} ids */
  function remove(ids) {
    const dead = new Set(ids)
    setItems((current) => current.filter((row) => !dead.has(row.id)))
  }

  return <PostsListContext.Provider value={{ items, upsert, remove }}>{children}</PostsListContext.Provider>
}

/** @returns {PostsListContextValue} */
export function usePostsList() {
  const context = useContext(PostsListContext)
  if (!context) throw new Error('usePostsList must be used within a PostsListProvider')
  return context
}
