import { cn } from '@/lib/cn'

/**
 * Which mode you're in, stated plainly. Viewers see muted; editors see the
 * forest dot. Phase 3 wires `editing` to the real session — until then
 * everyone is a viewer, which is accurate: row-level security means the anon
 * key genuinely cannot write.
 *
 * @param {{ editing?: boolean, className?: string }} props
 */
export function ModeBadge({ editing = false, className }) {
  return (
    <span
      className={cn(
        'flex items-center gap-2 text-xs uppercase tracking-[0.08em]',
        editing ? 'text-ink' : 'text-muted',
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', editing ? 'bg-forest' : 'bg-muted')} />
      {editing ? 'Editing' : 'View mode'}
    </span>
  )
}
