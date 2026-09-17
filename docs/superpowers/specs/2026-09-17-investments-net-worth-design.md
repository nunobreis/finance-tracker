# Finance Tracker — Sub-project 4: Dashboard, Investments & Net Worth

**Date:** 2026-09-17
**Scope:** Real exchange rates, dashboard overview, investments/portfolio page, and net worth history page.
**Delivers:** A working dashboard showing key financial metrics, a portfolio tracker with auto-refreshed market prices, and a net worth history page with a line chart.

---

## Stack & Runtime Context

- Next.js 16.3.5 / React 19 — always `await createClient()`
- `proxy.ts` at project root (Next.js 16 middleware naming)
- Tailwind v4 — tokens in `globals.css` `@theme`
- `useActionState` from `react` (React 19)
- Sidebar is a Client Component
- `recharts` — add as dependency for the net worth line chart

---

## What This Sub-project Delivers

1. **`lib/exchange-rates.ts`** — replace stub with Frankfurter.app API + DB cache
2. **`lib/prices.ts`** — stale-if-fresh price refresh via `yahoo-finance2`
3. **`lib/holdings.ts`** — pure utility functions for holding value and P&L (unit tested)
4. **`lib/net-worth.ts`** — `computeNetWorth()` that aggregates accounts + holdings into a snapshot
5. **Dashboard page** (`/dashboard`) — net worth, GBP/EUR rate, spending vs budget, upcoming bills, recent transactions
6. **Investments page** (`/investments`) — holdings table with auto price refresh, add/edit drawer
7. **Net Worth page** (`/net-worth`) — line chart over time, breakdown table, snapshot history
8. **Sidebar** — add Investments and Net Worth nav items

---

## Data Layer

### Exchange Rates — `lib/exchange-rates.ts`

Replace the current stub (`return 1`) with:

- `getRate(base, quote) → Promise<number>` — checks `exchange_rates` table for a row where `rate_date = today`. If found, returns the rate. If not, fetches from `https://api.frankfurter.app/latest?from={base}&to={quote}`, inserts into `exchange_rates`, returns the rate.
- `getLatestRateInfo(base, quote) → Promise<{ rate: number; rate_date: string }>` — same lookup but returns both fields, for the dashboard widget.
- The `exchange_rates` table has no `user_id` and no RLS — it is a global shared cache. Use the server Supabase client (service role not needed; anon key can read/write since there is no RLS policy on this table).
- Stale threshold: one row per `rate_date`. If today's row exists, it's fresh. No time-of-day staleness check needed.

### Investment Prices — `lib/prices.ts`

- `refreshPricesIfStale(supabase, holdingIds: string[]) → Promise<void>`
  - Loads each holding's most recent `holding_price_history` row.
  - Splits into fresh (price within last 6 hours) and stale buckets.
  - For stale holdings, groups symbols and calls `yahoo-finance2`'s `quote()` method per symbol.
  - Writes results to `holding_price_history` (upsert on `(holding_id, price_date)` where `price_date = today`).
  - Fails per-symbol gracefully — if Yahoo returns nothing for a symbol, that holding is skipped (it will show last known price with a stale indicator).
- Called from a server action on the investments page load.

### Holdings Utilities — `lib/holdings.ts`

Pure functions, no Supabase dependency. Unit tested.

- `computeHoldingValue(qty, latestPrice, avgCostBasis, nativeCurrency, eurRate) → { value_eur, cost_eur, pnl_eur, pnl_pct }`
- `formatPnl(pnl_eur, pnl_pct) → { label, isPositive }` — for display formatting

### Net Worth Computation — `lib/net-worth.ts`

- `computeNetWorth(supabase) → Promise<{ total_eur: number; breakdown: NetWorthBreakdown }>`
  - Fetches all accounts with their derived balances (same query as accounts page).
  - For each non-EUR account, calls `getRate(currency, 'EUR')`.
  - Fetches all holdings with their latest `holding_price_history` price.
  - For each holding, converts to EUR using `getRate(holding.currency, 'EUR')`.
  - Upserts a `net_worth_snapshots` row for today (`ON CONFLICT (user_id, snapshot_date) DO UPDATE`).
  - Returns total + breakdown JSONB (accounts array + holdings array, each with native amount and EUR equivalent).

```ts
type NetWorthBreakdown = {
  accounts: { id: string; name: string; balance_native: number; currency: string; balance_eur: number }[]
  holdings: { id: string; symbol: string; value_native: number; currency: string; value_eur: number }[]
}
```

---

## Dashboard Page (`/dashboard`)

Server Component. All data fetched in parallel with `Promise.all`.

### Data fetched on load

- `computeNetWorth(supabase)` — net worth total + upserts today's snapshot
- `getLatestRateInfo('GBP', 'EUR')` — rate + rate_date for the widget
- Spending vs budget: sum of non-transfer transaction amounts for the current month vs sum of budget amounts for the current month (same period logic as budgets page)
- Upcoming bills: next 5 `recurring_bills` rows ordered by next due date within 30 days
- Recent transactions: last 5 `transactions` rows ordered by `date desc`, joined to `categories`

### Layout

**Top row — 3 `SummaryCard` components:**
| Card | Value | Subtitle |
|------|-------|----------|
| Net Worth | `€42,350` | "across all accounts" |
| GBP/EUR | `1.1842` | "as of 16 Sep" |
| Spending this month | `€1,240 / €2,000` | progress bar + `62% of budget` |

**Bottom row — 2 panels side by side:**

