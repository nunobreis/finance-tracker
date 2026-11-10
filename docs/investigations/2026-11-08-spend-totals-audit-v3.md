# Spend Totals Audit v3 — Duplicate Account Cleanup

**Generated:** 2026-11-08
**Branch:** feat/mobile-fixes
**Script:** scripts/investigate-spend-totals-v3.mjs
**Supersedes:** 2026-11-08-spend-totals-audit-v2.md
**GBP/EUR rate:** 1.1988 (2026-11-06)

---

> **v3 headline:**
> Nuno confirmed the 4 accounts are a one-time duplicate setup: the same CSVs were
> imported into Monzo `8466b815` + Revolut `a3ab1f93` on 18 Sep,
> then ~1 h later into Monzo `76720141` + Revolut `3497ccbf`.
> All later imports went only into the second (kept) pair. The old pair has
> `is_active = false` but its rows still count in every transaction query,
> double-counting Jun–mid-Sep spend.
>
> This report confirms the row-for-row match of old vs new batches,
> quantifies the double-count, and proposes the cleanup + three code fixes.

---

## Section 1 — Account State

> GBP/EUR rate used throughout: **1.1988** (2026-11-06)

| account_id (short) | name | provider (currency) | is_active | row_count | import_batch_count | date_range |
|---|---|---|---|---|---|---|
| `8466b815` | Monzo | Monzo Bank (GBP) | **false** | 324 | 2 | 2026-06-01..2026-09-17 |
| `a3ab1f93` | Revolut | Revolut Bank (EUR) | **false** | 83 | 2 | 2026-06-14..2026-09-18 |
| `76720141` | Monzo | Monzo Bank (GBP) | **true** | 346 | 5 | 2026-06-01..2026-10-17 |
| `3497ccbf` | Revolut | Revolut Bank (EUR) | **true** | 248 | 6 | 2026-06-14..2026-10-31 |

**Validation: PASS** — Old accounts are `is_active = false`; new accounts are `is_active = true`. Matches Nuno's description.


---

## Section 2 — Aug/Sep Spend/Income in EUR: All vs Active-Only

> GBP/EUR rate: **1.1988** (2026-11-06). Transfers excluded from both totals.

### 2026-08

| Scenario | spentEUR | incomeEUR | row_count |
|---|---|---|---|
| All 4 accounts (current UI behaviour) | **-14392.30** | **15043.00** | 396 |
| Active accounts only (corrected) | **-7196.15** | **7521.50** | 198 |
| Delta (all minus active-only) | -7196.15 | 7521.50 | 198 |

<details><summary>Per-account breakdown</summary>

| account_id (short) | name | is_active | spentEUR | incomeEUR | rows |
|---|---|---|---|---|---|
| `8466b815` | Monzo | false | -6683.86 | 6419.50 | 185 |
| `a3ab1f93` | Revolut | false | -512.29 | 1102.00 | 13 |
| `76720141` | Monzo | true | -6683.86 | 6419.50 | 185 |
| `3497ccbf` | Revolut | true | -512.29 | 1102.00 | 13 |

</details>

### 2026-09

| Scenario | spentEUR | incomeEUR | row_count |
|---|---|---|---|
| All 4 accounts (current UI behaviour) | **-13479.23** | **17717.31** | 199 |
| Active accounts only (corrected) | **-7571.33** | **10323.04** | 122 |
| Delta (all minus active-only) | -5907.90 | 7394.27 | 77 |

<details><summary>Per-account breakdown</summary>

| account_id (short) | name | is_active | spentEUR | incomeEUR | rows |
|---|---|---|---|---|---|
| `8466b815` | Monzo | false | -4033.79 | 2144.27 | 20 |
| `a3ab1f93` | Revolut | false | -1874.11 | 5250.00 | 57 |
| `76720141` | Monzo | true | -4490.19 | 3675.57 | 24 |
| `3497ccbf` | Revolut | true | -3081.14 | 6647.47 | 98 |

</details>


---

## Section 3 — Batch Row-for-Row Comparison

> Matching strategy: exact `(occurred_on, amount, currency, description)` first;
> if that leaves unmatched rows, also try trimmed+casefold on description.

### Old batch `7dd4f6df` → New batch `d527f8e0`

