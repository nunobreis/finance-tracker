export type HoldingComputed = {
  value_eur: number
  cost_eur: number
  pnl_eur: number
  pnl_pct: number
}

export function computeHoldingValue(
  qty: number,
  latestPrice: number,
  avgCostBasis: number | null,
  eurRate: number
): HoldingComputed {
  const value_eur = qty * latestPrice * eurRate
  const cost_eur = avgCostBasis !== null ? qty * avgCostBasis * eurRate : 0
  const pnl_eur = avgCostBasis !== null ? value_eur - cost_eur : 0
  const pnl_pct = cost_eur > 0 ? (pnl_eur / cost_eur) * 100 : 0
  return { value_eur, cost_eur, pnl_eur, pnl_pct }
}
