# Follow-up plan — accurate totals, cascading account delete, import transfer detection

**Date:** 2026-11-10
**Branch:** `feat/accurate-totals` (created off `main` HEAD `3a2a16a`).
**Scope:** Four changes that together make Spent/Income trustworthy going forward. No cleanup — Nuno already deleted the 4 old batches + 2 inactive accounts manually (Aug now reads ≈ €7 196 spent).

Supersedes `docs/plans/2026-11-08-followup-cleanup-and-transfer-detection.md`.

---

## 1. `exclude_from_spending` flag + Mortgage (UK) user category + numeric-ref rule

### 1a. Schema (idempotent migration)

Run in Supabase SQL Editor and mirror in `schema.sql`:

```sql
alter table categories
  add column if not exists exclude_from_spending boolean not null default false;
```

- `types/database.ts`: add `exclude_from_spending: boolean` to the `Category` row type.
- `lib/categories.ts`: **no change to the system seed.** Mortgage (UK) is a normal user category — created via the same path the user uses for any other category.
- `messages/en.json` + `messages/pt-PT.json`:
  - `Categories.excludeFromSpendingLabel` — "Exclude from spending" / "Excluir das despesas"
  - `Categories.excludeFromSpendingHelp` — "When on, rows in this category don't appear in Spent totals. They still show in the transaction list." / PT-PT equivalent
  - (No system-name key for Mortgage (UK) because it's user-created.)

### 1b. Settings → Categories UI gets the toggle

- `CategoriesSection.tsx` gains a third column: `Exclude from spending` checkbox per category row (mobile + desktop).
- Save path uses the existing `updateCategoryTaxFields` server action — extend its payload to accept `exclude_from_spending: boolean` and update it alongside `irs_deduction` / `income_type`.

### 1c. One-shot setup SQL for Nuno's Mortgage category + rule + backfill

Separate script Nuno pastes once (same pattern as the batch cleanup):

- `docs/cleanups/2026-11-10-seed-mortgage-category-and-rule.sql` — a `begin/commit`-wrapped `do $$` block that:
  1. Resolves Nuno's `user_id` from a known-single-user source (e.g. `select distinct user_id from accounts limit 1`).
  2. Upserts a category: `name='Mortgage (UK)'`, `kind='expense'`, `exclude_from_spending=true`, `country='GB'`, `user_id=<nuno>`. Captures the id.
  3. Upserts a category rule: `match_text='1056324050010000'`, `match_key='1056324050010000'`, `match_type='equals'`, `category_id=<mortgage_uk_id>`, `user_id=<nuno>`.
  4. Backfills existing matching transactions: `UPDATE transactions SET category_id = <mortgage_uk_id> WHERE user_id = <nuno> AND (merchant = '1056324050010000' OR description = '1056324050010000')`. Overrides prior categorisation on matching rows.
  5. Prints the resulting category id, rule id, and backfilled row count via `RAISE NOTICE`.
  6. Raises + rolls back if the category or rule already exists with a DIFFERENT config (defensive).

The script lives in `docs/cleanups/` because it's operational data, not code — same handling as the batch cleanup.

### 1d. Tests

- `tests/lib/categories-utils.test.ts`: `shouldExcludeFromSpending(category)` pure helper + edge cases (null category, missing flag, flag on).
- `tests/lib/summary.test.ts` (new): `computeSpent(rows, excludedCategoryIds)` ignores excluded-category rows and still counts uncategorised rows.

---

## 2. Summary query safety net (active accounts only)

Every Spent / Income / net / budget utilisation query adds two guards:

- `.select('*, accounts!inner(is_active, ...existing fields...)')` + `.eq('accounts.is_active', true)` — drops rows whose account was soft-deleted. (Even though `deleteAccount` goes hard-delete in §3, this belt-and-braces covers the transition and any future "hide without delete" use.)
- `exclude_from_spending`: fetch the small set of excluded category ids once per server-component render, filter rows in the reducer (`!excludedCategoryIds.has(tx.category_id)`). Uncategorised rows (`category_id = null`) are **not** excluded.

**No DB view.** Explicit filters per query. Simpler and respects RLS.

Query sites to touch (grep-driven list, confirmed during implementation):

- `app/(app)/transactions/page.tsx` — hero metric, summary cards.
- `app/(app)/transactions/_components/TransactionSummary.tsx` — Spent / Income / Net cards (desktop).
- `app/(app)/dashboard/_components/*` — aggregation panels.
- `app/(app)/budgets/_components/*` — budget utilisation + 3-month comparison.
- `app/(app)/net-worth/_components/*` — if any component derives from `transactions` (vs snapshots).

**New pure helpers** in `lib/summary.ts`:

```ts
export function computeSpent(
  rows: Transaction[],
  excludedCategoryIds: Set<string>,
): number
export function computeIncome(
  rows: Transaction[],
  excludedCategoryIds: Set<string>,
): number
```

Unit-tested with:
- active-account real expense → counts
- active-account excluded-category expense → does NOT count
- inactive-account expense → already filtered server-side, never reaches the reducer
- uncategorised expense → counts

---

## 3. `deleteAccount` cascade (transactions + batches + recurring bills + holdings)

Current: `deleteAccount(id)` sets `is_active = false`. Keeps orphans counted.

New in `app/(app)/accounts/_components/actions.ts`:

```ts
export async function getAccountDeletionImpact(accountId: string): Promise<{
  transactionCount: number
  importBatchCount: number
  recurringBillCount: number
  holdingCount: number
} | { error: string }>

export async function deleteAccount(accountId: string): Promise<
  | { success: true; deletedTxs: number; deletedBatches: number; deletedBills: number; deletedHoldings: number }
  | { error: string }
>
```

### 3a. Flow

1. `auth.getUser()` + ownership check on the account row.
2. Fetch counts for transactions, import batches, recurring bills, holdings scoped to this account + user.
3. For each `import_batch`, run the existing `deleteImportBatch` body (clear `transfer_pair_id` in chunked `.in`, internal pair-clear, delete tx rows, delete batch row). Reuse — do not duplicate.
4. Defensive orphan sweep: `DELETE FROM transactions WHERE account_id = ? AND user_id = auth.uid()` — catches manual entries outside any batch.
5. `DELETE FROM recurring_bills WHERE account_id = ? AND user_id = auth.uid()` — cascades.
6. `DELETE FROM holdings WHERE account_id = ? AND user_id = auth.uid()` — cascades. (For associated `holding_price_history`: check the FK — if `ON DELETE CASCADE` is set, done; if not, explicit `DELETE FROM holding_price_history WHERE holding_id IN (...)` before the holdings delete. Flag in §3d.)
7. `DELETE FROM accounts WHERE id = ? AND user_id = auth.uid()` — **no more soft-delete.** `is_active` stays on the schema for forward compatibility.
8. `revalidatePath` for `/accounts`, `/dashboard`, `/transactions`, `/budgets`, `/net-worth`, `/recurring-bills`, `/investments`.

### 3b. Confirm dialog (proposed: cascade)

- Menu item "Delete account" → opens a confirm dialog.
- Dialog shows "loading counts…" briefly, then renders via `getAccountDeletionImpact`.
- Copy:
  > **Delete {name}?**
  >
  > This permanently removes:
  > - {txCount} transactions
  > - {batchCount} import batches
  > - {billCount} recurring bills
  > - {holdingCount} holdings
  >
  > This cannot be undone.

  Each line renders only when its count is > 0. If all four are 0: "This account has no data."
- Primary CTA: `Delete account` (destructive variant).
- Secondary: `Cancel`.
- **No "mark inactive" option** — removed.

**Decision point for your approval:** cascade vs block.

Your prompt said "include them in the dialog, or block with a clear message." I'm proposing cascade (default + simplest) with the counts visible in the dialog. If you'd rather block when `recurringBillCount > 0` or `holdingCount > 0`, swap for an inline error ("Reassign or delete the N recurring bills on this account first.") and don't offer the Delete CTA. Say which in your approval reply.

### 3c. Tests

- Happy path: cascades through N batches + M bills + K holdings.
- Removes manual-entry orphan transactions outside any batch.
- Rejects another user's account.
- `getAccountDeletionImpact` returns zeros for an empty account.
- `revalidatePath` called for all seven paths.
- Dialog renders only the non-zero lines (component test).

### 3d. Schema sanity check (implementation-time)

Verify `holding_price_history.holding_id` FK. If it lacks `ON DELETE CASCADE`, either add it in a migration or explicit-delete history rows first. Flag in the implementation step before touching any other code.

---

## 4. Import-time transfer detection + manual toggle

### 4a. Parser-level auto-flag

Each parser sets `is_transfer` on a row at parse time.

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

Explicitly **not** matched (v2 showed these cause false positives):
- `/\bpot\s/` — too broad.
- `/\breferral reward\b/i` — that's income.

### 4b. Revolut EXCHANGE pair linking

A Revolut `EXCHANGE` entry produces two linked rows on the same account (outgoing EUR leg + incoming GBP leg, or vice versa). Both legs get `is_transfer = true` and `transfer_pair_id` wired to each other during `importBatch`.

Algorithm (post-insert pass inside `importBatch`):
1. Normal row insert — capture each new row's generated `id`.
2. Group rows where both legs have `Type === 'EXCHANGE'`, same `occurred_on`, opposite signs with matching magnitude. If a disambiguating field exists in the CSV (e.g. a `Pair` column), prefer it; confirm against a real export during implementation.
3. For each matched pair, update both rows: `transfer_pair_id = otherLeg.id`.
4. Stays inside `importBatch` — no new action.

### 4c. Manual mark-as-transfer

New server action:

```ts
export async function setTransactionIsTransfer(
  txId: string,
  isTransfer: boolean,
): Promise<{ success: true } | { error: string }>
```

Flow: auth → ownership `.eq('user_id', user.id)` → `UPDATE transactions SET is_transfer = $1 WHERE id = $2 AND user_id = auth.uid()` → `revalidatePath('/transactions')`, `revalidatePath('/dashboard')`, `revalidatePath('/budgets')`, `revalidatePath('/net-worth')`.

UI:
- `TransactionTable.tsx` row action — kebab menu (desktop) / long-press (mobile).
- Label toggles between `Mark as transfer` / `Mark as not a transfer` based on current state.
- Optimistic flip + rollback on error.

### 4d. Tests

- Each Revolut + Monzo regex: positive match, negative non-match (one case per regex).
- `/\bpot\s/` and `referral reward`: explicitly asserted NOT to match (regression guard).
- Revolut EXCHANGE pair-linking: two-row CSV → both `is_transfer = true`, `transfer_pair_id` wired both ways.
- `setTransactionIsTransfer` happy path (both directions) + other-user rejection.

---

## 5. Commit sequence on `feat/accurate-totals`

1. **Schema + types + i18n + CategoriesSection toggle** — one commit covering schema migration, type bump, i18n keys, and the Settings UI.
2. **Summary safety net** — `computeSpent` / `computeIncome` helpers + wire into every summary site. Tests.
3. **`deleteAccount` cascade + confirm dialog** — `getAccountDeletionImpact`, rewritten `deleteAccount`, Accounts UI. Tests.
4. **Import parser transfer detection** — regex arrays + unit tests.
5. **Revolut EXCHANGE pair linking in `importBatch`** — post-insert pass + test.
6. **Manual `setTransactionIsTransfer` toggle** — action + row kebab + test.
7. **Mortgage seed SQL** — `docs/cleanups/2026-11-10-seed-mortgage-category-and-rule.sql`. Not executed in CI; you run it after deploy.
8. **Verify** — `tsc --noEmit`, `npm run test:run`, `scripts/check-horizontal-overflow.mjs`, Playwright on `/transactions`, `/accounts`, `/settings` at 390/1440 in EN/PT-PT.

Each commit: focused subject + spec + quality review per earlier waves.

---

## 6. Out of scope

- Rename `is_active` → `archived_at` or any audit mechanism. Hard-delete replaces soft-delete; `is_active` stays for any future "hide without delete" UX.
- Bulk-tag UI for duplicate rows.
- Transfer pair-linking across accounts (cross-Monzo↔Revolut). Manual toggle is the escape hatch.
- Dedup-at-import. Its own design conversation.

---

## 7. Open questions before I kick off

1. **§3b — cascade vs block for bills/holdings?** Proposal is cascade with counts visible in the dialog. If you prefer block ("reassign first"), say so and I'll flip it.
2. **§1c — Mortgage setup SQL vs in-app bootstrap?** SQL file (same handling as the earlier cleanup) is my proposal. Alternative is an in-app "Set up Mortgage (UK) tracking" button in Settings. Which do you want?
3. **§1c backfill override:** I propose overriding any prior categorisation on matching rows, since retroactive accuracy is the point. Say "only uncategorised" if you'd rather be conservative.
4. **Timing:** open the PR as soon as you approve, or wait for anything else first?