- **Upcoming Bills** — table: Name, Due date, Amount, Status badge. "View all" link to `/recurring-bills`. Shows max 5 rows, ordered soonest first.
- **Recent Transactions** — table: Date, Description, Category, Amount (coloured red/green). "View all" link to `/transactions`. Shows last 5.

### File structure

```
app/(app)/dashboard/
  page.tsx                        ← server component (replaces placeholder)
  _components/
    SpendingCard.tsx              ← spending vs budget card with progress bar
    UpcomingBillsPanel.tsx
    RecentTransactionsPanel.tsx
```

`SummaryCard` and `StatusBadge` reused from `components/ui/`.

---

## Investments Page (`/investments`)

### On load

Page is a Server Component that calls a `refreshPricesIfStale` server action, then renders with the refreshed data. A "last refreshed" timestamp derived from the most recent `holding_price_history.price_date` across all holdings is shown above the table.

### Summary cards (top row)

| Card | Value |
|------|-------|
| Total invested | `€18,400` (sum of qty × avg_cost_basis, in EUR) |
| Current value | `€21,250` (sum of qty × latest_price, in EUR) |
| Total P&L | `+€2,850 (+15.5%)` |

### Holdings table

Columns: Symbol, Name, Type, Account, Qty, Avg Cost, Current Price, Value (EUR), P&L (EUR), P&L %

- P&L EUR and % are colour-coded (green positive, red negative).
- If a holding's price is stale (no price within 6h and Yahoo returned nothing), show last known price with a small `stale` `StatusBadge`.
- Edit/delete actions per row (edit opens drawer, delete with confirmation).

### Add/Edit Holding Drawer

Fields:
- Symbol (text, e.g. `VWCE.DE`, `BTC-USD`)
- Name (text)
- Asset type (select: stock, ETF, fund, crypto, other)
- Account (select from user's accounts)
- Quantity (number)
- Avg cost basis (number, in holding's currency)
- Currency (text, 3-char, e.g. `EUR`, `GBP`, `USD`)

### Manual refresh

"Refresh prices" button above the table triggers the same `refreshPricesIfStale` server action with `force = true` (ignores the 6h stale check, always fetches).

### File structure

```
app/(app)/investments/
  page.tsx
  _components/
    InvestmentsSummary.tsx
    HoldingsTable.tsx
    AddHoldingDrawer.tsx
  actions.ts                      ← refreshPrices, addHolding, updateHolding, deleteHolding
```

```
lib/
  prices.ts                       ← refreshPricesIfStale
  holdings.ts                     ← pure value/P&L utilities
```

---

## Net Worth Page (`/net-worth`)

### On load

Calls `computeNetWorth(supabase)` to upsert today's snapshot, then fetches all `net_worth_snapshots` rows ordered by `snapshot_date asc`.

### Summary cards (top row)

| Card | Value |
|------|-------|
| Current net worth | `€42,350` |
| Change this month | `+€1,200 (+2.9%)` — today vs snapshot 30 days ago |
| Change this year | `+€8,400 (+24.7%)` — today vs earliest snapshot this year |

If a comparison snapshot doesn't exist yet, card shows "—".

### Line chart

Client Component (`NetWorthChart.tsx`) using `recharts` `LineChart`.

- X-axis: `snapshot_date` formatted as `MMM YY` (e.g. "Sep 25")
- Y-axis: `total_eur` formatted as `€42k`
- Single line, filled area under the line
- Tooltip: full date + exact EUR value

### Breakdown table

Shows today's `breakdown` JSONB columns:
- **Accounts section:** Name, Balance (native), Balance (EUR)
- **Holdings section:** Symbol, Name, Value (native), Value (EUR)
- Footer row: Total EUR

### Snapshot history

Collapsible secondary table below the breakdown: all snapshots with `snapshot_date` and `total_eur`. Read-only. Lets you verify what was recorded on each day.

### File structure

```
app/(app)/net-worth/
  page.tsx
  _components/
    NetWorthSummary.tsx
    NetWorthChart.tsx             ← 'use client', recharts
    BreakdownTable.tsx
    SnapshotHistory.tsx
```

---

## Sidebar

Add two nav items to `components/layout/Sidebar.tsx`, inserted after Dashboard:

```ts
{ href: '/investments', label: 'Investments', icon: TrendingUp },
{ href: '/net-worth',   label: 'Net Worth',   icon: BarChart2 },
```

Both icons from `lucide-react`.

---

## Testing

Unit tests in `tests/lib/`:

- `holdings.test.ts` — `computeHoldingValue`: correct EUR conversion, P&L sign, zero qty edge case
- `net-worth.test.ts` — `computeNetWorth` pure logic (mock Supabase responses): correct aggregation, handles missing holdings, handles single-currency case

No integration tests for the Frankfurter or Yahoo Finance calls — those are third-party APIs; unit test the transformation logic only.

---

## Dependencies to add

- `yahoo-finance2` — npm package for Yahoo Finance quotes
- `recharts` — line chart for net worth history

---

## Error Handling

- **Frankfurter fetch fails:** `getRate` throws; the calling page shows an error boundary or falls back to displaying "—" rather than crashing. Callers should handle the rejection gracefully.
- **Yahoo Finance fetch fails for a symbol:** logged, that holding skips the price update, displays last known price with `stale` badge. Page still renders.
- **No snapshots yet:** net worth change cards show "—". Chart renders empty state ("No data yet — check back after your first snapshot").
- **No holdings:** investments page shows empty state prompt to add first holding.
