# Norte Redesign — Wave 2 Implementation Specification

**Date:** 2026-11-06
**Branch:** `feat/redesign` (in isolated worktree `.worktrees/feat-redesign`, rebased onto `origin/main`)
**Design Source:** `new_design/new_design.pen` (`02 — Transactions`, `02b — Add Transaction`, `02c — Transactions (Desktop)`, `03-Import / 1-Upload`, `03-Import / 2-Map`, `03-Import / 3-Preview`, `03-Import / 4-Confirm`, `09 — Settings & Account`)
**Scope:** Wave 2 redesign (Transactions, Add Transaction Drawer, CSV Import 4-step flow, Settings & Account) + agreed Wave 2 cleanups (controlled `AddTransactionDrawer`, redesigned `CategoryCell`/`PromptBar`/`RulesSection`, and removal of all legacy `@theme` alias tokens) + small, tested server/query additions approved below.

---

## 1. Audit of Unbacked Artboard Elements (`02`, `02b`, `02c`, `03-1..4`, `09`)

Every element in the Wave 2 `.pen` artboards that lacks a backing feature today has been audited against the current schema (`schema.sql`), types (`types/database.ts`), and server actions. Each item is assigned one of:
- **(a) Build now** as a small, tested server/query/UI change
- **(b) Hide / omit** (or restrict to factual data already in the DB)
- **(c) Defer** to a future feature wave

### 1.1 Summary Decision Matrix

