import type { Metadata } from 'next'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Calendar' }

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="Posts on their scheduled dates, one month at a time."
      />
      <EmptyState title="The month grid arrives in phase 7." />
    </>
  )
}
