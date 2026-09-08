/** @type {readonly ['static', 'carousel', 'reel', 'video']} */
export const POST_FORMATS = ['static', 'carousel', 'reel', 'video']
/** @typedef {(typeof POST_FORMATS)[number]} PostFormat */
/** @typedef {PostFormat | 'unclassified'} FormatKey */
/** @type {readonly FormatKey[]} */
export const FORMAT_KEYS = [...POST_FORMATS, 'unclassified']
/** @type {Record<FormatKey, string>} */
export const FORMAT_LABELS = { static: 'Static', carousel: 'Carousel', reel: 'Reel', video: 'Video', unclassified: 'Not classified' }
/** @type {Record<FormatKey, string>} */
export const FORMAT_COLORS = { static: '#7350a5', carousel: '#14835f', reel: '#b52b79', video: '#087f93', unclassified: '#70647e' }
/** @param {unknown} value @returns {value is PostFormat} */
export function isPostFormat(value) { return typeof value === 'string' && /** @type {readonly string[]} */ (POST_FORMATS).includes(value) }
/** @param {unknown} value @returns {FormatKey | undefined} */
export function parseFormatFilter(value) { return value === 'unclassified' || isPostFormat(value) ? value : undefined }
/** @typedef {{ principal_id: string, principal_name: string, format: FormatKey, implemented: number, pending: number }} FormatRollup */
