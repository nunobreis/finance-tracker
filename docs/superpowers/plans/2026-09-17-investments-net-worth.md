# Sub-project 4: Dashboard, Investments & Net Worth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard placeholder with live financial metrics, add real GBP/EUR exchange rates, and build an investments portfolio page and net worth history page with a recharts line chart.

**Architecture:** Server Components fetch all data server-side; pure lib utilities handle computation (unit tested); `yahoo-finance2` fetches investment prices on page load if stale (>6 h / not today); `getRate()` caches exchange rates in the `exchange_rates` DB table via Frankfurter.app. `computeNetWorth()` upserts a daily snapshot on each call.

**Tech Stack:** Next.js 16.3.5 / React 19, Supabase SSR, Tailwind v4, Vitest, `yahoo-finance2`, `recharts`

**Spec:** `docs/superpowers/specs/2026-09-17-investments-net-worth-design.md`

## Global Constraints

- Always `await createClient()` — never call it synchronously
- Middleware file is `proxy.ts` (not `middleware.ts`) — do not rename it
- Tailwind v4 — all tokens live in `globals.css` `@theme`; no `tailwind.config.ts` tokens
- `useActionState` comes from `react` (React 19), not `react-dom`
- Sidebar is a Client Component (`'use client'`)
- Test runner: `npx vitest run` (alias `npm run test:run`)
- Test files live in `tests/lib/` and use Vitest import style (`import { describe, it, expect } from 'vitest'`)
- `@` alias resolves to project root (e.g. `@/lib/utils`)
- Amounts in `transactions.amount` are negative for expenses, positive for income; use `Math.abs()` when summing spend
- `occurred_on` is the date column on `transactions` (not `date` or `created_at`)

---

## File Map

**New files:**
- `lib/holdings.ts` — pure value/P&L computation
- `lib/prices.ts` — yahoo-finance2 price refresh
- `lib/net-worth.ts` — pure aggregation + DB snapshot upsert
- `tests/lib/holdings.test.ts`
- `tests/lib/net-worth.test.ts`
- `app/(app)/dashboard/_components/SpendingCard.tsx`
- `app/(app)/dashboard/_components/UpcomingBillsPanel.tsx`
- `app/(app)/dashboard/_components/RecentTransactionsPanel.tsx`
- `app/(app)/investments/page.tsx`
- `app/(app)/investments/_components/InvestmentsSummary.tsx`
- `app/(app)/investments/_components/HoldingsTable.tsx`
- `app/(app)/investments/_components/AddHoldingDrawer.tsx`
- `app/(app)/investments/_components/DeleteHoldingButton.tsx`
- `app/(app)/investments/_components/RefreshPricesButton.tsx`
- `app/(app)/investments/actions.ts`
- `app/(app)/net-worth/page.tsx`
- `app/(app)/net-worth/_components/NetWorthSummary.tsx`
- `app/(app)/net-worth/_components/NetWorthChart.tsx`
- `app/(app)/net-worth/_components/BreakdownTable.tsx`
- `app/(app)/net-worth/_components/SnapshotHistory.tsx`

**Modified files:**
- `lib/exchange-rates.ts` — replace stub with Frankfurter.app + DB cache
- `components/ui/SummaryCard.tsx` — add optional `subtitle` prop
- `components/layout/Sidebar.tsx` — add Investments + Net Worth nav items
- `app/(app)/dashboard/page.tsx` — replace placeholder with live data
- `types/database.ts` — no changes needed (Holding, HoldingPriceHistory, NetWorthSnapshot already defined)

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm)

**Interfaces:**
- Produces: `yahoo-finance2` and `recharts` available as imports

- [ ] **Step 1: Install packages**

```bash
cd /path/to/finance-tracker
npm install yahoo-finance2 recharts
npm install --save-dev @types/recharts
```

(Note: `recharts` ships its own types; if `@types/recharts` 404s just skip it — no separate types package is needed.)

- [ ] **Step 2: Verify no peer-dep errors**

Run: `npm ls yahoo-finance2 recharts`
Expected: both listed at their installed versions, no UNMET PEER DEPENDENCY warnings.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add yahoo-finance2 and recharts dependencies"
```

---

### Task 2: Real exchange rates

**Files:**
- Modify: `lib/exchange-rates.ts`

**Interfaces:**
- Produces:
  - `getRate(base: string, quote: string): Promise<number>` — same signature as the stub, now real
  - `getLatestRateInfo(base: string, quote: string): Promise<{ rate: number; rate_date: string }>` — new export for the dashboard widget

- [ ] **Step 1: Replace `lib/exchange-rates.ts`**

```ts
import { createClient } from '@/lib/supabase/server'

export async function getLatestRateInfo(
  base: string,
  quote: string
): Promise<{ rate: number; rate_date: string }> {
  if (base === quote) {
    return { rate: 1, rate_date: new Date().toISOString().split('T')[0] }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('rate, rate_date')
    .eq('base_currency', base)
    .eq('quote_currency', quote)
    .eq('rate_date', today)
    .single()

  if (cached) return { rate: Number(cached.rate), rate_date: cached.rate_date }

  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${base}&to=${quote}`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`)
  const data = await res.json() as { date: string; rates: Record<string, number> }
  const rate = data.rates[quote]
  const rate_date = data.date

  await supabase.from('exchange_rates').upsert(
    { base_currency: base, quote_currency: quote, rate, rate_date },
    { onConflict: 'rate_date,base_currency,quote_currency' }
  )

  return { rate, rate_date }
}

