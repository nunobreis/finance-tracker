# Follow-up PR plan — accurate totals, cascading account delete, import transfer detection

**Date:** 2026-11-08
**Branch:** TBD (`feat/accurate-totals`), opens after PR #2 merges.
**Scope:** Four changes that together make Spent/Income trustworthy.

## 0. Preconditions

- PR #2 (mobile fixes) merged into `main`.
- Cleanup SQL (`docs/cleanups/2026-11-08-remove-duplicate-batches-and-accounts.sql`) executed in Supabase; the 4 old batches + 2 inactive accounts are gone.

## 1. Schema: `categories.exclude_from_spending` + Mortgage (UK)

Idempotent migration, run in Supabase SQL Editor and mirrored in `schema.sql`:

```sql
alter table categories
  add column if not exists exclude_from_spending boolean not null default false;

-- Seed system category "Mortgage (UK)" if absent. Reuses the system-seed
-- pattern from commit 5a919c7 (idempotent, derives user_id from an existing
-- system row via a do $$ block). Flag on.
```

- `types/database.ts`: add `exclude_from_spending: boolean` to the `Category` row type.
- `lib/categories.ts`: add `"Mortgage (UK)"` to `SYSTEM_CATEGORIES` with `kind = 'expense'`, `exclude_from_spending = true`, country `GB`. Add to the i18n `Categories.systemNames` key set.
- `i18n`: `Categories.systemNames.Mortgage (UK)` → `"Mortgage (UK)"` (EN) / `"Hipoteca (RU)"` (PT-PT). `Categories.excludeFromSpendingLabel` for the Settings toggle.

## 2. Summary query safety net (replaces 6a DB view)

Skip the view (RLS complications unless `security_invoker`).

Instead, every summary query that computes Spent / Income / net / budget utilisation gets two explicit filters:

- `.select('*, accounts!inner(is_active)')` + `.eq('accounts.is_active', true)` — drops rows whose account was soft-deleted.
- `exclude_from_spending` handling: fetch the (small) set of excluded category IDs once per request, filter rows in the reducer (`!excludedCategoryIds.has(tx.category_id)`). Uncategorised rows (category_id null) are NOT excluded. No change to row persistence.

Files to touch (scan `from('transactions')` to confirm the full list):

- `app/(app)/transactions/page.tsx` — hero metric, summary cards.
- `app/(app)/dashboard/_components/*` — any aggregation panel.
- `app/(app)/budgets/_components/*` — budget utilisation, 3-month comparison.
- `app/(app)/net-worth/_components/*` — if it derives from `transactions` (vs snapshots, which are separate).
- `app/(app)/transactions/_components/TransactionSummary.tsx` — Spent/Income cards.

**Negative-test**: unit test a small reducer helper `computeSpent(rows, excludedCategoryIds)` that proves excluded rows don't contribute. Add one row of each kind (active-account real, active-account excluded, inactive-account real) and assert only the first counts.

## 3. `deleteAccount` cascade with confirm (6b)

Current: sets `is_active = false`. Keeps orphan transactions counted.

New server action in `app/(app)/accounts/_components/actions.ts`:

```ts
export async function deleteAccount(accountId: string):
  Promise<{ success: true; deletedTxs: number; deletedBatches: number } | { error: string }>
```

Flow:
1. `auth.getUser()` + ownership check on the account row.
2. SELECT every `import_batch` for this account — count them.
3. For each batch, run the existing `deleteImportBatch` body (clear transfer_pair_id in chunked `.in`, internal pair-clear, delete tx rows, delete batch row). Reuse — do not duplicate.
4. Defensive orphan sweep: `DELETE FROM transactions WHERE account_id = ? AND user_id = auth.uid()` — catches anything imported outside a batch (manual entries).
5. `DELETE FROM accounts WHERE id = ? AND user_id = auth.uid()` — **no more soft-delete**.
6. `revalidatePath` for `/accounts`, `/dashboard`, `/transactions`, `/budgets`, `/net-worth`.

UI (Accounts screen):
- Replace the single "Delete" button with a two-step confirm.
- Step 1: menu item "Delete account" → opens a confirm dialog.
- Step 2 copy: `"Delete {name}? This permanently removes {txCount} transactions and {batchCount} import batches. This cannot be undone."` Live counts fetched when the dialog opens.
- Primary CTA: `Delete account` (destructive). Secondary: `Cancel`.
- No "mark inactive" option — removed from the UI. If needed later, add a `Hide` filter that doesn't mutate DB.

Tests (`tests/lib/account-delete.test.ts` or near the action):
- Happy path: cascades through N batches.
- Removes manual-entry orphan transactions outside any batch.
- Rejects another user's account.
- `revalidatePath` called for all six paths.

## 4. Import-time transfer detection (6c)

### 4a. Parser-level auto-flag

