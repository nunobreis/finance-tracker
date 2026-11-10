export type ToEurFn = (amount: number, currency: string) => number

type TxLike = {
  amount: number | string
  currency: string
  category_id: string | null
  is_transfer: boolean
}

function notExcluded(categoryId: string | null, excluded: Set<string>): boolean {
  return categoryId === null || !excluded.has(categoryId)
}

export function computeSpent(
  rows: TxLike[],
  excludedCategoryIds: Set<string>,
  toEur: ToEurFn = (a) => a
): number {
  return rows
    .filter(tx => !tx.is_transfer && Number(tx.amount) < 0 && notExcluded(tx.category_id, excludedCategoryIds))
    .reduce((s, tx) => s + Math.abs(toEur(Number(tx.amount), tx.currency)), 0)
}

export function computeIncome(
  rows: TxLike[],
  excludedCategoryIds: Set<string>,
  toEur: ToEurFn = (a) => a
): number {
  return rows
    .filter(tx => !tx.is_transfer && Number(tx.amount) > 0 && notExcluded(tx.category_id, excludedCategoryIds))
    .reduce((s, tx) => s + toEur(Number(tx.amount), tx.currency), 0)
}
