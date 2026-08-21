import type { Metadata } from 'next'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Board' }

export default function BoardPage() {
  return (
    <>
      <PageHeader
        title="Board"
        description="Move posts from planned through to published."
      />
      <EmptyState title="The drag-and-drop board arrives in phase 7." />
    </>
  )
}
