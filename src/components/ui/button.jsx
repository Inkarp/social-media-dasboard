import { cn } from '@/lib/cn'

/**
 * Buttons say what happens. "Save target", not "Submit".
 *
 * Variants carry weight, not hue for `primary`/`secondary`/`ghost` — fill vs
 * outline vs bare. `danger` is the one place a second colour exists at all,
 * reserved for destructive actions, which also always sit behind a
 * confirmation dialog rather than relying on colour alone.
 */

/** @typedef {'primary' | 'secondary' | 'ghost' | 'danger'} ButtonVariant */
/** @typedef {'sm' | 'md'} ButtonSize */

/** @type {Record<ButtonVariant, string>} */
const VARIANTS = {
  primary: 'bg-forest text-on-accent shadow-[0_0_24px_rgba(32,227,162,0.28)] hover:bg-forest-hover',
  secondary: 'border border-hairline bg-raised text-ink hover:border-teal hover:bg-hover',
  ghost: 'text-muted hover:bg-hover hover:text-ink',
  danger: 'border border-danger bg-danger-06 text-danger hover:bg-danger hover:text-on-accent',
}

/** @type {Record<ButtonSize, string>} */
const SIZES = {
  sm: 'gap-2 px-3 py-1.5 text-sm',
  md: 'gap-2 px-4 py-2 text-base',
}

/**
 * @param {{ variant?: ButtonVariant, size?: ButtonSize, className?: string }} [options]
 * @returns {string}
 */
export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    `studio-button studio-button-${variant} inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-control font-medium`,
    'transition-all duration-[120ms] ease-standard',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

/**
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement> & {
 *   variant?: ButtonVariant, size?: ButtonSize, children: import('react').ReactNode
 * }} props
 */
export function Button({ variant, size, className, children, ...props }) {
  return (
    <button type="button" className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  )
}
