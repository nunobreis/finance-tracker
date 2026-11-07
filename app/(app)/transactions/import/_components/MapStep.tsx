'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import type { NormalisedRow } from '@/lib/csv/normalize'

type Format = 'revolut' | 'monzo'

type MappingCard = {
  appLabel: string
  csvColumn: string
  sampleKey: string | null
}

const REVOLUT_MAPPING: MappingCard[] = [
  { appLabel: 'Occurred Date',      csvColumn: 'Completed Date',                  sampleKey: 'Completed Date' },
  { appLabel: 'Merchant / Payee',   csvColumn: 'Description',                     sampleKey: 'Description' },
  { appLabel: 'Amount (Signed)',     csvColumn: 'Amount',                          sampleKey: 'Amount' },
  { appLabel: 'Native Currency',    csvColumn: 'Currency',                        sampleKey: 'Currency' },
  { appLabel: 'Transfer Detection', csvColumn: 'Type == "TRANSFER"',               sampleKey: 'Type' },
]

const MONZO_MAPPING: MappingCard[] = [
  { appLabel: 'Occurred Date',      csvColumn: 'Date',                            sampleKey: 'Date' },
  { appLabel: 'Merchant / Payee',   csvColumn: 'Name',                            sampleKey: 'Name' },
  { appLabel: 'Amount (Signed)',     csvColumn: 'Amount',                          sampleKey: 'Amount' },
  { appLabel: 'Native Currency',    csvColumn: 'Currency',                        sampleKey: 'Currency' },
  { appLabel: 'Transfer Detection', csvColumn: 'Type == "pot_transfer"',           sampleKey: 'Type' },
]

type Props = {
  format: Format
  rows: NormalisedRow[]
  records: Record<string, string>[]
  onBack: () => void
  onNext: () => void
}

export function MapStep({ format, rows, records, onBack, onNext }: Props) {
  const t = useTranslations('Transactions')
  const mapping = format === 'revolut' ? REVOLUT_MAPPING : MONZO_MAPPING
  const sample = records[0] ?? {}
  const dates = rows.map(r => r.occurred_on).filter(Boolean).sort()
  const minDate = dates[0]
  const maxDate = dates[dates.length - 1]

  return (
    <div className="flex flex-col gap-6">
      {/* Format detection badge */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-teal px-3 py-1 text-caption font-semibold text-white">
          {format === 'revolut' ? 'Revolut' : 'Monzo'}
        </span>
        <span className="text-caption text-text-secondary">
          {rows.length} rows · {minDate} → {maxDate}
        </span>
      </div>

      {/* Mapping cards */}
      <div className="flex flex-col gap-2">
        {mapping.map(card => {
          const sampleValue = card.sampleKey ? sample[card.sampleKey] : null
          return (
            <div
              key={card.appLabel}
              className="rounded-[12px] bg-canvas px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-semibold text-ink">{card.appLabel}</span>
                  <span className="text-caption text-text-secondary font-mono">{card.csvColumn}</span>
                </div>
                {sampleValue !== undefined && sampleValue !== null && sampleValue !== '' && (
                  <span className="text-caption text-text-muted font-mono text-right">
                    e.g. {sampleValue}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack} className="flex-1">
          {t('import.back')}
        </Button>
        <Button variant="primary" size="lg" onClick={onNext} className="flex-1">
          Preview {rows.length} rows
        </Button>
      </div>
    </div>
  )
}
