import type { Budget, Category, Transaction } from '@/types/database'

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
  transactions: Transaction[]
): BudgetRow[] {
  const actualByCategory: Record<string, number> = {}
  for (const tx of transactions) {
    if (!tx.category_id || tx.is_transfer) continue
    actualByCategory[tx.category_id] =
      (actualByCategory[tx.category_id] ?? 0) + Math.abs(Number(tx.amount))
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
    .filter(c => categoryIds.has(c.id) && c.kind === 'expense')
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
