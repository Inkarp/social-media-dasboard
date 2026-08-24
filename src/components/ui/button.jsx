import { cn } from '@/lib/cn'

/**
 * Buttons say what happens. "Save target", not "Submit".
 *
 * Variants carry weight, not hue — the palette has one accent, so hierarchy is
 * fill vs outline vs bare. `danger` is the same red as `primary` because there
 * is no second colour to reach for; destructive actions are distinguished by
 * their wording and by always sitting behind a confirmation dialog.
 */

/** @typedef {'primary' | 'secondary' | 'ghost' | 'danger'} ButtonVariant */
/** @typedef {'sm' | 'md'} ButtonSize */

/** @type {Record<ButtonVariant, string>} */
const VARIANTS = {
  primary: 'bg-ink-red text-ink-white hover:bg-ink-black',
  secondary: 'border border-hairline bg-ink-white text-ink-black hover:bg-hover',
  ghost: 'text-ink-grey hover:bg-hover hover:text-ink-black',
  danger: 'border border-ink-red bg-transparent text-ink-red hover:bg-ink-red hover:text-ink-white',
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
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-control font-medium',
    'transition-colors duration-[120ms] ease-instrument',
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
