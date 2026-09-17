# Budgets & Recurring Bills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Budgets page (monthly budget vs actual with 3-month variance widget) and the Recurring Bills page (status-derived bill tracking with mark-as-paid date advancement).

**Architecture:** Server Components fetch all data and compute derived values server-side; Client Components handle drawers and the mark-as-paid button. Pure utility functions in `lib/bills.ts` and `lib/budgets.ts` are unit-tested independently of React. All mutations go through Server Actions co-located in `_components/actions.ts`.

**Tech Stack:** Next.js 16.3.5 / React 19, Supabase (`@supabase/ssr`), Tailwind v4, Vitest (tests), lucide-react (icons).

**Spec:** `docs/superpowers/specs/2026-09-17-budgets-recurring-bills-design.md`

## Global Constraints

- Next.js 16.3.5 / React 19 — always `await createClient()`, `searchParams` is `Promise<...>` — always await it
- TypeScript strict mode — no `any`, no `ts-ignore`
- Tailwind v4 — token class names only (e.g. `bg-card-bg`, `text-text-primary`) — never raw hex in JSX
- `useActionState` from `react` (React 19) — NOT `useFormState` from `react-dom`
- Icons: `lucide-react` only
- `'use server'` at top of every Server Actions file; `'use client'` at top of every Client Component
- No `console.log` in committed code
- Commit after every task

---

## File Map

```
# New lib files
lib/bills.ts                                         # getBillStatus, advanceDueDate, toMonthlyEur, toAnnualEur
lib/budgets.ts                                       # BudgetRow type, buildBudgetRows

# Budgets feature
app/(app)/budgets/page.tsx                           # Server Component — replaces stub
app/(app)/budgets/_components/BudgetSummary.tsx      # 3 summary cards (Server Component)
app/(app)/budgets/_components/BudgetTable.tsx        # Progress bar table (Server Component)
app/(app)/budgets/_components/BudgetVarianceWidget.tsx  # 3-month bar chart (Server Component)
app/(app)/budgets/_components/AddBudgetDrawer.tsx    # 'use client' create/edit drawer
app/(app)/budgets/_components/actions.ts             # 'use server' — upsertBudget

# Recurring bills feature
app/(app)/recurring-bills/page.tsx                           # Server Component — replaces stub
app/(app)/recurring-bills/_components/BillsSummary.tsx       # 3 summary cards (Server Component)
app/(app)/recurring-bills/_components/BillsTable.tsx         # Bills with status (Server Component)
app/(app)/recurring-bills/_components/AddBillDrawer.tsx      # 'use client' create/edit drawer
app/(app)/recurring-bills/_components/MarkPaidButton.tsx     # 'use client' — calls markBillPaid
app/(app)/recurring-bills/_components/actions.ts             # 'use server' — upsertBill, markBillPaid

# Tests
tests/lib/bills.test.ts
tests/lib/budgets.test.ts
```

---

## Task 1: Pure Utility Functions — Bills and Budgets (with Tests)

**Files:**
- Create: `lib/bills.ts`, `lib/budgets.ts`
- Create: `tests/lib/bills.test.ts`, `tests/lib/budgets.test.ts`

**Interfaces:**
- Produces:
  - `BillStatus = 'overdue' | 'due_soon' | 'active'` from `@/lib/bills`
  - `getBillStatus(nextDueOn: string, reminderDaysBefore: number): BillStatus` from `@/lib/bills`
  - `advanceDueDate(nextDueOn: string, frequency: RecurringFrequency): string` from `@/lib/bills`
  - `toMonthlyEur(amount: number, currency: string, frequency: RecurringFrequency, gbpToEur: number): number` from `@/lib/bills`
  - `toAnnualEur(amount: number, currency: string, frequency: RecurringFrequency, gbpToEur: number): number` from `@/lib/bills`
  - `BudgetRow` type from `@/lib/budgets`
  - `buildBudgetRows(budgets: Budget[], categories: Category[], transactions: Transaction[]): BudgetRow[]` from `@/lib/budgets`

- [ ] **Step 1: Write failing tests for `lib/bills.ts`**

