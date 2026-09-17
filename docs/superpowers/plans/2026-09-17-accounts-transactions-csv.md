# Accounts, Transactions & CSV Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core data layer — accounts page with derived balances, filterable transactions table with manual entry, and a 4-step CSV import stepper supporting Revolut and Monzo formats.

**Architecture:** Server Components fetch all data; Client Components handle interaction (filters, drawers, stepper). Mutations go through Server Actions co-located in `_components/actions.ts` beside each feature. CSV parsing is pure TypeScript in `lib/csv/` — no server needed for parsing, only for the final commit.

**Tech Stack:** Next.js 16.3.5 / React 19, Supabase (`@supabase/ssr`), Tailwind v4, papaparse (CSV parsing), Vitest (tests), lucide-react (icons).

**Spec:** `docs/superpowers/specs/2026-09-16-accounts-transactions-csv-design.md`

## Global Constraints

- Next.js 16.3.5 / React 19 — always `await createClient()`, always `await cookies()`
- Middleware file is `proxy.ts` (not `middleware.ts`) — Next.js 16 naming
- TypeScript strict mode — no `any`, no `ts-ignore`
- Tailwind v4 — tokens in `globals.css` `@theme`; use token class names only (e.g. `bg-card-bg`, `text-text-primary`) — never raw hex in JSX
- `useActionState` from `react` (React 19) — NOT `useFormState` from `react-dom`
- Icons: `lucide-react` only
- `'use server'` at top of every Server Actions file; `'use client'` at top of every Client Component file
- No `console.log` in committed code
- Commit after every task

---

## File Map

```
# Install
papaparse + @types/papaparse                  # CSV parsing (Task 1)

# New lib files
lib/csv/normalize.ts                           # NormalisedRow type + shared helpers
lib/csv/detect.ts                              # detectFormat() from CSV headers
lib/csv/parsers/revolut.ts                     # parseRevolut(records) → NormalisedRow[]
lib/csv/parsers/monzo.ts                       # parseMonzo(records) → NormalisedRow[]
lib/csv/dedup.ts                               # flagDuplicates(rows, existing) → boolean[]
lib/categories.ts                              # MONZO_CATEGORY_MAP, getCategoryId(), seedCategoriesIfEmpty()
lib/exchange-rates.ts                          # getRate() stub returning 1.0

# New shared UI
components/ui/SummaryCard.tsx                  # Stat card (label, value, optional icon)
components/ui/Drawer.tsx                       # Slide-out drawer panel ('use client')
components/ui/StatusBadge.tsx                  # Coloured pill badge

# Accounts feature
app/(app)/accounts/page.tsx                    # Server Component — fetch accounts + balances
app/(app)/accounts/_components/AccountsSummary.tsx   # Net worth + count summary cards
app/(app)/accounts/_components/AccountCard.tsx        # Single account card
app/(app)/accounts/_components/AddAccountDrawer.tsx   # 'use client' add account form
app/(app)/accounts/_components/actions.ts             # 'use server' — createAccount

# Transactions feature
app/(app)/transactions/page.tsx                # Server Component — filtered transaction list
app/(app)/transactions/_components/TransactionTable.tsx    # Transaction rows
app/(app)/transactions/_components/TransactionFilters.tsx  # 'use client' URL-param filters
app/(app)/transactions/_components/TransactionSummary.tsx  # In/out/net chips
app/(app)/transactions/_components/AddTransactionDrawer.tsx # 'use client' add + transfer form
app/(app)/transactions/_components/actions.ts  # 'use server' — createTransaction, importBatch

# CSV import stepper
app/(app)/transactions/import/page.tsx         # Full 'use client' stepper page
app/(app)/transactions/import/_components/ImportStepper.tsx   # Step shell + state machine
app/(app)/transactions/import/_components/UploadStep.tsx      # File drop + account selector
app/(app)/transactions/import/_components/MapStep.tsx         # Column mapping review
app/(app)/transactions/import/_components/PreviewStep.tsx     # Rows + duplicate flags
app/(app)/transactions/import/_components/ConfirmStep.tsx     # Final summary + import button

# Modified
app/(app)/layout.tsx                           # Add seedCategoriesIfEmpty() call

# Tests
tests/lib/csv/detect.test.ts
tests/lib/csv/parsers.test.ts
tests/lib/csv/dedup.test.ts
tests/lib/categories.test.ts
```

---

## Task 1: CSV Utilities (Pure Functions + Tests)

**Files:**
- Create: `lib/csv/normalize.ts`, `lib/csv/detect.ts`, `lib/csv/parsers/revolut.ts`, `lib/csv/parsers/monzo.ts`, `lib/csv/dedup.ts`
- Create: `tests/lib/csv/detect.test.ts`, `tests/lib/csv/parsers.test.ts`, `tests/lib/csv/dedup.test.ts`

**Interfaces:**
- Produces:
  - `NormalisedRow` type from `@/lib/csv/normalize`
  - `detectFormat(headers: string[]): 'revolut' | 'monzo' | null` from `@/lib/csv/detect`
  - `parseRevolut(records: Record<string, string>[]): NormalisedRow[]` from `@/lib/csv/parsers/revolut`
  - `parseMonzo(records: Record<string, string>[]): NormalisedRow[]` from `@/lib/csv/parsers/monzo`
  - `ExistingTransaction` type and `flagDuplicates(rows: NormalisedRow[], existing: ExistingTransaction[]): boolean[]` from `@/lib/csv/dedup`

- [ ] **Step 1: Install papaparse**

```bash
npm install papaparse @types/papaparse
```

- [ ] **Step 2: Write failing tests**

Create `tests/lib/csv/detect.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { detectFormat } from '@/lib/csv/detect'

describe('detectFormat', () => {
  it('detects Revolut from headers', () => {
    expect(detectFormat(['Type', 'Started Date', 'Completed Date', 'Amount', 'Currency'])).toBe('revolut')
  })
  it('detects Monzo from headers', () => {
    expect(detectFormat(['Transaction ID', 'Date', 'Money Out', 'Money In', 'Amount'])).toBe('monzo')
  })
  it('returns null for unrecognised headers', () => {
    expect(detectFormat(['Date', 'Amount', 'Description'])).toBeNull()
  })
  it('is case-sensitive — real CSV headers have fixed casing', () => {
    expect(detectFormat(['transaction id', 'money out'])).toBeNull()
  })
})
```

