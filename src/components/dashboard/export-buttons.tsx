'use client'

import { Download, Printer } from 'lucide-react'
import * as XLSX from 'xlsx'
import { buttonClasses } from '@/components/ui/button'
import type { RollupDimension, RollupRow } from '@/lib/types'

const SHEETS: { dimension: RollupDimension; name: string }[] = [
  { dimension: 'principal', name: 'By Principal' },
  { dimension: 'group', name: 'By Group' },
  { dimension: 'manager', name: 'By Product Manager' },
  { dimension: 'product', name: 'By Product' },
  { dimension: 'campaign', name: 'By Campaign' },
]

/**
 * "Download as a spreadsheet and as a printable PDF" (brief 5.1). Both are
 * viewer-facing — exporting a report is not an editing action, so unlike "Add
 * post" these are never gated behind `EditorOnly`.
 *
 * The spreadsheet is built client-side from the rows already on the page —
 * no extra round trip. The PDF path is `window.print()` against the print
 * stylesheet already in globals.css: every piece of chrome not meant for
 * paper carries `data-print="hide"`.
 */
export function ExportButtons({ rows, filename }: { rows: RollupRow[]; filename: string }) {
  function exportSpreadsheet() {
    const workbook = XLSX.utils.book_new()

    for (const sheet of SHEETS) {
      const sheetRows = rows
        .filter((row) => row.dimension === sheet.dimension)
        .map((row) => ({
          Name: row.label,
          Planned: row.planned,
          Implemented: row.implemented,
          Pending: row.pending,
        }))
      const worksheet = XLSX.utils.json_to_sheet(
        sheetRows.length > 0 ? sheetRows : [{ Name: 'No activity in this period', Planned: '', Implemented: '', Pending: '' }],
      )
      worksheet['!cols'] = [{ wch: 32 }, { wch: 10 }, { wch: 12 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
    }

    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  return (
    <div data-print="hide" className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={exportSpreadsheet} className={buttonClasses({ variant: 'secondary' })}>
        <Download aria-hidden strokeWidth={1.75} className="size-4" />
        Export spreadsheet
      </button>
      <button type="button" onClick={() => window.print()} className={buttonClasses({ variant: 'secondary' })}>
        <Printer aria-hidden strokeWidth={1.75} className="size-4" />
        Download PDF
      </button>
    </div>
  )
}
