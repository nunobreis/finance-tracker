import type { NormalisedRow } from '@/lib/csv/normalize'
import { parseAmount, extractDate } from '@/lib/csv/normalize'

export function parseMonzo(records: Record<string, string>[]): NormalisedRow[] {
  return records.filter(r => r['Date']?.trim()).map(r => {
    const name = r['Name']?.trim() || null
    const description = r['Description']?.trim() || null
    return {
      occurred_on: extractDate(r['Date'] ?? ''),
      amount: parseAmount(r['Amount'] ?? '0'),
      currency: r['Currency']?.trim() ?? 'GBP',
      description,
      merchant: name ?? description,
      external_id: r['Transaction ID']?.trim() || null,
      is_transfer: r['Type']?.trim() === 'pot_transfer',
      raw_category: r['Category']?.trim() || null,
    }
  })
}
