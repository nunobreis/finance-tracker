# Tax Groundwork — Step 1 (A4 + A2/A3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the tax data foundation: historical exchange rates (`getRateOn` + `ensureRatesForRange` + `source_date` column), IRS deduction mapping for categories and transactions, income classification for categories, and country on accounts. No Phase B or C work.

**Architecture:** SQL migration run in the Supabase SQL Editor → pure utilities (TDD) → seed update → i18n strings → UI (Settings → Categories section + account country select). `schema.sql` and `types/database.ts` are updated to mirror the live DB after the migration runs.

**Spec:** `docs/superpowers/specs/2026-11-06-tax-and-learning-design.md` (Phases A2, A3, A4; build order step 1)

**Tech Stack:** Next.js 16.3.5 / React 19, Supabase (always `await createClient()`), Tailwind v4, Vitest, next-intl (EN + PT-PT)

## Global Constraints

- Always `await createClient()` — never call it synchronously
- Middleware file is `proxy.ts` — do not rename it
- Tailwind v4 — all tokens live in `globals.css` `@theme`; no `tailwind.config.ts` tokens
- `useActionState` comes from `react` (React 19), not `react-dom`
- Test runner: `npx vitest run` (alias `npm run test:run`)
- Test files live in `tests/lib/` and use Vitest import style
- `@` alias resolves to project root
- Amounts in `transactions.amount` are negative for expenses, positive for income; use `Math.abs()` when summing spend
- `occurred_on` is the date column on `transactions`
- **Tax views must never fall back to today's rate.** `getRateOn` returns `null` on failure; callers surface a "rate missing" state
- **Migration idempotency:** all `alter table` steps use `add column if not exists`; all data updates are conditional (`where col is null` or `where not exists`)
- **Migration user_id:** `auth.uid()` is null in the SQL Editor; derive `user_id` from existing system categories via a `do $$...$$` block
- Every new UI string goes in both `messages/en.json` and `messages/pt-PT.json` (PT-PT, not Brazilian Portuguese)

---

## File Map

**New files:**
- `lib/tax/deductions.ts` — pure spend-aggregation util
- `tests/lib/exchange-rates.test.ts`
- `tests/lib/tax/deductions.test.ts`
- `app/(app)/settings/_components/CategoriesSection.tsx`
- `docs/superpowers/plans/2026-11-06-tax-groundwork-step1.md` ← this file

**Modified files:**
- `schema.sql` — add `opening_balance` doc fix + all new columns
- `types/database.ts` — add `IrsDeduction`, `IncomeType` unions; update `Category`, `Transaction`, `Account`, `ExchangeRate`
- `lib/exchange-rates.ts` — add `getRateOn`, `ensureRatesForRange`
- `lib/categories.ts` — add new income system categories, `irs_deduction` defaults
- `messages/en.json` — new `Accounts.country`, `Accounts.countries`, top-level `Categories` section
- `messages/pt-PT.json` — same
- `app/(app)/settings/actions.ts` — add `updateCategoryTaxFields`
- `app/(app)/settings/page.tsx` — add `CategoriesSection`
- `app/(app)/accounts/_components/AddAccountDrawer.tsx` — add country select
- `app/(app)/accounts/_components/actions.ts` — save `country` field

---

### Task 1: SQL migration

Run this SQL in the Supabase SQL Editor. It is idempotent — safe to re-run.

**Files:**
- Mirror in: `schema.sql` (Step 3 below)

- [ ] **Step 1: Run the migration**