**Old batch:** `7dd4f6df`
- Account: Monzo `8466b815`
- Filename: `n/a`
- Imported at: 2026-09-18T09:58
- DB row_count: 304 | Actual tx rows: 304
- Date range: 2026-06-01..2026-08-30

**New batch:** `d527f8e0`
- Account: Monzo `76720141`
- Filename: `n/a`
- Imported at: 2026-09-18T11:20
- DB row_count: 304 | Actual tx rows: 304
- Date range: 2026-06-01..2026-08-30

**Row matching:**
- Exact match (case-sensitive desc):    304 / 304 old rows matched
- Casefold match (trim+lowercase desc): 304 / 304 old rows matched

**Rows in OLD but NOT in NEW (exact):** None — all old rows have an exact match in new batch.

**Rows in NEW but NOT in OLD (exact):** None — all new rows have an exact match in old batch.

---

### Old batch `3fb59c7b` → New batch `f629714f`

**Old batch:** `3fb59c7b`
- Account: Revolut `a3ab1f93`
- Filename: `n/a`
- Imported at: 2026-09-18T10:06
- DB row_count: 26 | Actual tx rows: 26
- Date range: 2026-06-14..2026-08-31

**New batch:** `f629714f`
- Account: Revolut `3497ccbf`
- Filename: `n/a`
- Imported at: 2026-09-18T11:22
- DB row_count: 26 | Actual tx rows: 26
- Date range: 2026-06-14..2026-08-31

**Row matching:**
- Exact match (case-sensitive desc):    26 / 26 old rows matched
- Casefold match (trim+lowercase desc): 26 / 26 old rows matched

**Rows in OLD but NOT in NEW (exact):** None — all old rows have an exact match in new batch.

**Rows in NEW but NOT in OLD (exact):** None — all new rows have an exact match in old batch.

---

### Old batch `fc1e01a7` → New batch `293c737e`

**Old batch:** `fc1e01a7`
- Account: Revolut `a3ab1f93`
- Filename: `n/a`
- Imported at: 2026-09-18T10:52
- DB row_count: 57 | Actual tx rows: 57
- Date range: 2026-09-01..2026-09-18

**New batch:** `293c737e`
- Account: Revolut `3497ccbf`
- Filename: `n/a`
- Imported at: 2026-09-18T11:22
- DB row_count: 57 | Actual tx rows: 57
- Date range: 2026-09-01..2026-09-18

**Row matching:**
- Exact match (case-sensitive desc):    57 / 57 old rows matched
- Casefold match (trim+lowercase desc): 57 / 57 old rows matched

**Rows in OLD but NOT in NEW (exact):** None — all old rows have an exact match in new batch.

**Rows in NEW but NOT in OLD (exact):** None — all new rows have an exact match in old batch.

---

### Old batch `b68efc23` → New batch `894242bd`

**Old batch:** `b68efc23`
- Account: Monzo `8466b815`
- Filename: `n/a`
- Imported at: 2026-09-18T10:53
- DB row_count: 20 | Actual tx rows: 20
- Date range: 2026-09-01..2026-09-17

**New batch:** `894242bd`
- Account: Monzo `76720141`
- Filename: `n/a`
- Imported at: 2026-09-18T11:21
- DB row_count: 20 | Actual tx rows: 20
- Date range: 2026-09-01..2026-09-17

**Row matching:**
- Exact match (case-sensitive desc):    20 / 20 old rows matched
- Casefold match (trim+lowercase desc): 20 / 20 old rows matched

**Rows in OLD but NOT in NEW (exact):** None — all old rows have an exact match in new batch.

**Rows in NEW but NOT in OLD (exact):** None — all new rows have an exact match in old batch.

---

**Overall: 407 / 407 old rows matched exactly across all 4 old batches.**


---

## Section 4 — Impact Statement

> **Deleting the 4 old batches would remove 407 rows totalling
> €31097.68 in gross spend and €29813.42 in gross income
> spanning 2026-06-01 to 2026-09-18 (Jun–mid-Sep 2026).
> The two inactive accounts have **no**
> other batches outside these four (verified), so after batch deletion they would
> be empty and deletable.
>
> **August UI today:** ≈ €14392.30 spent / €15043.00 income
> **August corrected:** ≈ €7196.15 spent / €7521.50 income
> (delta: €7196.15 over-stated in spend, €7521.50 in income)
>
> **September UI today:** ≈ €13479.23 spent / €17717.31 income
> **September corrected:** ≈ €7571.33 spent / €10323.04 income
> (delta: €5907.90 over-stated in spend, €7394.27 in income)


