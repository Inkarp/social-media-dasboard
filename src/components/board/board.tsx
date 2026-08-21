'use client'

import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { updatePostStatusAction } from '@/app/posts/actions'
import { useIsEditor } from '@/components/auth/editor-provider'
import { BoardCard } from '@/components/board/board-card'
import { BoardColumn } from '@/components/board/board-column'
import { PostClickTarget } from '@/components/posts/post-click-target'
import type { PrincipalOption } from '@/components/posts/post-form-dialog'
import { POST_STATUSES, isPostStatus } from '@/lib/status'
import type { PostRow } from '@/lib/data/posts'

/**
 * The Kanban board (brief 5.5). One droppable column per status; dragging a
 * card moves it locally (so the drop feels instant) and calls
 * `updatePostStatusAction` in the background — `router.refresh()` afterwards
 * makes the server's copy authoritative again, rolling back a failed move the
 * same way every other mutation in this app reconciles through a refresh
 * rather than trusting client state indefinitely.
 */
export function Board({ posts, principals }: { posts: PostRow[]; principals: PrincipalOption[] }) {
  const isEditor = useIsEditor()
  const router = useRouter()
  const [items, setItems] = useState(posts)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selected, setSelected] = useState<PostRow | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => setItems(posts), [posts])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || !isPostStatus(over.id)) return

    const post = items.find((p) => p.id === active.id)
    if (!post || post.status === over.id) return

    const previous = items
    const nextStatus = over.id
    setItems((current) => current.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p)))

    const formData = new FormData()
    formData.set('id', post.id)
    formData.set('status', nextStatus)

    startTransition(async () => {
      const result = await updatePostStatusAction(formData)
      if (!result.ok) setItems(previous)
      router.refresh()
    })
  }

  const activePost = activeId ? items.find((p) => p.id === activeId) : undefined

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {POST_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              posts={items.filter((p) => p.status === status)}
              draggable={isEditor}
              onCardClick={setSelected}
            />
          ))}
        </div>

        <DragOverlay>
          {activePost && <BoardCard post={activePost} draggable={false} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {selected && (
        <PostClickTarget post={selected} principals={principals} open onClose={() => setSelected(null)} />
      )}
    </>
  )
}
