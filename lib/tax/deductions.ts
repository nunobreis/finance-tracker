export function getDeductibleSpend(
  transactions: Array<{
    amount: number
    currency: string
    category_id: string | null
    is_transfer: boolean
    irs_deduction_override?: string | null
  }>,
  categories: Array<{
    id: string
    irs_deduction?: string | null
  }>
): Record<string, number> {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.irs_deduction ?? null]))
  const result: Record<string, number> = {}

  for (const tx of transactions) {
    if (tx.is_transfer || tx.amount >= 0 || tx.currency !== 'EUR') continue
    const deductionType =
      tx.irs_deduction_override ??
      (tx.category_id != null ? (catMap[tx.category_id] ?? null) : null)
    if (!deductionType || deductionType === 'none') continue
    result[deductionType] = (result[deductionType] ?? 0) + Math.abs(tx.amount)
  }

  return result
}
