import type { NormalisedRow } from '@/lib/csv/normalize'
import { parseAmount, extractDate } from '@/lib/csv/normalize'

// Monzo types that represent internal/own-account movements (pots, round-ups, Monzo Pay)
const MONZO_TRANSFER_TYPES = new Set([
  'pot_transfer',
  'pot_payment',
  'round_up',
  'monzo_to_monzo',
])

export function parseMonzo(records: Record<string, string>[]): NormalisedRow[] {
  return records.filter(r => r['Date']?.trim()).map(r => {
    const name = r['Name']?.trim() || null
    const description = r['Description']?.trim() || null
    const type = r['Type']?.trim() ?? ''
    return {
      occurred_on: extractDate(r['Date'] ?? ''),
      amount: parseAmount(r['Amount'] ?? '0'),
      currency: r['Currency']?.trim() ?? 'GBP',
      description,
      merchant: name ?? description,
      external_id: r['Transaction ID']?.trim() || null,
      is_transfer: MONZO_TRANSFER_TYPES.has(type),
      raw_category: r['Category']?.trim() || null,
    }
  })
}
