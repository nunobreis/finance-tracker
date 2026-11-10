import type { Budget, Category, Transaction } from '@/types/database'
import type { ToEurFn } from '@/lib/summary'

export type BudgetRow = {
  category: Category
  budgetEur: number
  actualEur: number
  varianceEur: number
  hasBudget: boolean
}

export function buildBudgetRows(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
  toEur: ToEurFn = (a) => a,
  excludedCategoryIds: Set<string> = new Set()
): BudgetRow[] {
  const actualByCategory: Record<string, number> = {}
  for (const tx of transactions) {
    if (!tx.category_id || tx.is_transfer) continue
    if (excludedCategoryIds.has(tx.category_id)) continue
    actualByCategory[tx.category_id] =
      (actualByCategory[tx.category_id] ?? 0) + Math.abs(toEur(Number(tx.amount), tx.currency))
  }

  const budgetByCategory: Record<string, Budget> = {}
  for (const b of budgets) {
    budgetByCategory[b.category_id] = b
  }

  const categoryIds = new Set([
    ...budgets.map(b => b.category_id),
    ...Object.keys(actualByCategory),
  ])

  return categories
    .filter(c => categoryIds.has(c.id) && c.kind === 'expense' && !excludedCategoryIds.has(c.id))
    .map(category => {
      const budget = budgetByCategory[category.id]
      const budgetEur = budget ? Number(budget.amount_eur) : 0
      const actualEur = actualByCategory[category.id] ?? 0
      return {
        category,
        budgetEur,
        actualEur,
        varianceEur: budgetEur - actualEur,
        hasBudget: !!budget,
      }
    })
    .sort((a, b) => b.budgetEur - a.budgetEur)
}
