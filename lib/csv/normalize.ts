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
  const s = raw.trim().split(/[ T]/)[0]
  // Convert DD/MM/YYYY → YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/')
    return `${yyyy}-${mm}-${dd}`
  }
  return s
}