```sql
-- ── A4: historical exchange rates ───────────────────────────────────────────
alter table exchange_rates
  add column if not exists source_date date;

-- ── A2: IRS deduction mapping ────────────────────────────────────────────────
alter table categories
  add column if not exists irs_deduction text
    check (irs_deduction in (
      'health', 'education',
      'housing_rent', 'housing_interest',
      'general_family',
      'iva_sector.restaurants', 'iva_sector.accommodation',
      'iva_sector.vehicles', 'iva_sector.hairdressers', 'iva_sector.gym',
      'iva_sector.veterinary', 'iva_sector.public_transport',
      'none'
    ));

alter table transactions
  add column if not exists irs_deduction_override text
    check (irs_deduction_override in (
      'health', 'education',
      'housing_rent', 'housing_interest',
      'general_family',
      'iva_sector.restaurants', 'iva_sector.accommodation',
      'iva_sector.vehicles', 'iva_sector.hairdressers', 'iva_sector.gym',
      'iva_sector.veterinary', 'iva_sector.public_transport',
      'none'
    ));

-- ── A3: income classification ────────────────────────────────────────────────
alter table categories
  add column if not exists income_type text
    check (income_type in (
      'employment_pt', 'rental_foreign', 'interest_foreign',
      'dividends_foreign', 'capital_gains_foreign', 'other_foreign', 'other'
    ));

alter table accounts
  add column if not exists country char(2) not null default 'PT';

-- ── Data updates (all idempotent) ────────────────────────────────────────────

-- GBP accounts → country = 'GB'
update accounts
  set country = 'GB'
  where currency = 'GBP' and country = 'PT';

-- IRS deduction defaults on existing system categories
update categories set irs_deduction = 'health'
  where is_system = true and name = 'Health' and irs_deduction is null;
update categories set irs_deduction = 'housing_rent'
  where is_system = true and name = 'Housing' and irs_deduction is null;
update categories set irs_deduction = 'iva_sector.restaurants'
  where is_system = true and name = 'Eating Out' and irs_deduction is null;

-- Income type on existing "Income" system category
update categories set income_type = 'employment_pt'
  where is_system = true and name = 'Income' and income_type is null;

-- Insert new system income categories (derive user_id from existing; idempotent)
do $$
declare v_user_id uuid;
begin
  select user_id into v_user_id
    from categories where is_system = true limit 1;
  if v_user_id is null then return; end if;

  if not exists (
    select 1 from categories where is_system = true and name = 'Rental income (UK)'
  ) then
    insert into categories (user_id, name, kind, is_system, income_type)
    values (v_user_id, 'Rental income (UK)', 'income', true, 'rental_foreign');
  end if;

  if not exists (
    select 1 from categories where is_system = true and name = 'Interest'
  ) then
    insert into categories (user_id, name, kind, is_system, income_type)
    values (v_user_id, 'Interest', 'income', true, 'interest_foreign');
  end if;

  if not exists (
    select 1 from categories where is_system = true and name = 'Dividends'
  ) then
    insert into categories (user_id, name, kind, is_system, income_type)
    values (v_user_id, 'Dividends', 'income', true, 'dividends_foreign');
  end if;
end $$;
```

- [ ] **Step 2: Verify in Supabase Table Editor**

Check:
- `exchange_rates` has nullable `source_date` column
- `categories` has `irs_deduction` and `income_type` columns with CHECK constraints
- `transactions` has `irs_deduction_override` column with CHECK constraint
- `accounts` has `country` column; existing GBP accounts show `country = 'GB'`
- Three new system income categories exist: Rental income (UK), Interest, Dividends
- Existing Health → `irs_deduction = 'health'`; Housing → `'housing_rent'`; Eating Out → `'iva_sector.restaurants'`
- Existing Income → `income_type = 'employment_pt'`

- [ ] **Step 3: Update `schema.sql`**

Apply these changes to `schema.sql` to keep it in sync (documentation only — do not re-run in Supabase):

In the `accounts` table block, add after `is_active`:
```sql
  country char(2) not null default 'PT',
  opening_balance numeric(12,2) not null default 0,
```
(Note: `opening_balance` already exists in the live DB and in `types/database.ts`; this is a documentation fix only.)

In the `categories` table block, add after `is_system`:
```sql
  irs_deduction text check (irs_deduction in (
    'health', 'education',
    'housing_rent', 'housing_interest',
    'general_family',
    'iva_sector.restaurants', 'iva_sector.accommodation',
    'iva_sector.vehicles', 'iva_sector.hairdressers', 'iva_sector.gym',
    'iva_sector.veterinary', 'iva_sector.public_transport',
    'none'
  )),
  income_type text check (income_type in (
    'employment_pt', 'rental_foreign', 'interest_foreign',
    'dividends_foreign', 'capital_gains_foreign', 'other_foreign', 'other'
  )),
```

In the `transactions` table block, add after `source`:
```sql
  irs_deduction_override text check (irs_deduction_override in (
    'health', 'education',
    'housing_rent', 'housing_interest',
    'general_family',
    'iva_sector.restaurants', 'iva_sector.accommodation',
    'iva_sector.vehicles', 'iva_sector.hairdressers', 'iva_sector.gym',
    'iva_sector.veterinary', 'iva_sector.public_transport',
    'none'
  )),
```

In the `exchange_rates` table block, add after `rate`:
```sql
  source_date date,
```

- [ ] **Step 4: Commit**

```bash
git add schema.sql
git commit -m "docs: mirror tax groundwork schema changes in schema.sql"
```

---

### Task 2: Update `types/database.ts`

**Files:**
- Modify: `types/database.ts`

**Interfaces:**
- Produces: `IrsDeduction`, `IncomeType` unions; updated `Category`, `Transaction`, `Account`, `ExchangeRate` types and their `Database` entries

- [ ] **Step 1: Add type unions at top of file**

After the existing union exports (`AccountType`, `AssetType`, etc.), add:

```ts
export type IrsDeduction =
  | 'health' | 'education'
  | 'housing_rent' | 'housing_interest'
  | 'general_family'
  | 'iva_sector.restaurants' | 'iva_sector.accommodation'
  | 'iva_sector.vehicles' | 'iva_sector.hairdressers' | 'iva_sector.gym'
  | 'iva_sector.veterinary' | 'iva_sector.public_transport'
  | 'none'

export type IncomeType =
  | 'employment_pt' | 'rental_foreign' | 'interest_foreign'
  | 'dividends_foreign' | 'capital_gains_foreign' | 'other_foreign' | 'other'
```

- [ ] **Step 2: Update `Account`**

Add `country: string` after `currency`. (`opening_balance: number` is already present — no change needed there.)

- [ ] **Step 3: Update `Category`**

Add after `is_system`:
```ts
  irs_deduction: IrsDeduction | null
  income_type: IncomeType | null
```

- [ ] **Step 4: Update `Transaction`**

Add after `source`:
```ts
  irs_deduction_override: IrsDeduction | null
```

- [ ] **Step 5: Update `ExchangeRate`**

Add after `rate`:
```ts
  source_date: string | null
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add types/database.ts
git commit -m "feat(types): add IrsDeduction, IncomeType, and new tax fields to database types"
```

---

### Task 3: `lib/exchange-rates.ts` — `getRateOn` + `ensureRatesForRange` (TDD)

**Files:**
- Create: `tests/lib/exchange-rates.test.ts`
- Modify: `lib/exchange-rates.ts`

**Interfaces:**
- Produces:
  - `getRateOn(base, quote, date): Promise<number | null>` — DB cache hit returns immediately; miss calls `https://api.frankfurter.app/{date}?from=&to=`; stores under the requested date with `source_date` = ECB date returned; returns `null` on any failure (never falls back to today's rate)
  - `fillCalendarDays(ecbRates, from, to, existingDates?): Array<{rate_date, source_date, rate}>` — pure function; for each calendar day in `[from, to]` not in `existingDates`, finds the most-recent ECB rate date ≤ that day; skips days that have no ECB rate available (before first ECB entry in `ecbRates`)
  - `ensureRatesForRange(base, quote, from, to): Promise<void>` — best-effort batch fill; fetches Frankfurter time-series from `(from − 7 days)` to `to` (the lookback covers weekends/holidays at range start); delegates day-filling to `fillCalendarDays`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/exchange-rates.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
let mockCachedRate: string | null = null

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() =>
        Promise.resolve(
          mockCachedRate !== null
            ? { data: { rate: mockCachedRate }, error: null }
            : { data: null, error: { code: 'PGRST116' } }
        )
      ),
      upsert: mockUpsert,
    }),
  }),
}))

import { getRateOn, fillCalendarDays } from '@/lib/exchange-rates'

describe('getRateOn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCachedRate = null
  })

  it('returns 1 for same currency without hitting DB', async () => {
    expect(await getRateOn('EUR', 'EUR', '2026-01-15')).toBe(1)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('returns cached rate on DB hit', async () => {
    mockCachedRate = '1.1850'
    expect(await getRateOn('GBP', 'EUR', '2026-01-15')).toBeCloseTo(1.185)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('fetches from Frankfurter on cache miss and stores with matching source_date', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ date: '2026-01-15', rates: { EUR: 1.185 } }),
    } as Response)
    const rate = await getRateOn('GBP', 'EUR', '2026-01-15')
    expect(rate).toBeCloseTo(1.185)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rate_date: '2026-01-15',
        source_date: '2026-01-15',
        rate: 1.185,
        base_currency: 'GBP',
        quote_currency: 'EUR',
      }),
      expect.any(Object)
    )
  })

  it('stores under requested date with ECB date as source_date for weekends', async () => {
    // Frankfurter returns Friday 2026-01-16 when asked for Sunday 2026-01-18
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ date: '2026-01-16', rates: { EUR: 1.183 } }),
    } as Response)
    await getRateOn('GBP', 'EUR', '2026-01-18')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rate_date: '2026-01-18',   // requested date
        source_date: '2026-01-16', // ECB business day
      }),
      expect.any(Object)
    )
  })

  it('returns null when Frankfurter returns non-ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 } as Response)
    expect(await getRateOn('GBP', 'EUR', '2026-01-15')).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
    expect(await getRateOn('GBP', 'EUR', '2026-01-15')).toBeNull()
  })
})

