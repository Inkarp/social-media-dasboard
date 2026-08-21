'use client'

import { LogIn } from 'lucide-react'
import { useActionState } from 'react'
import { signInAction } from '@/app/sign-in/actions'
import { SIGN_IN_INITIAL_STATE } from '@/app/sign-in/state'
import { buttonClasses } from '@/components/ui/button'
import { cn } from '@/lib/cn'

const fieldClasses = cn(
  'w-full rounded-control border border-hairline bg-ink-white px-3 py-2',
  'text-base text-ink-black placeholder:text-ink-grey',
  'transition-colors duration-[120ms] ease-instrument hover:border-ink-grey',
)

export function SignInForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(signInAction, SIGN_IN_INITIAL_STATE)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          aria-describedby={state.error ? 'sign-in-error' : undefined}
          className={fieldClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={state.error ? 'sign-in-error' : undefined}
          className={fieldClasses}
        />
      </div>

      {state.error && (
        <p
          id="sign-in-error"
          role="alert"
          className="flex items-start gap-3 rounded-card border border-ink-red-12 bg-ink-red-06 px-4 py-3 text-base text-ink-black"
        >
          <span aria-hidden className="mt-1 block h-4 w-[3px] shrink-0 bg-ink-red" />
          {state.error}
        </p>
      )}

      <button type="submit" disabled={isPending} className={buttonClasses({ className: 'self-start' })}>
        <LogIn aria-hidden strokeWidth={1.75} className="size-4" />
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
