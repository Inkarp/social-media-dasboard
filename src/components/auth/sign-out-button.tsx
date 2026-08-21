'use client'

import { LogOut } from 'lucide-react'
import { useTransition } from 'react'
import { signOutAction } from '@/app/sign-in/actions'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/button'

/**
 * The way back out of editing. Present wherever the "Editing" indicator is, so
 * leaving is never a hunt through a menu.
 */
export function SignOutButton({
  label = 'Leave editing',
  variant = 'secondary',
  size = 'md',
  className,
}: {
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
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
