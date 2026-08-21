/**
 * The five channels the brief supports. This list mirrors the array check
 * constraint on `posts.channels` — adding one here without adding it to the
 * constraint produces an insert that fails in the database.
 *
 * Deliberately free of React imports so server code, Zod schemas and
 * scripts/seed.ts can all use it. The glyphs live in
 * src/components/ui/channel-icon.tsx.
 */

export const CHANNELS = ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube'] as const

export type Channel = (typeof CHANNELS)[number]

export function isChannel(value: unknown): value is Channel {
  return typeof value === 'string' && (CHANNELS as readonly string[]).includes(value)
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  youtube: 'YouTube',
}

/** Quick-select sets offered on the post form, alongside the single-channel shortcuts. */
export const CHANNEL_PRESETS = [
  { id: 'all', label: 'All', channels: CHANNELS },
  {
    id: 'social',
    label: 'Social only',
    channels: ['facebook', 'instagram', 'linkedin', 'twitter'],
  },
] as const satisfies readonly { id: string; label: string; channels: readonly Channel[] }[]

/** Human-readable list for accessible names: "LinkedIn and Instagram". */
export function channelListLabel(channels: readonly Channel[]): string {
  const names = channels.map((c) => CHANNEL_LABELS[c])
  if (names.length === 0) return 'No channels'
  if (names.length === 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}