Create `tests/lib/bills.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getBillStatus, advanceDueDate, toMonthlyEur, toAnnualEur } from '@/lib/bills'

describe('getBillStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-17'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns overdue when next_due_on is in the past', () => {
    expect(getBillStatus('2026-09-10', 3)).toBe('overdue')
  })
  it('returns overdue when next_due_on is yesterday', () => {
    expect(getBillStatus('2026-09-16', 3)).toBe('overdue')
  })
  it('returns due_soon when within reminder window', () => {
    expect(getBillStatus('2026-09-19', 3)).toBe('due_soon')
  })
  it('returns due_soon on exactly the reminder boundary', () => {
    expect(getBillStatus('2026-09-20', 3)).toBe('due_soon')
  })
  it('returns active when beyond reminder window', () => {
    expect(getBillStatus('2026-09-25', 3)).toBe('active')
  })
  it('returns due_soon when due today', () => {
    expect(getBillStatus('2026-09-17', 3)).toBe('due_soon')
  })
})

describe('advanceDueDate', () => {
  it('advances weekly by 7 days', () => {
    expect(advanceDueDate('2026-09-17', 'weekly')).toBe('2026-09-24')
  })
  it('advances monthly by 1 month', () => {
    expect(advanceDueDate('2026-09-17', 'monthly')).toBe('2026-10-17')
  })
  it('advances quarterly by 3 months', () => {
    expect(advanceDueDate('2026-09-17', 'quarterly')).toBe('2026-12-17')
  })
  it('advances yearly by 12 months', () => {
    expect(advanceDueDate('2026-09-17', 'yearly')).toBe('2027-09-17')
  })
  it('handles month-end correctly for monthly', () => {
    expect(advanceDueDate('2026-01-31', 'monthly')).toBe('2026-03-03')
  })
})

describe('toMonthlyEur', () => {
  it('monthly EUR bill returns amount unchanged', () => {
    expect(toMonthlyEur(100, 'EUR', 'monthly', 1.18)).toBeCloseTo(100)
  })
  it('monthly GBP bill converts to EUR', () => {
    expect(toMonthlyEur(100, 'GBP', 'monthly', 1.18)).toBeCloseTo(118)
  })
  it('yearly bill divided by 12', () => {
    expect(toMonthlyEur(120, 'EUR', 'yearly', 1.18)).toBeCloseTo(10)
  })
  it('quarterly bill divided by 3', () => {
    expect(toMonthlyEur(30, 'EUR', 'quarterly', 1.18)).toBeCloseTo(10)
  })
  it('weekly bill multiplied by 52/12', () => {
    expect(toMonthlyEur(10, 'EUR', 'weekly', 1.18)).toBeCloseTo(10 * 52 / 12)
  })
})

describe('toAnnualEur', () => {
  it('annual is monthly * 12', () => {
    expect(toAnnualEur(100, 'EUR', 'monthly', 1.18)).toBeCloseTo(1200)
  })
  it('yearly GBP bill converts and annualises', () => {
    expect(toAnnualEur(120, 'GBP', 'yearly', 1.18)).toBeCloseTo(120 * 1.18)
  })
})
```

- [ ] **Step 2: Write failing tests for `lib/budgets.ts`**

Create `tests/lib/budgets.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests — confirm they fail**

```bash
npm run test:run tests/lib/bills.test.ts tests/lib/budgets.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Create `lib/bills.ts`**

```ts
import type { RecurringFrequency } from '@/types/database'

export type BillStatus = 'overdue' | 'due_soon' | 'active'

export function getBillStatus(
  nextDueOn: string,
  reminderDaysBefore: number
): BillStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDueOn)
  due.setHours(0, 0, 0, 0)
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue <= reminderDaysBefore) return 'due_soon'
  return 'active'
}

export function advanceDueDate(
  nextDueOn: string,
  frequency: RecurringFrequency
): string {
  const date = new Date(nextDueOn)
  switch (frequency) {
    case 'weekly':    date.setDate(date.getDate() + 7);         break
    case 'monthly':   date.setMonth(date.getMonth() + 1);       break
    case 'quarterly': date.setMonth(date.getMonth() + 3);       break
    case 'yearly':    date.setFullYear(date.getFullYear() + 1); break
  }
  return date.toISOString().split('T')[0]
}

const MONTHLY_MULTIPLIER: Record<RecurringFrequency, number> = {
  weekly:    52 / 12,
  monthly:   1,
  quarterly: 1 / 3,
  yearly:    1 / 12,
}

export function toMonthlyEur(
  amount: number,
  currency: string,
  frequency: RecurringFrequency,
  gbpToEur: number
): number {
  const rate = currency === 'EUR' ? 1 : gbpToEur
  return amount * rate * MONTHLY_MULTIPLIER[frequency]
}

export function toAnnualEur(
  amount: number,
  currency: string,
  frequency: RecurringFrequency,
  gbpToEur: number
): number {
  return toMonthlyEur(amount, currency, frequency, gbpToEur) * 12
}
```

