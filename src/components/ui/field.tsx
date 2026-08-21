import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const inputClasses = cn(
  'w-full rounded-control border border-hairline bg-ink-white px-3 py-2',
  'text-base text-ink-black placeholder:text-ink-grey',
  'transition-colors duration-[120ms] ease-instrument',
  'hover:border-ink-grey focus:border-ink-red',
  'disabled:opacity-50',
)

export const selectClasses = cn(inputClasses, 'appearance-none pr-9')

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-ink-grey">{hint}</p>}
    </div>
  )
}