| Artboard & Element | Current Codebase State | Proposal | Details |
|---|---|---|---|
| **`02`, `02c`, `03-1`, `03-4` — "Undo import batch"** (`tx-batch-banner`, `dtx-sum-Latest CSV Import Batch`, `Recent Batch` cards in `03-1`, `Undo Batch` in `03-4`) | `import_batches` stores `{ id, user_id, account_id, filename, imported_at, row_count, status }` and `transactions.import_batch_id` references `import_batches(id)`. `importBatch()` currently passes `filename: null` and there is no delete action. | **(a) Build now** | 1. Update `importBatch(accountId, rows, categoryIdMap, filename?)` to store `filename` and return `{ success, batchId, autoCategorisedCount, error }`.<br>2. Add `deleteImportBatch(batchId)` in `app/(app)/transactions/_components/actions.ts`:<br>  • Verify the batch exists and belongs to `user.id` first (`select('id').eq('id', batchId).eq('user_id', user.id).maybeSingle()`).<br>  • Clear any `transfer_pair_id` pointing to or from a row in the batch (`update({ transfer_pair_id: null })` for rows where `transfer_pair_id IN (batchTxIds)` and rows in the batch), since `transfer_pair_id` has no `ON DELETE` rule.<br>  • Delete the batch's `transactions` first, then delete the `import_batches` row, in that exact order so a retry after partial failure is safe (no orphaned transactions).<br>3. Require an explicit confirmation step in the UI before deleting.<br>4. Cover with unit tests in `tests/lib/import-batch.test.ts` (happy path, another user's batch, cross-batch transfer pair, retry after partial failure). |
| **`02c` — Desktop "IRS / Rule Status" column** (`th-IRS / Rule Status`: `"Auto-rule: \"lidl\""`, `"IVA Sector (Restaurants)"`, `"IRS Health (15%)"`, `"General Family (35%)"`, `"Excluded from spend"`) | `categories` has `irs_deduction` and `income_type`; `transactions` has `irs_deduction_override` and `is_transfer`; `category_rules` has `match_text`, `match_key`, `match_type`, `category_id`. No IFICI / tax-rate engine exists yet. | **(a) + (b) Build with factual data only; hide all `%` and tax estimates** | Show only facts the data already has:<br>• Transfers (`tx.is_transfer`): `"Excluded from spend"` (`t('ruleStatus.transferExcluded')`).<br>• Matched rule (`findMatchingRule(tx, rules)` where rule's `category_id` matches the transaction's effective `category_id`): `"Auto-rule: \"{match_text}\""`.<br>• Mapped IRS deduction (`tx.irs_deduction_override ?? category.irs_deduction`, when not `'none'`/`null`): localized name from `Categories.irsDeductionOptions.*` (e.g. `"Health"`, `"IVA — Restaurants"`, `"General family"` — **never show `(15%)` or `(35%)`**).<br>• Mapped income type (`category.income_type`): localized name from `Categories.incomeTypeOptions.*` (e.g. `"PT Employment"`).<br>• Otherwise: `"—"`. |
| **`02c` — Desktop Header Notification Bell** (`desktop-bell-btn`) | No notification system exists. | **(b) Hide / omit** | Leave out on both mobile and desktop, matching Wave 1. |
| **`02`, `02c` — Search input + Account / Uncategorised filter pills** (`tx-search-bar`, `tx-filter-chips`, `dtx-filter-bar`) | `transactions/page.tsx` already filters by `?account=<uuid>`, `?category=<uuid>`, `?from=<date>`, `?to=<date>`, and `?q=<text>` (`description.ilike.%q%,merchant.ilike.%q%`). However, `?q=` goes straight into `.or()` unescaped today, `TransactionFilters.tsx` has no search input UI, and `page.tsx` does not handle `?category=uncategorised` or count uncategorised rows. | **(a) Build now** | 1. Add `sanitiseSearchQuery(q)` / `buildSearchOrFilter(q)` to strip/escape `, ( ) % _ \` before building the PostgREST `.or()` filter, with unit tests for `"a,b"` and `"50%"`.<br>2. Add the search input in `TransactionFilters.tsx` wired to `?q=`.<br>3. Support `?category=uncategorised` in `transactions/page.tsx` (`.is('category_id', null).eq('is_transfer', false)`).<br>4. Query the uncategorised count for the active period/account so the `"Uncategorised ({count})"` pill displays the live count alongside `"All"`, per-account pills (`Revolut`, `Monzo`, etc.), category dropdown, and month switcher. |
| **`02`, `02c` — Multi-currency Hero & Summary Totals + GBP Row Equivalent** (`Spent in Nov 2026`, `Income`, `- £ 3.55 (≈ - € 4.20)`) | `TransactionSummary.tsx` currently sums raw `tx.amount` across currencies without FX conversion and formats with `formatEur`. | **(a) Build now (latest FX rate)** | Fetch `reportingCurrency`, `reportingRate`, and latest GBP→EUR exchange rate in `transactions/page.tsx` (using `getReportingCurrency`, `getReportingRate`, `getLatestRates`). Per the `CLAUDE.md` MVP decision, summary totals and `≈ €` row equivalents always use the **latest rate** (`getRateOn` / historical rates are reserved for tax views only). |
| **`02b` — `AddTransactionDrawer` Segmented Type (`Expense \| Income \| Transfer`)** (`s02b-type-seg`) | Currently uses a single raw `<input name="amount" placeholder="-25.50" />` where the user must type `-` for expenses, only lists `expense` categories, and uses a checkbox for `is_transfer`. | **(a) Build now (with server-side sign validation)** | Add the 3-way segmented pill (`Expense` \| `Income` \| `Transfer`) in `AddTransactionDrawer.tsx` and validate sign vs `tx_type` on the server in `createTransaction`:<br>• `Expense` (`tx_type = 'expense'`): lists `expense` categories, submits negative `-Math.abs(amount)`, and `createTransaction` validates `amount < 0`.<br>• `Income` (`tx_type = 'income'`): lists `income` categories, submits positive `+Math.abs(amount)`, and `createTransaction` validates `amount > 0`.<br>• `Transfer` (`tx_type = 'transfer'` / `is_transfer = 'on'`): sets `is_transfer="on"` and renders `Destination account` (`linked_account_id`), validated and inserted as a linked debit/credit pair as today.<br>• Unit test all 3 branches and sign validation in `tests/lib/import-batch.test.ts` (or `tests/lib/transactions-actions.test.ts`). |
| **`02b` — Category option `"Health · IRS deductible (15%)"` & `"Auto-rule"` field inside `AddTransactionDrawer`** (`s02b-f-Category`, `s02b-f-Auto-rule`) | Categories have `irs_deduction` without percentages; `createTransaction` does not create category rules. | **(b) Factual IRS label only / (c) Defer inline rule creation in drawer** | In `AddTransactionDrawer`'s category `<Select>`, show factual IRS category mapping name if set (no `%`). Omit the `"Auto-rule"` field inside `AddTransactionDrawer` (rules are created via the inline `PromptBar` in `TransactionTable` and in `Settings → RulesSection`). |
| **`03-1` — Recent Import Batches list on Upload step** (`Recent Batch #103`, `Recent Batch #102` with `"Undo batch"`) | `import/page.tsx` currently only loads `accounts` and `categories`. | **(a) Build now** | Load the user's 5 most recent completed `import_batches` in `import/page.tsx` and render them below the dropzone in `UploadStep.tsx` with filename, row count, date, and `"Undo batch"` (wired to `deleteImportBatch` with confirm). |
| **`03-2` — Column Mapping cards with live CSV sample values** (`Completed Date (e.g. 2026-11-06)`) | `MapStep.tsx` renders a static table of field names without sample values from the parsed file. | **(a) Build now** | Display sample values from `rows[0]` inside `#F4F5F7` mapping cards in `MapStep.tsx`. |
| **`03-3` — Preview & Rules summary (`"11 auto-categorised · 2 transfers · 1 duplicate skipped"`) & per-row rule badges** | `PreviewStep.tsx` flags duplicates and checks `row.raw_category`, but does not receive `category_rules` (even though `importBatch` applies `category_rules` on insert). Also, CSV imports flag `row.is_transfer` rather than linking cross-account transfer pairs. | **(a) + (b) Build rule preview; show factual transfer label** | Pass `category_rules` from `import/page.tsx` to `PreviewStep.tsx` so each row previews `"Auto-rule \"{match_text}\" → {Category}"` and the subtitle shows accurate counts (`auto-categorised · transfers · duplicates skipped`). Show `"Transfer · Excluded from spend"` (not `"Linked transfer pair"`) and omit IRS `%`. |
| **`03-4` — Post-Import Completion screen (`"Step 4 of 4 · Complete — Import successful!"` + `"Undo Batch immediately"`)** | `ConfirmStep.tsx` currently only shows a pre-import summary and immediately redirects to `/transactions?account=...` after `importBatch` resolves. | **(a) Build now** | When the user clicks `"Confirm & import"` in `ConfirmStep.tsx` and `importBatch` succeeds, transition `ConfirmStep` to the `03-4 Complete` state showing the Batch summary cards, auto-categorised count, `"Undo batch immediately"` button (calling `deleteImportBatch(batchId)`), and `"Back to Transactions"` CTA. |
| **`09` — Settings & Account consolidation** (`Reporting Currency`, `App Language`, `Merchant → Category Rules` with `"Re-run all"`, `Account Security`, plus `CategoriesSection`) | `/settings` has `SettingsForm`, `CategoriesSection`, and `RulesSection` (without `"Re-run all"`). `/account` has `ChangePasswordForm` and `signOut`. | **(a) Build now** | Redesign `/settings` (`09 — Settings & Account`) with `ScreenHero` (showing user email), Preferences cards (`SettingsForm`), `RulesSection` (with `"Re-run all"` button calling `rerunRules()`), `CategoriesSection` (IRS/Income mapping), and `AccountSecuritySection` (Change password + Sign out). Also update `/account` to render `ScreenHero` + `AccountSecuritySection` so both routes share the redesigned UI. |

