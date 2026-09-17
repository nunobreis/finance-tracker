import type { NormalisedRow } from '@/lib/csv/normalize'

export type ExistingTransaction = {
  occurred_on: string
  amount: number
  currency: string
  external_id: string | null
}

export function flagDuplicates(
  rows: NormalisedRow[],
  existing: ExistingTransaction[]
): boolean[] {
  return rows.map(row => {
    if (row.external_id) {
      // Monzo: exact match on external_id
      return existing.some(e => e.external_id === row.external_id)
    }
    // Revolut: soft match on date + amount + currency
    return existing.some(
      e =>
        e.occurred_on === row.occurred_on &&
        Math.abs(e.amount - row.amount) < 0.001 &&
        e.currency === row.currency
    )
  })
}
