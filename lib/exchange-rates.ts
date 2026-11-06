import { createClient } from '@/lib/supabase/server'

export function fillCalendarDays(
  ecbRates: Record<string, number>,
  from: string,
  to: string,
  existingDates?: Set<string>
): Array<{ rate_date: string; source_date: string; rate: number }> {
  const ecbDatesSorted = Object.keys(ecbRates).sort()
  if (ecbDatesSorted.length === 0) return []

  const rows: Array<{ rate_date: string; source_date: string; rate: number }> = []
  const cursor = new Date(from + 'T00:00:00Z')
  const end = new Date(to + 'T00:00:00Z')

  while (cursor <= end) {
    const day = cursor.toISOString().split('T')[0]
    if (!existingDates?.has(day)) {
      const source_date = ecbDatesSorted.filter(d => d <= day).at(-1)
      if (source_date) {
        rows.push({ rate_date: day, source_date, rate: ecbRates[source_date] })
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return rows
}

export async function getRateOn(
  base: string,
  quote: string,
  date: string
): Promise<number | null> {
  if (base === quote) return 1

  const supabase = await createClient()

  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', base)
    .eq('quote_currency', quote)
    .eq('rate_date', date)
    .single()

  if (cached) return Number(cached.rate)

  try {
    const res = await fetch(
      `https://api.frankfurter.app/${date}?from=${base}&to=${quote}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json() as { date: string; rates: Record<string, number> }
    const rate = data.rates[quote]
    if (rate == null) return null

    await supabase.from('exchange_rates').upsert(
      { base_currency: base, quote_currency: quote, rate, rate_date: date, source_date: data.date },
      { onConflict: 'rate_date,base_currency,quote_currency' }
    )
    return rate
  } catch {
    return null
  }
}

export async function ensureRatesForRange(
  base: string,
  quote: string,
  from: string,
  to: string
): Promise<void> {
  if (base === quote) return

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('exchange_rates')
    .select('rate_date')
    .eq('base_currency', base)
    .eq('quote_currency', quote)
    .gte('rate_date', from)
    .lte('rate_date', to)

  const existingDates = new Set((existing ?? []).map(r => r.rate_date as string))

  // Fetch 7 days before `from` so a range starting on a weekend/holiday
  // still gets the preceding business day's rate from the lookback window.
  const lookbackDate = new Date(from + 'T00:00:00Z')
  lookbackDate.setUTCDate(lookbackDate.getUTCDate() - 7)
  const fetchFrom = lookbackDate.toISOString().split('T')[0]

  try {
    const res = await fetch(
      `https://api.frankfurter.app/${fetchFrom}..${to}?from=${base}&to=${quote}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return
    const data = await res.json() as { rates: Record<string, Record<string, number>> }

    const ecbRates: Record<string, number> = {}
    for (const [d, rates] of Object.entries(data.rates)) {
      if (rates[quote] != null) ecbRates[d] = rates[quote]
    }

    const rows = fillCalendarDays(ecbRates, from, to, existingDates)

    if (rows.length > 0) {
      await supabase.from('exchange_rates').upsert(
        rows.map(r => ({ ...r, base_currency: base, quote_currency: quote })),
        { onConflict: 'rate_date,base_currency,quote_currency', ignoreDuplicates: true }
      )
    }
  } catch {
    // best-effort — caller can retry individual days via getRateOn
  }
}

export async function getLatestRateInfo(
  base: string,
  quote: string
): Promise<{ rate: number; rate_date: string }> {
  if (base === quote) {
    return { rate: 1, rate_date: new Date().toISOString().split('T')[0] }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('rate, rate_date')
    .eq('base_currency', base)
    .eq('quote_currency', quote)
    .eq('rate_date', today)
    .single()

  if (cached) return { rate: Number(cached.rate), rate_date: cached.rate_date }

  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${base}&to=${quote}`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`)
  const data = await res.json() as { date: string; rates: Record<string, number> }
  const rate = data.rates[quote]
  if (rate == null) throw new Error(`Frankfurter did not return a rate for ${base}/${quote}`)
  const rate_date = data.date

  await supabase.from('exchange_rates').upsert(
    { base_currency: base, quote_currency: quote, rate, rate_date, source_date: data.date },
    { onConflict: 'rate_date,base_currency,quote_currency' }
  )

  return { rate, rate_date }
}

export async function getRate(base: string, quote: string): Promise<number> {
  const { rate } = await getLatestRateInfo(base, quote)
  return rate
}