---

## 2. Agreed Wave 2 Cleanups & Architecture

### 2.1 Controlled `AddTransactionDrawer` & Removal of Dashboard `ref` Hack
- **File:** `app/(app)/transactions/_components/AddTransactionDrawer.tsx`
- **Props Contract:**
  ```ts
  type Props = {
    accounts: Account[]
    categories: Category[]
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    defaultTransfer?: boolean
    hideTrigger?: boolean
  }
  ```
- **Behaviour:**
  - Supports both **uncontrolled** usage (e.g. when rendered with its own `+ Add transaction` trigger button in `/transactions`) and **controlled** usage (`isOpen` + `onOpenChange` + `defaultTransfer` + `hideTrigger` from `DashboardQuickActions`).
  - Whenever the drawer opens (or `defaultTransfer` changes), syncs the initial segmented tab (`'transfer'` when `defaultTransfer` is `true`, `'expense'` otherwise).
  - Closes automatically when `createTransaction` succeeds (`state.success`).
- **Dashboard Cleanup (`app/(app)/dashboard/_components/DashboardQuickActions.tsx`):**
  - Removes `txWrapperRef`, `document.getElementById('is_transfer')`, and the hidden wrapper `div` for `AddTransactionDrawer`.
  - Uses `const [txDrawerOpen, setTxDrawerOpen] = useState(false)` and `const [defaultTransfer, setDefaultTransfer] = useState(false)`, passing `isOpen={txDrawerOpen}`, `onOpenChange={setTxDrawerOpen}`, `defaultTransfer={defaultTransfer}`, and `hideTrigger` to `<AddTransactionDrawer />`.
  - Similarly adds optional `isOpen` / `onOpenChange` / `hideTrigger` props to `AddBillDrawer.tsx` so `billWrapperRef` in `DashboardQuickActions.tsx` is also replaced with clean React state.

