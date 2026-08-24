'use client'

import { LogOut } from 'lucide-react'
import { useTransition } from 'react'
import { signOutAction } from '@/app/sign-in/actions'
import { Button } from '@/components/ui/button'

/** @typedef {import('@/components/ui/button').ButtonVariant} ButtonVariant */
/** @typedef {import('@/components/ui/button').ButtonSize} ButtonSize */

/**
 * The way back out of editing. Present wherever the "Editing" indicator is, so
 * leaving is never a hunt through a menu.
 *
 * @param {{
 *   label?: string,
 *   variant?: ButtonVariant,
 *   size?: ButtonSize,
 *   className?: string,
 * }} props
 */
export function SignOutButton({ label = 'Leave editing', variant = 'secondary', size = 'md', className }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signOutAction()
        })
      }}
    >
      <LogOut aria-hidden strokeWidth={1.75} className="size-4" />
      {isPending ? 'Leaving…' : label}
    </Button>
  )
}
