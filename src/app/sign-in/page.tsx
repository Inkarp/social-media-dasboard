import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
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

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const next = safeInternalPath(firstParam(params, 'next'))

  const viewer = await getViewer()

  if (viewer.isEditor) {
    return (
      <div className="max-w-xl">
        <PageHeader title="You are signed in" description="Editing is unlocked on every section." />
        <Card>
          <div className="flex items-center justify-between gap-4">
            <ModeBadge editing tone="dark" />
            {viewer.email && <span className="num text-sm text-ink-grey">{viewer.email}</span>}
          </div>
          <p className="mt-6 text-base text-ink-grey">
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
      </div>
    )
  }

  // A valid session that isn't an admin. Distinct from never having signed in
  // at all — showing the sign-in form again here would read as "that didn't
  // work", when the credentials were fine and the account simply isn't
  // authorised to edit yet.
  if (viewer.hasSession) {
    return (
      <div className="max-w-xl">
        <PageHeader
          title="Signed in, not authorised to edit"
          description="This account can view everything but cannot add, edit or delete anything yet."
        />
        <Card>
          <div className="flex items-center justify-between gap-4">
            <ModeBadge tone="dark" />
            {viewer.email && <span className="num text-sm text-ink-grey">{viewer.email}</span>}
          </div>
          <p className="mt-6 text-base text-ink-grey">
            Ask whoever administers the Supabase project to add this account to{' '}
            <span className="num text-ink-black">admin_users</span>.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/" className={buttonClasses()}>
              Go to the dashboard
            </Link>
            <SignOutButton />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Sign in to edit"
        description="Viewing needs no account. Signing in unlocks adding, editing and deleting."
      />

      <Card>
        {viewer.canSignIn ? (
          <SignInForm next={next} />
        ) : (
          <>
            <CardHeader
              title="No project connected"
              hint="Sign-in needs a Supabase project. The dashboard still opens read-only without one."
            />
            <p className="mt-6 text-base text-ink-grey">
              Add <span className="num text-ink-black">NEXT_PUBLIC_SUPABASE_URL</span> and{' '}
              <span className="num text-ink-black">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to{' '}
              <span className="num text-ink-black">.env.local</span>, then restart the dev server.
              Next only reads that file at startup.
            </p>
          </>
        )}

        <p className="mt-6 border-t border-hairline-soft pt-6 text-sm text-ink-grey">
          Editor accounts are created by whoever administers the Supabase project — there is no
          self-registration, by design. Access is enforced by row-level security in the database, so
          the key your browser holds can read every table and write to none of them.
        </p>

        <Link
          href="/"
          className={buttonClasses({ variant: 'ghost', className: 'mt-6 -ml-3' })}
        >
          <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" />
          Back to the dashboard
        </Link>
      </Card>
    </div>
  )
}