### 2.2 Pure Rule-Matching Helper in `lib/category-rules.ts`
- Currently `applyRules(tx, rules)` returns `string | null` (`category_id`).
- To display which rule matched a transaction in `02c` (`"Auto-rule: \"lidl\""`) and in `03-3` (`"Auto-rule \"lidl\" → Groceries"`), add a small exported helper `findMatchingRule<T extends Rule>(tx, rules: T[]): T | null` in `lib/category-rules.ts` (and have `applyRules` delegate to `findMatchingRule(tx, rules)?.category_id ?? null`).
- Covered by unit tests in `tests/lib/category-rules.test.ts`.

### 2.3 Redesigned `CategoryCell`, `PromptBar`, and `RulesSection`
- **`CategoryCell.tsx`:**
  - Viewing state: Renders a pill button (`inline-flex items-center gap-1 rounded-full bg-separator-subtle px-3 py-1 text-caption font-semibold text-ink hover:bg-teal-tint hover:text-teal transition-colors`) showing `{categoryName} ▾`, or a dashed/subtle `"Uncategorised ▾"` pill (`bg-warning-tint/60 text-warning-deep`) when `categoryId` is `null`.
  - Editing state: Renders a compact rounded `select` (`rounded-full border border-teal bg-surface px-3 py-1 text-caption font-semibold text-ink outline-none`) with error feedback in `text-caption text-negative`.
- **`PromptBar` (in `TransactionTable.tsx`):**
  - Styled as a teal-tinted glass/surface banner (`flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-teal/30 bg-teal-tint/40 px-4 py-2.5 text-caption text-ink`) with primary `Button` (`size="sm"`, `variant="primary"`) for `Create rule` / `Update rule` and `Button` (`size="sm"`, `variant="ghost"`) for `Skip`.
