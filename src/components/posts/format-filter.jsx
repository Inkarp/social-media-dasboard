'use client'

import { useId, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { selectClasses } from '@/components/ui/field'
import { useRoutePending } from '@/components/shell/route-progress'
import { hrefWith } from '@/lib/search-params'
import { FORMAT_KEYS, FORMAT_LABELS } from '@/lib/post-formats'

export function FormatFilter() {
  const id = useId()
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  useRoutePending(pending)
  return <div className="flex flex-col gap-2" data-print="hide"><label className="label" htmlFor={id}>Post format</label><select id={id} className={selectClasses} value={params.get('format') ?? ''} disabled={pending} onChange={(event) => { const value = event.target.value; startTransition(() => router.replace(hrefWith(pathname, params, { format: value || null }))) }}><option value="">All formats</option>{FORMAT_KEYS.map((format) => <option key={format} value={format}>{FORMAT_LABELS[format]}</option>)}</select></div>
}
