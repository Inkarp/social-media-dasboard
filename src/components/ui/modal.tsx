'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Modal built on the native <dialog> element.
 *
 * `showModal()` gives focus trapping, Escape-to-close, inertness of the page
 * behind, and correct accessibility semantics from the platform — the things a
 * dialog library mostly exists to provide. What is left is styling, which this
 * design system would be overriding wholesale anyway.
 *
 * Note the ::backdrop styling has to be inline: it is a pseudo-element on the
 * dialog, so a utility class cannot reach it.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  labelledBy = 'modal-title',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  labelledBy?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself, since the
      // content sits in a child. Anything deeper is a click inside the modal.
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        'w-[min(32rem,calc(100vw-2rem))] rounded-card border border-hairline bg-ink-white p-0',
        'text-ink-black shadow-overlay backdrop:bg-scrim',
        'open:animate-none',
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-4">
        <div className="min-w-0">
          <h2 id={labelledBy} className="text-md text-ink-black">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-ink-grey">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 -mt-1 rounded-control p-2 text-ink-grey transition-colors duration-[120ms] ease-instrument hover:bg-hover hover:text-ink-black"
        >
          <X aria-hidden strokeWidth={1.75} className="size-4" />
        </button>
      </div>

      <div className="px-6 py-6">{children}</div>

      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-hairline px-6 py-4">
          {footer}
        </div>
      )}
    </dialog>
  )
}