Create `tests/lib/csv/parsers.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseRevolut } from '@/lib/csv/parsers/revolut'
import { parseMonzo } from '@/lib/csv/parsers/monzo'

describe('parseRevolut', () => {
  const completedRow = {
    Type: 'CARD_PAYMENT',
    'Started Date': '2026-09-01 10:00:00',
    'Completed Date': '2026-09-01 10:05:00',
    Description: 'Tesco',
    Amount: '-25.50',
    Fee: '0.00',
    Currency: 'GBP',
    State: 'COMPLETED',
    Balance: '974.50',
  }

  it('parses a completed card payment', () => {
    const [result] = parseRevolut([completedRow])
    expect(result.occurred_on).toBe('2026-09-01')
    expect(result.amount).toBe(-25.5)
    expect(result.currency).toBe('GBP')
    expect(result.merchant).toBe('Tesco')
    expect(result.description).toBe('Tesco')
    expect(result.is_transfer).toBe(false)
    expect(result.external_id).toBeNull()
    expect(result.raw_category).toBeNull()
  })

  it('skips PENDING transactions', () => {
    const pending = { ...completedRow, State: 'PENDING' }
    expect(parseRevolut([pending])).toHaveLength(0)
  })

  it('skips FAILED transactions', () => {
    const failed = { ...completedRow, State: 'FAILED' }
    expect(parseRevolut([failed])).toHaveLength(0)
  })

  it('marks TRANSFER type as is_transfer', () => {
    const transfer = { ...completedRow, Type: 'TRANSFER' }
    const [result] = parseRevolut([transfer])
    expect(result.is_transfer).toBe(true)
  })

  it('handles date with only date part (no time)', () => {
    const row = { ...completedRow, 'Completed Date': '2026-09-15' }
    const [result] = parseRevolut([row])
    expect(result.occurred_on).toBe('2026-09-15')
  })
})

describe('parseMonzo', () => {
  const monzoRow = {
    'Transaction ID': 'tx_abc123def456',
    Date: '2026-09-01',
    Time: '10:30:00',
    Type: 'card_payment',
    Name: 'Waitrose',
    Emoji: '🛒',
    Category: 'groceries',
    Amount: '-18.40',
    Currency: 'GBP',
    'Local amount': '-18.40',
    'Local currency': 'GBP',
    'Notes and #tags': '',
    Address: '',
    Receipt: '',
    Description: 'Waitrose 123',
    'Category split': '',
    'Money Out': '18.40',
    'Money In': '',
  }

  it('parses a Monzo card payment', () => {
    const [result] = parseMonzo([monzoRow])
    expect(result.occurred_on).toBe('2026-09-01')
    expect(result.amount).toBe(-18.4)
    expect(result.currency).toBe('GBP')
    expect(result.merchant).toBe('Waitrose')
    expect(result.external_id).toBe('tx_abc123def456')
    expect(result.raw_category).toBe('groceries')
    expect(result.is_transfer).toBe(false)
  })

  it('marks pot_transfer as is_transfer', () => {
    const transfer = { ...monzoRow, Type: 'pot_transfer' }
    const [result] = parseMonzo([transfer])
    expect(result.is_transfer).toBe(true)
  })

  it('uses Description as fallback if Name is empty', () => {
    const row = { ...monzoRow, Name: '' }
    const [result] = parseMonzo([row])
    expect(result.merchant).toBe('Waitrose 123')
  })
})
```

Create `tests/lib/csv/dedup.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { flagDuplicates } from '@/lib/csv/dedup'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { ExistingTransaction } from '@/lib/csv/dedup'

const makeRow = (overrides: Partial<NormalisedRow> = {}): NormalisedRow => ({
  occurred_on: '2026-09-01',
  amount: -25.5,
  currency: 'GBP',
  description: null,
  merchant: null,
  external_id: null,
  is_transfer: false,
  raw_category: null,
  ...overrides,
})

const existing: ExistingTransaction[] = [
  { occurred_on: '2026-09-01', amount: -25.5,  currency: 'GBP', external_id: null },
  { occurred_on: '2026-09-02', amount: -10.0,  currency: 'GBP', external_id: 'tx_abc' },
]

describe('flagDuplicates', () => {
  it('flags soft duplicate by date + amount + currency (Revolut style)', () => {
    expect(flagDuplicates([makeRow()], existing)).toEqual([true])
  })

  it('flags exact duplicate by external_id (Monzo style)', () => {
    const row = makeRow({ occurred_on: '2026-09-02', amount: -10.0, external_id: 'tx_abc' })
    expect(flagDuplicates([row], existing)).toEqual([true])
  })

  it('does not flag a new transaction', () => {
    const row = makeRow({ occurred_on: '2026-09-03', amount: -50.0 })
    expect(flagDuplicates([row], existing)).toEqual([false])
  })

  it('does not flag when external_id differs even if date/amount match', () => {
    // Row with an external_id does exact-match only — different ID = not a dup
    const row = makeRow({ external_id: 'tx_different' })
    expect(flagDuplicates([row], existing)).toEqual([false])
  })

  it('handles empty existing list', () => {
    expect(flagDuplicates([makeRow()], [])).toEqual([false])
  })

  it('handles multiple rows, mixed results', () => {
    const rows = [makeRow(), makeRow({ occurred_on: '2026-09-05', amount: -99 })]
    expect(flagDuplicates(rows, existing)).toEqual([true, false])
  })
})
```

- [ ] **Step 3: Run tests — confirm they fail**

```bash
npm run test:run tests/lib/csv/
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Create `lib/csv/normalize.ts`**

```ts
export type NormalisedRow = {
  occurred_on: string        // 'YYYY-MM-DD'
  amount: number             // signed — negative = debit, positive = credit
  currency: string           // 3-char ISO code e.g. 'GBP'
  description: string | null
  merchant: string | null
  external_id: string | null // Monzo Transaction ID; null for Revolut
  is_transfer: boolean
  raw_category: string | null // Monzo raw category string before mapping; null for Revolut
}

export function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[^0-9.-]/g, ''))
}

export function extractDate(raw: string): string {
  // Handles '2026-09-01 10:30:00', '2026-09-01T10:30:00', '2026-09-01'
  return raw.trim().split(/[ T]/)[0]
}
```

- [ ] **Step 5: Create `lib/csv/detect.ts`**

```ts
export function detectFormat(headers: string[]): 'revolut' | 'monzo' | null {
  if (headers.includes('Started Date') && headers.includes('Completed Date')) {
    return 'revolut'
  }
  if (headers.includes('Transaction ID') && headers.includes('Money Out')) {
    return 'monzo'
  }
  return null
}
```

- [ ] **Step 6: Create `lib/csv/parsers/revolut.ts`**

```ts
import type { NormalisedRow } from '@/lib/csv/normalize'
import { parseAmount, extractDate } from '@/lib/csv/normalize'

export function parseRevolut(records: Record<string, string>[]): NormalisedRow[] {
  return records
    .filter(r => r['State']?.trim() === 'COMPLETED')
    .map(r => ({
      occurred_on: extractDate(r['Completed Date'] ?? ''),
      amount: parseAmount(r['Amount'] ?? '0'),
      currency: r['Currency']?.trim() ?? 'GBP',
      description: r['Description']?.trim() || null,
      merchant: r['Description']?.trim() || null,
      external_id: null,
      is_transfer: r['Type']?.trim() === 'TRANSFER',
      raw_category: null,
    }))
}
```

- [ ] **Step 7: Create `lib/csv/parsers/monzo.ts`**

```ts
import type { NormalisedRow } from '@/lib/csv/normalize'
import { parseAmount, extractDate } from '@/lib/csv/normalize'

export function parseMonzo(records: Record<string, string>[]): NormalisedRow[] {
  return records.map(r => {
    const name = r['Name']?.trim() || null
    const description = r['Description']?.trim() || null
    return {
      occurred_on: extractDate(r['Date'] ?? ''),
      amount: parseAmount(r['Amount'] ?? '0'),
      currency: r['Currency']?.trim() ?? 'GBP',
      description,
      merchant: name ?? description,
      external_id: r['Transaction ID']?.trim() || null,
      is_transfer: r['Type']?.trim() === 'pot_transfer',
      raw_category: r['Category']?.trim() || null,
    }
  })
}
```

- [ ] **Step 8: Create `lib/csv/dedup.ts`**

```ts
import type { NormalisedRow } from '@/lib/csv/normalize'

