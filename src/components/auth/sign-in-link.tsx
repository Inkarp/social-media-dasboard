'use client'

import { LogIn } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { buttonClasses } from '@/components/ui/button'

/**
 * "Sign in to edit", carrying where you were so you land back there afterwards —
 * filters and financial year intact. Someone three filters deep into Q3 should
 * not be dropped on the dashboard root just for signing in.
 *
 * A client component because the header lives in the root layout, and layouts
 * are not told the current path.
 */
export function SignInLink() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const query = searchParams.toString()
  const here = query ? `${pathname}?${query}` : pathname
  const href = here === '/' ? '/sign-in' : `/sign-in?next=${encodeURIComponent(here)}`

  return (
    <Link href={href} className={buttonClasses()}>
      <LogIn aria-hidden strokeWidth={1.75} className="size-4" />
      Sign in to edit
    </Link>
  )
}