export async function getRate(base: string, quote: string): Promise<number> {
  const { rate } = await getLatestRateInfo(base, quote)
  return rate
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors in `lib/exchange-rates.ts`

- [ ] **Step 3: Manual smoke test**

Start the dev server (`npm run dev`), visit `/recurring-bills`. The page uses `getRate('GBP', 'EUR')` — it should load without errors. Check the Supabase `exchange_rates` table in the dashboard to confirm a row was inserted for today.

- [ ] **Step 4: Commit**

```bash
git add lib/exchange-rates.ts
git commit -m "feat: replace exchange rate stub with Frankfurter.app + DB cache"
```

---

### Task 3: Holdings utilities + tests

**Files:**
- Create: `lib/holdings.ts`
- Create: `tests/lib/holdings.test.ts`

**Interfaces:**
- Produces:
  - `computeHoldingValue(qty: number, latestPrice: number, avgCostBasis: number | null, eurRate: number): HoldingComputed`
  - `type HoldingComputed = { value_eur: number; cost_eur: number; pnl_eur: number; pnl_pct: number }`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/holdings.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeHoldingValue } from '@/lib/holdings'

describe('computeHoldingValue', () => {
  it('computes value, cost, P&L and percentage in EUR', () => {
    const result = computeHoldingValue(10, 100, 80, 1)
    expect(result.value_eur).toBeCloseTo(1000)
    expect(result.cost_eur).toBeCloseTo(800)
    expect(result.pnl_eur).toBeCloseTo(200)
    expect(result.pnl_pct).toBeCloseTo(25)
  })

  it('applies eurRate to convert non-EUR holding', () => {
    const result = computeHoldingValue(10, 100, 80, 1.18)
    expect(result.value_eur).toBeCloseTo(1180)
    expect(result.cost_eur).toBeCloseTo(944)
    expect(result.pnl_eur).toBeCloseTo(236)
  })

  it('returns zero P&L when avgCostBasis is null', () => {
    const result = computeHoldingValue(10, 100, null, 1)
    expect(result.pnl_eur).toBe(0)
    expect(result.pnl_pct).toBe(0)
    expect(result.cost_eur).toBe(0)
  })

  it('handles zero quantity', () => {
    const result = computeHoldingValue(0, 100, 80, 1)
    expect(result.value_eur).toBe(0)
    expect(result.pnl_eur).toBe(0)
  })

  it('returns negative P&L when price is below cost', () => {
    const result = computeHoldingValue(10, 60, 80, 1)
    expect(result.pnl_eur).toBeCloseTo(-200)
    expect(result.pnl_pct).toBeCloseTo(-25)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npx vitest run tests/lib/holdings.test.ts`
Expected: FAIL — "Cannot find module '@/lib/holdings'"

- [ ] **Step 3: Create `lib/holdings.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npx vitest run tests/lib/holdings.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/holdings.ts tests/lib/holdings.test.ts
git commit -m "feat: add holdings value/P&L utilities with tests"
```

---

### Task 4: Net worth pure aggregation + tests

**Files:**
- Create: `lib/net-worth.ts`
- Create: `tests/lib/net-worth.test.ts`

**Interfaces:**
- Consumes: `getRate` from `@/lib/exchange-rates`, Supabase client from `@/lib/supabase/server`
- Produces:
  - `type AccountBalance = { id: string; name: string; currency: string; balance: number }`
  - `type HoldingValueInput = { id: string; symbol: string; currency: string; latestPrice: number; quantity: number }`
  - `type NetWorthBreakdown = { accounts: AccountBreakdownItem[]; holdings: HoldingBreakdownItem[] }`
  - `aggregateNetWorth(accountBalances, holdingValues, getEurRate): { total_eur: number; breakdown: NetWorthBreakdown }` — pure, no Supabase
  - `computeNetWorth(supabase: SupabaseClient): Promise<{ total_eur: number; breakdown: NetWorthBreakdown }>` — fetches data and upserts snapshot

- [ ] **Step 1: Write failing tests for `aggregateNetWorth`**

Create `tests/lib/net-worth.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { aggregateNetWorth } from '@/lib/net-worth'

const EUR = (c: string) => c === 'EUR' ? 1 : 1.18

describe('aggregateNetWorth', () => {
  it('sums a single EUR account', () => {
    const result = aggregateNetWorth(
      [{ id: '1', name: 'Revolut EUR', currency: 'EUR', balance: 1000 }],
      [],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1000)
    expect(result.breakdown.accounts[0].balance_eur).toBeCloseTo(1000)
    expect(result.breakdown.accounts[0].balance_native).toBeCloseTo(1000)
  })

  it('converts a GBP account balance to EUR', () => {
    const result = aggregateNetWorth(
      [{ id: '1', name: 'Monzo', currency: 'GBP', balance: 1000 }],
      [],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1180)
    expect(result.breakdown.accounts[0].balance_eur).toBeCloseTo(1180)
    expect(result.breakdown.accounts[0].balance_native).toBeCloseTo(1000)
  })

  it('includes holding values in EUR total', () => {
    const result = aggregateNetWorth(
      [],
      [{ id: '1', symbol: 'VWCE.DE', currency: 'EUR', latestPrice: 100, quantity: 10 }],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1000)
    expect(result.breakdown.holdings[0].value_eur).toBeCloseTo(1000)
    expect(result.breakdown.holdings[0].value_native).toBeCloseTo(1000)
  })

  it('converts a GBP holding to EUR', () => {
    const result = aggregateNetWorth(
      [],
      [{ id: '1', symbol: 'SMT.L', currency: 'GBP', latestPrice: 10, quantity: 100 }],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1180)
  })

  it('sums accounts and holdings together', () => {
    const result = aggregateNetWorth(
      [{ id: '1', name: 'Cash', currency: 'EUR', balance: 500 }],
      [{ id: '2', symbol: 'AAPL', currency: 'EUR', latestPrice: 100, quantity: 5 }],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1000)
  })

  it('returns zero total with no data', () => {
    const result = aggregateNetWorth([], [], EUR)
    expect(result.total_eur).toBe(0)
    expect(result.breakdown.accounts).toHaveLength(0)
    expect(result.breakdown.holdings).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npx vitest run tests/lib/net-worth.test.ts`
Expected: FAIL — "Cannot find module '@/lib/net-worth'"

- [ ] **Step 3: Create `lib/net-worth.ts`**

```ts
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
  supabase: SupabaseClient
): Promise<{ total_eur: number; breakdown: NetWorthBreakdown }> {
  // Fetch active accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, currency')
    .eq('is_active', true)

  const accountList = accounts ?? []

  // Derive balances by summing non-transfer transactions per account
  const { data: txData } = await supabase
    .from('transactions')
    .select('account_id, amount')
    .eq('is_transfer', false)
    .in('account_id', accountList.map(a => a.id))

  const balanceMap: Record<string, number> = {}
  for (const tx of txData ?? []) {
    balanceMap[tx.account_id] = (balanceMap[tx.account_id] ?? 0) + Number(tx.amount)
  }

  const accountBalances: AccountBalance[] = accountList.map(a => ({
    id: a.id,
    name: a.name,
    currency: a.currency,
    balance: balanceMap[a.id] ?? 0,
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
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npx vitest run tests/lib/net-worth.test.ts`
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/net-worth.ts tests/lib/net-worth.test.ts
git commit -m "feat: add net worth aggregation utilities with tests"
```

---

### Task 5: Price refresh service

**Files:**
- Create: `lib/prices.ts`

**Interfaces:**
- Consumes: `SupabaseClient` from `@supabase/supabase-js`, `yahoo-finance2`
- Produces: `refreshPricesIfStale(supabase: SupabaseClient, holdings: { id: string; symbol: string }[], force?: boolean): Promise<void>`

No unit tests — yahoo-finance2 is a third-party API. Test is manual (add a holding and visit the investments page).

- [ ] **Step 1: Create `lib/prices.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import yahooFinance from 'yahoo-finance2'

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
      const quote = await yahooFinance.quote(holding.symbol, {}, { validateResult: false })
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors in `lib/prices.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/prices.ts
git commit -m "feat: add yahoo-finance2 price refresh service"
```

---

### Task 6: SummaryCard extension + Dashboard page

**Files:**
- Modify: `components/ui/SummaryCard.tsx` — add optional `subtitle` prop
- Create: `app/(app)/dashboard/_components/SpendingCard.tsx`
- Create: `app/(app)/dashboard/_components/UpcomingBillsPanel.tsx`
- Create: `app/(app)/dashboard/_components/RecentTransactionsPanel.tsx`
- Modify: `app/(app)/dashboard/page.tsx` — replace placeholder

**Interfaces:**
- Consumes: `computeNetWorth` from `@/lib/net-worth`, `getLatestRateInfo` from `@/lib/exchange-rates`, `getBillStatus` from `@/lib/bills`

- [ ] **Step 1: Extend `SummaryCard` with `subtitle` prop**

Edit `components/ui/SummaryCard.tsx`. Add `subtitle?: string` to the Props type, and render it below the value:

```ts
// Old Props type:
type Props = {
  label: string
  value: string
  icon?: LucideIcon
  accent?: boolean
}

// New Props type:
type Props = {
  label: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  accent?: boolean
}
```

Replace the `<span className="text-2xl ...">` line with:

```tsx
<div>
  <span className="text-2xl font-semibold text-text-primary">{value}</span>
  {subtitle && <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>}
</div>
```

- [ ] **Step 2: Create `SpendingCard.tsx`**

Create `app/(app)/dashboard/_components/SpendingCard.tsx`:

```tsx
import { formatEur } from '@/lib/utils'

type Props = { spent: number; budgeted: number }

export function SpendingCard({ spent, budgeted }: Props) {
  const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0
  const overBudget = budgeted > 0 && spent > budgeted

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border-col bg-card-bg p-5">
      <span className="text-sm font-medium text-text-secondary">Spending this month</span>
      <div>
        <span className="text-2xl font-semibold text-text-primary">{formatEur(spent)}</span>
        <span className="ml-2 text-sm text-text-tertiary">/ {formatEur(budgeted)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-content-bg">
        <div
          className={`h-full rounded-full transition-all ${overBudget ? 'bg-status-danger' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-text-tertiary">{pct.toFixed(0)}% of budget used</p>
    </div>
  )
}
```

- [ ] **Step 3: Create `UpcomingBillsPanel.tsx`**

Create `app/(app)/dashboard/_components/UpcomingBillsPanel.tsx`:

```tsx
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getBillStatus } from '@/lib/bills'
import type { RecurringBill } from '@/types/database'

type Props = { bills: RecurringBill[] }

export function UpcomingBillsPanel({ bills }: Props) {
  return (
    <div className="flex flex-1 flex-col rounded-xl border border-border-col bg-card-bg">
      <div className="flex items-center justify-between border-b border-border-col px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Upcoming Bills</h3>
        <Link href="/recurring-bills" className="text-xs text-accent hover:underline">View all</Link>
      </div>
      {bills.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
          No bills due in the next 30 days
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border-col">
            {bills.map(bill => {
              const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
              const statusColor = status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warn' : 'good'
              const statusLabel = status === 'overdue' ? 'Overdue' : status === 'due_soon' ? 'Due soon' : 'Active'
              return (
                <tr key={bill.id}>
                  <td className="px-5 py-3 font-medium text-text-primary">{bill.name}</td>
                  <td className="px-5 py-3 text-text-secondary text-xs">{formatDate(bill.next_due_on)}</td>
                  <td className="px-5 py-3 text-right font-medium text-text-primary">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: bill.currency }).format(Number(bill.amount))}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge label={statusLabel} color={statusColor} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `RecentTransactionsPanel.tsx`**

Create `app/(app)/dashboard/_components/RecentTransactionsPanel.tsx`:

```tsx
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Transaction, Category } from '@/types/database'

type Props = {
  transactions: Transaction[]
  categories: Category[]
}

export function RecentTransactionsPanel({ transactions, categories }: Props) {
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-border-col bg-card-bg">
      <div className="flex items-center justify-between border-b border-border-col px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Recent Transactions</h3>
        <Link href="/transactions" className="text-xs text-accent hover:underline">View all</Link>
      </div>
      {transactions.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
          No transactions yet
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border-col">
            {transactions.map(tx => {
              const amount = Number(tx.amount)
              const isExpense = amount < 0
              const categoryName = tx.category_id ? categoryMap[tx.category_id] : null
              return (
                <tr key={tx.id}>
                  <td className="px-5 py-3 text-text-tertiary text-xs whitespace-nowrap">{formatDate(tx.occurred_on)}</td>
                  <td className="px-5 py-3 font-medium text-text-primary">{tx.description ?? tx.merchant ?? '—'}</td>
                  <td className="px-5 py-3">
                    {categoryName && <StatusBadge label={categoryName} color="accent" />}
                  </td>
                  <td className={`px-5 py-3 text-right font-medium whitespace-nowrap ${isExpense ? 'text-status-danger' : 'text-status-good'}`}>
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: tx.currency }).format(Math.abs(amount))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Replace `app/(app)/dashboard/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { computeNetWorth } from '@/lib/net-worth'
import { getLatestRateInfo } from '@/lib/exchange-rates'
import { PageHeader } from '@/components/layout/PageHeader'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { SpendingCard } from './_components/SpendingCard'
import { UpcomingBillsPanel } from './_components/UpcomingBillsPanel'
import { RecentTransactionsPanel } from './_components/RecentTransactionsPanel'
import { formatEur } from '@/lib/utils'
import { Globe, TrendingUp } from 'lucide-react'

function getPeriodBounds() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`
  const start = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  return { start, end, yearMonth }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { start, end, yearMonth } = getPeriodBounds()
  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    netWorth,
    rateInfo,
    budgetsResult,
    spendingResult,
    billsResult,
    txResult,
    categoriesResult,
  ] = await Promise.all([
    computeNetWorth(supabase),
    getLatestRateInfo('GBP', 'EUR'),
    supabase.from('budgets').select('amount_eur').eq('period_month', `${yearMonth}-01`),
    supabase.from('transactions').select('amount')
      .gte('occurred_on', start).lte('occurred_on', end)
      .eq('is_transfer', false).lt('amount', 0),
    supabase.from('recurring_bills').select('*')
      .eq('is_active', true)
      .gte('next_due_on', today).lte('next_due_on', in30Days)
      .order('next_due_on', { ascending: true }).limit(5),
    supabase.from('transactions').select('*')
      .order('occurred_on', { ascending: false }).limit(5),
    supabase.from('categories').select('*'),
  ])

  const totalBudgeted = (budgetsResult.data ?? []).reduce((s, b) => s + Number(b.amount_eur), 0)
  const totalSpent = (spendingResult.data ?? []).reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

  const rateDate = new Date(rateInfo.rate_date + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  })

  return (
    <div className="flex flex-col">
      <PageHeader title="Dashboard" />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex gap-4">
          <SummaryCard
            label="Net Worth"
            value={formatEur(netWorth.total_eur)}
            subtitle="across all accounts"
            icon={TrendingUp}
            accent
          />
          <SummaryCard
            label="GBP / EUR"
            value={rateInfo.rate.toFixed(4)}
            subtitle={`as of ${rateDate}`}
            icon={Globe}
          />
          <SpendingCard spent={totalSpent} budgeted={totalBudgeted} />
        </div>
        <div className="flex gap-4">
          <UpcomingBillsPanel bills={billsResult.data ?? []} />
          <RecentTransactionsPanel
            transactions={txResult.data ?? []}
            categories={categoriesResult.data ?? []}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors across all modified files.

- [ ] **Step 7: Manual test**

Start `npm run dev`, visit `/dashboard`. Verify:
- Net worth card shows a EUR total (even £0.00 is fine if no data yet)
- GBP/EUR card shows a 4-decimal rate and a date
- Spending card shows a progress bar
- Upcoming bills and recent transactions panels render (empty state is fine)

- [ ] **Step 8: Commit**

```bash
git add components/ui/SummaryCard.tsx \
        app/\(app\)/dashboard/page.tsx \
        app/\(app\)/dashboard/_components/
git commit -m "feat: build dashboard with net worth, rate, spending, bills and transactions widgets"
```

---

### Task 7: Sidebar nav items

**Files:**
- Modify: `components/layout/Sidebar.tsx`

**Interfaces:**
- Produces: `/investments` and `/net-worth` nav links visible in the sidebar

- [ ] **Step 1: Add nav items to `Sidebar.tsx`**

Add `TrendingUp` and `BarChart2` to the existing lucide-react import, then add two entries to `NAV_ITEMS` after `Dashboard`:

```ts
// Updated import line:
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  RefreshCw,
  Wallet,
  Settings,
  User,
  LogOut,
  TrendingUp,
  BarChart2,
} from 'lucide-react'

// Updated NAV_ITEMS:
const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/investments',     label: 'Investments',     icon: TrendingUp },
  { href: '/net-worth',       label: 'Net Worth',       icon: BarChart2 },
  { href: '/transactions',    label: 'Transactions',    icon: ArrowLeftRight },
  { href: '/budgets',         label: 'Budgets',         icon: PieChart },
  { href: '/recurring-bills', label: 'Recurring Bills', icon: RefreshCw },
  { href: '/accounts',        label: 'Accounts',        icon: Wallet },
] as const
```

- [ ] **Step 2: Manual test**

Refresh the browser. Verify Investments and Net Worth appear in the sidebar between Dashboard and Transactions. Both links should produce 404 for now (pages don't exist yet).

- [ ] **Step 3: Commit**

```bash
git add components/layout/Sidebar.tsx
git commit -m "feat: add Investments and Net Worth to sidebar nav"
```

---

### Task 8: Investments page

**Files:**
- Create: `app/(app)/investments/page.tsx`
- Create: `app/(app)/investments/_components/InvestmentsSummary.tsx`
- Create: `app/(app)/investments/_components/HoldingsTable.tsx`
- Create: `app/(app)/investments/_components/AddHoldingDrawer.tsx`
- Create: `app/(app)/investments/_components/DeleteHoldingButton.tsx`
- Create: `app/(app)/investments/_components/RefreshPricesButton.tsx`
- Create: `app/(app)/investments/actions.ts`

**Interfaces:**
- Consumes: `refreshPricesIfStale` from `@/lib/prices`, `computeHoldingValue` from `@/lib/holdings`, `getRate` from `@/lib/exchange-rates`
- Consumes: `Holding`, `HoldingPriceHistory`, `AssetType` from `@/types/database`

- [ ] **Step 1: Create `actions.ts`**

Create `app/(app)/investments/actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { refreshPricesIfStale } from '@/lib/prices'
import type { AssetType } from '@/types/database'

export async function refreshPrices(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: holdings } = await supabase.from('holdings').select('id, symbol')
  await refreshPricesIfStale(supabase, holdings ?? [], true)
  revalidatePath('/investments')
  return {}
}

export async function upsertHolding(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string | null
  const payload = {
    user_id: user.id,
    account_id: formData.get('account_id') as string,
    symbol: (formData.get('symbol') as string).trim().toUpperCase(),
    name: (formData.get('name') as string).trim() || null,
    asset_type: formData.get('asset_type') as AssetType,
    quantity: parseFloat(formData.get('quantity') as string),
    avg_cost_basis: formData.get('avg_cost_basis')
      ? parseFloat(formData.get('avg_cost_basis') as string)
      : null,
    currency: (formData.get('currency') as string).trim().toUpperCase(),
  }

  const { error } = id
    ? await supabase.from('holdings').update(payload).eq('id', id).eq('user_id', user.id)
    : await supabase.from('holdings').insert(payload)

  if (error) return { error: error.message }
  revalidatePath('/investments')
  return {}
}

export async function deleteHolding(holdingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('holding_price_history').delete().eq('holding_id', holdingId)
  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', holdingId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/investments')
  return {}
}
```

- [ ] **Step 2: Create `AddHoldingDrawer.tsx`**

Create `app/(app)/investments/_components/AddHoldingDrawer.tsx`:

```tsx
'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { upsertHolding } from '../actions'
import type { Account, Holding } from '@/types/database'

type Props = {
  accounts: Account[]
  prefill?: Holding
  trigger?: 'button' | 'icon'
}

const initialState: { error?: string } = {}

const ASSET_TYPES = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'fund', label: 'Fund' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' },
]

export function AddHoldingDrawer({ accounts, prefill, trigger = 'button' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(upsertHolding, initialState)

  const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

  return (
    <>
      {trigger === 'button' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} />
          Add holding
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded p-1 text-text-tertiary hover:text-accent"
          aria-label="Edit holding"
        >
          <Pencil size={14} />
        </button>
      )}

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={prefill ? 'Edit holding' : 'Add holding'}>
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          {prefill && <input type="hidden" name="id" value={prefill.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Symbol <span className="text-status-danger">*</span></label>
            <input name="symbol" required defaultValue={prefill?.symbol} placeholder="e.g. VWCE.DE, BTC-USD" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Name</label>
            <input name="name" defaultValue={prefill?.name ?? ''} placeholder="e.g. Vanguard FTSE All-World" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Asset type <span className="text-status-danger">*</span></label>
            <select name="asset_type" defaultValue={prefill?.asset_type ?? 'etf'} className={inputClass}>
              {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Account <span className="text-status-danger">*</span></label>
            <select name="account_id" defaultValue={prefill?.account_id ?? ''} required className={inputClass}>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">Quantity <span className="text-status-danger">*</span></label>
              <input name="quantity" type="number" step="any" min="0" required defaultValue={prefill?.quantity} className={inputClass} />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-text-primary">Currency</label>
              <input name="currency" defaultValue={prefill?.currency ?? 'EUR'} placeholder="EUR" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Avg cost basis</label>
            <input name="avg_cost_basis" type="number" step="any" min="0" defaultValue={prefill?.avg_cost_basis ?? ''} placeholder="Per unit" className={inputClass} />
          </div>

          <button type="submit" className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            {prefill ? 'Save changes' : 'Add holding'}
          </button>
        </form>
      </Drawer>
    </>
  )
}
```

- [ ] **Step 3: Create `DeleteHoldingButton.tsx`**

Create `app/(app)/investments/_components/DeleteHoldingButton.tsx`:

```tsx
'use client'

import { Trash2 } from 'lucide-react'
import { deleteHolding } from '../actions'

type Props = { holdingId: string }

export function DeleteHoldingButton({ holdingId }: Props) {
  async function handleDelete() {
    if (!confirm('Delete this holding and all its price history?')) return
    await deleteHolding(holdingId)
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded p-1 text-text-tertiary hover:text-status-danger"
      aria-label="Delete holding"
    >
      <Trash2 size={14} />
    </button>
  )
}
```

- [ ] **Step 4: Create `RefreshPricesButton.tsx`**

Create `app/(app)/investments/_components/RefreshPricesButton.tsx`:

```tsx
'use client'

import { RefreshCw } from 'lucide-react'
import { refreshPrices } from '../actions'
import { useState } from 'react'

export function RefreshPricesButton() {
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    await refreshPrices()
    setLoading(false)
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-border-col px-3 py-2 text-sm text-text-secondary hover:bg-content-bg disabled:opacity-50"
    >
      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Refreshing…' : 'Refresh prices'}
    </button>
  )
}
```

- [ ] **Step 5: Create `InvestmentsSummary.tsx`**

Create `app/(app)/investments/_components/InvestmentsSummary.tsx`:

```tsx
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import { TrendingUp, DollarSign, BarChart2 } from 'lucide-react'
import type { HoldingComputed } from '@/lib/holdings'

type Props = { rows: HoldingComputed[] }

export function InvestmentsSummary({ rows }: Props) {
  const totalValue = rows.reduce((s, r) => s + r.value_eur, 0)
  const totalCost = rows.reduce((s, r) => s + r.cost_eur, 0)
  const totalPnl = rows.reduce((s, r) => s + r.pnl_eur, 0)
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const sign = totalPnl >= 0 ? '+' : ''

  return (
    <div className="flex gap-4">
      <SummaryCard label="Total invested" value={formatEur(totalCost)} icon={DollarSign} />
      <SummaryCard label="Current value"  value={formatEur(totalValue)} icon={BarChart2} accent />
      <SummaryCard
        label="Total P&L"
        value={`${sign}${formatEur(totalPnl)}`}
        subtitle={`${sign}${totalPnlPct.toFixed(2)}%`}
        icon={TrendingUp}
      />
    </div>
  )
}
```

- [ ] **Step 6: Create `HoldingsTable.tsx`**

Create `app/(app)/investments/_components/HoldingsTable.tsx`:

```tsx
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AddHoldingDrawer } from './AddHoldingDrawer'
import { DeleteHoldingButton } from './DeleteHoldingButton'
import type { Holding, Account } from '@/types/database'
import type { HoldingComputed } from '@/lib/holdings'

type HoldingRow = {
  holding: Holding
  computed: HoldingComputed
  latestPrice: number | null
  isStale: boolean
}

type Props = {
  rows: HoldingRow[]
  accounts: Account[]
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

export function HoldingsTable({ rows, accounts }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No holdings yet. Click &quot;Add holding&quot; to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-col bg-card-bg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 text-left">Symbol</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Avg cost</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3 text-right">Value (EUR)</th>
            <th className="px-4 py-3 text-right">P&L (EUR)</th>
            <th className="px-4 py-3 text-right">P&L %</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {rows.map(({ holding, computed, latestPrice, isStale }) => {
            const pnlPositive = computed.pnl_eur >= 0
            const pnlColor = computed.cost_eur > 0
              ? (pnlPositive ? 'text-status-good' : 'text-status-danger')
              : 'text-text-tertiary'
            const account = accounts.find(a => a.id === holding.account_id)

            return (
              <tr key={holding.id} className="hover:bg-content-bg">
                <td className="px-4 py-3 font-semibold text-text-primary">{holding.symbol}</td>
                <td className="px-4 py-3 text-text-secondary">{holding.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={holding.asset_type} color="neutral" />
                </td>
                <td className="px-4 py-3 text-right text-text-primary">{Number(holding.quantity).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {holding.avg_cost_basis != null
                    ? formatCurrency(Number(holding.avg_cost_basis), holding.currency)
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right text-text-primary">
                  {latestPrice != null
                    ? formatCurrency(latestPrice, holding.currency)
                    : '—'}
                  {isStale && <StatusBadge label="stale" color="warn" />}
                </td>
                <td className="px-4 py-3 text-right font-medium text-text-primary">
                  {new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(computed.value_eur)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${pnlColor}`}>
                  {computed.cost_eur > 0
                    ? `${computed.pnl_eur >= 0 ? '+' : ''}${new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(computed.pnl_eur)}`
                    : '—'}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${pnlColor}`}>
                  {computed.cost_eur > 0
                    ? `${computed.pnl_pct >= 0 ? '+' : ''}${computed.pnl_pct.toFixed(2)}%`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <AddHoldingDrawer accounts={accounts} prefill={holding} trigger="icon" />
                    <DeleteHoldingButton holdingId={holding.id} />
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

- [ ] **Step 7: Create `app/(app)/investments/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { refreshPricesIfStale } from '@/lib/prices'
import { computeHoldingValue } from '@/lib/holdings'
import { getRate } from '@/lib/exchange-rates'
import { PageHeader } from '@/components/layout/PageHeader'
import { InvestmentsSummary } from './_components/InvestmentsSummary'
import { HoldingsTable } from './_components/HoldingsTable'
import { AddHoldingDrawer } from './_components/AddHoldingDrawer'
import { RefreshPricesButton } from './_components/RefreshPricesButton'

export default async function InvestmentsPage() {
  const supabase = await createClient()

  const { data: holdings } = await supabase.from('holdings').select('*')
  const holdingList = holdings ?? []

  // Auto-refresh stale prices on page load
  await refreshPricesIfStale(supabase, holdingList)

  // Fetch latest price for each holding
  const today = new Date().toISOString().split('T')[0]
  const priceRows = await Promise.all(
    holdingList.map(async h => {
      const { data } = await supabase
        .from('holding_price_history')
        .select('price, price_date')
        .eq('holding_id', h.id)
        .order('price_date', { ascending: false })
        .limit(1)
        .single()
      return { holdingId: h.id, priceRow: data }
    })
  )
  const priceMap = Object.fromEntries(
    priceRows.map(({ holdingId, priceRow }) => [holdingId, priceRow])
  )

  // Get EUR rates for all unique currencies
  const currencies = new Set(holdingList.map(h => h.currency))
  const rateMap: Record<string, number> = { EUR: 1 }
  for (const currency of currencies) {
    if (currency !== 'EUR') {
      rateMap[currency] = await getRate(currency, 'EUR')
    }
  }

  const tableRows = holdingList.map(holding => {
    const priceData = priceMap[holding.id]
    const latestPrice = priceData ? Number(priceData.price) : null
    const isStale = !priceData || priceData.price_date < today
    const eurRate = rateMap[holding.currency] ?? 1
    const computed = computeHoldingValue(
      Number(holding.quantity),
      latestPrice ?? 0,
      holding.avg_cost_basis != null ? Number(holding.avg_cost_basis) : null,
      eurRate
    )
    return { holding, computed, latestPrice, isStale }
  })

  const { data: accounts } = await supabase.from('accounts').select('*').eq('is_active', true)
  const accountList = accounts ?? []

  const lastRefreshedDate = priceRows
    .map(p => p.priceRow?.price_date)
    .filter(Boolean)
    .sort()
    .at(-1)

  return (
    <div className="flex flex-col">
      <PageHeader title="Investments" actions={<AddHoldingDrawer accounts={accountList} />} />
      <div className="flex flex-col gap-6 p-6">
        <InvestmentsSummary rows={tableRows.map(r => r.computed)} />
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            {lastRefreshedDate ? `Prices as of ${lastRefreshedDate}` : 'No prices yet'}
          </p>
          <RefreshPricesButton />
        </div>
        <HoldingsTable rows={tableRows} accounts={accountList} />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Manual test**

Visit `/investments`. Verify:
- Empty state shows "No holdings yet" message
- "Add holding" drawer opens, fields are present, submitting adds a row
- After adding a holding, the page refreshes and shows the holding (price may be "—" until Yahoo returns data)
- "Refresh prices" button triggers a fetch (check browser network tab or Supabase `holding_price_history` table)

- [ ] **Step 10: Commit**

```bash
git add app/\(app\)/investments/
git commit -m "feat: add investments page with holdings table, price refresh, and add/edit/delete"
```

---

### Task 9: Net Worth page

**Files:**
- Create: `app/(app)/net-worth/page.tsx`
- Create: `app/(app)/net-worth/_components/NetWorthSummary.tsx`
- Create: `app/(app)/net-worth/_components/NetWorthChart.tsx`
- Create: `app/(app)/net-worth/_components/BreakdownTable.tsx`
- Create: `app/(app)/net-worth/_components/SnapshotHistory.tsx`

**Interfaces:**
- Consumes: `computeNetWorth` from `@/lib/net-worth`, `NetWorthSnapshot` from `@/types/database`
- Consumes: `recharts` — `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`

- [ ] **Step 1: Create `NetWorthChart.tsx`**

Create `app/(app)/net-worth/_components/NetWorthChart.tsx`:

```tsx
'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { NetWorthSnapshot } from '@/types/database'

type Props = { snapshots: NetWorthSnapshot[] }

function formatShortEur(value: number) {
  if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(1)}k`
  return `€${value.toFixed(0)}`
}

function formatMonthLabel(dateStr: string) {
  const [year, month] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}

export function NetWorthChart({ snapshots }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No data yet — check back after your first snapshot
      </div>
    )
  }

  const data = snapshots.map(s => ({
    date: s.snapshot_date,
    label: formatMonthLabel(s.snapshot_date),
    total: Number(s.total_eur),
  }))

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Net Worth Over Time</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-col)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatShortEur}
            tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value: number) =>
              new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value)
            }
            labelFormatter={(label: string) => label}
            contentStyle={{
              backgroundColor: 'var(--color-card-bg)',
              border: '1px solid var(--color-border-col)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Net Worth"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#netWorthGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Create `NetWorthSummary.tsx`**

Create `app/(app)/net-worth/_components/NetWorthSummary.tsx`:

```tsx
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import type { NetWorthSnapshot } from '@/types/database'

type Props = {
  current: number
  snapshots: NetWorthSnapshot[]
}

function formatChange(current: number, previous: NetWorthSnapshot | undefined) {
  if (!previous) return null
  const change = current - Number(previous.total_eur)
  const pct = Number(previous.total_eur) > 0 ? (change / Number(previous.total_eur)) * 100 : 0
  const sign = change >= 0 ? '+' : ''
  return `${sign}${formatEur(change)} (${sign}${pct.toFixed(2)}%)`
}

export function NetWorthSummary({ current, snapshots }: Props) {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const startOfYear = `${today.getFullYear()}-01-01`

  const snapshot30d = [...snapshots].reverse().find(s => s.snapshot_date <= thirtyDaysAgo)
  const snapshotYTD = snapshots.find(s => s.snapshot_date >= startOfYear)

  const change30d = formatChange(current, snapshot30d)
  const changeYTD = formatChange(current, snapshotYTD)

  return (
    <div className="flex gap-4">
      <SummaryCard
        label="Current net worth"
        value={formatEur(current)}
        icon={TrendingUp}
        accent
      />
      <SummaryCard
        label="Change (30 days)"
        value={change30d ?? '—'}
        icon={Calendar}
      />
      <SummaryCard
        label="Change (this year)"
        value={changeYTD ?? '—'}
        icon={TrendingDown}
      />
    </div>
  )
}
```

- [ ] **Step 3: Create `BreakdownTable.tsx`**

Create `app/(app)/net-worth/_components/BreakdownTable.tsx`:

```tsx
import { formatEur } from '@/lib/utils'
import type { NetWorthBreakdown } from '@/lib/net-worth'

type Props = { breakdown: NetWorthBreakdown; total_eur: number }

export function BreakdownTable({ breakdown, total_eur }: Props) {
  return (
    <div className="rounded-xl border border-border-col bg-card-bg overflow-hidden">
      <div className="border-b border-border-col px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Breakdown</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-5 py-3 text-left">Name</th>
            <th className="px-5 py-3 text-right">Native balance</th>
            <th className="px-5 py-3 text-right">EUR equivalent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {breakdown.accounts.length > 0 && (
            <tr className="bg-content-bg">
              <td colSpan={3} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Accounts</td>
            </tr>
          )}
          {breakdown.accounts.map(a => (
            <tr key={a.id}>
              <td className="px-5 py-3 text-text-primary">{a.name}</td>
              <td className="px-5 py-3 text-right text-text-secondary">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: a.currency }).format(a.balance_native)}
              </td>
              <td className="px-5 py-3 text-right font-medium text-text-primary">{formatEur(a.balance_eur)}</td>
            </tr>
          ))}
          {breakdown.holdings.length > 0 && (
            <tr className="bg-content-bg">
              <td colSpan={3} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Holdings</td>
            </tr>
          )}
          {breakdown.holdings.map(h => (
            <tr key={h.id}>
              <td className="px-5 py-3 text-text-primary">{h.symbol}</td>
              <td className="px-5 py-3 text-right text-text-secondary">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: h.currency }).format(h.value_native)}
              </td>
              <td className="px-5 py-3 text-right font-medium text-text-primary">{formatEur(h.value_eur)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-border-col bg-content-bg">
            <td className="px-5 py-3 font-semibold text-text-primary" colSpan={2}>Total</td>
            <td className="px-5 py-3 text-right text-xl font-bold text-text-primary">{formatEur(total_eur)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create `SnapshotHistory.tsx`**

Create `app/(app)/net-worth/_components/SnapshotHistory.tsx`:

```tsx
import { formatEur } from '@/lib/utils'
import type { NetWorthSnapshot } from '@/types/database'

type Props = { snapshots: NetWorthSnapshot[] }

export function SnapshotHistory({ snapshots }: Props) {
  const sorted = [...snapshots].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date))

  return (
    <details className="rounded-xl border border-border-col bg-card-bg overflow-hidden">
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-text-primary select-none hover:bg-content-bg">
        Snapshot history ({sorted.length})
      </summary>
      <table className="w-full text-sm border-t border-border-col">
        <thead>
          <tr className="bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-5 py-3 text-left">Date</th>
            <th className="px-5 py-3 text-right">Net Worth (EUR)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {sorted.map(s => (
            <tr key={s.id}>
              <td className="px-5 py-3 text-text-secondary">{s.snapshot_date}</td>
              <td className="px-5 py-3 text-right font-medium text-text-primary">{formatEur(Number(s.total_eur))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
```

- [ ] **Step 5: Create `app/(app)/net-worth/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { computeNetWorth } from '@/lib/net-worth'
import { PageHeader } from '@/components/layout/PageHeader'
import { NetWorthSummary } from './_components/NetWorthSummary'
import { NetWorthChart } from './_components/NetWorthChart'
import { BreakdownTable } from './_components/BreakdownTable'
import { SnapshotHistory } from './_components/SnapshotHistory'

export default async function NetWorthPage() {
  const supabase = await createClient()

  // computeNetWorth upserts today's snapshot first — fetch snapshots after so today's point appears in the chart
  const netWorth = await computeNetWorth(supabase)
  const { data: snapshots } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: true })

  return (
    <div className="flex flex-col">
      <PageHeader title="Net Worth" />
      <div className="flex flex-col gap-6 p-6">
        <NetWorthSummary current={netWorth.total_eur} snapshots={snapshots} />
        <NetWorthChart snapshots={snapshots} />
        <BreakdownTable breakdown={netWorth.breakdown} total_eur={netWorth.total_eur} />
        <SnapshotHistory snapshots={snapshots} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors across all new files.

- [ ] **Step 7: Run full test suite**

Run: `npm run test:run`
Expected: all tests pass (holdings + net-worth + existing suites).

- [ ] **Step 8: Manual test**

Visit `/net-worth`. Verify:
- Summary cards render (change cards may show "—" if only one snapshot exists)
- Chart renders either the empty state message or a line (if snapshots exist)
- Breakdown table shows accounts section
- Snapshot history is collapsible and shows rows

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/net-worth/
git commit -m "feat: add net worth page with line chart, breakdown table, and snapshot history"
```
