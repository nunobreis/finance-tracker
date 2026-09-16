# Finance Tracker — Sub-project 2: Accounts, Transactions & CSV Import

**Date:** 2026-09-16
**Scope:** Accounts page, Transactions page (with filters and manual entry), CSV import stepper (Revolut + Monzo), category seed migration.
**Delivers:** The core data layer — create accounts, import CSVs, add transactions manually, and view your full transaction history with filters.

---

## Stack & Runtime Context

- Next.js 16.3.5 / React 19 (same as Sub-project 1)
- `createClient()` from `lib/supabase/server.ts` is `async` — always `await createClient()`
- Middleware file is `proxy.ts` (Next.js 16 naming)
- Tailwind v4 — tokens in `globals.css` `@theme`, classes like `bg-sidebar-bg`, `text-text-primary`
- `useActionState` from `react` (React 19), not `useFormState` from `react-dom`
- Sidebar is a Client Component

---

## What This Sub-project Delivers

1. **Category seed** — 14 system categories in the DB, readable by all authenticated users
2. **Accounts page** (`/accounts`) — net worth summary, per-account cards with derived balances, add account drawer
3. **Transactions page** (`/transactions`) — filterable table with URL-param filters, summary stats, add transaction drawer (including transfers)
4. **CSV import** (`/transactions/import`) — 4-step stepper supporting Revolut and Monzo CSV formats with auto-detection, column mapping review, duplicate flagging, and batch commit

---

## File Structure

```
# New files
app/(app)/accounts/
├── page.tsx                              # Server Component — accounts + derived balances
└── _components/
    ├── AccountCard.tsx                   # Single account card (Server Component)
    ├── AccountsSummary.tsx               # Net worth + count summary cards (Server Component)
    ├── AddAccountDrawer.tsx              # 'use client' drawer form
    └── actions.ts                        # 'use server' — createAccount

app/(app)/transactions/
├── page.tsx                              # Server Component — transactions with filters
├── import/
│   └── page.tsx                          # CSV import stepper page ('use client')
└── _components/
    ├── TransactionTable.tsx              # Table rows (Server Component)
    ├── TransactionFilters.tsx            # 'use client' filter bar — URL params
    ├── TransactionSummary.tsx            # In/out/net chips (Server Component)
    ├── AddTransactionDrawer.tsx          # 'use client' drawer form
    ├── ImportStepper/
    │   ├── index.tsx                     # Stepper shell + step state ('use client')
    │   ├── UploadStep.tsx                # File drop + account selector
    │   ├── MapStep.tsx                   # Column mapping review
    │   ├── PreviewStep.tsx               # Normalised rows + duplicate flags
    │   └── ConfirmStep.tsx               # Final summary + import button
    └── actions.ts                        # 'use server' — createTransaction, importBatch

lib/csv/
├── detect.ts                             # Format detection from header row
├── parsers/
│   ├── revolut.ts                        # Revolut CSV → NormalisedRow[]
│   └── monzo.ts                          # Monzo CSV → NormalisedRow[]
├── normalize.ts                          # NormalisedRow type + shared helpers
└── dedup.ts                              # Duplicate detection logic

lib/categories.ts                         # MONZO_CATEGORY_MAP + getCategoryId() + seedCategoriesIfEmpty()
lib/exchange-rates.ts                     # Stub: getRate() returns 1.0 with TODO for Sub-project 4

# Modified files
schema.sql                                # Add category seed migration + updated RLS policy
```

---

## Category Seed

### RLS Policy

