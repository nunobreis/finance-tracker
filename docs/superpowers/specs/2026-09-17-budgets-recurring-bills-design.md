# Finance Tracker — Sub-project 3: Budgets & Recurring Bills

**Date:** 2026-09-17
**Scope:** Budgets page (monthly budget vs actual with variance widget) and Recurring Bills page (status-derived bill tracking with mark-as-paid).
**Delivers:** Set monthly category budgets, track spending against them with a variance view, and manage recurring subscriptions/bills with due-date status.

---

## Stack & Runtime Context

- Next.js 16.3.5 / React 19 — always `await createClient()`
- `proxy.ts` at project root (Next.js 16 middleware naming)
- Tailwind v4 — tokens in `globals.css` `@theme`
- `useActionState` from `react` (React 19)
- Sidebar is a Client Component
- `getRate('GBP', 'EUR')` from `lib/exchange-rates.ts` returns 1.0 stub (Sub-project 4 replaces with real API)

---

## What This Sub-project Delivers

1. **`lib/bills.ts`** — pure utility functions for bill status, date advancement, and monthly/annual cost normalisation (unit tested)
2. **`lib/budgets.ts`** — pure utility functions for joining budget + transaction data into display rows and variance data (unit tested)
3. **Budgets page** (`/budgets`) — month-navigable view with summary cards, category progress table, variance widget, and add/edit budget drawer
4. **Recurring Bills page** (`/recurring-bills`) — summary cards, bills table with derived status badges, add/edit bill drawer, and mark-as-paid action

---

## File Structure

```
# New lib files
lib/bills.ts                                    # getBillStatus, advanceDueDate, toMonthlyEur, toAnnualEur
lib/budgets.ts                                  # buildBudgetRows, BudgetRow type

# New shared type
lib/budgets.ts (exported)                        # BudgetRow type

# Budgets feature
app/(app)/budgets/page.tsx                       # Server Component — budgets + actuals for selected month
app/(app)/budgets/_components/BudgetSummary.tsx  # 3 summary cards
app/(app)/budgets/_components/BudgetTable.tsx    # Category rows with progress bars + variance
app/(app)/budgets/_components/BudgetVarianceWidget.tsx  # Last 3 months bar chart
app/(app)/budgets/_components/AddBudgetDrawer.tsx       # 'use client' create/edit drawer
app/(app)/budgets/_components/actions.ts                # 'use server' — upsertBudget

# Recurring bills feature
app/(app)/recurring-bills/page.tsx                          # Server Component — bills + derived status
app/(app)/recurring-bills/_components/BillsSummary.tsx      # 3 summary cards
app/(app)/recurring-bills/_components/BillsTable.tsx        # Bills with status badges
app/(app)/recurring-bills/_components/AddBillDrawer.tsx     # 'use client' create/edit drawer
app/(app)/recurring-bills/_components/MarkPaidButton.tsx    # 'use client' — advances next_due_on
app/(app)/recurring-bills/_components/actions.ts            # 'use server' — upsertBill, markBillPaid

# Tests
tests/lib/bills.test.ts
tests/lib/budgets.test.ts
```

---

## Shared Utilities

### `lib/bills.ts`

Pure functions — no Supabase imports, fully unit testable.

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
    case 'weekly':    date.setDate(date.getDate() + 7);        break
    case 'monthly':   date.setMonth(date.getMonth() + 1);      break
    case 'quarterly': date.setMonth(date.getMonth() + 3);      break
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

### `lib/budgets.ts`

