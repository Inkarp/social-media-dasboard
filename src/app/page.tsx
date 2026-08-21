import { EditorOnly } from '@/components/auth/editor-only'
import { Button } from '@/components/ui/button'
import { CalibratedBar } from '@/components/ui/calibrated-bar'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { POST_STATUSES } from '@/lib/status'

/**
 * Phase 1 placeholder. This page exists to make the design system judgeable
 * before five real pages are built on top of it: every figure below is
 * hard-coded and there is no data source yet.
 */

const PREVIEW_CARDS = [
  { label: 'Planned', figure: 612, bar: null },
  { label: 'Implemented', figure: 388, bar: { implemented: 388, planned: 612 } },
  { label: 'Pending', figure: 224, bar: null },
  { label: 'On target', figure: 19, bar: { implemented: 19, planned: 48 } },
  { label: 'Completion', figure: '63%', bar: { implemented: 388, planned: 612 } },
] as const

const PREVIEW_GAUGES = [
  { brand: 'Under target', implemented: 7, planned: 24 },
  { brand: 'Approaching', implemented: 19, planned: 24 },
  { brand: 'On target', implemented: 24, planned: 24 },
  { brand: 'Overshot', implemented: 36, planned: 24 },
  { brand: 'No plan set', implemented: 3, planned: 0 },
] as const

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Planned against published activity across every principal, for the selected financial year."
        actions={
          <EditorOnly
            fallback={
              <span className="text-sm text-ink-grey">
                Sign in to edit — viewing needs no account.
              </span>
            }
          >
            <Button variant="secondary">Export report</Button>
            <Button>Add post</Button>
          </EditorOnly>
        }
      />

      <div
        role="note"
        className="mb-8 flex items-start gap-3 rounded-card border border-ink-red-12 bg-ink-red-06 px-6 py-4"
      >
        <span aria-hidden className="mt-1 block h-4 w-[3px] shrink-0 bg-ink-red" />
        <p className="text-base text-ink-black">
          <span className="font-medium">Design preview.</span>{' '}
          <span className="text-ink-grey">
            Every figure on this page is hard-coded. The database, the roll-up query and the real
            summary cards arrive in later phases.
          </span>
        </p>
      </div>

      <section aria-label="Summary" className="mb-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {PREVIEW_CARDS.map((card) => (
            <div key={card.label} className="card flex flex-col gap-4 p-6">
              <div>
                <p className="num text-2xl font-medium text-ink-black">{card.figure}</p>
                <p className="label mt-2">{card.label}</p>
              </div>
              {card.bar && (
                <CalibratedBar
                  implemented={card.bar.implemented}
                  planned={card.bar.planned}
                  showPercentage={false}
                  label={`${card.label}: ${card.bar.implemented} of ${card.bar.planned}`}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Calibrated gauge"
            hint="One component, every progress reading in the app. Ticks at 25/50/75; the black marker is the target."
          />
          <dl className="mt-6 flex flex-col gap-4">
            {PREVIEW_GAUGES.map((row) => (
              <div key={row.brand} className="flex items-center gap-4">
                <dt className="w-32 shrink-0 text-sm text-ink-grey">{row.brand}</dt>
                <dd className="flex-1">
                  <CalibratedBar implemented={row.implemented} planned={row.planned} />
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Status treatments"
            hint="Weight and fill carry the difference, never hue. The label is always present."
          />
          <ul className="mt-6 flex flex-col gap-4">
            {POST_STATUSES.map((status) => (
              <li key={status} className="flex items-center justify-between gap-4 border-b border-hairline-soft pb-4 last:border-0 last:pb-0">
                <StatusBadge status={status} />
                <span className="num text-xs text-ink-grey">
                  {status === 'published' ? 'counts as implemented' : 'counts as pending'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