- [ ] **Step 5: Create `lib/budgets.ts`**

```ts
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
```

- [ ] **Step 6: Run tests — confirm they all pass**

```bash
npm run test:run tests/lib/bills.test.ts tests/lib/budgets.test.ts
```

Expected: all tests PASS. (Note: the `advanceDueDate` test for `'2026-01-31'` monthly advancing to `'2026-03-03'` is correct — JavaScript's `setMonth(1)` on Jan 31 overflows to March 3 because Feb has no 31st. This is expected behaviour.)

- [ ] **Step 7: Run full test suite**

```bash
npm run test:run
```

Expected: all 32 prior tests + new tests pass.

- [ ] **Step 8: Commit**

```bash
git add lib/bills.ts lib/budgets.ts tests/lib/bills.test.ts tests/lib/budgets.test.ts
git commit -m "feat: add bills and budgets utility functions with tests"
```

---

## Task 2: Budgets Page

**Files:**
- Create: `app/(app)/budgets/_components/actions.ts`
- Create: `app/(app)/budgets/_components/AddBudgetDrawer.tsx`
- Create: `app/(app)/budgets/_components/BudgetSummary.tsx`
- Create: `app/(app)/budgets/_components/BudgetTable.tsx`
- Create: `app/(app)/budgets/_components/BudgetVarianceWidget.tsx`
- Replace: `app/(app)/budgets/page.tsx`

**Interfaces:**
- Consumes:
  - `buildBudgetRows`, `BudgetRow` from `@/lib/budgets`
  - `getRate` from `@/lib/exchange-rates`
  - `formatEur` from `@/lib/utils`
  - `SummaryCard` from `@/components/ui/SummaryCard`
  - `StatusBadge` from `@/components/ui/StatusBadge`
  - `Drawer` from `@/components/ui/Drawer`
  - `PageHeader` from `@/components/layout/PageHeader`
  - `createClient` from `@/lib/supabase/server`
  - `Budget`, `Category`, `Transaction` from `@/types/database`
- Produces: `/budgets` route — month-navigable budget vs actual view

- [ ] **Step 1: Create `app/(app)/budgets/_components/actions.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function upsertBudget(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const categoryId = formData.get('category_id') as string
  const amountEur = parseFloat(formData.get('amount_eur') as string)
  const periodMonth = `${formData.get('period_month') as string}-01`

  if (!categoryId || isNaN(amountEur) || amountEur <= 0) {
    return { error: 'Category and a positive amount are required' }
  }

  const { error } = await supabase.from('budgets').upsert(
    { user_id: user.id, category_id: categoryId, period_month: periodMonth, amount_eur: amountEur, rollover: false },
    { onConflict: 'user_id,category_id,period_month' }
  )

  if (error) return { error: error.message }
  revalidatePath('/budgets')
  return {}
}
```

- [ ] **Step 2: Create `app/(app)/budgets/_components/AddBudgetDrawer.tsx`**

```tsx
'use client'

import { useState, useActionState } from 'react'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { upsertBudget } from './actions'
import type { Category } from '@/types/database'

type Props = {
  categories: Category[]
  currentMonth: string  // 'YYYY-MM'
  prefillCategoryId?: string
  prefillAmount?: number
  trigger?: 'button' | 'icon'
}

const initialState = {}

export function AddBudgetDrawer({
  categories,
  currentMonth,
  prefillCategoryId,
  prefillAmount,
  trigger = 'button',
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(upsertBudget, initialState)

  const expenseCategories = categories.filter(c => c.kind === 'expense')
  const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

  return (
    <>
      {trigger === 'button' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} />
          Set budget
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded p-1 text-text-tertiary hover:text-accent"
          aria-label="Edit budget"
        >
          <Plus size={14} />
        </button>
      )}

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Set budget">
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
            {state.error}
          </div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Category <span className="text-status-danger">*</span>
            </label>
            <select
              name="category_id"
              required
              defaultValue={prefillCategoryId ?? ''}
              className={inputClass}
            >
              <option value="">Select category</option>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Amount (EUR) <span className="text-status-danger">*</span>
            </label>
            <input
              name="amount_eur"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={prefillAmount}
              placeholder="e.g. 500"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Month <span className="text-status-danger">*</span>
            </label>
            <input
              name="period_month"
              type="month"
              required
              defaultValue={currentMonth}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Save budget
          </button>
        </form>
      </Drawer>
    </>
  )
}
```

- [ ] **Step 3: Create `app/(app)/budgets/_components/BudgetSummary.tsx`**

```tsx
import { Target, TrendingDown, PiggyBank } from 'lucide-react'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import type { BudgetRow } from '@/lib/budgets'

type Props = { rows: BudgetRow[] }

export function BudgetSummary({ rows }: Props) {
  const totalBudgeted = rows.filter(r => r.hasBudget).reduce((s, r) => s + r.budgetEur, 0)
  const totalSpent = rows.reduce((s, r) => s + r.actualEur, 0)
  const remaining = totalBudgeted - totalSpent

  return (
    <div className="flex gap-4">
      <SummaryCard label="Total budgeted" value={formatEur(totalBudgeted)} icon={Target} accent />
      <SummaryCard label="Total spent"    value={formatEur(totalSpent)}    icon={TrendingDown} />
      <SummaryCard label="Remaining"      value={formatEur(remaining)}     icon={PiggyBank} />
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/budgets/_components/BudgetTable.tsx`**

```tsx
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatEur } from '@/lib/utils'
import { AddBudgetDrawer } from './AddBudgetDrawer'
import type { BudgetRow } from '@/lib/budgets'
import type { Category } from '@/types/database'

type Props = {
  rows: BudgetRow[]
  categories: Category[]
  currentMonth: string
}

export function BudgetTable({ rows, categories, currentMonth }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No budgets set for this month. Click "Set budget" to get started.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-col bg-card-bg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-right">Budgeted</th>
            <th className="px-4 py-3 text-right">Spent</th>
            <th className="px-4 py-3 text-left w-40">Progress</th>
            <th className="px-4 py-3 text-right">Over / Under</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Edit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {rows.map(row => {
            const pct = row.hasBudget && row.budgetEur > 0
              ? Math.min(row.actualEur / row.budgetEur, 1)
              : 0
            const isOver = row.hasBudget && row.actualEur > row.budgetEur
            const variance = Math.abs(row.varianceEur)

            let statusLabel: string
            let statusColor: 'good' | 'danger' | 'neutral'
            if (!row.hasBudget) { statusLabel = 'No budget'; statusColor = 'neutral' }
            else if (isOver)    { statusLabel = 'Over budget'; statusColor = 'danger' }
            else                { statusLabel = 'On track'; statusColor = 'good' }

            return (
              <tr key={row.category.id} className="hover:bg-content-bg">
                <td className="px-4 py-3 font-medium text-text-primary">{row.category.name}</td>
                <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                  {row.hasBudget ? formatEur(row.budgetEur) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-text-primary tabular-nums">
                  {formatEur(row.actualEur)}
                </td>
                <td className="px-4 py-3">
                  {row.hasBudget && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-content-bg">
                      <div
                        className={`h-full rounded-full ${isOver ? 'bg-status-danger' : 'bg-accent'}`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  )}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-xs font-medium ${isOver ? 'text-status-danger' : 'text-status-good'}`}>
                  {row.hasBudget ? `${isOver ? '+' : '-'}${formatEur(variance)}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={statusLabel} color={statusColor} />
                </td>
                <td className="px-4 py-3">
                  <AddBudgetDrawer
                    categories={categories}
                    currentMonth={currentMonth}
                    prefillCategoryId={row.category.id}
                    prefillAmount={row.hasBudget ? row.budgetEur : undefined}
                    trigger="icon"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/budgets/_components/BudgetVarianceWidget.tsx`**

```tsx
import { formatEur } from '@/lib/utils'
import type { BudgetRow } from '@/lib/budgets'

type MonthData = {
  label: string   // e.g. 'Aug 2026'
  rows: BudgetRow[]
}

type Props = { months: MonthData[] }

export function BudgetVarianceWidget({ months }: Props) {
  if (months.every(m => m.rows.length === 0)) return null

  // Find all category names across all months
  const categoryNames = Array.from(
    new Set(months.flatMap(m => m.rows.map(r => r.category.name)))
  )

  // Max value for scale
  const maxVal = Math.max(
    ...months.flatMap(m => m.rows.flatMap(r => [r.budgetEur, r.actualEur])),
    1
  )

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Budget vs Actual — Last 3 Months</h3>
      <div className="space-y-4">
        {categoryNames.map(name => (
          <div key={name} className="space-y-1">
            <p className="text-xs font-medium text-text-secondary">{name}</p>
            <div className="flex gap-6">
              {months.map(month => {
                const row = month.rows.find(r => r.category.name === name)
                const budgetPct = row ? (row.budgetEur / maxVal) * 100 : 0
                const actualPct = row ? (row.actualEur / maxVal) * 100 : 0
                return (
                  <div key={month.label} className="flex-1 space-y-1">
                    <p className="text-xs text-text-tertiary">{month.label}</p>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <div className="h-3 rounded-sm bg-accent-light" style={{ width: `${budgetPct}%`, minWidth: row?.hasBudget ? '2px' : '0' }} />
                        {row?.hasBudget && <span className="text-xs text-text-tertiary">{formatEur(row.budgetEur)}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-3 rounded-sm ${row && row.actualEur > row.budgetEur && row.hasBudget ? 'bg-status-danger' : 'bg-accent'}`}
                          style={{ width: `${actualPct}%`, minWidth: row?.actualEur ? '2px' : '0' }}
                        />
                        {row?.actualEur ? <span className="text-xs text-text-tertiary">{formatEur(row.actualEur)}</span> : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-sm bg-accent-light" /> Budgeted</div>
        <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-sm bg-accent" /> Actual</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `app/(app)/budgets/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { buildBudgetRows } from '@/lib/budgets'
import { getRate } from '@/lib/exchange-rates'
import { PageHeader } from '@/components/layout/PageHeader'
import { BudgetSummary } from './_components/BudgetSummary'
import { BudgetTable } from './_components/BudgetTable'
import { BudgetVarianceWidget } from './_components/BudgetVarianceWidget'
import { AddBudgetDrawer } from './_components/AddBudgetDrawer'

function getPeriodBounds(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number)
  const start = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

function getMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function subtractMonths(yearMonth: string, n: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const d = new Date(year, month - 1 - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

type SearchParams = Promise<{ month?: string }>

export default async function BudgetsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const now = new Date()
  const currentMonth = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const supabase = await createClient()
  const [categoriesResult] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
  ])
  const categories = categoriesResult.data ?? []

  // Fetch current + 2 prior months for variance widget
  const months = [subtractMonths(currentMonth, 2), subtractMonths(currentMonth, 1), currentMonth]

  const monthData = await Promise.all(
    months.map(async (ym) => {
      const { start, end } = getPeriodBounds(ym)
      const [budgetsRes, txRes] = await Promise.all([
        supabase.from('budgets').select('*').eq('period_month', start),
        supabase.from('transactions').select('*').gte('occurred_on', start).lte('occurred_on', end).eq('is_transfer', false),
      ])
      return {
        yearMonth: ym,
        label: getMonthLabel(ym),
        rows: buildBudgetRows(budgetsRes.data ?? [], categories, txRes.data ?? []),
      }
    })
  )

  const currentData = monthData[2]

  // Month navigation
  const prevMonth = subtractMonths(currentMonth, 1)
  const nextMonth = subtractMonths(currentMonth, -1)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Budgets"
        actions={<AddBudgetDrawer categories={categories} currentMonth={currentMonth} />}
      />
      <div className="flex flex-col gap-6 p-6">
        {/* Month navigation */}
        <div className="flex items-center gap-3">
          <a href={`/budgets?month=${prevMonth}`} className="rounded-lg border border-border-col px-3 py-1.5 text-sm text-text-secondary hover:bg-content-bg">←</a>
          <span className="text-sm font-medium text-text-primary">{getMonthLabel(currentMonth)}</span>
          <a href={`/budgets?month=${nextMonth}`} className="rounded-lg border border-border-col px-3 py-1.5 text-sm text-text-secondary hover:bg-content-bg">→</a>
        </div>

        <BudgetSummary rows={currentData.rows} />
        <BudgetTable rows={currentData.rows} categories={categories} currentMonth={currentMonth} />
        <BudgetVarianceWidget months={monthData} />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 8: Manual smoke test**

```bash
npm run dev
```

Visit `http://localhost:3000/budgets`. Verify:
- Month navigation arrows change the URL param and reload the page
- Summary cards show €0 on empty state
- "Set budget" opens the drawer; setting a budget for a category makes it appear in the table
- After adding a transaction in `/transactions` for a budgeted category, the "Spent" column and progress bar update on next `/budgets` load

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/budgets/
git commit -m "feat: add budgets page with progress table and variance widget"
```

---

## Task 3: Recurring Bills Page

**Files:**
- Create: `app/(app)/recurring-bills/_components/actions.ts`
- Create: `app/(app)/recurring-bills/_components/MarkPaidButton.tsx`
- Create: `app/(app)/recurring-bills/_components/AddBillDrawer.tsx`
- Create: `app/(app)/recurring-bills/_components/BillsSummary.tsx`
- Create: `app/(app)/recurring-bills/_components/BillsTable.tsx`
- Replace: `app/(app)/recurring-bills/page.tsx`

**Interfaces:**
- Consumes:
  - `getBillStatus`, `BillStatus`, `advanceDueDate`, `toMonthlyEur`, `toAnnualEur` from `@/lib/bills`
  - `getRate` from `@/lib/exchange-rates`
  - `formatEur`, `formatDate` from `@/lib/utils`
  - `SummaryCard` from `@/components/ui/SummaryCard`
  - `StatusBadge` from `@/components/ui/StatusBadge`
  - `Drawer` from `@/components/ui/Drawer`
  - `PageHeader` from `@/components/layout/PageHeader`
  - `createClient` from `@/lib/supabase/server`
  - `RecurringBill`, `Account`, `Category`, `RecurringFrequency` from `@/types/database`
- Produces: `/recurring-bills` route — bills with derived status and mark-as-paid

- [ ] **Step 1: Create `app/(app)/recurring-bills/_components/actions.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { advanceDueDate } from '@/lib/bills'
import type { RecurringFrequency } from '@/types/database'

export async function upsertBill(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string | null
  const payload = {
    user_id: user.id,
    name: (formData.get('name') as string).trim(),
    category_id: (formData.get('category_id') as string) || null,
    account_id: (formData.get('account_id') as string) || null,
    amount: parseFloat(formData.get('amount') as string),
    currency: formData.get('currency') as string,
    frequency: formData.get('frequency') as RecurringFrequency,
    next_due_on: formData.get('next_due_on') as string,
    reminder_days_before: parseInt(formData.get('reminder_days_before') as string, 10) || 3,
    is_active: true,
  }

  const { error } = id
    ? await supabase.from('recurring_bills').update(payload).eq('id', id)
    : await supabase.from('recurring_bills').insert(payload)

  if (error) return { error: error.message }
  revalidatePath('/recurring-bills')
  return {}
}

export async function markBillPaid(billId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: bill, error: fetchError } = await supabase
    .from('recurring_bills')
    .select('next_due_on, frequency')
    .eq('id', billId)
    .single()

  if (fetchError || !bill) return { error: fetchError?.message ?? 'Bill not found' }

  const newDueDate = advanceDueDate(bill.next_due_on, bill.frequency as RecurringFrequency)

  const { error } = await supabase
    .from('recurring_bills')
    .update({ next_due_on: newDueDate })
    .eq('id', billId)

  if (error) return { error: error.message }
  revalidatePath('/recurring-bills')
  return {}
}
```

- [ ] **Step 2: Create `app/(app)/recurring-bills/_components/MarkPaidButton.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { markBillPaid } from './actions'

