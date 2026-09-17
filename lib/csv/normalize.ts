export type NormalisedRow = {
  occurred_on: string        // 'YYYY-MM-DD'
  amount: number             // signed — negative = debit, positive = credit
  currency: string           // 3-char ISO code e.g. 'GBP'
  description: string | null
  merchant: string | null
  external_id: string | null // Monzo Transaction ID; null for Revolut
  is_transfer: boolean
  raw_category: string | null // Monzo raw category string before mapping; null for Revolut
}

export function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[^0-9.-]/g, ''))
}

export function extractDate(raw: string): string {
  // Handles '2026-09-01 10:30:00', '2026-09-01T10:30:00', '2026-09-01'
  return raw.trim().split(/[ T]/)[0]
}
