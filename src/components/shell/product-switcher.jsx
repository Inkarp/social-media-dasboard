'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { InkarpLogo } from '@/components/brand/inkarp-logo'
import { cn } from '@/lib/cn'
import { PRODUCTS } from '@/lib/products'

/**
 * The sidebar logo card doubles as a product switcher: Inkarp Social is the
 * only one that's actually built, but the menu lists what's coming next
 * ("Coming soon") so the rest of the suite isn't a surprise later.
 */
export function ProductSwitcher() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="product-switcher">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="sidebar-card product-switcher-trigger"
      >
        <InkarpLogo className="sidebar-logo" />
        <span className="flex items-center gap-1 text-xs font-semibold text-muted">
          Inkarp Social
          <ChevronDown
            aria-hidden
            strokeWidth={2}
            className={cn('size-3.5 transition-transform duration-[160ms] ease-standard', open && 'rotate-180')}
          />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Switch product"
          className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-card border border-hairline bg-surface p-1.5 shadow-overlay"
        >
          {PRODUCTS.map((product) => (
            <button
              key={product.id}
              type="button"
              role="menuitem"
              aria-disabled={!product.available}
              onClick={() => {
                if (product.available) setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-[120ms] ease-standard',
                product.available ? 'cursor-pointer text-ink hover:bg-hover' : 'cursor-default text-faint',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-chip',
                  product.available ? 'bg-forest/12 text-forest' : 'bg-zebra text-faint',
                )}
              >
                <product.icon aria-hidden strokeWidth={1.75} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{product.label}</span>
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-muted">{product.tagline}</span>
                  {product.available ? (
                    <Check aria-hidden strokeWidth={2.5} className="size-4 shrink-0 text-forest" />
                  ) : (
                    <span className="shrink-0 rounded-chip bg-zebra px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-faint">
                      Soon
                    </span>
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