- **`RulesSection.tsx` (in `app/(app)/settings/_components/RulesSection.tsx`):**
  - Header shows `"Categorisation Rules"` (`text-body font-bold text-ink lg:text-h2`), active rule count badge, and the `"Re-run all"` (`tCR('bulkAction')`) `Button` (`size="sm"`, `variant="secondary"`) calling `rerunRules()` from `@/app/(app)/transactions/_components/actions`.
  - Mobile (`< lg`): `#F4F5F7` (`bg-canvas`) rule cards showing `"{match_text}"` (`match_type` badge), target category `< select >`, and delete icon button.
  - Desktop (`>= lg`): Clean table inside `rounded-[20px] border border-separator/80 bg-surface p-6 shadow-xs`, plus an inline `"Add rule"` form using filled `Input`, `Select`, and `Button`.

### 2.4 Legacy Token Removal (`app/globals.css`)
- Replace all remaining legacy token references in:
  - `app/(app)/transactions/**`
  - `app/(app)/settings/**`
  - `app/(app)/account/**`
  - `app/(app)/net-worth/_components/{NetWorthChart,BreakdownTable,SnapshotHistory}.tsx` (`text-text-primary` → `text-ink`)
  - `components/ui/LoadingSpinner.tsx` (`border-border-col border-t-accent` → `border-separator border-t-teal`)
  - `components/layout/PageHeader.tsx` (`border-border-col bg-card-bg text-text-primary` → `border-separator bg-surface text-ink`)
- Delete lines 83–101 (`/* Backwards-compatible legacy aliases */`) from `app/globals.css`.
- Verify via `grep` that zero occurrences of `sidebar-bg`, `content-bg`, `card-bg`, `accent`, `accent-light`, `text-primary`, `text-tertiary`, `border-col`, `nav-icon-col`, `nav-active-bg`, `status-good`, `status-warn`, `status-danger`, `good-bg`, `warn-bg`, `danger-bg`, `warn-icon-bg`, or `good-icon-bg` remain anywhere in `app/` or `components/`.

---

## 3. Screen-by-Screen Design Specification

### 3.1 Screen 1: Transactions (`app/(app)/transactions/`) — Artboards `02`, `02b`, `02c`
- **Hero & Header (`ScreenHero`):**
  - Mobile (`< lg`, `02`):
    - Title: `t('title')` (`"Transactions"` / `"Transações"`).
    - Top-right mobile action pills: `Import CSV` link pill (`bg-glass-15 text-white border border-glass-30`) + `+ Add` trigger button (`AddTransactionDrawer`).
    - Hero metric: `Spent in {Month YYYY}` (`formatMoney(-Math.abs(totalOutEur * reportingRate), reportingCurrency, locale)` in `text-display-sm font-extrabold text-white`), with right/subtitle column showing `Income · +€...` (`text-positive-tint`) and `{transferCount} transfers excluded` (`text-glass-70`).
  - Desktop (`>= lg`, `02c`):
    - Desktop header title `t('title')`, with right controls: month switcher pill (`← Nov 2026 →`), `GBP / EUR · {rate}` pill, `Import CSV` button (`variant="secondary"`, `size="sm"`), and `+ Add transaction` button (`AddTransactionDrawer`).
    - 3-card summary row (`TransactionSummary.tsx`, `hidden lg:grid lg:grid-cols-3 lg:gap-4`):
      1. **Spent in {Month}:** `formatMoney(-Math.abs(totalOutReporting), reportingCurrency, locale)` with subtitle `Across {expenseCount} transactions · {transferCount} transfers excluded`.
      2. **Income in {Month}:** `formatMoney(totalInReporting, reportingCurrency, locale, { signDisplay: 'always' })` in `text-positive` with subtitle `Across {incomeCount} transactions`.
      3. **Latest CSV Import Batch (or Net):** When a recent `import_batch` exists for the user, displays `Batch · {row_count} rows` (`{filename}`) with an `"Undo batch"` action button; otherwise displays the `Net` cashflow card.
