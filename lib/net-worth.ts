import type { SupabaseClient } from '@supabase/supabase-js'
import { getRate } from '@/lib/exchange-rates'

export type AccountBalance = {
  id: string
  name: string
  currency: string
  balance: number
}

export type HoldingValueInput = {
  id: string
  symbol: string
  currency: string
  latestPrice: number
  quantity: number
}

type AccountBreakdownItem = {
  id: string
  name: string
  balance_native: number
  currency: string
  balance_eur: number
}

type HoldingBreakdownItem = {
  id: string
  symbol: string
  value_native: number
  currency: string
  value_eur: number
}

export type NetWorthBreakdown = {
  accounts: AccountBreakdownItem[]
  holdings: HoldingBreakdownItem[]
}

export function aggregateNetWorth(
  accountBalances: AccountBalance[],
  holdingValues: HoldingValueInput[],
  getEurRate: (currency: string) => number
): { total_eur: number; breakdown: NetWorthBreakdown } {
  const accounts: AccountBreakdownItem[] = accountBalances.map(a => ({
    id: a.id,
    name: a.name,
    balance_native: a.balance,
    currency: a.currency,
    balance_eur: a.balance * getEurRate(a.currency),
  }))

  const holdings: HoldingBreakdownItem[] = holdingValues.map(h => {
    const value_native = h.quantity * h.latestPrice
    return {
      id: h.id,
      symbol: h.symbol,
      value_native,
      currency: h.currency,
      value_eur: value_native * getEurRate(h.currency),
    }
  })

  const total_eur =
    accounts.reduce((s, a) => s + a.balance_eur, 0) +
    holdings.reduce((s, h) => s + h.value_eur, 0)

  return { total_eur, breakdown: { accounts, holdings } }
}

export async function computeNetWorth(
  supabase: SupabaseClient,
  asOf?: string
): Promise<{ total_eur: number; breakdown: NetWorthBreakdown }> {
  // Fetch active accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, currency, opening_balance')
    .eq('is_active', true)

  const accountList = accounts ?? []

  // Derive balances by summing non-transfer transactions per account, optionally up to asOf date
  let txQuery = supabase
    .from('transactions')
    .select('account_id, amount')
    .eq('is_transfer', false)
    .in('account_id', accountList.map(a => a.id))

  if (asOf) txQuery = txQuery.lte('occurred_on', asOf)

  const { data: txData } = await txQuery

  const balanceMap: Record<string, number> = {}
  for (const tx of txData ?? []) {
    balanceMap[tx.account_id] = (balanceMap[tx.account_id] ?? 0) + Number(tx.amount)
  }

  const accountBalances: AccountBalance[] = accountList.map(a => ({
    id: a.id,
    name: a.name,
    currency: a.currency,
    balance: Number(a.opening_balance ?? 0) + (balanceMap[a.id] ?? 0),
  }))

  // Fetch holdings with latest price
  const { data: holdingsData } = await supabase
    .from('holdings')
    .select('id, symbol, currency, quantity')

  const holdingValues: HoldingValueInput[] = []
  for (const h of holdingsData ?? []) {
    const { data: priceRow } = await supabase
      .from('holding_price_history')
      .select('price')
      .eq('holding_id', h.id)
      .order('price_date', { ascending: false })
      .limit(1)
      .single()

    if (priceRow) {
      holdingValues.push({
        id: h.id,
        symbol: h.symbol,
        currency: h.currency,
        latestPrice: Number(priceRow.price),
        quantity: Number(h.quantity),
      })
    }
  }

  // Build rate map for all unique non-EUR currencies
  const currencies = new Set([
    ...accountList.map(a => a.currency),
    ...(holdingsData ?? []).map(h => h.currency),
  ])
  const rateMap: Record<string, number> = { EUR: 1 }
  for (const currency of currencies) {
    if (currency !== 'EUR') {
      rateMap[currency] = await getRate(currency, 'EUR')
    }
  }

  const result = aggregateNetWorth(
    accountBalances,
    holdingValues,
    c => rateMap[c] ?? 1
  )

  // Upsert today's snapshot
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('net_worth_snapshots').upsert(
      {
        user_id: user.id,
        snapshot_date: today,
        total_eur: result.total_eur,
        breakdown: result.breakdown as unknown as Record<string, unknown>,
      },
      { onConflict: 'user_id,snapshot_date' }
    )
  }

  return result
}
