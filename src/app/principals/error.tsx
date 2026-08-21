'use client'

import { RotateCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'

/**
 * Errors say what went wrong and what to do. The recovery action is real —
 * `reset()` re-runs the server component rather than reloading the whole app,
 * so a transient database blip clears without losing the rest of the session.
 */
export default function PrincipalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[principals]', error)
  }, [error])

  return (
    <div className="max-w-xl">
      <PageHeader title="Principals" />
      <Card>
        <CardHeader
          title="The brand directory could not be loaded"
          hint="The database did not answer. This is usually a dropped connection rather than anything wrong with your data."
        />

        <p className="mt-6 text-base text-ink-grey">
          Nothing has been changed. Targets and posts are untouched.
        </p>

        {error.message && (
          <p className="num mt-4 break-words rounded-card border border-hairline bg-zebra px-4 py-3 text-sm text-ink-grey">
            {error.message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={reset} className={buttonClasses()}>
            <RotateCw aria-hidden strokeWidth={1.75} className="size-4" />
            Try again
          </button>
          <Link href="/" className={buttonClasses({ variant: 'secondary' })}>
            Back to the dashboard
          </Link>
        </div>
      </Card>
    </div>
  )
}
