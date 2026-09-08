import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SignInForm } from '@/app/sign-in/sign-in-form'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Card, CardHeader } from '@/components/ui/card'
import { ModeBadge } from '@/components/shell/mode-badge'
import { PageHeader } from '@/components/ui/page-header'
import { buttonClasses } from '@/components/ui/button'
import { getViewer } from '@/lib/auth'
import { safeInternalPath } from '@/lib/safe-path'
import { firstParam } from '@/lib/search-params'

/** @type {import('next').Metadata} */
export const metadata = { title: 'Sign in' }

/**
 * @param {{ searchParams: Promise<Record<string, string | string[] | undefined>> }} props
 */
export default async function SignInPage({ searchParams }) {
  const params = await searchParams
  const next = safeInternalPath(firstParam(params, 'next'))

  const viewer = await getViewer()

  if (viewer.isEditor) {
    return (
      <>
        <PageHeader title="You are signed in" description="Editing is unlocked on every section." />
        <Card className="max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <ModeBadge editing />
            {viewer.email && <span className="num text-sm text-muted">{viewer.email}</span>}
          </div>
          <p className="mt-6 text-base text-muted">
            Add, edit and delete controls are now visible across the dashboard. Leaving editing
            returns you to the same read-only view everyone else sees.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/" className={buttonClasses()}>
              Go to the dashboard
            </Link>
            <SignOutButton label="Leave editing" variant="secondary" />
          </div>
        </Card>
      </>
    )
  }

  // A valid session that isn't an admin. Distinct from never having signed in
  // at all — showing the sign-in form again here would read as "that didn't
  // work", when the credentials were fine and the account simply isn't
  // authorised to edit yet.
  if (viewer.hasSession) {
    return (
      <>
        <PageHeader
          title="Signed in, not authorised to edit"
          description="This account can view everything but cannot add, edit or delete anything yet."
        />
        <Card className="max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <ModeBadge />
            {viewer.email && <span className="num text-sm text-muted">{viewer.email}</span>}
          </div>
          <p className="mt-6 text-base text-muted">
            Ask whoever administers the Supabase project to add this account to{' '}
            <span className="num text-ink">admin_users</span>.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/" className={buttonClasses()}>
              Go to the dashboard
            </Link>
            <SignOutButton />
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Sign in to edit"
        description="Viewing needs no account. Signing in unlocks adding, editing and deleting."
      />

      <Card>
        {viewer.canSignIn ? (
          <div className="grid gap-10 md:grid-cols-2">
            <div className="max-w-sm">
              <SignInForm next={next} />
            </div>

            <div className="flex flex-col md:border-l md:border-hairline-soft md:pl-10">
              <p className="text-base text-muted">
                Editor accounts are created by whoever administers the Supabase project — there is
                no self-registration, by design. Access is enforced by row-level security in the
                database, so the key your browser holds can read every table and write to none of
                them.
              </p>

              <Link
                href="/"
                className={buttonClasses({ variant: 'ghost', className: 'mt-6 -ml-3 self-start' })}
              >
                <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" />
                Back to the dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            <CardHeader
              title="No project connected"
              hint="Sign-in needs a Supabase project. The dashboard still opens read-only without one."
            />
            <p className="mt-6 max-w-2xl text-base text-muted">
              Add <span className="num text-ink">NEXT_PUBLIC_SUPABASE_URL</span> and{' '}
              <span className="num text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to{' '}
              <span className="num text-ink">.env.local</span>, then restart the dev server.
              Next only reads that file at startup.
            </p>

            <Link
              href="/"
              className={buttonClasses({ variant: 'ghost', className: 'mt-6 -ml-3' })}
            >
              <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" />
              Back to the dashboard
            </Link>
          </>
        )}
      </Card>
    </>
  )
}