export type ExistingTransaction = {
  occurred_on: string
  amount: number
  currency: string
  external_id: string | null
}

export function flagDuplicates(
  rows: NormalisedRow[],
  existing: ExistingTransaction[]
): boolean[] {
  return rows.map(row => {
    if (row.external_id) {
      // Monzo: exact match on external_id
      return existing.some(e => e.external_id === row.external_id)
    }
    // Revolut: soft match on date + amount + currency
    return existing.some(
      e =>
        e.occurred_on === row.occurred_on &&
        Math.abs(e.amount - row.amount) < 0.001 &&
        e.currency === row.currency
    )
  })
}
```

- [ ] **Step 9: Run tests — confirm they all pass**

```bash
npm run test:run tests/lib/csv/
```

Expected: all tests PASS.

- [ ] **Step 10: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 11: Commit**

```bash
git add lib/csv/ tests/lib/csv/
git commit -m "feat: add CSV utility functions (detect, parse, dedup) with tests"
```

---

## Task 2: Foundation — Categories, SummaryCard, Drawer, StatusBadge, Exchange Rates Stub

**Files:**
- Create: `lib/categories.ts`, `lib/exchange-rates.ts`
- Create: `components/ui/SummaryCard.tsx`, `components/ui/Drawer.tsx`, `components/ui/StatusBadge.tsx`
- Create: `tests/lib/categories.test.ts`
- Modify: `app/(app)/layout.tsx`

**Interfaces:**
- Produces:
  - `MONZO_CATEGORY_MAP: Record<string, string>` from `@/lib/categories`
  - `getCategoryId(rawCategory: string, categories: Category[]): string | null` from `@/lib/categories`
  - `seedCategoriesIfEmpty(userId: string): Promise<void>` from `@/lib/categories`
  - `getRate(base: string, quote: string): Promise<number>` from `@/lib/exchange-rates`
  - `<SummaryCard label value icon? accent? />` from `@/components/ui/SummaryCard`
  - `<Drawer isOpen onClose title children />` from `@/components/ui/Drawer`
  - `<StatusBadge label color />` from `@/components/ui/StatusBadge`

- [ ] **Step 1: Write failing category tests**

Create `tests/lib/categories.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getCategoryId, MONZO_CATEGORY_MAP } from '@/lib/categories'
import type { Category } from '@/types/database'

const mockCategories: Category[] = [
  { id: 'cat-food', user_id: 'u1', name: 'Food & Grocery', kind: 'expense', parent_category_id: null, is_system: true },
  { id: 'cat-transport', user_id: 'u1', name: 'Transport', kind: 'expense', parent_category_id: null, is_system: true },
  { id: 'cat-eating-out', user_id: 'u1', name: 'Eating Out', kind: 'expense', parent_category_id: null, is_system: true },
]

describe('getCategoryId', () => {
  it('maps groceries → Food & Grocery', () => {
    expect(getCategoryId('groceries', mockCategories)).toBe('cat-food')
  })
  it('maps transport → Transport', () => {
    expect(getCategoryId('transport', mockCategories)).toBe('cat-transport')
  })
  it('maps eating_out → Eating Out', () => {
    expect(getCategoryId('eating_out', mockCategories)).toBe('cat-eating-out')
  })
  it('returns null for unknown Monzo category', () => {
    expect(getCategoryId('unknown_xyz', mockCategories)).toBeNull()
  })
  it('returns null when mapped name not in category list', () => {
    // holidays → Travel, but Travel not in mockCategories
    expect(getCategoryId('holidays', mockCategories)).toBeNull()
  })
})