describe('fillCalendarDays', () => {
  it('range starting on Saturday uses prior Friday ECB rate', () => {
    // ECB has Friday data (provided by the 7-day lookback in ensureRatesForRange)
    const rows = fillCalendarDays(
      { '2026-01-16': 1.183 },   // Friday
      '2026-01-17',               // Saturday (from)
      '2026-01-18'                // Sunday (to)
    )
    expect(rows).toEqual([
      { rate_date: '2026-01-17', source_date: '2026-01-16', rate: 1.183 },
      { rate_date: '2026-01-18', source_date: '2026-01-16', rate: 1.183 },
    ])
  })

  it('holiday mid-range uses previous business day rate', () => {
    // 2026-04-14 (Tuesday) missing from ECB — public holiday
    const rows = fillCalendarDays(
      { '2026-04-13': 1.180, '2026-04-15': 1.185 },
      '2026-04-13',
      '2026-04-15'
    )
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual({ rate_date: '2026-04-13', source_date: '2026-04-13', rate: 1.180 })
    expect(rows[1]).toEqual({ rate_date: '2026-04-14', source_date: '2026-04-13', rate: 1.180 })
    expect(rows[2]).toEqual({ rate_date: '2026-04-15', source_date: '2026-04-15', rate: 1.185 })
  })

  it('skips dates in existingDates', () => {
    const rows = fillCalendarDays(
      { '2026-01-14': 1.180, '2026-01-15': 1.183 },
      '2026-01-14',
      '2026-01-15',
      new Set(['2026-01-14'])
    )
    expect(rows).toEqual([
      { rate_date: '2026-01-15', source_date: '2026-01-15', rate: 1.183 },
    ])
  })

  it('excludes days before the first available ECB date', () => {
    const rows = fillCalendarDays(
      { '2026-01-15': 1.183 },
      '2026-01-14',   // no ECB rate available for this day
      '2026-01-15'
    )
    expect(rows).toEqual([
      { rate_date: '2026-01-15', source_date: '2026-01-15', rate: 1.183 },
    ])
  })

  it('returns empty array when ecbRates is empty', () => {
    expect(fillCalendarDays({}, '2026-01-14', '2026-01-16')).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npx vitest run tests/lib/exchange-rates.test.ts`
Expected: FAIL — `getRateOn` is not exported yet.

- [ ] **Step 3: Add `fillCalendarDays`, `getRateOn`, and `ensureRatesForRange` to `lib/exchange-rates.ts`**

Append to the existing file (keep `getLatestRateInfo` and `getRate` unchanged):

```ts
export function fillCalendarDays(
  ecbRates: Record<string, number>,
  from: string,
  to: string,
  existingDates?: Set<string>
): Array<{ rate_date: string; source_date: string; rate: number }> {
  const ecbDatesSorted = Object.keys(ecbRates).sort()
  if (ecbDatesSorted.length === 0) return []

  const rows: Array<{ rate_date: string; source_date: string; rate: number }> = []
  const cursor = new Date(from + 'T00:00:00Z')
  const end = new Date(to + 'T00:00:00Z')

  while (cursor <= end) {
    const day = cursor.toISOString().split('T')[0]
    if (!existingDates?.has(day)) {
      const source_date = ecbDatesSorted.filter(d => d <= day).at(-1)
      if (source_date) {
        rows.push({ rate_date: day, source_date, rate: ecbRates[source_date] })
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return rows
}

export async function getRateOn(
  base: string,
  quote: string,
  date: string
): Promise<number | null> {
  if (base === quote) return 1

  const supabase = await createClient()

  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', base)
    .eq('quote_currency', quote)
    .eq('rate_date', date)
    .single()

  if (cached) return Number(cached.rate)

  try {
    const res = await fetch(
      `https://api.frankfurter.app/${date}?from=${base}&to=${quote}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json() as { date: string; rates: Record<string, number> }
    const rate = data.rates[quote]
    if (rate == null) return null

    await supabase.from('exchange_rates').upsert(
      { base_currency: base, quote_currency: quote, rate, rate_date: date, source_date: data.date },
      { onConflict: 'rate_date,base_currency,quote_currency' }
    )
    return rate
  } catch {
    return null
  }
}

export async function ensureRatesForRange(
  base: string,
  quote: string,
  from: string,
  to: string
): Promise<void> {
  if (base === quote) return

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('exchange_rates')
    .select('rate_date')
    .eq('base_currency', base)
    .eq('quote_currency', quote)
    .gte('rate_date', from)
    .lte('rate_date', to)

  const existingDates = new Set((existing ?? []).map(r => r.rate_date as string))

  // Fetch 7 days before `from` so a range starting on a weekend/holiday
  // still gets the preceding business day's rate from the lookback window.
  const lookbackDate = new Date(from + 'T00:00:00Z')
  lookbackDate.setUTCDate(lookbackDate.getUTCDate() - 7)
  const fetchFrom = lookbackDate.toISOString().split('T')[0]

  try {
    const res = await fetch(
      `https://api.frankfurter.app/${fetchFrom}..${to}?from=${base}&to=${quote}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return
    const data = await res.json() as { rates: Record<string, Record<string, number>> }

    const ecbRates: Record<string, number> = {}
    for (const [d, rates] of Object.entries(data.rates)) {
      if (rates[quote] != null) ecbRates[d] = rates[quote]
    }

    const rows = fillCalendarDays(ecbRates, from, to, existingDates)

    if (rows.length > 0) {
      await supabase.from('exchange_rates').upsert(
        rows.map(r => ({ ...r, base_currency: base, quote_currency: quote })),
        { onConflict: 'rate_date,base_currency,quote_currency', ignoreDuplicates: true }
      )
    }
  } catch {
    // best-effort — caller can retry individual days via getRateOn
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npx vitest run tests/lib/exchange-rates.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/exchange-rates.ts tests/lib/exchange-rates.test.ts
git commit -m "feat: add getRateOn and ensureRatesForRange to exchange rates lib"
```

---

### Task 4: `lib/tax/deductions.ts` — `getDeductibleSpend` (TDD)

**Files:**
- Create: `lib/tax/deductions.ts`
- Create: `tests/lib/tax/deductions.test.ts`

**Interfaces:**
- Produces: `getDeductibleSpend(transactions, categories): Record<string, number>` — sums absolute spend per IRS deduction type. No rate or cap estimates — those come with A1 (tax_rules).

Resolution order: `irs_deduction_override` → `category.irs_deduction`. Skips: transfers, income (amount ≥ 0), non-EUR transactions (IRS deductions come from PT invoices), null/`'none'` deduction types.

- [ ] **Step 1: Write failing tests**

Create `tests/lib/tax/deductions.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getDeductibleSpend } from '@/lib/tax/deductions'

type Tx = { amount: number; currency: string; category_id: string | null; is_transfer: boolean; irs_deduction_override?: string | null }
type Cat = { id: string; irs_deduction?: string | null }

const cat = (id: string, irs: string | null = null): Cat => ({ id, irs_deduction: irs })
const tx = (amount: number, categoryId: string | null, override?: string | null, currency = 'EUR'): Tx => ({
  amount, currency, category_id: categoryId, is_transfer: false, irs_deduction_override: override ?? null,
})

describe('getDeductibleSpend', () => {
  it('returns empty object when no transactions', () => {
    expect(getDeductibleSpend([], [])).toEqual({})
  })

  it('sums expenses by category irs_deduction', () => {
    expect(
      getDeductibleSpend([tx(-50, 'c1'), tx(-30, 'c1')], [cat('c1', 'health')])
    ).toEqual({ health: 80 })
  })

  it('override takes precedence over category mapping', () => {
    expect(
      getDeductibleSpend([tx(-40, 'c1', 'education')], [cat('c1', 'health')])
    ).toEqual({ education: 40 })
  })

  it('excludes transactions with null deduction type (no override, no category mapping)', () => {
    expect(getDeductibleSpend([tx(-40, 'c1')], [cat('c1', null)])).toEqual({})
  })

  it('excludes transactions where deduction type is "none"', () => {
    expect(getDeductibleSpend([tx(-40, 'c1')], [cat('c1', 'none')])).toEqual({})
  })

  it('excludes transfer transactions', () => {
    expect(
      getDeductibleSpend(
        [{ amount: -100, category_id: 'c1', is_transfer: true, irs_deduction_override: null }],
        [cat('c1', 'health')]
      )
    ).toEqual({})
  })

  it('excludes income transactions (positive amount)', () => {
    expect(getDeductibleSpend([tx(500, 'c1')], [cat('c1', 'health')])).toEqual({})
  })

  it('groups multiple deduction types correctly', () => {
    expect(
      getDeductibleSpend(
        [tx(-50, 'c1'), tx(-30, 'c2'), tx(-20, 'c1')],
        [cat('c1', 'health'), cat('c2', 'iva_sector.restaurants')]
      )
    ).toEqual({ health: 70, 'iva_sector.restaurants': 30 })
  })

  it('skips transaction with no matching category', () => {
    expect(getDeductibleSpend([tx(-40, 'unknown')], [])).toEqual({})
  })

  it('excludes GBP expenses even in a deductible category', () => {
    expect(
      getDeductibleSpend([tx(-40, 'c1', null, 'GBP')], [cat('c1', 'health')])
    ).toEqual({})
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npx vitest run tests/lib/tax/deductions.test.ts`
Expected: FAIL — "Cannot find module '@/lib/tax/deductions'"

- [ ] **Step 3: Create `lib/tax/deductions.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npx vitest run tests/lib/tax/deductions.test.ts`
Expected: 9 tests PASS.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test:run`
Expected: all tests pass (exchange-rates, tax/deductions, and all pre-existing suites).

- [ ] **Step 6: Commit**

```bash
git add lib/tax/deductions.ts tests/lib/tax/deductions.test.ts
git commit -m "feat(tax): add getDeductibleSpend utility with tests"
```

---

### Task 5: `lib/categories.ts` seed update

**Files:**
- Modify: `lib/categories.ts`

**Interfaces:**
- Produces: new users get the three income categories + `irs_deduction` defaults pre-seeded. Existing users already have these via the SQL migration.

- [ ] **Step 1: Update `SYSTEM_CATEGORIES` and the seed function**

```ts
import type { CategoryKind, IrsDeduction, IncomeType, Database } from '@/types/database'
export { MONZO_CATEGORY_MAP, getCategoryId } from '@/lib/categories-utils'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']

const SYSTEM_CATEGORIES: Array<{
  name: string
  kind: CategoryKind
  irs_deduction?: IrsDeduction
  income_type?: IncomeType
}> = [
  { name: 'Housing',            kind: 'expense', irs_deduction: 'housing_rent' },
  { name: 'Food & Grocery',     kind: 'expense' },
  { name: 'Eating Out',         kind: 'expense', irs_deduction: 'iva_sector.restaurants' },
  { name: 'Transport',          kind: 'expense' },
  { name: 'Entertainment',      kind: 'expense' },
  { name: 'Health',             kind: 'expense', irs_deduction: 'health' },
  { name: 'Personal Care',      kind: 'expense' },
  { name: 'Utilities',          kind: 'expense' },
  { name: 'Subscriptions',      kind: 'expense' },
  { name: 'Shopping',           kind: 'expense' },
  { name: 'Travel',             kind: 'expense' },
  { name: 'Other',              kind: 'expense' },
  { name: 'Income',             kind: 'income',  income_type: 'employment_pt' },
  { name: 'Rental income (UK)', kind: 'income',  income_type: 'rental_foreign' },
  { name: 'Interest',           kind: 'income',  income_type: 'interest_foreign' },
  { name: 'Dividends',          kind: 'income',  income_type: 'dividends_foreign' },
  { name: 'Transfer',           kind: 'transfer' },
]

export async function seedCategoriesIfEmpty(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_system', true)

  if (count && count > 0) return

  const rows: CategoryInsert[] = SYSTEM_CATEGORIES.map(c => ({
    user_id: userId,
    name: c.name,
    kind: c.kind,
    is_system: true,
    parent_category_id: null,
    irs_deduction: c.irs_deduction ?? null,
    income_type: c.income_type ?? null,
  }))
  await supabase.from('categories').insert(rows)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/categories.ts
git commit -m "feat(categories): add irs_deduction and income_type to system category seed"
```

---

### Task 6: i18n strings

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/pt-PT.json`

- [ ] **Step 1: Add to `messages/en.json`**

In the `"Accounts"` object, add after `"types"`:
```json
"country": "Country",
"countries": {
  "PT": "Portugal",
  "GB": "United Kingdom"
}
```

Add a new top-level `"Categories"` object:
```json
"Categories": {
  "title": "Categories",
  "name": "Name",
  "irsDeduction": "IRS Deduction",
  "incomeType": "Income Type",
  "noMapping": "Not mapped",
  "irsDeductionOptions": {
    "health": "Health",
    "education": "Education",
    "housing_rent": "Housing — rent",
    "housing_interest": "Housing — mortgage interest",
    "general_family": "General family",
    "iva_sector.restaurants": "IVA — Restaurants",
    "iva_sector.accommodation": "IVA — Accommodation",
    "iva_sector.vehicles": "IVA — Vehicle maintenance",
    "iva_sector.hairdressers": "IVA — Hairdressers & beauty",
    "iva_sector.gym": "IVA — Gym & sports",
    "iva_sector.veterinary": "IVA — Veterinary",
    "iva_sector.public_transport": "IVA — Public transport passes",
    "none": "Not deductible"
  },
  "incomeTypeOptions": {
    "employment_pt": "PT Employment",
    "rental_foreign": "Foreign rental income",
    "interest_foreign": "Foreign interest",
    "dividends_foreign": "Foreign dividends",
    "capital_gains_foreign": "Foreign capital gains",
    "other_foreign": "Other foreign income",
    "other": "Other"
  },
  "save": "Save categories",
  "saved": "Categories saved"
}
```

- [ ] **Step 2: Add to `messages/pt-PT.json`**

In `"Accounts"`, add after `"types"`:
```json
"country": "País",
"countries": {
  "PT": "Portugal",
  "GB": "Reino Unido"
}
```

Add a new top-level `"Categories"` object:
```json
"Categories": {
  "title": "Categorias",
  "name": "Nome",
  "irsDeduction": "Dedução IRS",
  "incomeType": "Tipo de rendimento",
  "noMapping": "Sem mapeamento",
  "irsDeductionOptions": {
    "health": "Saúde",
    "education": "Educação",
    "housing_rent": "Habitação — renda",
    "housing_interest": "Habitação — juros de crédito",
    "general_family": "Encargos gerais familiares",
    "iva_sector.restaurants": "IVA — Restauração",
    "iva_sector.accommodation": "IVA — Alojamento",
    "iva_sector.vehicles": "IVA — Manutenção de automóveis",
    "iva_sector.hairdressers": "IVA — Cabeleireiros e beleza",
    "iva_sector.gym": "IVA — Ginásios e desporto",
    "iva_sector.veterinary": "IVA — Veterinários",
    "iva_sector.public_transport": "IVA — Passes de transporte público",
    "none": "Não dedutível"
  },
  "incomeTypeOptions": {
    "employment_pt": "Trabalho dependente (PT)",
    "rental_foreign": "Rendas estrangeiras",
    "interest_foreign": "Juros estrangeiros",
    "dividends_foreign": "Dividendos estrangeiros",
    "capital_gains_foreign": "Mais-valias estrangeiras",
    "other_foreign": "Outros rendimentos estrangeiros",
    "other": "Outros"
  },
  "save": "Guardar categorias",
  "saved": "Categorias guardadas"
}
```

- [ ] **Step 3: Commit**

```bash
git add messages/en.json messages/pt-PT.json
git commit -m "feat(i18n): add country, IRS deduction and income type strings"
```

---

### Task 7: Settings → Categories section

**Files:**
- Modify: `app/(app)/settings/actions.ts`
- Create: `app/(app)/settings/_components/CategoriesSection.tsx`
- Modify: `app/(app)/settings/page.tsx`

**Interfaces:**
- Produces: table of all categories with IRS deduction select (all rows) and income type select (kind = 'income' rows only); single form submit saves all via `updateCategoryTaxFields`

- [ ] **Step 1: Add `updateCategoryTaxFields` to `app/(app)/settings/actions.ts`**

Append to the existing file (keep `saveSettings` unchanged):

```ts
import type { IrsDeduction, IncomeType } from '@/types/database'

const VALID_IRS_DEDUCTIONS = new Set<string>([
  'health', 'education', 'housing_rent', 'housing_interest', 'general_family',
  'iva_sector.restaurants', 'iva_sector.accommodation', 'iva_sector.vehicles',
  'iva_sector.hairdressers', 'iva_sector.gym', 'iva_sector.veterinary',
  'iva_sector.public_transport', 'none',
])

const VALID_INCOME_TYPES = new Set<string>([
  'employment_pt', 'rental_foreign', 'interest_foreign', 'dividends_foreign',
  'capital_gains_foreign', 'other_foreign', 'other',
])

export async function updateCategoryTaxFields(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)

  // Validate all values before writing anything
  for (const cat of categories ?? []) {
    const rawIrs = formData.get(`irs_deduction_${cat.id}`) as string | null
    const rawIncome = formData.get(`income_type_${cat.id}`) as string | null
    if (rawIrs && !VALID_IRS_DEDUCTIONS.has(rawIrs))
      return { error: `Invalid IRS deduction value: ${rawIrs}` }
    if (rawIncome && !VALID_INCOME_TYPES.has(rawIncome))
      return { error: `Invalid income type value: ${rawIncome}` }
  }

  for (const cat of categories ?? []) {
    const rawIrs = formData.get(`irs_deduction_${cat.id}`) as string | null
    const rawIncome = formData.get(`income_type_${cat.id}`) as string | null
    const { error } = await supabase
      .from('categories')
      .update({
        irs_deduction: (rawIrs || null) as IrsDeduction | null,
        income_type: (rawIncome || null) as IncomeType | null,
      })
      .eq('id', cat.id)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: 'saved' }
}
```

- [ ] **Step 2: Create `app/(app)/settings/_components/CategoriesSection.tsx`**

```tsx
'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { updateCategoryTaxFields } from '../actions'
import type { Category, IrsDeduction, IncomeType } from '@/types/database'

type Props = { categories: Category[] }

const IRS_DEDUCTION_VALUES: IrsDeduction[] = [
  'health', 'education', 'housing_rent', 'housing_interest', 'general_family',
  'iva_sector.restaurants', 'iva_sector.accommodation', 'iva_sector.vehicles',
  'iva_sector.hairdressers', 'iva_sector.gym', 'iva_sector.veterinary',
  'iva_sector.public_transport', 'none',
]

const INCOME_TYPE_VALUES: IncomeType[] = [
  'employment_pt', 'rental_foreign', 'interest_foreign',
  'dividends_foreign', 'capital_gains_foreign', 'other_foreign', 'other',
]

const selectClass =
  'rounded-lg border border-border-col bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

export function CategoriesSection({ categories }: Props) {
  const t = useTranslations('Categories')
  const [state, formAction] = useActionState(updateCategoryTaxFields, {})

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('title')}</h2>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">
          {t('saved')}
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-col text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="pb-2 pr-4 text-left">{t('name')}</th>
                <th className="pb-2 pr-4 text-left">{t('irsDeduction')}</th>
                <th className="pb-2 text-left">{t('incomeType')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-col">
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td className="py-2 pr-4 text-text-primary">{cat.name}</td>
                  <td className="py-2 pr-4">
                    {cat.kind === 'expense' ? (
                      <select
                        name={`irs_deduction_${cat.id}`}
                        defaultValue={cat.irs_deduction ?? ''}
                        className={selectClass}
                      >
                        <option value="">{t('noMapping')}</option>
                        {IRS_DEDUCTION_VALUES.map(v => (
                          <option key={v} value={v}>{t(`irsDeductionOptions.${v}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </td>
                  <td className="py-2">
                    {cat.kind === 'income' ? (
                      <select
                        name={`income_type_${cat.id}`}
                        defaultValue={cat.income_type ?? ''}
                        className={selectClass}
                      >
                        <option value="">{t('noMapping')}</option>
                        {INCOME_TYPE_VALUES.map(v => (
                          <option key={v} value={v}>{t(`incomeTypeOptions.${v}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="submit"
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('save')}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Update `app/(app)/settings/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { SettingsForm } from './_components/SettingsForm'
import { CategoriesSection } from './_components/CategoriesSection'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('Settings')

  const metadata = user?.user_metadata ?? {}
  const reportingCurrency = (metadata.reporting_currency as string) ?? 'EUR'
  const locale = (metadata.locale as string) ?? 'en'

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('kind')
    .order('name')

  return (
    <div className="flex flex-col">
      <PageHeader title={t('title')} />
      <div className="flex max-w-2xl flex-col gap-6 p-6">
        <SettingsForm reportingCurrency={reportingCurrency} locale={locale} />
        <CategoriesSection categories={categories ?? []} />
      </div>
    </div>
  )
}
```

Note: `max-w-lg` widened to `max-w-2xl` to accommodate the category table.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual test**

Start `npm run dev`, visit `/settings`. Verify:
- Categories section appears below preferences
- Health shows "Health", Eating Out shows "IVA — Restaurants", etc.
- Income rows (Income, Rental income (UK), Interest, Dividends) show the income type select; all other rows show "—"
- Saving updates the values (verify in Supabase Table Editor)

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/settings/
git commit -m "feat(settings): add Categories section with IRS deduction and income type selects"
```

---

### Task 8: Account form — country select

**Files:**
- Modify: `app/(app)/accounts/_components/AddAccountDrawer.tsx`
- Modify: `app/(app)/accounts/_components/actions.ts`

**Interfaces:**
- Produces: `country` field on account create; defaults to `'PT'`

- [ ] **Step 1: Add country select to `AddAccountDrawer.tsx`**

After the existing currency `<div>`, add:

```tsx
<div>
  <label className="mb-1 block text-sm font-medium text-text-primary">
    {t('country')} <span className="text-status-danger">*</span>
  </label>
  <select
    name="country"
    required
    defaultValue="PT"
    className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
  >
    <option value="PT">{t('countries.PT')}</option>
    <option value="GB">{t('countries.GB')}</option>
  </select>
</div>
```

- [ ] **Step 2: Update `createAccount` in `actions.ts`**

Add `country` to the insert payload:

```ts
country: (formData.get('country') as string) || 'PT',
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual test**

Visit `/accounts`, open "Add account". Verify:
- Country select appears with "Portugal" and "United Kingdom" options, defaulting to "Portugal"
- Saving creates a row with the correct `country` value in Supabase

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/accounts/_components/AddAccountDrawer.tsx \
        app/\(app\)/accounts/_components/actions.ts
git commit -m "feat(accounts): add country select to account form"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npm run test:run`
Expected: all tests pass, including the new exchange-rates and tax/deductions suites.

- [ ] **Step 2: TypeScript clean build**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit spec + plan**

```bash
git add docs/superpowers/specs/2026-11-06-tax-and-learning-design.md \
        docs/superpowers/plans/2026-11-06-tax-groundwork-step1.md
git commit -m "docs: add tax & learning spec and step-1 implementation plan"
```

---

## Open questions for Phase B

- **IFICI deduction eligibility:** Whether health, education, and housing deductions still reduce tax liability under the 20% flat rate is unknown — do not assume they do. Verify with tax advisor before building deduction estimate cards in B2.
- **e-Fatura CSV column layout:** Before writing the Phase B plan, export a CSV from Portal das Finanças (Consultar faturas → Adquirente → export) and share the column headers plus 2–3 redacted sample rows, so the B3 parser is built against the real column names, date format and decimal separator. B3 must be ready before the end-of-February e-Fatura validation deadline.
- **IRS calendar feeds:** No Norte-to-morning-briefing integration needed. B1 will include a "Download .ics" button that exports IRS deadlines as all-day calendar events with short PT-PT titles (e.g. "IRS: validar faturas e-Fatura"), for manual import into Google Calendar.
