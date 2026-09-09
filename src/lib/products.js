import { Mail, MessageCircle, MessageSquare, Share2 } from 'lucide-react'

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} label
 * @property {string} tagline
 * @property {import('lucide-react').LucideIcon} icon
 * @property {boolean} available Whether this product has shipped — unavailable
 *   products still show in the switcher, tagged "Coming soon", so people know
 *   what Inkarp is building next.
 */

/** @type {readonly Product[]} */
export const PRODUCTS = [
  {
    id: 'social',
    label: 'Inkarp Social',
    tagline: 'Posts, principals & the publishing calendar',
    icon: Share2,
    available: true,
  },
  {
    id: 'email',
    label: 'Email Marketing',
    tagline: 'Campaigns, lists & automations',
    icon: Mail,
    available: false,
  },
  {
    id: 'sms',
    label: 'SMS Marketing',
    tagline: 'Bulk & transactional SMS',
    icon: MessageSquare,
    available: false,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Marketing',
    tagline: 'Broadcast lists & templates',
    icon: MessageCircle,
    available: false,
  },
]
