import type { NormalisedRow } from '@/lib/csv/normalize'
import { parseAmount, extractDate } from '@/lib/csv/normalize'

// Revolut types that represent internal/own-account movements
const REVOLUT_TRANSFER_TYPES = new Set(['TRANSFER', 'EXCHANGE'])

export function parseRevolut(records: Record<string, string>[]): NormalisedRow[] {
  return records
    .filter(r => {
      const state = (r['State'] || r['Estado'] || '').trim()
      const completedDate = (r['Completed Date'] || r['Data de Conclusão'] || '').trim()
      return (state === 'COMPLETED' || state === 'CONCLUÍDA') && completedDate
    })
    .map(r => {
      const raw = r['Description'] || r['Descrição'] || ''
      const description = raw.trim() || null
      const type = (r['Type'] || r['Tipo'] || '').trim().toUpperCase()
      return {
        occurred_on: extractDate(r['Completed Date'] || r['Data de Conclusão'] || ''),
        amount: parseAmount(r['Amount'] || r['Montante'] || '0'),
        currency: (r['Currency'] || r['Moeda'] || 'EUR').trim(),
        description,
        merchant: description,
        external_id: null,
        is_transfer: REVOLUT_TRANSFER_TYPES.has(type),
        raw_category: null,
      }
    })
}
