import { Image, Images, Clapperboard, Video, CircleHelp } from 'lucide-react'
import { FORMAT_COLORS, FORMAT_LABELS } from '@/lib/post-formats'

const icons = { static: Image, carousel: Images, reel: Clapperboard, video: Video, unclassified: CircleHelp }
/** @param {{ format: import('@/lib/post-formats').PostFormat | null, compact?: boolean }} props */
export function FormatBadge({ format, compact = false }) {
  const key = format ?? 'unclassified'
  const Icon = icons[key]
  return <span title={FORMAT_LABELS[key]} aria-label={`Format: ${FORMAT_LABELS[key]}`} className="inline-flex shrink-0 items-center gap-1 rounded-chip px-2 py-1 text-xs font-medium" style={{ color: FORMAT_COLORS[key], backgroundColor: `${FORMAT_COLORS[key]}12` }}><Icon aria-hidden="true" className="size-3.5" />{!compact && FORMAT_LABELS[key]}</span>
}