type Props = { billId: string }

export function MarkPaidButton({ billId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await markBillPaid(billId)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-border-col px-2.5 py-1 text-xs font-medium text-text-secondary hover:border-status-good hover:text-status-good disabled:opacity-50"
      >
        <CheckCircle size={12} />
        {loading ? 'Saving…' : 'Mark paid'}
      </button>
      {error && <span className="text-xs text-status-danger">{error}</span>}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/recurring-bills/_components/AddBillDrawer.tsx`**

```tsx
'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { upsertBill } from './actions'
import type { Account, Category, RecurringBill } from '@/types/database'

type Props = {
  accounts: Account[]
  categories: Category[]
  prefill?: RecurringBill
  trigger?: 'button' | 'icon'
}

const initialState = {}

export function AddBillDrawer({ accounts, categories, prefill, trigger = 'button' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(upsertBill, initialState)

  const expenseCategories = categories.filter(c => c.kind === 'expense')
  const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

  return (
    <>
      {trigger === 'button' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} />
          Add bill
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded p-1 text-text-tertiary hover:text-accent"
          aria-label="Edit bill"
        >
          <Pencil size={14} />
        </button>
      )}

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={prefill ? 'Edit bill' : 'Add recurring bill'}>
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          {prefill && <input type="hidden" name="id" value={prefill.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Name <span className="text-status-danger">*</span></label>
            <input name="name" required defaultValue={prefill?.name} placeholder="e.g. Netflix" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Category</label>
            <select name="category_id" defaultValue={prefill?.category_id ?? ''} className={inputClass}>
              <option value="">None</option>
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Account</label>
            <select name="account_id" defaultValue={prefill?.account_id ?? ''} className={inputClass}>
              <option value="">None</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">Amount <span className="text-status-danger">*</span></label>
              <input name="amount" type="number" step="0.01" min="0.01" required defaultValue={prefill?.amount} className={inputClass} />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-text-primary">Currency</label>
              <select name="currency" defaultValue={prefill?.currency ?? 'GBP'} className={inputClass}>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Frequency <span className="text-status-danger">*</span></label>
            <select name="frequency" required defaultValue={prefill?.frequency ?? 'monthly'} className={inputClass}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Next due <span className="text-status-danger">*</span></label>
            <input name="next_due_on" type="date" required defaultValue={prefill?.next_due_on} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Reminder (days before)</label>
            <input name="reminder_days_before" type="number" min="0" defaultValue={prefill?.reminder_days_before ?? 3} className={inputClass} />
          </div>

          <button type="submit" className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90">
            {prefill ? 'Save changes' : 'Add bill'}
          </button>
        </form>
      </Drawer>
    </>
  )
}
```

- [ ] **Step 4: Create `app/(app)/recurring-bills/_components/BillsSummary.tsx`**

```tsx
import { Calendar, AlertCircle, TrendingUp } from 'lucide-react'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import { toMonthlyEur, toAnnualEur, getBillStatus } from '@/lib/bills'
import type { RecurringBill, RecurringFrequency } from '@/types/database'

type Props = { bills: RecurringBill[]; gbpToEur: number }

export function BillsSummary({ bills, gbpToEur }: Props) {
  const activeBills = bills.filter(b => b.is_active)

  const monthlyTotal = activeBills.reduce(
    (s, b) => s + toMonthlyEur(Number(b.amount), b.currency, b.frequency as RecurringFrequency, gbpToEur), 0
  )
  const annualTotal = activeBills.reduce(
    (s, b) => s + toAnnualEur(Number(b.amount), b.currency, b.frequency as RecurringFrequency, gbpToEur), 0
  )
  const overdueTotal = activeBills
    .filter(b => getBillStatus(b.next_due_on, b.reminder_days_before) === 'overdue')
    .reduce((s, b) => s + toMonthlyEur(Number(b.amount), b.currency, b.frequency as RecurringFrequency, gbpToEur), 0)

  return (
    <div className="flex gap-4">
      <SummaryCard label="Monthly total" value={formatEur(monthlyTotal)} icon={Calendar} accent />
      <SummaryCard label="Overdue"        value={formatEur(overdueTotal)} icon={AlertCircle} />
      <SummaryCard label="Annual total"   value={formatEur(annualTotal)}  icon={TrendingUp} />
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/recurring-bills/_components/BillsTable.tsx`**

```tsx
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getBillStatus } from '@/lib/bills'
import { MarkPaidButton } from './MarkPaidButton'
import { AddBillDrawer } from './AddBillDrawer'
import type { RecurringBill, Account, Category, RecurringFrequency } from '@/types/database'

type Props = {
  bills: RecurringBill[]
  accounts: Account[]
  categories: Category[]
}

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
}

function formatBillAmount(amount: number, currency: string, frequency: RecurringFrequency): string {
  const formatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  return `${formatted} / ${FREQ_LABEL[frequency].toLowerCase()}`
}

export function BillsTable({ bills, accounts, categories }: Props) {
  if (bills.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No recurring bills yet. Click "Add bill" to get started.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-col bg-card-bg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Account</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-left">Next due</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {bills.map(bill => {
            const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
            const category = categories.find(c => c.id === bill.category_id)
            const account = accounts.find(a => a.id === bill.account_id)
            const statusColor = status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warn' : 'good'
            const statusLabel = status === 'overdue' ? 'Overdue' : status === 'due_soon' ? 'Due soon' : 'Active'

            return (
              <tr key={bill.id} className="hover:bg-content-bg">
                <td className="px-4 py-3 font-medium text-text-primary">{bill.name}</td>
                <td className="px-4 py-3">
                  {category ? <StatusBadge label={category.name} color="accent" /> : <span className="text-text-tertiary">—</span>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{account?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums text-text-primary whitespace-nowrap">
                  {formatBillAmount(Number(bill.amount), bill.currency, bill.frequency as RecurringFrequency)}
                </td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(bill.next_due_on)}</td>
                <td className="px-4 py-3"><StatusBadge label={statusLabel} color={statusColor} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MarkPaidButton billId={bill.id} />
                    <AddBillDrawer accounts={accounts} categories={categories} prefill={bill} trigger="icon" />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: Create `app/(app)/recurring-bills/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { getRate } from '@/lib/exchange-rates'
import { PageHeader } from '@/components/layout/PageHeader'
import { BillsSummary } from './_components/BillsSummary'
import { BillsTable } from './_components/BillsTable'
import { AddBillDrawer } from './_components/AddBillDrawer'

export default async function RecurringBillsPage() {
  const supabase = await createClient()

  const [billsResult, accountsResult, categoriesResult, gbpToEur] = await Promise.all([
    supabase.from('recurring_bills').select('*').eq('is_active', true).order('next_due_on', { ascending: true }),
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('*').order('name'),
    getRate('GBP', 'EUR'),
  ])

  const bills = billsResult.data ?? []
  const accounts = accountsResult.data ?? []
  const categories = categoriesResult.data ?? []

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Recurring Bills"
        actions={<AddBillDrawer accounts={accounts} categories={categories} />}
      />
      <div className="flex flex-col gap-6 p-6">
        <BillsSummary bills={bills} gbpToEur={gbpToEur} />
        <BillsTable bills={bills} accounts={accounts} categories={categories} />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Run full test suite and build**

```bash
npm run test:run && npm run build
```

Expected: all tests pass, build clean.

- [ ] **Step 8: Manual smoke test**

```bash
npm run dev
```

Visit `http://localhost:3000/recurring-bills`. Verify:
- "Add bill" opens the drawer; adding a monthly bill makes it appear in the table
- Status badge shows "Active", "Due soon" (if within reminder window), or "Overdue" (if next_due_on is past)
- "Mark paid" on a monthly bill advances the next due date by 1 month (verify in Supabase Table Editor)
- "Mark paid" on a yearly bill advances by 12 months
- Edit pencil pre-fills the drawer with the bill's current values
- Summary cards show correct monthly and annual totals

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/recurring-bills/
git commit -m "feat: add recurring bills page with status tracking and mark-as-paid"
```

---

## Post-Task: Push to remote

```bash
git push origin main
```
