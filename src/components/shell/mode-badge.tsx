import { cn } from '@/lib/cn'

/**
 * Which mode you're in, stated plainly. Viewers see grey; editors see the red
 * dot the brief asks for. Phase 3 wires `editing` to the real session — until
 * then everyone is a viewer, which is accurate: row-level security means the
 * anon key genuinely cannot write.
 */
export function ModeBadge({
  editing = false,
  tone = 'light',
  className,
}: {
  editing?: boolean
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-2 text-xs uppercase tracking-[0.08em]',
        editing
          ? tone === 'light'
            ? 'text-ink-white'
            : 'text-ink-black'
          : tone === 'light'
            ? 'text-[color:var(--color-sidebar-muted)]'
            : 'text-ink-grey',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          editing
            ? 'bg-ink-red'
            : tone === 'light'
              ? 'bg-[color:var(--color-sidebar-muted)]'
              : 'bg-ink-grey',
        )}
      />
      {editing ? 'Editing' : 'View mode'}
    </span>
  )
}