describe('MONZO_CATEGORY_MAP', () => {
  it('has all required mappings', () => {
    expect(MONZO_CATEGORY_MAP['groceries']).toBe('Food & Grocery')
    expect(MONZO_CATEGORY_MAP['eating_out']).toBe('Eating Out')
    expect(MONZO_CATEGORY_MAP['transport']).toBe('Transport')
    expect(MONZO_CATEGORY_MAP['entertainment']).toBe('Entertainment')
    expect(MONZO_CATEGORY_MAP['bills']).toBe('Utilities')
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm run test:run tests/lib/categories.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `lib/categories.ts`**

```ts
import type { Category } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

export const MONZO_CATEGORY_MAP: Record<string, string> = {
  groceries:     'Food & Grocery',
  eating_out:    'Eating Out',
  transport:     'Transport',
  entertainment: 'Entertainment',
  health:        'Health',
  personal_care: 'Personal Care',
  bills:         'Utilities',
  shopping:      'Shopping',
  holidays:      'Travel',
  general:       'Other',
}

export function getCategoryId(
  rawCategory: string,
  categories: Category[]
): string | null {
  const mappedName = MONZO_CATEGORY_MAP[rawCategory]
  if (!mappedName) return null
  return categories.find(c => c.name === mappedName)?.id ?? null
}

const SYSTEM_CATEGORIES = [
  { name: 'Housing',        kind: 'expense'  },
  { name: 'Food & Grocery', kind: 'expense'  },
  { name: 'Eating Out',     kind: 'expense'  },
  { name: 'Transport',      kind: 'expense'  },
  { name: 'Entertainment',  kind: 'expense'  },
  { name: 'Health',         kind: 'expense'  },
  { name: 'Personal Care',  kind: 'expense'  },
  { name: 'Utilities',      kind: 'expense'  },
  { name: 'Subscriptions',  kind: 'expense'  },
  { name: 'Shopping',       kind: 'expense'  },
  { name: 'Travel',         kind: 'expense'  },
  { name: 'Other',          kind: 'expense'  },
  { name: 'Income',         kind: 'income'   },
  { name: 'Transfer',       kind: 'transfer' },
] as const

export async function seedCategoriesIfEmpty(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_system', true)

  if (count && count > 0) return

  await supabase.from('categories').insert(
    SYSTEM_CATEGORIES.map(c => ({ ...c, user_id: userId, is_system: true }))
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm run test:run tests/lib/categories.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Create `lib/exchange-rates.ts`**

```ts
// TODO (Sub-project 4): replace with real Frankfurter API fetch + DB cache
export async function getRate(base: string, _quote: string): Promise<number> {
  if (base === _quote) return 1
  return 1
}
```

- [ ] **Step 6: Create `components/ui/SummaryCard.tsx`**

```tsx
import { type LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string
  icon?: LucideIcon
  accent?: boolean
}

export function SummaryCard({ label, value, icon: Icon, accent = false }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border-col bg-card-bg p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? 'bg-accent-light' : 'bg-content-bg'}`}>
            <Icon size={16} className={accent ? 'text-accent' : 'text-text-tertiary'} />
          </div>
        )}
      </div>
      <span className="text-2xl font-semibold text-text-primary">{value}</span>
    </div>
  )
}
```

- [ ] **Step 7: Create `components/ui/Drawer.tsx`**

```tsx
'use client'

import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Drawer({ isOpen, onClose, title, children }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card-bg shadow-xl">
        <div className="flex items-center justify-between border-b border-border-col px-6 py-4">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-tertiary hover:bg-content-bg hover:text-text-primary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </>
  )
}
```

- [ ] **Step 8: Create `components/ui/StatusBadge.tsx`**

```tsx
type Color = 'good' | 'warn' | 'danger' | 'neutral' | 'accent'

type Props = {
  label: string
  color?: Color
}

const colorMap: Record<Color, string> = {
  good:    'bg-good-bg text-status-good',
  warn:    'bg-warn-bg text-status-warn',
  danger:  'bg-danger-bg text-status-danger',
  neutral: 'bg-content-bg text-text-secondary',
  accent:  'bg-accent-light text-accent',
}

export function StatusBadge({ label, color = 'neutral' }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color]}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 9: Update `app/(app)/layout.tsx` to seed categories**

Replace the entire file:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { seedCategoriesIfEmpty } from '@/lib/categories'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await seedCategoriesIfEmpty(user.id)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto bg-content-bg">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 10: Run all tests and build**

```bash
npm run test:run && npm run build
```

Expected: all tests pass, build clean.

- [ ] **Step 11: Commit**

```bash
git add lib/categories.ts lib/exchange-rates.ts components/ui/ app/\(app\)/layout.tsx tests/lib/categories.test.ts
git commit -m "feat: add categories, SummaryCard, Drawer, StatusBadge, and exchange rate stub"
```

---

## Task 3: Accounts Page

**Files:**
- Create: `app/(app)/accounts/page.tsx`
- Create: `app/(app)/accounts/_components/AccountsSummary.tsx`
- Create: `app/(app)/accounts/_components/AccountCard.tsx`
- Create: `app/(app)/accounts/_components/AddAccountDrawer.tsx`
- Create: `app/(app)/accounts/_components/actions.ts`

**Interfaces:**
- Consumes:
  - `SummaryCard` from `@/components/ui/SummaryCard`
  - `Drawer` from `@/components/ui/Drawer`
  - `getRate(base, quote)` from `@/lib/exchange-rates`
  - `formatEur(amount)`, `formatDate(date)` from `@/lib/utils`
  - `createClient()` from `@/lib/supabase/server`
  - `Account` type from `@/types/database`
- Produces: `/accounts` route — working page with account cards and add account drawer

- [ ] **Step 1: Create `app/(app)/accounts/_components/actions.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AccountType } from '@/types/database'

export async function createAccount(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: (formData.get('name') as string).trim(),
    institution: (formData.get('institution') as string)?.trim() || null,
    account_type: formData.get('account_type') as AccountType,
    currency: formData.get('currency') as string,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/accounts')
  return {}
}
```

- [ ] **Step 2: Create `app/(app)/accounts/_components/AddAccountDrawer.tsx`**

```tsx
'use client'

import { useState, useActionState } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { createAccount } from './actions'
import { Plus } from 'lucide-react'

const initialState = {}

export function AddAccountDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(createAccount, initialState)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={16} />
        Add account
      </button>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add account">
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
            {state.error}
          </div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Account name <span className="text-status-danger">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Revolut"
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Institution</label>
            <input
              name="institution"
              placeholder="e.g. Revolut Bank"
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Account type <span className="text-status-danger">*</span>
            </label>
            <select
              name="account_type"
              required
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit_card">Credit card</option>
              <option value="cash">Cash</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Currency <span className="text-status-danger">*</span>
            </label>
            <select
              name="currency"
              required
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create account
          </button>
        </form>
      </Drawer>
    </>
  )
}
```

- [ ] **Step 3: Create `app/(app)/accounts/_components/AccountCard.tsx`**

```tsx
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Account } from '@/types/database'

type Props = {
  account: Account
  balance: number
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking:    'Checking',
  savings:     'Savings',
  credit_card: 'Credit card',
  cash:        'Cash',
  investment:  'Investment',
}