Each parser now sets `is_transfer` on a row at parse time.

`lib/csv/parsers/revolut.ts`:

```ts
const REVOLUT_TRANSFER_TYPES = new Set(['TRANSFER', 'EXCHANGE'])
const REVOLUT_TRANSFER_DESC = [
  /^exchanged to /i,
  /\btop[- ]?up\b/i,
  /savings vault/i,
  /\bto [A-Z]{3} account\b/i,
  /balance migration/i,
]

function isRevolutTransfer(row: RevolutRow): boolean {
  if (REVOLUT_TRANSFER_TYPES.has(row.Type)) return true
  return REVOLUT_TRANSFER_DESC.some(rx => rx.test(row.Description))
}
```

`lib/csv/parsers/monzo.ts`:

```ts
const MONZO_TRANSFER_CATEGORIES = new Set(['pot_transfer'])
const MONZO_TRANSFER_DESC = [
  /^round[- ]?up\b/i,
  /lease hold pot/i,
  /coin jar/i,
  /withdrawal from pot/i,
  /pot withdrawal/i,
  /to .+ pot\b/i,
  /from .+ pot\b/i,
]

function isMonzoTransfer(row: MonzoRow): boolean {
  if (MONZO_TRANSFER_CATEGORIES.has(row.Category)) return true
  return MONZO_TRANSFER_DESC.some(rx => rx.test(row.Description))
}
```

Explicitly not matched (v2 showed these cause false positives):
- `/\bpot\s/` — too broad (hits legit purchases).
- `/\breferral reward\b/i` — that's income, not a transfer.

Both regex arrays live next to their parser so the pattern-set stays source-of-truth for what the user sees.

### 4b. Revolut EXCHANGE pair linking

A Revolut `EXCHANGE` entry produces two linked rows (outgoing EUR leg + incoming GBP leg, or vice versa) on the same account. **Both** legs get `is_transfer = true` and `transfer_pair_id` wired to each other during `importBatch`.

Algorithm in `importBatch`:
1. Normal row insert.
2. Second pass (same transaction): group by `(occurred_on, external_id_prefix, matching amounts)` — Revolut's exchange rows typically share a date and a "Pair" identifier (check a real CSV; if there's no shared id, match by same-date + same-|amount| + opposite signs on the same account).
3. For each matched pair, update both with `transfer_pair_id = otherLeg.id`.
4. All inside the existing `importBatch` function — no new action.

### 4c. Manual mark-as-transfer

New server action in `app/(app)/transactions/_components/actions.ts`:

```ts
export async function setTransactionIsTransfer(
  txId: string,
  isTransfer: boolean,
): Promise<{ success: true } | { error: string }>
```

Flow: auth → ownership `.eq('user_id', user.id)` → `UPDATE transactions SET is_transfer = $1 WHERE id = $2 AND user_id = auth.uid()` → `revalidatePath(/transactions)`, `revalidatePath(/dashboard)`, `revalidatePath(/budgets)`, `revalidatePath(/net-worth)`.

UI:
- `TransactionTable.tsx` row kebab menu (desktop) / long-press action (mobile) → `Mark as transfer` / `Mark as not a transfer` based on current state.
- Live update: optimistic flip + rollback on error.

Tests:
- `setTransactionIsTransfer` happy path (both directions).
- Rejects a different user's row.
- UI test: kebab click triggers the action and the label updates.

## 5. Sequence of implementation

1. Migration + types (file touches: `schema.sql`, `types/database.ts`, `lib/categories.ts`, both `messages/*.json`).
2. Summary query safety net + `computeSpent` helper + tests.
3. `deleteAccount` cascade action + UI confirm + tests.
4. Import parser transfer detection + regex unit tests.
5. Revolut EXCHANGE pair linking + test.
6. Manual toggle action + UI + test.
7. Full verification: `tsc --noEmit`, `npm run test:run`, `scripts/check-horizontal-overflow.mjs`, Playwright of `/transactions` + `/accounts` + `/settings` at 390 and 1440 in EN/PT-PT.

Each step gets its own commit on `feat/accurate-totals`. Spec+quality reviewers as per earlier waves.

## 6. Out of scope (deferred)

- Rename `is_active` → `archived_at` or other audit mechanism. Not needed; hard-delete replaces soft-delete.
- UI for bulk-tagging duplicate rows. The SQL cleanup is one-shot; future duplicates are a separate problem (dedup at import time is a bigger design question).
- Transfer pair-linking across accounts (cross-Monzo↔Revolut). The v2 mirror-pair heuristic had false positives; keep the manual toggle as the escape hatch until a proper UI exists.

## 7. Open questions before I start

- Confirm this plan matches your intent? Any step you want cut or added?
- When you want me to open the PR: immediately on your approval, or after you've run the cleanup SQL?