---

## Section 5 — Proposed Cleanup (No Writes — Proposal Only)

### 5.1 Order of Operations (Nuno runs these manually)

1. **For each of the 4 old batches** — use the existing "Undo last import" / delete-batch UI on
   the Transactions page. Each call to `deleteImportBatch(id)` will:
   - Clear any `transfer_pair_id` references pointing to that batch's transactions.
   - Delete all transaction rows for that batch.
   - Delete the `import_batches` row itself.

   Old batch IDs to delete (copy-paste order does not matter):
      - `7dd4f6df-614e-444b-a2ee-9dcae0207d65`
   - `3fb59c7b-7658-4e12-952c-c7e11ab8ea03`
   - `fc1e01a7-896e-457e-92ec-c6f06e96a356`
   - `b68efc23-cee0-4d57-aadc-5fca171655f9`

2. **After all 4 deletions**, verify each inactive account's remaining row count = 0
   (use the SQL below).

3. **Delete the now-empty inactive accounts** — either via the Accounts UI
   "Delete account" button, or via a one-off SQL `DELETE` (see below).
   This is the **only write** after batch cleanup, and only after verification.

---

### 5.2 Verification SELECTs (paste into Supabase SQL Editor)

**Before cleanup — confirm the 4 batches and their row counts:**

```sql
-- Confirm the 4 old batches exist
SELECT id, account_id, filename, row_count, imported_at
FROM import_batches
WHERE id IN (
  '7dd4f6df-614e-444b-a2ee-9dcae0207d65',
                 '3fb59c7b-7658-4e12-952c-c7e11ab8ea03',
                 'fc1e01a7-896e-457e-92ec-c6f06e96a356',
                 'b68efc23-cee0-4d57-aadc-5fca171655f9'
);

-- Confirm row counts in transactions
SELECT import_batch_id, count(*) AS tx_count
FROM transactions
WHERE import_batch_id IN (
  '7dd4f6df-614e-444b-a2ee-9dcae0207d65',
                 '3fb59c7b-7658-4e12-952c-c7e11ab8ea03',
                 'fc1e01a7-896e-457e-92ec-c6f06e96a356',
                 'b68efc23-cee0-4d57-aadc-5fca171655f9'
)
GROUP BY import_batch_id;
```

**After cleanup — confirm zero rows on inactive accounts:**

```sql
-- Should return 0 rows for each inactive account after batch deletion
SELECT
  a.id,
  a.name,
  a.is_active,
  count(t.id) AS remaining_tx_rows,
  count(DISTINCT b.id) AS remaining_batches
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id
LEFT JOIN import_batches b ON b.account_id = a.id
WHERE a.is_active = false
GROUP BY a.id, a.name, a.is_active;
```

**One-off account hard-delete (ONLY run after the above shows 0 rows):**

```sql
-- !! DESTRUCTIVE — only run after verifying row counts = 0 above !!
DELETE FROM accounts
WHERE id IN (
    '8466b815-f5a2-4f67-b11b-17e72cea24fe',
  'a3ab1f93-91f8-4e46-8b73-85e9190cc720'
)
AND is_active = false;
```



---

## Section 6 — Code Proposal Sketches

> These are design sketches only. No source files are edited.

---

### 6a. Exclude Inactive Accounts from Every Transaction Query/Total

**Files that query `transactions` without an active-account guard:**

| File | Issue |
|---|---|
| `app/(app)/dashboard/page.tsx:58` | spending total — `.select('amount')` with `.lt('amount', 0)` and `.eq('is_transfer', false)` — no account join, no is_active filter |
| `app/(app)/dashboard/page.tsx:65` | recent transactions `.select('*')` — no account join, no is_active filter |
| `app/(app)/transactions/page.tsx:83` | main transaction list — `.select('*, accounts(name), categories(...)')` — accounts joined but no `.eq('accounts.is_active', true)` |
| `app/(app)/transactions/page.tsx:104` | uncategorised count — no account join |
| `app/(app)/transactions/_components/actions.ts:214` | deleteImportBatch — fetch tx IDs to delete (safe, batch-scoped) |
| `app/(app)/accounts/page.tsx:39` | per-account balance — counts own rows, filtered by account_id already (safe) |
| `app/(app)/budgets/page.tsx:64` | budget spend totals — no account join, no is_active filter |
| `lib/net-worth.ts:87` | net-worth transaction sum — no account join, no is_active filter |

