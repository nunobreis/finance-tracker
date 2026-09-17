import type { NormalisedRow } from '@/lib/csv/normalize'
import { parseAmount, extractDate } from '@/lib/csv/normalize'

export function parseRevolut(records: Record<string, string>[]): NormalisedRow[] {
  return records
    .filter(r => r['State']?.trim() === 'COMPLETED')
    .map(r => ({
      occurred_on: extractDate(r['Completed Date'] ?? ''),
      amount: parseAmount(r['Amount'] ?? '0'),
      currency: r['Currency']?.trim() ?? 'GBP',
      description: r['Description']?.trim() || null,
      merchant: r['Description']?.trim() || null,
      external_id: null,
      is_transfer: r['Type']?.trim() === 'TRANSFER',
      raw_category: null,
    }))
}