function formatBalance(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function AccountCard({ account, balance }: Props) {
  const initial = (account.institution ?? account.name).charAt(0).toUpperCase()

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-col bg-card-bg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="font-medium text-text-primary">{account.name}</p>
            {account.institution && (
              <p className="text-xs text-text-tertiary">{account.institution}</p>
            )}
          </div>
        </div>
        <span className="rounded-full bg-content-bg px-2.5 py-0.5 text-xs text-text-secondary">
          {ACCOUNT_TYPE_LABELS[account.account_type]}
        </span>
      </div>

      <div>
        <p className="text-xs text-text-secondary">Balance</p>
        <p className="text-2xl font-semibold text-text-primary">
          {formatBalance(balance, account.currency)}
        </p>
      </div>

      <Link
        href={`/transactions/import?account=${account.id}`}
        className="flex items-center gap-1 text-xs text-accent hover:underline"
      >
        Import CSV <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/accounts/_components/AccountsSummary.tsx`**

```tsx
import { Wallet, Hash, Calendar } from 'lucide-react'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur, formatDate } from '@/lib/utils'
import type { Account } from '@/types/database'

type Props = {
  accounts: Account[]
  balances: Record<string, number>  // account.id → balance in native currency
  gbpToEur: number
}

export function AccountsSummary({ accounts, balances, gbpToEur }: Props) {
  const netWorthEur = accounts.reduce((sum, a) => {
    const balance = balances[a.id] ?? 0
    const rate = a.currency === 'EUR' ? 1 : gbpToEur
    return sum + balance * rate
  }, 0)

  return (
    <div className="flex gap-4">
      <SummaryCard
        label="Net Worth"
        value={formatEur(netWorthEur)}
        icon={Wallet}
        accent
      />
      <SummaryCard
        label="Accounts"
        value={String(accounts.length)}
        icon={Hash}
      />
      <SummaryCard
        label="Today"
        value={formatDate(new Date())}
        icon={Calendar}
      />
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/accounts/page.tsx`**

```tsx
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getRate } from '@/lib/exchange-rates'
import { PageHeader } from '@/components/layout/PageHeader'
import { AccountsSummary } from './_components/AccountsSummary'
import { AccountCard } from './_components/AccountCard'
import { AddAccountDrawer } from './_components/AddAccountDrawer'

export default async function AccountsPage() {
  const supabase = await createClient()

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const accountList = accounts ?? []

  // Derive balance for each account from transactions
  const balanceEntries = await Promise.all(
    accountList.map(async (account) => {
      const { data } = await supabase
        .from('transactions')
        .select('amount')
        .eq('account_id', account.id)
        .eq('is_transfer', false)
      const balance = (data ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
      return [account.id, balance] as [string, number]
    })
  )
  const balances = Object.fromEntries(balanceEntries)
  const gbpToEur = await getRate('GBP', 'EUR')

  return (
    <div className="flex flex-col">
      <PageHeader title="Accounts" actions={<AddAccountDrawer />} />
      <div className="flex flex-col gap-6 p-6">
        <AccountsSummary accounts={accountList} balances={balances} gbpToEur={gbpToEur} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accountList.map(account => (
            <AccountCard key={account.id} account={account} balance={balances[account.id] ?? 0} />
          ))}
          {accountList.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-col p-10 text-text-tertiary">
              <Plus size={24} />
              <p className="text-sm">Add your first account to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 7: Manual smoke test**

```bash
npm run dev
```

Visit `http://localhost:3000/accounts`. Verify:
- Three summary cards render (Net Worth, Accounts, Today)
- Empty state shows when no accounts exist
- "Add account" button opens the drawer
- Filling in the form and submitting creates an account (visible in Supabase Table Editor and on page refresh)
- Account card shows £0.00 balance (no transactions yet)

- [ ] **Step 8: Commit**

```bash
git add app/\(app\)/accounts/
git commit -m "feat: add accounts page with balance derivation and add account drawer"
```

---

## Task 4: Transactions Page

**Files:**
- Create: `app/(app)/transactions/page.tsx`
- Create: `app/(app)/transactions/_components/TransactionTable.tsx`
- Create: `app/(app)/transactions/_components/TransactionFilters.tsx`
- Create: `app/(app)/transactions/_components/TransactionSummary.tsx`
- Create: `app/(app)/transactions/_components/AddTransactionDrawer.tsx`
- Create: `app/(app)/transactions/_components/actions.ts`

**Interfaces:**
- Consumes: `Drawer`, `StatusBadge`, `SummaryCard`, `formatEur`, `formatDate`, `createClient`, `Account`, `Transaction`, `Category` types
- Produces:
  - `/transactions` route with URL-param filtering
  - `createTransaction(_, formData): Promise<{ error?: string }>` Server Action

- [ ] **Step 1: Create `app/(app)/transactions/_components/actions.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createTransaction(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const isTransfer = formData.get('is_transfer') === 'on'
  const amount = parseFloat(formData.get('amount') as string)
  const accountId = formData.get('account_id') as string
  const linkedAccountId = formData.get('linked_account_id') as string | null

  if (isTransfer && linkedAccountId) {
    // Insert two linked rows atomically
    const { data: debit, error: debitErr } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: accountId,
        occurred_on: formData.get('occurred_on') as string,
        amount: -Math.abs(amount),
        currency: formData.get('currency') as string,
        description: (formData.get('description') as string)?.trim() || null,
        merchant: (formData.get('merchant') as string)?.trim() || null,
        category_id: null,
        is_transfer: true,
        source: 'manual',
      })
      .select('id')
      .single()

    if (debitErr || !debit) return { error: debitErr?.message ?? 'Failed to create transfer' }

    const { data: credit, error: creditErr } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: linkedAccountId,
        occurred_on: formData.get('occurred_on') as string,
        amount: Math.abs(amount),
        currency: formData.get('currency') as string,
        description: (formData.get('description') as string)?.trim() || null,
        merchant: (formData.get('merchant') as string)?.trim() || null,
        category_id: null,
        is_transfer: true,
        transfer_pair_id: debit.id,
        source: 'manual',
      })
      .select('id')
      .single()

    if (creditErr || !credit) return { error: creditErr?.message ?? 'Failed to create transfer credit' }

    // Link debit to credit
    await supabase
      .from('transactions')
      .update({ transfer_pair_id: credit.id })
      .eq('id', debit.id)
  } else {
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: accountId,
      occurred_on: formData.get('occurred_on') as string,
      amount,
      currency: formData.get('currency') as string,
      description: (formData.get('description') as string)?.trim() || null,
      merchant: (formData.get('merchant') as string)?.trim() || null,
      category_id: (formData.get('category_id') as string) || null,
      is_transfer: false,
      source: 'manual',
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  return {}
}
```

- [ ] **Step 2: Create `app/(app)/transactions/_components/TransactionSummary.tsx`**

```tsx
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import type { Transaction } from '@/types/database'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

type Props = { transactions: Transaction[] }

export function TransactionSummary({ transactions }: Props) {
  const nonTransfers = transactions.filter(t => !t.is_transfer)
  const totalIn  = nonTransfers.filter(t => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0)
  const totalOut = nonTransfers.filter(t => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="flex gap-4">
      <SummaryCard label="Money in"  value={formatEur(totalIn)}         icon={TrendingUp}  accent />
      <SummaryCard label="Money out" value={formatEur(Math.abs(totalOut))} icon={TrendingDown} />
      <SummaryCard label="Net"       value={formatEur(totalIn + totalOut)} icon={Activity} />
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/transactions/_components/TransactionTable.tsx`**

```tsx
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Transaction, Account, Category } from '@/types/database'

type TxWithRelations = Transaction & {
  accounts: Pick<Account, 'name'> | null
  categories: Pick<Category, 'name'> | null
}

type Props = { transactions: TxWithRelations[] }

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export function TransactionTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No transactions found. Import a CSV or add one manually.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-col bg-card-bg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Description</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Account</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {transactions.map(tx => (
            <tr key={tx.id} className="hover:bg-content-bg">
              <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                {formatDate(tx.occurred_on)}
              </td>
              <td className="px-4 py-3 text-text-primary">
                {tx.merchant ?? tx.description ?? '—'}
                {tx.source === 'csv_import' && (
                  <span className="ml-2 rounded bg-accent-light px-1.5 py-0.5 text-xs text-accent">Import</span>
                )}
              </td>
              <td className="px-4 py-3">
                {tx.is_transfer ? (
                  <StatusBadge label="Transfer" color="neutral" />
                ) : tx.categories ? (
                  <StatusBadge label={tx.categories.name} color="accent" />
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-text-secondary">{tx.accounts?.name ?? '—'}</td>
              <td className={`px-4 py-3 text-right font-medium tabular-nums ${Number(tx.amount) >= 0 ? 'text-status-good' : 'text-status-danger'}`}>
                {formatAmount(Number(tx.amount), tx.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/transactions/_components/TransactionFilters.tsx`**

```tsx
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import type { Account, Category } from '@/types/database'

type Props = {
  accounts: Account[]
  categories: Category[]
  currentAccount: string
  currentCategory: string
  currentFrom: string
  currentTo: string
}

export function TransactionFilters({ accounts, categories, currentAccount, currentCategory, currentFrom, currentTo }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [searchParams, pathname, router])

  const setMonth = useCallback((offset: number) => {
    const from = new Date(currentFrom)
    from.setMonth(from.getMonth() + offset)
    const year = from.getFullYear()
    const month = String(from.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(year, from.getMonth() + 1, 0).getDate()
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', `${year}-${month}-01`)
    params.set('to', `${year}-${month}-${String(lastDay).padStart(2, '0')}`)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [currentFrom, searchParams, pathname, router])

  const monthLabel = new Date(currentFrom).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const selectClass = 'rounded-lg border border-border-col bg-card-bg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <button onClick={() => setMonth(-1)} className="rounded-lg border border-border-col px-2 py-1.5 text-sm text-text-secondary hover:bg-content-bg">←</button>
        <span className="min-w-[140px] text-center text-sm font-medium text-text-primary">{monthLabel}</span>
        <button onClick={() => setMonth(1)} className="rounded-lg border border-border-col px-2 py-1.5 text-sm text-text-secondary hover:bg-content-bg">→</button>
      </div>
      <select value={currentAccount} onChange={e => update('account', e.target.value)} className={selectClass}>
        <option value="">All accounts</option>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <select value={currentCategory} onChange={e => update('category', e.target.value)} className={selectClass}>
        <option value="">All categories</option>
        {categories.filter(c => c.kind !== 'transfer').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/transactions/_components/AddTransactionDrawer.tsx`**

```tsx
'use client'

import { useState, useActionState } from 'react'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { createTransaction } from './actions'
import type { Account, Category } from '@/types/database'

type Props = { accounts: Account[]; categories: Category[] }

const initialState = {}
const today = () => new Date().toISOString().split('T')[0]

export function AddTransactionDrawer({ accounts, categories }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isTransfer, setIsTransfer] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? '')
  const [state, formAction] = useActionState(createTransaction, initialState)

  const selectedCurrency = accounts.find(a => a.id === selectedAccount)?.currency ?? 'GBP'
  const expenseCategories = categories.filter(c => c.kind === 'expense')

  const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={16} />
        Add transaction
      </button>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add transaction">
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Date *</label>
            <input name="occurred_on" type="date" required defaultValue={today()} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Account *</label>
            <select name="account_id" required value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className={inputClass}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">Amount *</label>
              <input name="amount" type="number" step="0.01" required placeholder="-25.50" className={inputClass} />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-text-primary">Currency</label>
              <input name="currency" value={selectedCurrency} readOnly className={`${inputClass} bg-content-bg`} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Merchant</label>
            <input name="merchant" type="text" placeholder="e.g. Tesco" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Description</label>
            <input name="description" type="text" placeholder="Optional note" className={inputClass} />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_transfer"
              name="is_transfer"
              type="checkbox"
              checked={isTransfer}
              onChange={e => setIsTransfer(e.target.checked)}
              className="h-4 w-4 rounded border-border-col text-accent"
            />
            <label htmlFor="is_transfer" className="text-sm text-text-primary">This is a transfer between my accounts</label>
          </div>

          {!isTransfer && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Category</label>
              <select name="category_id" className={inputClass}>
                <option value="">No category</option>
                {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {isTransfer && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Destination account *</label>
              <select name="linked_account_id" required className={inputClass}>
                <option value="">Select account</option>
                {accounts.filter(a => a.id !== selectedAccount).map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90">
            Save transaction
          </button>
        </form>
      </Drawer>
    </>
  )
}
```

- [ ] **Step 6: Create `app/(app)/transactions/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { TransactionTable } from './_components/TransactionTable'
import { TransactionFilters } from './_components/TransactionFilters'
import { TransactionSummary } from './_components/TransactionSummary'
import { AddTransactionDrawer } from './_components/AddTransactionDrawer'
import Link from 'next/link'
import { Upload } from 'lucide-react'

type SearchParams = {
  account?: string
  category?: string
  from?: string
  to?: string
  q?: string
}

function defaultDateRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const defaults = defaultDateRange()
  const from = searchParams.from ?? defaults.from
  const to   = searchParams.to   ?? defaults.to

  const [accountsResult, categoriesResult] = await Promise.all([
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('*').order('name'),
  ])

  let txQuery = supabase
    .from('transactions')
    .select('*, accounts(name), categories(name)')
    .gte('occurred_on', from)
    .lte('occurred_on', to)
    .order('occurred_on', { ascending: false })

  if (searchParams.account)  txQuery = txQuery.eq('account_id', searchParams.account)
  if (searchParams.category) txQuery = txQuery.eq('category_id', searchParams.category)
  if (searchParams.q)        txQuery = txQuery.or(`description.ilike.%${searchParams.q}%,merchant.ilike.%${searchParams.q}%`)

  const { data: transactions } = await txQuery

  const accounts   = accountsResult.data   ?? []
  const categories = categoriesResult.data ?? []
  const txList     = (transactions ?? []) as Parameters<typeof TransactionTable>[0]['transactions']

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Transactions"
        actions={
          <div className="flex gap-2">
            <Link
              href="/transactions/import"
              className="flex items-center gap-2 rounded-lg border border-border-col bg-card-bg px-4 py-2 text-sm font-medium text-text-primary hover:bg-content-bg"
            >
              <Upload size={16} />
              Import CSV
            </Link>
            <AddTransactionDrawer accounts={accounts} categories={categories} />
          </div>
        }
      />
      <div className="flex flex-col gap-5 p-6">
        <TransactionSummary transactions={txList} />
        <TransactionFilters
          accounts={accounts}
          categories={categories}
          currentAccount={searchParams.account ?? ''}
          currentCategory={searchParams.category ?? ''}
          currentFrom={from}
          currentTo={to}
        />
        <TransactionTable transactions={txList} />
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

Visit `http://localhost:3000/transactions`. Verify:
- Summary cards show £0 / £0 / £0 on empty state
- Table shows "No transactions found" message
- "Add transaction" button opens the drawer
- Add a manual expense — it appears in the table, account balance on `/accounts` updates
- Add a transfer — two rows appear, both marked as transfers; net total excludes them
- Month arrows navigate to adjacent months; URL params update

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/transactions/
git commit -m "feat: add transactions page with filterable table, manual entry, and transfer support"
```

---

## Task 5: CSV Import Stepper

**Files:**
- Create: `app/(app)/transactions/import/page.tsx`
- Create: `app/(app)/transactions/import/_components/ImportStepper.tsx`
- Create: `app/(app)/transactions/import/_components/UploadStep.tsx`
- Create: `app/(app)/transactions/import/_components/MapStep.tsx`
- Create: `app/(app)/transactions/import/_components/PreviewStep.tsx`
- Create: `app/(app)/transactions/import/_components/ConfirmStep.tsx`
- Modify: `app/(app)/transactions/_components/actions.ts` (add `importBatch`)

**Interfaces:**
- Consumes: `detectFormat`, `parseRevolut`, `parseMonzo`, `flagDuplicates`, `NormalisedRow`, `ExistingTransaction`, `getCategoryId`, `MONZO_CATEGORY_MAP`, `Account`, `Category` types, `createClient`
- Produces: `/transactions/import` route — 4-step import flow committing via `importBatch` Server Action

- [ ] **Step 1: Add `importBatch` to `app/(app)/transactions/_components/actions.ts`**

Append to the existing `actions.ts` file (keep `createTransaction` as-is):

```ts
import type { NormalisedRow } from '@/lib/csv/normalize'

export async function importBatch(
  accountId: string,
  rows: NormalisedRow[],
  categoryIdMap: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .insert({ account_id: accountId, row_count: rows.length, status: 'pending' })
    .select('id')
    .single()

  if (batchError || !batch) {
    return { success: false, error: batchError?.message ?? 'Failed to create batch' }
  }

  const transactions = rows.map(row => ({
    user_id: user.id,
    account_id: accountId,
    occurred_on: row.occurred_on,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    merchant: row.merchant,
    external_id: row.external_id,
    is_transfer: row.is_transfer,
    category_id: row.raw_category ? (categoryIdMap[row.raw_category] ?? null) : null,
    import_batch_id: batch.id,
    source: 'csv_import' as const,
  }))

  const { error: txError } = await supabase.from('transactions').insert(transactions)

  if (txError) {
    await supabase.from('import_batches').update({ status: 'failed' }).eq('id', batch.id)
    return { success: false, error: txError.message }
  }

  await supabase
    .from('import_batches')
    .update({ status: 'completed', row_count: rows.length })
    .eq('id', batch.id)

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  return { success: true }
}
```

- [ ] **Step 2: Create `app/(app)/transactions/import/_components/UploadStep.tsx`**

```tsx
'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { detectFormat } from '@/lib/csv/detect'
import { Upload, CheckCircle, XCircle } from 'lucide-react'
import type { Account } from '@/types/database'

type Format = 'revolut' | 'monzo'

type Props = {
  accounts: Account[]
  onNext: (data: { accountId: string; format: Format; records: Record<string, string>[] }) => void
}

export function UploadStep({ accounts, onNext }: Props) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [format, setFormat] = useState<Format | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [records, setRecords] = useState<Record<string, string>[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    setFormat(null)
    setFileName(file.name)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        const headers = result.meta.fields ?? []
        const detected = detectFormat(headers)
        if (!detected) {
          setError('Unrecognised CSV format. Expected a Revolut or Monzo export.')
          return
        }
        setFormat(detected)
        setRecords(result.data)
      },
      error(err) {
        setError(`Failed to parse CSV: ${err.message}`)
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-text-primary">Account *</label>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </select>
      </div>

      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-col p-10 text-center hover:border-accent hover:bg-accent-light/20 cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        <Upload size={24} className="text-text-tertiary" />
        <p className="text-sm text-text-secondary">Drop your CSV here or <span className="text-accent underline">browse</span></p>
        <p className="text-xs text-text-tertiary">Revolut or Monzo export · max 10 MB</p>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {fileName && format && (
        <div className="flex items-center gap-2 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">
          <CheckCircle size={16} />
          <span><strong>{fileName}</strong> — {format === 'revolut' ? 'Revolut' : 'Monzo'} format detected · {records.length} rows</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
          <XCircle size={16} />
          {error}
        </div>
      )}

      <button
        disabled={!format || !accountId}
        onClick={() => format && onNext({ accountId, format, records })}
        className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next: Review column mapping
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/transactions/import/_components/MapStep.tsx`**

```tsx
'use client'

import type { NormalisedRow } from '@/lib/csv/normalize'

type Format = 'revolut' | 'monzo'

const REVOLUT_MAPPING = [
  { app: 'Date',        csv: 'Completed Date' },
  { app: 'Amount',      csv: 'Amount' },
  { app: 'Currency',    csv: 'Currency' },
  { app: 'Description', csv: 'Description' },
  { app: 'Transfer?',   csv: 'Type == "TRANSFER"' },
  { app: 'Status',      csv: 'State (COMPLETED only imported)' },
]

const MONZO_MAPPING = [
  { app: 'Date',         csv: 'Date' },
  { app: 'Amount',       csv: 'Amount' },
  { app: 'Currency',     csv: 'Currency' },
  { app: 'Merchant',     csv: 'Name' },
  { app: 'Description',  csv: 'Description' },
  { app: 'Category',     csv: 'Category (auto-mapped)' },
  { app: 'External ID',  csv: 'Transaction ID' },
  { app: 'Transfer?',    csv: 'Type == "pot_transfer"' },
]

type Props = {
  format: Format
  rows: NormalisedRow[]
  onBack: () => void
  onNext: () => void
}

export function MapStep({ format, rows, onBack, onNext }: Props) {
  const mapping = format === 'revolut' ? REVOLUT_MAPPING : MONZO_MAPPING
  const dates = rows.map(r => r.occurred_on).filter(Boolean).sort()
  const minDate = dates[0]
  const maxDate = dates[dates.length - 1]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 rounded-lg bg-accent-light px-4 py-3">
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
          {format === 'revolut' ? 'Revolut' : 'Monzo'}
        </span>
        <span className="text-sm text-text-secondary">
          {rows.length} rows · {minDate} → {maxDate}
        </span>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-text-primary">Column mapping</h3>
        <div className="overflow-hidden rounded-lg border border-border-col">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-col bg-content-bg">
                <th className="px-4 py-2 text-left text-xs font-medium text-text-tertiary">App field</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-tertiary">CSV column</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-col">
              {mapping.map(row => (
                <tr key={row.app}>
                  <td className="px-4 py-2 font-medium text-text-primary">{row.app}</td>
                  <td className="px-4 py-2 font-mono text-xs text-text-secondary">{row.csv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-lg border border-border-col py-2 text-sm font-medium text-text-primary hover:bg-content-bg">Back</button>
        <button onClick={onNext} className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90">Next: Preview rows</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/transactions/import/_components/PreviewStep.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { flagDuplicates } from '@/lib/csv/dedup'
import { formatDate } from '@/lib/utils'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { ExistingTransaction } from '@/lib/csv/dedup'
import type { Category } from '@/types/database'
import { getCategoryId } from '@/lib/categories'
import { createClient } from '@/lib/supabase/browser'

type Props = {
  rows: NormalisedRow[]
  accountId: string
  categories: Category[]
  onBack: () => void
  onNext: (checked: boolean[]) => void  // passes final selection to parent
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export function PreviewStep({ rows, accountId, categories, onBack, onNext }: Props) {
  const [duplicates, setDuplicates] = useState<boolean[]>(rows.map(() => false))
  // checked lives here — auto-initialised after dedup so duplicates start unchecked
  const [checked, setChecked] = useState<boolean[]>(rows.map(() => true))
  const [loading, setLoading] = useState(true)

  function toggle(index: number) {
    setChecked(prev => prev.map((v, i) => (i === index ? !v : v)))
  }

  useEffect(() => {
    const supabase = createClient()
    const dates = rows.map(r => r.occurred_on).filter(Boolean).sort()
    const minDate = dates[0]
    const maxDate = dates[dates.length - 1]

    supabase
      .from('transactions')
      .select('occurred_on, amount, currency, external_id')
      .eq('account_id', accountId)
      .gte('occurred_on', minDate)
      .lte('occurred_on', maxDate)
      .then(({ data }) => {
        const existing: ExistingTransaction[] = (data ?? []).map(t => ({
          occurred_on: t.occurred_on,
          amount: Number(t.amount),
          currency: t.currency,
          external_id: t.external_id ?? null,
        }))
        const flags = flagDuplicates(rows, existing)
        setDuplicates(flags)
        // Duplicates unchecked by default
        setChecked(flags.map(isDup => !isDup))
        setLoading(false)
      })
  }, []) // run once on mount

  const selectedCount = checked.filter(Boolean).length
  const dupCount = duplicates.filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-content-bg px-4 py-3 text-sm text-text-secondary">
        {loading ? 'Checking for duplicates…' : (
          <>{rows.length} rows · <span className="text-status-warn">{dupCount} flagged as duplicates</span> · <span className="text-status-good">{selectedCount} will be imported</ span></>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-border-col bg-card-bg">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-border-col bg-content-bg">
            <tr>
              <th className="px-3 py-2 text-left text-xs text-text-tertiary">Import</th>
              <th className="px-3 py-2 text-left text-xs text-text-tertiary">Date</th>
              <th className="px-3 py-2 text-left text-xs text-text-tertiary">Merchant</th>
              <th className="px-3 py-2 text-left text-xs text-text-tertiary">Category</th>
              <th className="px-3 py-2 text-right text-xs text-text-tertiary">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-col">
            {rows.map((row, i) => {
              const isDup = duplicates[i]
              const categoryId = row.raw_category ? getCategoryId(row.raw_category, categories) : null
              const categoryName = categoryId ? categories.find(c => c.id === categoryId)?.name : null

              return (
                <tr key={i} className={isDup ? 'bg-warn-bg' : ''}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      onChange={() => toggle(i)}
                      className="h-4 w-4 rounded border-border-col text-accent"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-text-secondary">{formatDate(row.occurred_on)}</td>
                  <td className="px-3 py-2 text-text-primary">
                    {row.merchant ?? row.description ?? '—'}
                    {isDup && <span className="ml-2 text-xs text-status-warn">Duplicate</span>}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{categoryName ?? '—'}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${row.amount >= 0 ? 'text-status-good' : 'text-status-danger'}`}>
                    {formatAmount(row.amount, row.currency)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-lg border border-border-col py-2 text-sm font-medium text-text-primary hover:bg-content-bg">Back</button>
        <button disabled={selectedCount === 0} onClick={() => onNext(checked)} className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
          Next: Confirm import
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/transactions/import/_components/ConfirmStep.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { importBatch } from '@/app/(app)/transactions/_components/actions'
import { getCategoryId } from '@/lib/categories'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { Account, Category } from '@/types/database'
import { formatEur } from '@/lib/utils'

type Props = {
  rows: NormalisedRow[]
  checked: boolean[]
  accountId: string
  accounts: Account[]
  categories: Category[]
  onBack: () => void
}

export function ConfirmStep({ rows, checked, accountId, accounts, categories, onBack }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedRows = rows.filter((_, i) => checked[i])
  const skippedCount = rows.length - selectedRows.length
  const accountName = accounts.find(a => a.id === accountId)?.name ?? 'Unknown'
  const totalAmount = selectedRows.reduce((s, r) => s + r.amount, 0)

  async function handleImport() {
    setLoading(true)
    setError(null)

    const categoryIdMap: Record<string, string> = {}
    for (const row of selectedRows) {
      if (row.raw_category && !categoryIdMap[row.raw_category]) {
        const id = getCategoryId(row.raw_category, categories)
        if (id) categoryIdMap[row.raw_category] = id
      }
    }

    const result = await importBatch(accountId, selectedRows, categoryIdMap)

    if (!result.success) {
      setError(result.error ?? 'Import failed')
      setLoading(false)
      return
    }

    router.push(`/transactions?account=${accountId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border-col bg-card-bg p-5">
        <h3 className="mb-4 font-semibold text-text-primary">Import summary</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <div className="flex justify-between"><span>Account</span><span className="font-medium text-text-primary">{accountName}</span></div>
          <div className="flex justify-between"><span>Transactions to import</span><span className="font-medium text-status-good">{selectedRows.length}</span></div>
          <div className="flex justify-between"><span>Skipped (duplicates / unchecked)</span><span>{skippedCount}</span></div>
          <div className="flex justify-between border-t border-border-col pt-2"><span>Net total</span><span className={`font-medium ${totalAmount >= 0 ? 'text-status-good' : 'text-status-danger'}`}>{formatEur(totalAmount)}</span></div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{error}</div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} disabled={loading} className="flex-1 rounded-lg border border-border-col py-2 text-sm font-medium text-text-primary hover:bg-content-bg disabled:opacity-40">Back</button>
        <button onClick={handleImport} disabled={loading || selectedRows.length === 0} className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? 'Importing…' : `Import ${selectedRows.length} transactions`}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `app/(app)/transactions/import/_components/ImportStepper.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { parseRevolut } from '@/lib/csv/parsers/revolut'
import { parseMonzo } from '@/lib/csv/parsers/monzo'
import { UploadStep } from './UploadStep'
import { MapStep } from './MapStep'
import { PreviewStep } from './PreviewStep'
import { ConfirmStep } from './ConfirmStep'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { Account, Category } from '@/types/database'

type Format = 'revolut' | 'monzo'

type StepData = {
  accountId: string
  format: Format
  records: Record<string, string>[]
  rows: NormalisedRow[]
  checked: boolean[]
}

const STEPS = ['Upload', 'Map columns', 'Preview', 'Confirm']

type Props = { accounts: Account[]; categories: Category[] }

export function ImportStepper({ accounts, categories }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<StepData>>({})

  function handleUploadNext(uploaded: { accountId: string; format: Format; records: Record<string, string>[] }) {
    const rows = uploaded.format === 'revolut'
      ? parseRevolut(uploaded.records)
      : parseMonzo(uploaded.records)
    setData({ ...uploaded, rows, checked: rows.map(() => true) })
    setStep(1)
  }

  function handlePreviewNext(finalChecked: boolean[]) {
    setData(prev => ({ ...prev, checked: finalChecked }))
    setStep(3)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i === step ? 'bg-accent text-white' : i < step ? 'bg-status-good text-white' : 'bg-content-bg text-text-tertiary'}`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'font-medium text-text-primary' : 'text-text-tertiary'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="flex-1 border-t border-border-col" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border-col bg-card-bg p-6">
        {step === 0 && <UploadStep accounts={accounts} onNext={handleUploadNext} />}
        {step === 1 && data.rows && (
          <MapStep format={data.format!} rows={data.rows} onBack={() => setStep(0)} onNext={() => setStep(2)} />
        )}
        {step === 2 && data.rows && (
          <PreviewStep
            rows={data.rows}
            accountId={data.accountId!}
            categories={categories}
            onBack={() => setStep(1)}
            onNext={handlePreviewNext}
          />
        )}
        {step === 3 && data.rows && data.checked && (
          <ConfirmStep
            rows={data.rows}
            checked={data.checked}
            accountId={data.accountId!}
            accounts={accounts}
            categories={categories}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create `app/(app)/transactions/import/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { ImportStepper } from './_components/ImportStepper'

export default async function ImportPage() {
  const supabase = await createClient()

  const [accountsResult, categoriesResult] = await Promise.all([
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('*').order('name'),
  ])

  return (
    <div className="flex flex-col">
      <PageHeader title="Import CSV" />
      <ImportStepper
        accounts={accountsResult.data ?? []}
        categories={categoriesResult.data ?? []}
      />
    </div>
  )
}
```

- [ ] **Step 8: Run all tests and build**

```bash
npm run test:run && npm run build
```

Expected: all tests pass, build clean.

- [ ] **Step 9: Manual smoke test**

```bash
npm run dev
```

Test the full import flow:
1. Navigate to `/transactions/import`
2. Select an account, drop a Revolut CSV — verify "Revolut format detected · N rows" appears
3. Click Next — verify column mapping table shows Revolut fields
4. Click Next — verify rows appear; re-import the same file to confirm duplicates are flagged amber and unchecked
5. Confirm import — rows appear in `/transactions`, account balance updates in `/accounts`
6. Repeat with a Monzo CSV — verify Monzo categories auto-map (e.g. "groceries" → "Food & Grocery")

- [ ] **Step 10: Commit**

```bash
git add app/\(app\)/transactions/import/ app/\(app\)/transactions/_components/actions.ts
git commit -m "feat: add CSV import stepper with Revolut/Monzo support and duplicate detection"
```

---

## Post-Task: Push to remote

```bash
git push origin main
```