**Recommended fix: DB view `active_transactions`**

Rather than adding `.eq('accounts.is_active', true)` in every callsite (error-prone,
easy to miss on new queries), create a view that bakes the filter in:

```sql
-- Create once in Supabase SQL Editor (Nuno runs this — do NOT auto-run)
CREATE OR REPLACE VIEW active_transactions AS
SELECT t.*
FROM transactions t
JOIN accounts a ON a.id = t.account_id
WHERE a.is_active = true;
```

Then in app code, replace `from('transactions')` with `from('active_transactions')`
in the callsites above. The TypeScript types will need a manual type override or
a Supabase type regeneration (`supabase gen types typescript`).

**Alternative (no view):** add a join + filter at each callsite:

```ts
// dashboard/page.tsx spending total — before:
supabase.from('transactions').select('amount')
  .gte('occurred_on', start).lte('occurred_on', end)
  .eq('is_transfer', false).lt('amount', 0)

// after:
supabase.from('transactions').select('amount, accounts!inner(is_active)')
  .gte('occurred_on', start).lte('occurred_on', end)
  .eq('is_transfer', false).lt('amount', 0)
  .eq('accounts.is_active', true)
```

The view approach is lower maintenance. The inline approach is explicit at each callsite.
Recommend the view for MVP; inline filter as a belt-and-braces fallback.

**Test note:** Add a Vitest test that inserts a transaction on an `is_active = false`
account and asserts it does not appear in the dashboard spending total.

---

### 6b. `deleteAccount` Should Cascade Transactions

**Current behaviour** (`app/(app)/accounts/_components/actions.ts:31`):
```ts
// Sets is_active = false — leaves all transactions and import_batches in DB
.update({ is_active: false })
```

**Proposed `deleteAccount` (server action — sketch, do not apply):**

```ts
export async function deleteAccount(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Verify ownership
  const { data: acct } = await supabase
    .from('accounts').select('id, name').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!acct) return { error: 'Account not found' }

  // 2. Fetch batches for pre-delete count (shown in confirm dialog)
  const { data: acctBatches } = await supabase
    .from('import_batches').select('id').eq('account_id', id).eq('user_id', user.id)
  const batchIds = (acctBatches ?? []).map(b => b.id)

  // 3. For each batch, run existing deleteImportBatch cascade logic
  for (const batchId of batchIds) {
    const result = await deleteImportBatch(batchId)
    if (result.error) return { error: `Batch ${batchId}: ${result.error}` }
  }

  // 4. Delete any orphan transactions not covered by a batch (defensive)
  await supabase.from('transactions').delete()
    .eq('account_id', id).eq('user_id', user.id)

  // 5. Hard-delete the account row
  const { error } = await supabase.from('accounts').delete()
    .eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/budgets')
  revalidatePath('/net-worth')
  return {}
}
```

**Confirm dialog in `AccountCard.tsx` (before calling `deleteAccount`):**

```
"Delete Monzo and its 304 transactions across 1 import batch?
 This cannot be undone."
[ Cancel ]  [ Delete account + transactions ]
```

**Test additions:**
- `"deleteAccount removes all import batches for the account"`
- `"deleteAccount removes all orphan transactions for the account"`
- `"deleteAccount removes the account row"`
- `"deleteAccount rejects a different user's account"`

---

### 6c. Import-time Transfer Detection (v2 Tightened Heuristics + Manual Toggle)

**Files in play:**
- `lib/csv/parsers/monzo.ts` — currently flags `is_transfer` only for `Type === 'pot_transfer'`
- `lib/csv/parsers/revolut.ts` — currently flags only `Type === 'TRANSFER'`
- `lib/csv/normalize.ts` — post-parse normaliser (add heuristic pass here)

**Heuristic upgrades (exact regex/match arrays for review):**

