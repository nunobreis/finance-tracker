import { createClient } from '@/lib/supabase/server'

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
    { base_currency: base, quote_currency: quote, rate, rate_date },
    { onConflict: 'rate_date,base_currency,quote_currency' }
  )

  return { rate, rate_date }
}

export async function getRate(base: string, quote: string): Promise<number> {
  const { rate } = await getLatestRateInfo(base, quote)
  return rate
}
