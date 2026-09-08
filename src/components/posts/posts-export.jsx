'use client'

import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'
import { usePostsList } from '@/components/posts/posts-list-context'
import { buttonClasses } from '@/components/ui/button'
import { FORMAT_LABELS } from '@/lib/post-formats'
import { STATUS_LABELS } from '@/lib/status'
import { CHANNEL_LABELS } from '@/lib/channels'

export function PostsExport() {
  const { items } = usePostsList()
  function download() {
    const workbook = XLSX.utils.book_new()
    const rows = items.map((post) => ({ 'Post name': post.name, Description: post.description ?? '', Brand: post.principalName, Product: post.productName ?? '', Channels: post.channels.map((channel) => CHANNEL_LABELS[channel]).join(', '), Date: post.postDate, Status: STATUS_LABELS[post.status], 'Post format': FORMAT_LABELS[post.format ?? 'unclassified'] }))
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows, { header: ['Post name', 'Description', 'Brand', 'Product', 'Channels', 'Date', 'Status', 'Post format'] }), 'Posts')
    XLSX.writeFile(workbook, 'inkarp-posts.xlsx')
  }
  return <button type="button" data-print="hide" onClick={download} className={buttonClasses({ variant: 'secondary' })}><Download aria-hidden="true" className="size-4" />Export posts</button>
}