```ts
// revolut.ts — replace the is_transfer assignment:
const type = (r['Type'] || r['Tipo'] || '').trim()
const desc = raw.trim()

const REVOLUT_TRANSFER_TYPES  = ['TRANSFER', 'EXCHANGE']
const REVOLUT_TRANSFER_DESCS  = [
  /^exchanged to /i,       // "Exchanged to GBP" etc.
  /\btop[- ]?up\b/i,       // "Top up" / "Top-up"
  /savings vault/i,        // "Savings Vault" etc.
]
const isTransfer =
  REVOLUT_TRANSFER_TYPES.includes(type) ||
  REVOLUT_TRANSFER_DESCS.some(re => re.test(desc))
```

```ts
// monzo.ts — replace the is_transfer assignment:
const type    = r['Type']?.trim() ?? ''
const rawDesc = (r['Description']?.trim() ?? '')
const rawName = (r['Name']?.trim()        ?? '')

const MONZO_TRANSFER_TYPES  = ['pot_transfer']
const MONZO_TRANSFER_DESCS  = [
  /^round[- ]?up\b/i,          // "Round up"
  /lease hold pot/i,            // "Lease Hold Pot"
  /coin jar/i,                  // "Coin Jar"
  /withdrawal from pot/i,       // "Withdrawal from pot"
  /pot withdrawal/i,            // "Pot withdrawal"
  /\bto .+ pot\b/i,            // "To Holidays Pot"
  /\bfrom .+ pot\b/i,          // "From Savings Pot"
]
// NOTE: /\bpot\s/i deliberately excluded (too broad — per v2 investigation)
// NOTE: "referral reward" deliberately excluded (income, not a transfer)

const haystack = rawDesc + ' ' + rawName
const isTransfer =
  MONZO_TRANSFER_TYPES.includes(type) ||
  MONZO_TRANSFER_DESCS.some(re => re.test(haystack))
```

**Manual toggle — server action:**

```ts
// New action in app/(app)/transactions/_components/actions.ts
export async function setTransactionIsTransfer(
  txId: string,
  isTransfer: boolean
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('transactions')
    .update({ is_transfer: isTransfer })
    .eq('id', txId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/budgets')
  return { success: true }
}
```

UI: kebab menu on each `TransactionTable` row → "Mark as transfer" / "Mark as not a transfer".
The `Transfer` tab on the Add Transaction drawer already exists; reuse it for edits.

**Test additions:**
- Each REVOLUT_TRANSFER_DESCS regex: one positive + one negative example.
- Each MONZO_TRANSFER_DESCS regex: one positive + one negative example.
- Confirm `/\bpot\s/` is NOT in the list (regression guard).
- Confirm `"referral reward"` is NOT in the list (regression guard).
- `setTransactionIsTransfer` happy path (true + false).
- `setTransactionIsTransfer` other-user rejection.



---

## Section 7 — Open Questions for Nuno

Short list — answer in your next message:

1. **Confirm the 4 old batch IDs and 2 old account IDs are correct.**
   Old batches: `7dd4f6df`, `3fb59c7b`, `fc1e01a7`, `b68efc23`.
   Inactive accounts: `8466b815`, `a3ab1f93`.
   Once confirmed, run `deleteImportBatch` for each via the Transactions UI.

2. **Hard-delete the inactive accounts after cleanup, or keep them soft-deleted?**
   Recommend: hard-delete (there's no audit value in keeping ghost accounts once their
   rows are gone). The one-off DELETE SQL is in Section 5.2 above.

3. **Mortgage / numeric-reference Monzo row — spend or loan payment?**
   Any Monzo rows where Description is a pure numeric reference (e.g. a loan account
   number) should probably be categorised as "Loan / Mortgage repayment" rather than
   generic spend. Confirm so a category rule can be added.

4. **Round-ups: flag as transfer (zero out of spend) or track as a micro-spend bucket?**
   Current Section 6c proposal flags them as transfer (`is_transfer = true`), consistent
   with Nuno's v2 feedback. Confirm this is still the intent, or if you'd rather keep them
   as a "Round-ups" category.

5. **Revolut EXCHANGE pair — flag both legs as transfer, or only the outgoing leg?**
   The outgoing debit (e.g. −€762 "Exchanged to GBP") and the incoming credit (+£636) each
   land in different accounts. The proposal flags both via the `EXCHANGE` type.
   Confirm you want both sides excluded from spend/income totals.


---

*Zero writes were issued. All queries were SELECT-only via the authenticated user session.*
*GBP/EUR rate fetched read-only from frankfurter.app if not in DB; not written back.*
