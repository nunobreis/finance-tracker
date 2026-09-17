import { describe, it, expect } from 'vitest'
import { buildBudgetRows } from '@/lib/budgets'
import type { Budget, Category, Transaction } from '@/types/database'

const cat = (id: string, name: string): Category => ({
  id, user_id: 'u1', name, kind: 'expense', parent_category_id: null, is_system: true,
})
const budget = (categoryId: string, amount: number): Budget => ({
  id: `b-${categoryId}`, user_id: 'u1', category_id: categoryId,
  period_month: '2026-09-01', amount_eur: amount, rollover: false,
})
const tx = (categoryId: string | null, amount: number, isTransfer = false): Transaction => ({
  id: `t-${Math.random()}`, user_id: 'u1', account_id: 'a1',
  occurred_on: '2026-09-10', amount, currency: 'EUR', description: null,
  merchant: null, category_id: categoryId, is_transfer: isTransfer,
  transfer_pair_id: null, import_batch_id: null, external_id: null,
  source: 'manual', created_at: '2026-09-10T00:00:00Z',
})

describe('buildBudgetRows', () => {
  it('returns one row per budgeted expense category', () => {
    const rows = buildBudgetRows([budget('cat1', 500)], [cat('cat1', 'Housing')], [])
    expect(rows).toHaveLength(1)
    expect(rows[0].budgetEur).toBe(500)
    expect(rows[0].actualEur).toBe(0)
    expect(rows[0].varianceEur).toBe(500)
    expect(rows[0].hasBudget).toBe(true)
  })

  it('includes categories with actual spend but no budget', () => {
    const rows = buildBudgetRows([], [cat('cat1', 'Food')], [tx('cat1', -50)])
    expect(rows).toHaveLength(1)
    expect(rows[0].budgetEur).toBe(0)
    expect(rows[0].actualEur).toBe(50)
    expect(rows[0].hasBudget).toBe(false)
  })

  it('sums multiple transactions for same category', () => {
    const rows = buildBudgetRows(
      [budget('cat1', 200)],
      [cat('cat1', 'Food')],
      [tx('cat1', -30), tx('cat1', -20)]
    )
    expect(rows[0].actualEur).toBe(50)
    expect(rows[0].varianceEur).toBe(150)
  })

  it('excludes transfer transactions from actuals', () => {
    const rows = buildBudgetRows(
      [budget('cat1', 200)],
      [cat('cat1', 'Food')],
      [tx('cat1', -50, true)]
    )
    expect(rows[0].actualEur).toBe(0)
  })

  it('excludes transactions with no category', () => {
    const rows = buildBudgetRows(
      [budget('cat1', 200)],
      [cat('cat1', 'Food')],
      [tx(null, -50)]
    )
    expect(rows[0].actualEur).toBe(0)
  })

  it('sorts rows by budgetEur descending', () => {
    const rows = buildBudgetRows(
      [budget('cat1', 100), budget('cat2', 500)],
      [cat('cat1', 'Food'), cat('cat2', 'Housing')],
      []
    )
    expect(rows[0].budgetEur).toBe(500)
    expect(rows[1].budgetEur).toBe(100)
  })
})
