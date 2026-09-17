import type { SupabaseClient } from '@supabase/supabase-js'
import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance()

export async function refreshPricesIfStale(
  supabase: SupabaseClient,
  holdings: { id: string; symbol: string }[],
  force = false
): Promise<void> {
  if (holdings.length === 0) return

  const today = new Date().toISOString().split('T')[0]

  let staleHoldings = holdings
  if (!force) {
    const { data: freshPrices } = await supabase
      .from('holding_price_history')
      .select('holding_id')
      .in('holding_id', holdings.map(h => h.id))
      .eq('price_date', today)

    const freshIds = new Set((freshPrices ?? []).map(p => p.holding_id))
    staleHoldings = holdings.filter(h => !freshIds.has(h.id))
  }

  if (staleHoldings.length === 0) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  for (const holding of staleHoldings) {
    try {
      const quote = await yf.quote(holding.symbol, {}, { validateResult: false })
      const price = quote.regularMarketPrice
      if (price == null) continue

      await supabase.from('holding_price_history').upsert(
        {
          holding_id: holding.id,
          user_id: user.id,
          price_date: today,
          price,
        },
        { onConflict: 'holding_id,price_date' }
      )
    } catch {
      // Skip silently — stale badge will show on UI
    }
  }
}
