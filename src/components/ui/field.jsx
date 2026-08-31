import { cn } from '@/lib/cn'

export const inputClasses = cn(
  'w-full rounded-control border border-hairline bg-surface px-3 py-2',
  'text-base text-ink placeholder:text-muted',
  'transition-colors duration-[120ms] ease-standard',
  'hover:border-muted focus:border-forest',
  'disabled:opacity-50',
)

export const selectClasses = cn(inputClasses, 'appearance-none pr-9')

/**
 * @param {{
 *   label: string,
 *   htmlFor: string,
 *   hint?: string,
 *   children: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export function Field({ label, htmlFor, hint, children, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  )
}
