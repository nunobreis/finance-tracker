'use client'

import type { NormalisedRow } from '@/lib/csv/normalize'

type Format = 'revolut' | 'monzo'

const REVOLUT_MAPPING = [
  { app: 'Date',        csv: 'Completed Date' },
  { app: 'Amount',      csv: 'Amount' },
  { app: 'Currency',    csv: 'Currency' },
  { app: 'Description', csv: 'Description' },
  { app: 'Transfer?',   csv: 'Type == "TRANSFER"' },
  { app: 'Status',      csv: 'State (COMPLETED only imported)' },
]

const MONZO_MAPPING = [
  { app: 'Date',         csv: 'Date' },
  { app: 'Amount',       csv: 'Amount' },
  { app: 'Currency',     csv: 'Currency' },
  { app: 'Merchant',     csv: 'Name' },
  { app: 'Description',  csv: 'Description' },
  { app: 'Category',     csv: 'Category (auto-mapped)' },
  { app: 'External ID',  csv: 'Transaction ID' },
  { app: 'Transfer?',    csv: 'Type == "pot_transfer"' },
]

type Props = {
  format: Format
  rows: NormalisedRow[]
  onBack: () => void
  onNext: () => void
}

export function MapStep({ format, rows, onBack, onNext }: Props) {
  const mapping = format === 'revolut' ? REVOLUT_MAPPING : MONZO_MAPPING
  const dates = rows.map(r => r.occurred_on).filter(Boolean).sort()
  const minDate = dates[0]
  const maxDate = dates[dates.length - 1]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 rounded-lg bg-accent-light px-4 py-3">
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
          {format === 'revolut' ? 'Revolut' : 'Monzo'}
        </span>
        <span className="text-sm text-text-secondary">
          {rows.length} rows · {minDate} → {maxDate}
        </span>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-text-primary">Column mapping</h3>
        <div className="overflow-hidden rounded-lg border border-border-col">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-col bg-content-bg">
                <th className="px-4 py-2 text-left text-xs font-medium text-text-tertiary">App field</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-tertiary">CSV column</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-col">
              {mapping.map(row => (
                <tr key={row.app}>
                  <td className="px-4 py-2 font-medium text-text-primary">{row.app}</td>
                  <td className="px-4 py-2 font-mono text-xs text-text-secondary">{row.csv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-lg border border-border-col py-2 text-sm font-medium text-text-primary hover:bg-content-bg">Back</button>
        <button onClick={onNext} className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90">Next: Preview rows</button>
      </div>
    </div>
  )
}