- **Filter Bar (`TransactionFilters.tsx`):**
  - Search bar (`bg-canvas lg:bg-surface rounded-full px-4 h-10 flex items-center gap-2 border border-transparent lg:border-separator`) wired to `?q=`.
  - Horizontally scrollable filter chips (`flex items-center gap-2 overflow-x-auto`):
    - `"All"` (`!currentAccount && !currentCategory`)
    - One chip per active account (`a.name`, active when `currentAccount === a.id`)
    - `"Uncategorised ({uncategorisedCount})"` (active when `currentCategory === 'uncategorised'`)
    - Category `<select>` pill for filtering by any specific category
    - Mobile month switcher pill (`← {monthLabel} →`).
- **Latest Import Batch Banner (Mobile `< lg`):**
  - When a recent completed `import_batch` exists, renders a compact banner (`rounded-[12px] bg-teal-tint/50 px-3.5 py-2.5 flex items-center justify-between gap-2`) showing `{filename || 'CSV Import'} ({row_count} rows)` and an `"Undo batch"` button (with confirmation prompt).
- **Transaction List & Desktop Table (`TransactionTable.tsx`):**
  - Mobile (`< lg`, `lg:hidden`):
    - Renders each transaction using `TransactionRow` (or a card row matching `YeYyc` with category icon circle via `resolveCategoryVisual`), merchant/description title, account + date subtitle, formatted native amount (`formatMoney`) + optional EUR equivalent when `tx.currency !== reportingCurrency`, and inline `CategoryCell` (or `Transfer` `StatusBadge`).
    - When `prompt?.txId === tx.id`, renders the redesigned `PromptBar` directly underneath the row.
  - Desktop (`>= lg`, `hidden lg:block`):
    - 6-column table inside `rounded-[20px] border border-separator/80 bg-surface shadow-xs overflow-hidden`:
      1. `Date` (`formatDate(tx.occurred_on, locale, { includeYear: true })`)
      2. `Merchant & Description` (with category icon circle from `resolveCategoryVisual` + optional `Import` badge)
      3. `Account` (`tx.accounts?.name` + currency)
      4. `Category` (`CategoryCell` pill with `▾` or `Linked Transfer` `StatusBadge`)
      5. `IRS / Rule Status` (factual rule match `"Auto-rule: \"...\""`, factual IRS deduction label, factual income type label, or `"Excluded from spend"` — zero percentages)
      6. `Amount` (native `formatMoney` with true minus `−` / `+`, plus muted `(≈ €...)` when `tx.currency !== reportingCurrency`).

### 3.2 Screen 2: CSV Import (`app/(app)/transactions/import/`) — Artboards `03-1` to `03-4`
- **Hero & Layout (`import/page.tsx` & `ImportStepper.tsx`):**
  - Uses `ScreenHero` with dynamic step pill (`Step {step + 1} of 4 · {stepLabel}`), step headline (`Import bank statement`, `Map CSV columns`, `Review before import`, `Import successful!`), and dynamic subtitle.
  - Desktop step indicator bar (`hidden lg:flex`) above the step card (`rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-6 lg:shadow-xs`).
- **Step 1 — Upload (`UploadStep.tsx`, `03-1`):**
  - Filled `Select` for `Target Account` (showing account name, currency, and balance).
  - Dashed `#F4F5F7` (`bg-canvas`) Dropzone card (`rounded-[16px] border-2 border-dashed border-separator p-6 text-center hover:border-teal cursor-pointer`) showing selected filename, detected format (`Revolut` / `Monzo`), and row count.
  - **Recent Import Batches section:** Lists up to 5 recent completed batches as `#F4F5F7` cards (`{filename} · {row_count} rows`) with an `"Undo batch"` button (with confirm step calling `deleteImportBatch`).
  - Full-width `size="lg"` primary `Button` (`"Continue to column mapping"`).
