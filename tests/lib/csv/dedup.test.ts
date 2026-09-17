import { describe, it, expect } from 'vitest'
import { flagDuplicates } from '@/lib/csv/dedup'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { ExistingTransaction } from '@/lib/csv/dedup'

const makeRow = (overrides: Partial<NormalisedRow> = {}): NormalisedRow => ({
  occurred_on: '2026-09-01',
  amount: -25.5,
  currency: 'GBP',
  description: null,
  merchant: null,
  external_id: null,
  is_transfer: false,
  raw_category: null,
  ...overrides,
})

const existing: ExistingTransaction[] = [
  { occurred_on: '2026-09-01', amount: -25.5,  currency: 'GBP', external_id: null },
  { occurred_on: '2026-09-02', amount: -10.0,  currency: 'GBP', external_id: 'tx_abc' },
]

describe('flagDuplicates', () => {
  it('flags soft duplicate by date + amount + currency (Revolut style)', () => {
    expect(flagDuplicates([makeRow()], existing)).toEqual([true])
  })

  it('flags exact duplicate by external_id (Monzo style)', () => {
    const row = makeRow({ occurred_on: '2026-09-02', amount: -10.0, external_id: 'tx_abc' })
    expect(flagDuplicates([row], existing)).toEqual([true])
  })

  it('does not flag a new transaction', () => {
    const row = makeRow({ occurred_on: '2026-09-03', amount: -50.0 })
    expect(flagDuplicates([row], existing)).toEqual([false])
  })

  it('does not flag when external_id differs even if date/amount match', () => {
    // Row with an external_id does exact-match only — different ID = not a dup
    const row = makeRow({ external_id: 'tx_different' })
    expect(flagDuplicates([row], existing)).toEqual([false])
  })

  it('handles empty existing list', () => {
    expect(flagDuplicates([makeRow()], [])).toEqual([false])
  })

  it('handles multiple rows, mixed results', () => {
    const rows = [makeRow(), makeRow({ occurred_on: '2026-09-05', amount: -99 })]
    expect(flagDuplicates(rows, existing)).toEqual([true, false])
  })
})
