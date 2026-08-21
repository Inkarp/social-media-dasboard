'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { SignInState } from '@/app/sign-in/state'
import { safeInternalPath } from '@/lib/safe-path'
import { createClient } from '@/lib/supabase/server'

/**
 * Only async functions are exported from this file. Everything in a `'use server'`
 * module becomes a callable server endpoint, so Next rejects any other export —
 * the state type and its initial value live in ./state instead.
 */

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .email('That is not a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  // Where to go afterwards. Restricted to in-app paths so a crafted link cannot
  // bounce someone to another site immediately after they authenticate.
  next: z
    .string()
    .optional()
    .transform((value) => safeInternalPath(value)),
})

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  }

  const parsed = signInSchema.safeParse({
    email: typeof raw.email === 'string' ? raw.email : '',
    password: typeof raw.password === 'string' ? raw.password : '',
    next: typeof raw.next === 'string' ? raw.next : undefined,
  })

  const email = typeof raw.email === 'string' ? raw.email : ''

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the details and try again.', email }
  }

  const supabase = await createClient()
  if (!supabase) {
    return {
      error:
        'No Supabase project is connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.',
      email,
    }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Supabase returns the same error for a wrong password and an address with
    // no account, deliberately — telling someone which one they got wrong tells
    // an attacker which addresses are real.
    return {
      error:
        error.message === 'Invalid login credentials'
          ? 'Those details do not match an editor account. Check the email and password, or ask whoever administers the Supabase project to create your account.'
          : error.message,
      email,
    }
  }

  // The session lives in a cookie the whole tree reads, so the entire layout
  // needs revalidating — not just the current page.
  revalidatePath('/', 'layout')
  redirect(parsed.data.next)
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  if (supabase) await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/')
}