- **Step 2 — Map Columns (`MapStep.tsx`, `03-2`):**
  - Shows detected format banner (`Revolut` or `Monzo`, row count, date range) and stacked `#F4F5F7` mapping cards (`Occurred Date`, `Merchant / Payee`, `Amount (Signed)`, `Native Currency`, `Transfer Detection`) populated with live sample values from `rows[0]`.
  - `Back` (`variant="ghost"` / `secondary`) and `Preview {count} rows` (`variant="primary"`, `size="lg"`) buttons.
- **Step 3 — Preview & Rules (`PreviewStep.tsx`, `03-3`):**
  - Summary banner showing `{autoCategorisedCount} auto-categorised · {transferCount} transfers · {dupCount} duplicate(s) skipped`.
  - Mobile (`< lg`): `#F4F5F7` preview cards with checkbox, merchant + amount, and status subtitle (`Auto-rule "{match_text}" → {Category}`, `CSV category → {Category}`, `Transfer · Excluded from spend`, or `Duplicate · Skipped`).
  - Desktop (`>= lg`): Scrollable table with checkboxes, Date, Merchant, Category / Rule match badge, and formatted Amount.
  - `Back` and `Confirm & import {selectedCount} rows` buttons.
- **Step 4 — Confirm & Complete (`ConfirmStep.tsx`, `03-4`):**
  - **Pre-submit state:** Summary cards (`Target Account`, `Transactions to import`, `Categorised by Rules`, `Skipped duplicates`, `Net total`) + `Back` and `Confirm & import {count} rows` CTA.
  - **Post-submit complete state (matches `03-4` artboard):**
    - Displays `#F4F5F7` summary cards:
      - `Import Batch`: `{filename} ({count} rows)`
      - `Categorised by Rules`: `{autoCategorisedCount} of {count} transactions auto-tagged`
      - `Reversibility`: `"You can undo this entire batch in one tap anytime"`
      - `Secondary Action`: Interactive card/button `"Undo batch immediately"` (with confirm step calling `deleteImportBatch(batchId)` and returning to `/transactions`)
    - Primary `size="lg" fullWidth` `Button`: `"Back to Transactions"` (`/transactions?account={accountId}`).

### 3.3 Screen 3: Settings & Account (`app/(app)/settings/` & `app/(app)/account/`) — Artboard `09`
- **`app/(app)/settings/page.tsx`:**
  - Uses `ScreenHero`:
    - `title={t('title')}` (`"Settings"` / `"Definições"`)
    - `eyebrow={t('heroEyebrow')}` (`"Signed in as personal owner"`)
    - `metric={user?.email ?? '—'}`
    - `subtitle={t('heroSubtitle')}` (`"Single-user instance · Supabase RLS active"`)
  - Body sections:
    1. **Preferences (`SettingsForm.tsx`):** Two `#F4F5F7` (`bg-canvas lg:bg-surface`) cards matching `09` (`Reporting Currency` and `App Language (i18n)`) with filled `Select` controls and `Save settings` primary `Button`.
    2. **Merchant → Category Rules (`RulesSection.tsx`):** Card showing active rules count (`{count} rules`), `"Re-run all"` action button (`rerunRules`), list of rules (mobile `#F4F5F7` cards / desktop table) with inline category `<select>` and delete action, plus `"Add rule"` form with filled `Input`, `Select`, and `Button`.
    3. **Categories & IRS / Income Mapping (`CategoriesSection.tsx`):** Card with mobile `#F4F5F7` category cards (`< lg`) and desktop table (`>= lg`) for mapping each expense category to `irs_deduction` and each income category to `income_type`, with `Save categories` primary `Button`.
    4. **Account Security (`AccountSecuritySection.tsx`):** Shared component rendering the Change Password form (`changePassword` action with filled `Input`s and `Button`) and Sign Out button (`signOut` action).
- **`app/(app)/account/page.tsx`:**
  - Uses `ScreenHero` (with `user?.email` metric) and renders the shared `AccountSecuritySection` so `/account` has zero legacy tokens or `PageHeader` references.
