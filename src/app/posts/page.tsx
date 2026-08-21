import type { Metadata } from 'next'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Posts' }

export default function PostsPage() {
  return (
    <>
      <PageHeader
        title="Posts"
        description="Every individual post and campaign for the selected financial year."
      />
      <EmptyState title="The post list and its shared add/edit form arrive in phase 5." />
    </>
  )
}