No changes needed. Categories are seeded with `user_id = auth.uid()` (the real user's UUID), so the existing `owner access` policy already covers reads, writes, and the system categories. The `is_system = true` flag is enforced at the application layer — system categories are never offered for deletion in the UI.

### Seed Insert

System categories are seeded automatically on first login via a `seedCategories` Server Action called from `(app)/layout.tsx`. The action checks whether any `is_system = true` categories already exist for the user; if not, it inserts the full default set with `user_id = auth.uid()`. This avoids foreign key issues (no sentinel UUID needed) and works cleanly with the existing RLS policy.

```ts
// Called once from (app)/layout.tsx after getUser() check
export async function seedCategoriesIfEmpty(userId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_system', true)

  if (count && count > 0) return  // already seeded

  await supabase.from('categories').insert([
    { user_id: userId, name: 'Housing',        kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Food & Grocery', kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Eating Out',     kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Transport',      kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Entertainment',  kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Health',         kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Personal Care',  kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Utilities',      kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Subscriptions',  kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Shopping',       kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Travel',         kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Other',          kind: 'expense',  is_system: true },
    { user_id: userId, name: 'Income',         kind: 'income',   is_system: true },
    { user_id: userId, name: 'Transfer',       kind: 'transfer', is_system: true },
  ])
}
```

Since this is a single-user app and `user_id = auth.uid()` is already the RLS scope, no additional RLS policy is needed — the existing `owner access` policy covers everything.

### Monzo Category Map (`lib/categories.ts`)

```ts
export const MONZO_CATEGORY_MAP: Record<string, string> = {
  groceries:    'Food & Grocery',
  eating_out:   'Eating Out',
  transport:    'Transport',
  entertainment:'Entertainment',
  health:       'Health',
  personal_care:'Personal Care',
  bills:        'Utilities',
  shopping:     'Shopping',
  holidays:     'Travel',
  general:      'Other',
}
```

`getCategoryId(monzoCategory: string, allCategories: Category[]): string | null` — looks up the mapped name in the loaded category list; returns null if not found.

---

## Accounts Page (`/accounts`)

### Data Fetching (`page.tsx`)

Server Component. Two parallel queries:
1. `SELECT * FROM accounts WHERE user_id = auth.uid() AND is_active = true ORDER BY created_at ASC`
2. For each account: `SELECT COALESCE(SUM(amount), 0) AS balance FROM transactions WHERE account_id = $1 AND user_id = auth.uid() AND is_transfer = false`
3. Latest GBP→EUR rate via `getRate('GBP', 'EUR')` from `lib/exchange-rates.ts` (stub returning 1.0 until Sub-project 4 implements the real utility — add a TODO comment)

### Summary Cards

Three `SummaryCard` instances (reusing the shared component from Sub-project 1's ui/ folder — create it here if not already present):
- **Net Worth** — sum of all account balances converted to EUR, formatted as `€X,XXX.XX`
- **Accounts** — count of active accounts
- **Today** — formatted current date

### Account Cards

One card per account showing:
- Institution initial in a coloured circle (first letter of institution or account name)
- Account name + institution
- Account type badge (e.g. "Checking")
- Balance in native currency (e.g. `£18,240.00`) — derived from transaction sum
- Small link: "Import CSV →" pointing to `/transactions/import?account=<id>`

A final "Add account" placeholder card with a `+` icon triggers `AddAccountDrawer`.

### Add Account Drawer

Fields:
- **Account name** — text, required (e.g. "Revolut")
- **Institution** — text, optional (e.g. "Revolut Bank")
- **Account type** — select: `checking | savings | credit_card | cash | investment`
- **Currency** — select: `GBP | EUR` (expandable later)

On submit → `createAccount` Server Action → `revalidatePath('/accounts')` → drawer closes.

No account edit or delete in this sub-project.

---

## Transactions Page (`/transactions`)

### Data Fetching (`page.tsx`)

Server Component. Reads `searchParams` for filter values:
- `account` — account UUID
- `category` — category UUID  
- `from` — ISO date string (defaults to first day of current month)
- `to` — ISO date string (defaults to today)
- `q` — search string (matches `description` or `merchant`)

Runs one Supabase query with all filters applied server-side. Fetches accounts and categories in parallel for the filter dropdowns.

### Transaction Table

Columns:
| Column | Notes |
|---|---|
| Date | `occurred_on` formatted as `16 Sep 2026` |
| Description | `merchant` if present, else `description` |
| Category | Coloured `StatusBadge`; transfers show "Transfer" badge instead |
| Account | Account name |
| Amount | Native currency; negative = red, positive = green |
| Source | CSV import rows show a small "Import" chip; manual rows show nothing |

Transfers (`is_transfer = true`) display a "Transfer" badge in the Category column and are excluded from the summary totals.

### Summary Chips

Above the table (matching pen.dev design):
- **Money in** — sum of positive non-transfer transactions in the filtered range
- **Money out** — sum of negative non-transfer transactions (shown as positive number)
- **Net** — in minus out

### Transaction Filters (`TransactionFilters`)

Client Component. Pushes changes to URL params via `router.push` (Next.js `useRouter`). Controls:
- Account dropdown
- Category dropdown
- Month picker (prev/next arrows, defaults to current month — sets `from` and `to` to month boundaries)
- Search input (debounced 300ms)

### Add Transaction Drawer

Fields:
| Field | Input | Notes |
|---|---|---|
| Date | Date picker | Defaults to today |
| Amount | Number | Positive = income, negative = expense |
| Currency | Select | Defaults to selected account's currency |
| Account | Select | Required |
| Description | Text | Optional |
| Merchant | Text | Optional |
| Category | Select | Hidden when Transfer is checked |
| Transfer | Checkbox | Shows linked account selector when checked |
| Linked account | Select | Visible only when Transfer is checked |

**Transfer creation:** when Transfer is checked and a linked account is selected, `createTransaction` Server Action inserts two rows atomically:
- Row 1: debit on source account (`amount` as negative)
- Row 2: credit on destination account (`amount` as positive, same absolute value)
- Both: `is_transfer = true`, each referencing the other via `transfer_pair_id`

On success: `revalidatePath('/transactions')`, drawer closes.

---

## CSV Import Stepper (`/transactions/import`)

Full `'use client'` page — the stepper manages local state across steps, with the actual import committed via a Server Action only at Step 4.

### Step 1 — Upload

- Account selector (pre-populated from `?account=<id>` query param if present)
- Drag-and-drop file zone (CSV only, max 10MB)
- On file select: read first 2 rows client-side, run `detectFormat(headers)` from `lib/csv/detect.ts`
- Show detected format badge: "Revolut" or "Monzo" (green) or "Unrecognised format" (red)
- Next enabled only when: account selected + format detected

**Format detection (`lib/csv/detect.ts`):**
```ts
export function detectFormat(headers: string[]): 'revolut' | 'monzo' | null {
  if (headers.includes('Started Date') && headers.includes('Completed Date')) return 'revolut'
  if (headers.includes('Transaction ID') && headers.includes('Money Out')) return 'monzo'
  return null
}
```

### Step 2 — Map Columns

- Read-only mapping table: CSV column → App field
- Detected format badge + one-line description of format
- Shows: total row count, date range (min/max `occurred_on` from parsed rows)
- If detection failed: dropdown selectors for each required field (fallback manual mapping)
- "Next" proceeds to preview

### Step 3 — Preview

All rows parsed and normalised client-side. Fetch existing transactions for this account in the detected date range (one Supabase query from the client) to check for duplicates.

**Duplicate detection (`lib/csv/dedup.ts`):**
- Monzo: row flagged if `external_id` matches an existing `transactions.external_id` for this account
- Revolut: row flagged if `(occurred_on, amount, currency)` matches an existing transaction for this account
- Flagged rows shown with amber background, unchecked by default
- User can re-check flagged rows to import anyway

**Preview table columns:** Date · Merchant/Description · Category (auto-mapped for Monzo) · Amount · Currency · Duplicate flag

**Header:** `"47 rows · 3 flagged as duplicates · 44 will be imported"`

### Step 4 — Confirm

- Summary card: `"44 transactions will be imported into Revolut · 3 skipped"`
- "Import" button → `importBatch` Server Action:
  1. Insert `import_batches` row with `status: 'pending'`
  2. Bulk insert all checked `transactions` rows referencing the batch ID
  3. Update `import_batches.status` to `'completed'`, set `row_count`
  4. On any error: update status to `'failed'`, throw — no partial data visible
- On success: redirect to `/transactions?account=<id>` with a success toast

### NormalisedRow Type (`lib/csv/normalize.ts`)

```ts
export type NormalisedRow = {
  occurred_on: string        // ISO date: 'YYYY-MM-DD'
  amount: number             // signed decimal
  currency: string           // 3-char ISO code
  description: string | null
  merchant: string | null
  external_id: string | null // Monzo Transaction ID; null for Revolut
  is_transfer: boolean
  raw_category: string | null // Monzo raw category string before mapping
}
```

### Column Mapping

| App field | Revolut column | Monzo column |
|---|---|---|
| `occurred_on` | `Completed Date` | `Date` (+ `Time` combined, date part only) |
| `amount` | `Amount` (signed) | `Amount` (signed) |
| `currency` | `Currency` | `Currency` |
| `description` | `Description` | `Description` |
| `merchant` | `Description` (fallback) | `Name` |
| `external_id` | *(null)* | `Transaction ID` |
| `is_transfer` | `Type === 'TRANSFER'` | `Type === 'pot_transfer'` |
| `raw_category` | *(null)* | `Category` |

Revolut rows with `State !== 'COMPLETED'` are skipped (pending/failed transactions not imported).

---

## Shared UI Component: `SummaryCard`

If not already in `components/ui/`, create it here — used on both Accounts and Transactions pages and will be reused in Sub-projects 3 and 4:

```tsx
// components/ui/SummaryCard.tsx
type Props = {
  label: string
  value: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}
```

Server Component. Styled to match the pen.dev white card with label, large value, and optional icon.

---

## Error Handling

- **Accounts:** failed `createAccount` returns `{ error: string }` from the Server Action; displayed inline in the drawer
- **Transactions:** same pattern for `createTransaction`
- **CSV import:** format detection failure shown on Step 1 with an error message; import batch failure shown on Step 4 with a retry option (user stays on Step 4, batch row marked `failed`)
- **Duplicate detection fetch failure:** dedup step skipped silently — all rows shown as unchecked without duplicate flags, with a warning banner

---

## Verification Checklist

- [ ] Category seed applied in Supabase; system categories readable on `/transactions` category filter
- [ ] Can create an account (Revolut, GBP, checking); card appears on `/accounts` with £0.00 balance
- [ ] Can add a manual transaction; appears in `/transactions` table; account balance updates
- [ ] Can add a manual transfer between two accounts; both rows created with `is_transfer = true`; transfer excluded from summary totals
- [ ] Can import a Revolut CSV; format auto-detected; transactions appear post-import; account balance reflects import
- [ ] Can import a Monzo CSV; Monzo categories auto-mapped where possible
- [ ] Re-importing same CSV flags duplicates in Step 3
- [ ] Transaction filters (account, category, month, search) all work via URL params
- [ ] `npm run build` and `npm run test:run` pass

---

## Out of Scope for This Sub-project

- Transaction edit or delete (individual rows)
- Account edit, delete, or archiving
- Budget management (Sub-project 3)
- Recurring bills (Sub-project 3)
- Dashboard aggregations (Sub-project 4)
- Exchange rate fetching (Sub-project 4) — `getRate()` stubs return 1.0 with a TODO comment
- User-created custom categories
- Phase 2 tables (holdings, net worth snapshots)
