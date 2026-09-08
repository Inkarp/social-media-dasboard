'use client'

import { RotateCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'

/**
 * Fallback for every route that doesn't define its own error.jsx (Principals
 * is the one exception). Without this, a transient Supabase blip on any of
 * those pages surfaced as Next's raw, unstyled "Internal Server Error".
 *
 * `reset()` re-runs the failed server component rather than reloading the
 * whole app, so a transient database blip clears without losing the session.
 *
 * @param {{ error: Error & { digest?: string }, reset: () => void }} props
 */
export default function RootError({ error, reset }) {
  useEffect(() => {
    console.error('[root]', error)
  }, [error])

  return (
    <div className="max-w-xl">
      <PageHeader accent="slate" title="Something went wrong" />
      <Card>
        <CardHeader
          title="This page could not be loaded"
          hint="The database did not answer. This is usually a dropped connection rather than anything wrong with your data."
        />

        <p className="mt-6 text-base text-muted">Nothing has been changed.</p>

        {error.message && (
          <p className="num mt-4 break-words rounded-card border border-hairline bg-zebra px-4 py-3 text-sm text-muted">
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