```ts
import type { Budget, Category, Transaction } from '@/types/database'

export type BudgetRow = {
  category: Category
  budgetEur: number       // 0 if no budget set for this category
  actualEur: number       // sum of transactions for this category this month
  varianceEur: number     // budgetEur - actualEur (positive = under budget)
  hasBudget: boolean
}

export function buildBudgetRows(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[]
): BudgetRow[] {
  // Compute actual spend per category from transactions
  const actualByCategory: Record<string, number> = {}
  for (const tx of transactions) {
    if (!tx.category_id || tx.is_transfer) continue
    actualByCategory[tx.category_id] = (actualByCategory[tx.category_id] ?? 0) + Math.abs(Number(tx.amount))
  }

  const budgetByCategory: Record<string, Budget> = {}
  for (const b of budgets) {
    budgetByCategory[b.category_id] = b
  }

  // Include categories that have a budget OR have actual spend
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

---

## Budgets Page (`/budgets`)

### Data Fetching (`page.tsx`)

URL param: `?month=YYYY-MM` — defaults to current month.

```ts
const periodMonth = searchParams.month ?? `${year}-${month}`  // e.g. '2026-09'
const periodStart = `${periodMonth}-01`
const periodEnd   = last day of that month
```

Three parallel queries:
1. Budgets for `period_month = periodStart`
2. Non-transfer expense transactions for the period (`occurred_on` between `periodStart` and `periodEnd`)
3. All categories

Pass results to `buildBudgetRows()` server-side.

For the variance widget, fetch the same data for the previous 2 calendar months as well (3 months total: current month + 2 preceding months). This is 3 budget queries + 3 transaction queries — all small, all fast.

### Summary Cards

Using `SummaryCard` from `components/ui/`:

- **Total budgeted** — `SUM(budgetEur)` across all rows that `hasBudget`; icon: `Target`
- **Total spent** — `SUM(actualEur)` across all rows; icon: `TrendingDown`
- **Remaining** — budgeted minus spent; accent green if positive, red if negative; icon: `PiggyBank`

### Budget Table (`BudgetTable`)

Server Component. One row per `BudgetRow`:

| Column | Notes |
|---|---|
| Category | Name with a coloured left border dot |
| Budgeted | `formatEur(budgetEur)`; "—" if no budget |
| Spent | `formatEur(actualEur)` |
| Progress | Filled bar, width = `min(actualEur / budgetEur, 1) * 100%`; red fill when over budget; hidden when no budget |
| Over/Under | `formatEur(Math.abs(varianceEur))` with "Under" (green) or "Over" (red) label |
| Status | `StatusBadge`: "On track" (good) / "Over budget" (danger) / "No budget" (neutral) |
| Edit | Pencil icon opens `AddBudgetDrawer` pre-filled |

### Budget Variance Widget (`BudgetVarianceWidget`)

Below the table. Shows last 3 months for categories that have a budget in any of those months.

Layout: one row per category, two horizontal bars side by side — budgeted (accent-light fill) and actual (accent fill). Bar widths are proportional to the maximum value across all bars in the widget. No chart library — pure Tailwind layout.

```
Housing        [████████████ €1,200]  [█████████ €950]
Food & Grocery [████████ €400]        [██████████ €480]
Transport      [████ €200]            [███ €150]
```

Month labels above each pair. If a category had no budget in a given month, both bars show as 0-width with a "—" label.

### Add/Edit Budget Drawer (`AddBudgetDrawer`)

Fields:
- **Category** — select from all expense categories
- **Amount (EUR)** — number input (budgets are always in EUR per schema)
- **Month** — date input (type="month"), defaults to currently viewed month

`upsertBudget` Server Action:
```ts
supabase.from('budgets').upsert(
  { user_id, category_id, period_month, amount_eur, rollover: false },
  { onConflict: 'user_id,category_id,period_month' }
)
```

On success: `revalidatePath('/budgets')`, drawer closes.

---

## Recurring Bills Page (`/recurring-bills`)

### Data Fetching (`page.tsx`)

Single query: all `recurring_bills` where `is_active = true`, ordered by `next_due_on ASC`.

Derive status for each bill using `getBillStatus(bill.next_due_on, bill.reminder_days_before)`.

Also fetch accounts and categories for the drawer dropdowns.

GBP→EUR rate via `getRate('GBP', 'EUR')`.

### Summary Cards

- **Monthly total** — `SUM(toMonthlyEur(...))` across all active bills; icon: `Calendar`
- **Overdue** — `SUM(toMonthlyEur(...))` for overdue bills only; shown in `text-status-danger` if > 0; icon: `AlertCircle`
- **Annual total** — `SUM(toAnnualEur(...))` across all active bills; icon: `TrendingUp`

### Bills Table (`BillsTable`)

Server Component. Receives bills with pre-derived status. One row per bill:

| Column | Notes |
|---|---|
| Name | Bill name; institution/provider as subtitle |
| Category | `StatusBadge` if set, "—" otherwise |
| Account | Account name if linked |
| Amount | Native currency + frequency (e.g. `£9.99 / month`) |
| Next due | Formatted date |
| Status | `StatusBadge`: "Overdue" (danger) / "Due soon" (warn) / "Active" (good) |
| Actions | "Mark as paid" button + edit pencil |

### Mark as Paid (`MarkPaidButton`)

`'use client'` button — calls `markBillPaid(billId)` Server Action directly (not via form).

`markBillPaid` Server Action:
1. Fetches the bill's current `next_due_on` and `frequency`
2. Calls `advanceDueDate(next_due_on, frequency)`
3. Updates the bill with the new `next_due_on`
4. `revalidatePath('/recurring-bills')`

No transaction row is created — payment tracking is manual via the Transactions page.

### Add/Edit Bill Drawer (`AddBillDrawer`)

Fields:
| Field | Input | Notes |
|---|---|---|
| Name | Text | Required |
| Category | Select | Optional; expense categories only |
| Account | Select | Optional |
| Amount | Number | Required |
| Currency | Select | GBP / EUR |
| Frequency | Select | Weekly / Monthly / Quarterly / Yearly |
| Next due | Date | Required |
| Reminder days | Number | Default 3 |

`upsertBill` Server Action: insert for new (no `id` in form), update by `id` for edit. Edit triggered by clicking the pencil icon on a bill row, which opens the drawer pre-filled.

---

## Error Handling

- `upsertBudget`: inline error in drawer on failure
- `upsertBill`: inline error in drawer on failure
- `markBillPaid`: button shows loading state; on error shows a brief inline error message beside the button; does not redirect

---

## Verification Checklist

- [ ] Can set a budget for a category and month; appears in table with progress bar
- [ ] Adding a transaction (via `/transactions`) updates the budget "Spent" column on next `/budgets` load
- [ ] Over-budget category shows red progress bar and "Over budget" badge
- [ ] Variance widget shows last 3 months side-by-side per category
- [ ] Month navigation (prev/next) loads the correct month's budgets and actuals
- [ ] Can add a recurring bill; appears in table with correct status badge
- [ ] "Mark as paid" on a monthly bill advances `next_due_on` by exactly 1 month
- [ ] "Mark as paid" on a weekly bill advances by 7 days
- [ ] Overdue bill shows danger badge; bill within reminder window shows warn badge
- [ ] Monthly total, annual total, and overdue summary cards show correct EUR totals
- [ ] `npm run build` and `npm run test:run` pass

---

## Out of Scope for This Sub-project

- Budget rollover (column exists, stays `false`)
- Bill deactivation / deletion
- Transaction creation from "Mark as paid"
- Custom category creation
- Exchange rate fetching (Sub-project 4 replaces the 1.0 stub)
- Dashboard aggregations (Sub-project 4)
