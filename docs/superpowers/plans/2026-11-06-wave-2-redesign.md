# Norte Redesign — Wave 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Wave 2 of the Norte UI redesign (`02 / 02b / 02c — Transactions`, `03-Import / 1–4 — CSV Import`, `09 — Settings & Account`), add the approved small server/query enhancements (`deleteImportBatch`, `importBatch` filename & return metadata, `findMatchingRule`, `?category=uncategorised`), refactor `AddTransactionDrawer` to controlled props (removing the Dashboard `ref` click bridge), and remove all legacy `@theme` alias tokens.

**Architecture:**
- Keep all work in `.worktrees/feat-redesign` on branch `feat/redesign`.
- Use only the semantic `@theme` tokens (`bg-ink`, `bg-teal`, `bg-canvas`, `bg-surface`, `text-ink`, `text-text-secondary`, `border-separator`, `bg-glass-*`, etc.) and the 9 named typography tokens (`text-display`, `text-display-sm`, `text-h1`, `text-h1-sm`, `text-h2`, `text-body`, `text-body-sm`, `text-caption`, `text-label`). Zero raw hex in `className`.
- Use the single breakpoint `lg` (`1024px`) for every mobile↔desktop switch.
- Use `formatMoney` and `formatDate` / `formatMonthYear` from `@/lib/utils` for all currency and date formatting across EN and PT-PT.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19 (`useActionState`), TypeScript, Tailwind CSS v4 (`@theme`), Supabase SSR, `next-intl`, Vitest + Testing Library, Playwright.

---

### Task 1: Server Actions, Rule Matcher Helper, Additive i18n Keys & Unit Tests (TDD)

**Files:**
- Modify: `lib/category-rules.ts`
- Modify: `tests/lib/category-rules.test.ts`
- Modify: `app/(app)/transactions/_components/actions.ts`
- Create: `tests/lib/import-batch.test.ts`
- Modify: `messages/en.json`
- Modify: `messages/pt-PT.json`

- [ ] **Step 1: Write failing unit tests for `findMatchingRule` and `deleteImportBatch` / `importBatch`**

Add tests in `tests/lib/category-rules.test.ts` for `findMatchingRule(tx, rules)` returning the winning rule object (`{ match_text, match_key, match_type, category_id, created_at }`) or `null`, and create `tests/lib/import-batch.test.ts` testing:
1. `importBatch` persists `filename` on `import_batches` and returns `{ success: true, batchId, autoCategorisedCount }`.
2. `deleteImportBatch(batchId)` rejects unauthenticated requests, deletes `transactions` scoped by `import_batch_id = batchId` and `user_id = user.id`, deletes the `import_batches` row scoped by `id = batchId` and `user_id = user.id`, and returns `{ deletedCount }`.

- [ ] **Step 2: Run Vitest to confirm new tests fail**

Run:
```bash
npm --prefix .worktrees/feat-redesign run test:run
```

- [ ] **Step 3: Implement `findMatchingRule` in `lib/category-rules.ts` and `deleteImportBatch` + `importBatch` updates in `app/(app)/transactions/_components/actions.ts`**

1. In `lib/category-rules.ts`:
```ts
export type RuleMatchInput = {
  match_key: string
  match_type: 'equals' | 'contains'
  category_id: string
  created_at: string
  match_text?: string
}

export function findMatchingRule<T extends RuleMatchInput>(
  tx: { merchant: string | null; description: string | null },
  rules: T[]
): T | null {
  const target = matchTarget(tx)
  if (!target) return null
  const normTarget = normalise(target)
  if (!normTarget) return null

  const matches = rules.filter(rule => {
    if (rule.match_type === 'equals') return normTarget === rule.match_key
    return normTarget.includes(rule.match_key)
  })

  if (matches.length === 0) return null

  matches.sort((a, b) => {
    if (a.match_type !== b.match_type) return a.match_type === 'equals' ? -1 : 1
    if (b.match_key.length !== a.match_key.length) return b.match_key.length - a.match_key.length
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return matches[0]
}

export function applyRules(
  tx: { merchant: string | null; description: string | null },
  rules: RuleMatchInput[]
): string | null {
  return findMatchingRule(tx, rules)?.category_id ?? null
}
```
2. In `app/(app)/transactions/_components/actions.ts`:
   - Update `createTransaction` to also return `{ success?: boolean; error?: string }` and `revalidatePath('/dashboard')`.
   - Update `importBatch(accountId, rows, categoryIdMap, filename = null)` to store `filename`, count auto-categorised rows (`autoCategorisedCount`), and return `{ success: true, batchId: batch.id, autoCategorisedCount }`.
   - Add `deleteImportBatch(batchId: string): Promise<{ deletedCount: number; error?: string }>`:
     - Authenticates `user` via `supabase.auth.getUser()`.
     - Deletes from `transactions` where `import_batch_id = batchId` and `user_id = user.id` (selecting `id` to count deleted rows).
     - Deletes from `import_batches` where `id = batchId` and `user_id = user.id`.
     - Calls `revalidatePath('/transactions')`, `revalidatePath('/transactions/import')`, `revalidatePath('/accounts')`, `revalidatePath('/dashboard')`, `revalidatePath('/budgets')`, `revalidatePath('/net-worth')`.
3. Add additive Wave 2 i18n keys to `messages/en.json` and `messages/pt-PT.json` for `Transactions` (hero labels, segmented type tabs, filter chips, rule status column labels, batch banner & undo confirm), `Transactions.import` (step pills, recent batches, completion cards), and `Settings` (hero eyebrow/subtitle, card subtitles).

- [ ] **Step 4: Run `tsc --noEmit` and `npm run test:run`**

Run:
```bash
npx --prefix .worktrees/feat-redesign tsc --noEmit -p .worktrees/feat-redesign/tsconfig.json
npm --prefix .worktrees/feat-redesign run test:run
```

- [ ] **Step 5: Commit**

```bash
git add lib/category-rules.ts tests/lib/category-rules.test.ts app/\(app\)/transactions/_components/actions.ts tests/lib/import-batch.test.ts messages/en.json messages/pt-PT.json
git commit -m "feat(transactions): add deleteImportBatch action, findMatchingRule helper, and Wave 2 i18n keys"
```

---

### Task 2: Controlled `AddTransactionDrawer` (`02b`) & Dashboard QuickActions Cleanup

**Files:**
- Modify: `app/(app)/transactions/_components/AddTransactionDrawer.tsx`
- Modify: `app/(app)/recurring-bills/_components/AddBillDrawer.tsx`
- Modify: `app/(app)/dashboard/_components/DashboardQuickActions.tsx`
- Create: `tests/components/transactions/AddTransactionDrawer.test.tsx`

- [ ] **Step 1: Write unit tests for controlled `AddTransactionDrawer`**

Create `tests/components/transactions/AddTransactionDrawer.test.tsx` verifying:
1. Renders trigger button by default and opens when clicked (uncontrolled mode).
2. Respects controlled `isOpen` and calls `onOpenChange(false)` when closed.
3. Selects the `Transfer` tab and shows `Destination account` selector when `defaultTransfer={true}`.
4. Switches between `Expense`, `Income`, and `Transfer` tabs, filtering categories by `kind` (`expense` vs `income`).

- [ ] **Step 2: Refactor `AddTransactionDrawer.tsx`, `AddBillDrawer.tsx`, and `DashboardQuickActions.tsx`**

1. In `AddTransactionDrawer.tsx`:
   - Accept `{ accounts, categories, isOpen: controlledOpen, onOpenChange, defaultTransfer = false, hideTrigger = false, triggerVariant = 'primary' }`.
   - Render the 3-way segmented control (`Expense` | `Income` | `Transfer` matching `02b — Add Transaction`, `p6zC92`).
   - Use `Input` and `Select` (`variant="filled"`) and `Button` (`variant="primary" size="lg" fullWidth`).
   - Normalize sign on submit via a hidden `<input name="amount" value={signedAmount} />`: negative for `Expense`, positive for `Income`, positive with `is_transfer="on"` for `Transfer`.
   - Show factual IRS deduction mapping on category options (e.g. `Health · IRS: Health`) without any percentages.
2. In `AddBillDrawer.tsx`:
   - Add optional `isOpen?: boolean`, `onOpenChange?: (open: boolean) => void`, `hideTrigger?: boolean` props.
3. In `DashboardQuickActions.tsx`:
   - Remove `txWrapperRef`, `billWrapperRef`, `document.getElementById('is_transfer')`, and the hidden wrapper `div`s.
   - Drive `<AddTransactionDrawer>` and `<AddBillDrawer>` directly via React state (`isOpen`, `onOpenChange`, `defaultTransfer`, `hideTrigger`).

- [ ] **Step 3: Verify TypeScript and tests**

Run:
```bash
npx --prefix .worktrees/feat-redesign tsc --noEmit -p .worktrees/feat-redesign/tsconfig.json
npm --prefix .worktrees/feat-redesign run test:run
```

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/transactions/_components/AddTransactionDrawer.tsx app/\(app\)/recurring-bills/_components/AddBillDrawer.tsx app/\(app\)/dashboard/_components/DashboardQuickActions.tsx tests/components/transactions/AddTransactionDrawer.test.tsx
git commit -m "feat(transactions): redesign controlled AddTransactionDrawer and remove Dashboard ref hack"
```

---

### Task 3: Transactions Screen (`02 — Transactions` & `02c — Transactions (Desktop)`)

**Files:**
- Modify: `app/(app)/transactions/page.tsx`
- Modify: `app/(app)/transactions/_components/TransactionSummary.tsx`
- Modify: `app/(app)/transactions/_components/TransactionFilters.tsx`
- Modify: `app/(app)/transactions/_components/CategoryCell.tsx`
- Modify: `app/(app)/transactions/_components/TransactionTable.tsx`

- [ ] **Step 1: Update `transactions/page.tsx`, `TransactionSummary.tsx`, `TransactionFilters.tsx`, `CategoryCell.tsx`, and `TransactionTable.tsx`**

1. `transactions/page.tsx`:
   - Fetch `reportingCurrency`, `reportingRate`, `gbpToEurRate` (`getLatestRates`), active `accounts`, `categories` (including `irs_deduction`, `income_type`, `kind`), `category_rules` (`id, match_text, match_key, match_type, category_id, created_at`), latest completed `import_batches` row (with `accounts(name)`), and `uncategorisedCount` for the active date range.
   - Support `params.category === 'uncategorised'` (`.is('category_id', null).eq('is_transfer', false)`).
   - Render `ScreenHero` with `Spent in {month}` hero metric, `Income · +...` & `{n} transfers excluded` subtitle, and mobile/desktop actions (`Import CSV` link pill + `AddTransactionDrawer`).
2. `TransactionSummary.tsx`:
   - Desktop 3-card summary grid (`hidden lg:grid lg:grid-cols-3 lg:gap-4`) showing `Spent in {month}`, `Income in {month}`, and `Latest CSV Import Batch` (with `"Undo batch"` button calling `deleteImportBatch` after confirm, or `Net` when no batch exists).
3. `TransactionFilters.tsx`:
   - Search bar (`?q=`), month switcher pill (`← {month} →`), account filter pills (`All`, each active account), `"Uncategorised ({uncategorisedCount})"` pill, and category filter `<select>` pill.
4. `CategoryCell.tsx`:
   - Redesigned pill (`{categoryName} ▾` in `bg-separator-subtle text-ink` or `"Uncategorised ▾"` in `bg-warning-tint/60 text-warning-deep`) and inline `<select>` editor using semantic tokens.
5. `TransactionTable.tsx`:
   - Optional mobile Latest Import Batch banner with `"Undo batch"` (confirm step → `deleteImportBatch`).
   - Redesigned toolbar (`rerunRules` button + status toast) and inline `PromptBar` (`Button` `size="sm"`).
   - Mobile (`lg:hidden`) transaction cards using category icon circles (`resolveCategoryVisual`), `formatMoney`, `formatDate`, and inline `CategoryCell`.
   - Desktop (`hidden lg:block`) 6-column table (`Date`, `Merchant & Description`, `Account`, `Category`, `IRS / Rule Status` showing factual rule match or IRS/income category name without `%`, and `Amount` with native + reporting currency equivalent).

- [ ] **Step 2: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Compare against `02 — Transactions` (`e0l352`), `02b — Add Transaction` (`p6zC92`), and `02c — Transactions (Desktop)` (`B0VPVS`).

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/transactions/page.tsx app/\(app\)/transactions/_components/
git commit -m "feat(transactions): redesign Transactions screen, filters, CategoryCell, and batch undo"
```

---

### Task 4: CSV Import 4-Step Flow (`03-Import / 1–4`)

**Files:**
- Modify: `app/(app)/transactions/import/page.tsx`
- Modify: `app/(app)/transactions/import/_components/ImportStepper.tsx`
- Modify: `app/(app)/transactions/import/_components/UploadStep.tsx`
- Modify: `app/(app)/transactions/import/_components/MapStep.tsx`
- Modify: `app/(app)/transactions/import/_components/PreviewStep.tsx`
- Modify: `app/(app)/transactions/import/_components/ConfirmStep.tsx`

- [ ] **Step 1: Redesign `import/page.tsx`, `ImportStepper.tsx`, `UploadStep.tsx`, `MapStep.tsx`, `PreviewStep.tsx`, and `ConfirmStep.tsx`**

1. `import/page.tsx`:
   - Fetch active `accounts` (with computed balances), `categories`, `category_rules`, and the 5 most recent completed `import_batches` (joined with `accounts(name)`).
2. `ImportStepper.tsx`:
   - Wrap the 4 steps in `ScreenHero` with dynamic step pill (`Step {step + 1} of 4 · ...`), step headline, and subtitle, plus a desktop step progress bar (`hidden lg:flex`).
   - Track `fileName` in `StepData` and pass `fileName`, `rules`, and `recentBatches` down to the steps.
3. `UploadStep.tsx` (`03-1`):
   - Filled `Select` for `Target Account`, dashed `#F4F5F7` (`bg-canvas`) Dropzone card, Recent Import Batches cards with `"Undo batch"` (confirm → `deleteImportBatch`), and `size="lg" fullWidth` primary `Button` (`"Continue to column mapping"`).
4. `MapStep.tsx` (`03-2`):
   - Format detection badge + `#F4F5F7` (`bg-canvas`) column mapping cards populated with live sample values from `rows[0]`, plus `Back` and `Preview {count} rows` buttons.
5. `PreviewStep.tsx` (`03-3`):
   - Summary pill (`{autoCount} auto-categorised · {transferCount} transfers · {dupCount} duplicate(s) skipped`).
   - Uses `findMatchingRule(row, rules)` and `getCategoryId` to display factual rule/category badges (`Auto-rule "{match_text}" → {Category}` or `Transfer · Excluded from spend`, no IRS `%`).
   - Mobile `#F4F5F7` selectable cards (`lg:hidden`) and desktop table (`hidden lg:block`).
6. `ConfirmStep.tsx` (`03-4`):
   - Pre-import summary cards + `"Confirm & import {count} rows"` button calling `importBatch(accountId, selectedRows, categoryIdMap, fileName)`.
   - Post-import completion view matching `03-4` (`"Import successful!"`, Batch ID & filename card, Categorised by Rules count card, Reversibility card, `"Undo batch immediately"` action card calling `deleteImportBatch(batchId)`, and `"Back to Transactions"` primary CTA).

- [ ] **Step 2: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Compare against `03-Import / 1-Upload` (`ECVf7`), `03-Import / 2-Map` (`E156wg`), `03-Import / 3-Preview` (`AYM97`), and `03-Import / 4-Confirm` (`wd8rr`).

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/transactions/import/
git commit -m "feat(import): redesign 4-step CSV Import flow with rule preview and batch undo"
```

---

### Task 5: Settings & Account Screens (`09 — Settings & Account`)

**Files:**
- Modify: `app/(app)/settings/page.tsx`
- Modify: `app/(app)/settings/_components/SettingsForm.tsx`
- Modify: `app/(app)/settings/_components/RulesSection.tsx`
- Modify: `app/(app)/settings/_components/CategoriesSection.tsx`
- Create: `app/(app)/settings/_components/AccountSecuritySection.tsx`
- Modify: `app/(app)/account/page.tsx`
- Modify: `app/(app)/account/_components/ChangePasswordForm.tsx`

- [ ] **Step 1: Redesign `settings/page.tsx`, `SettingsForm.tsx`, `RulesSection.tsx`, `CategoriesSection.tsx`, `AccountSecuritySection.tsx`, and `account/page.tsx`**

1. `settings/page.tsx`:
   - Render `ScreenHero` with `title={t('title')}`, `eyebrow={t('heroEyebrow')}`, `metric={user?.email ?? '—'}`, `subtitle={t('heroSubtitle')}`.
   - Render `SettingsForm`, `RulesSection`, `CategoriesSection`, and `AccountSecuritySection`.
2. `SettingsForm.tsx`:
   - `#F4F5F7` (`bg-canvas lg:bg-surface`) preference cards for `Reporting Currency` and `App Language (i18n)` matching `09`, with filled `Select`s and primary `Button`.
3. `RulesSection.tsx`:
   - Header with active rules count (`{count} rules`) and `"Re-run all"` button (`rerunRules` from `@/app/(app)/transactions/_components/actions`).
   - Mobile `#F4F5F7` rule cards (`lg:hidden`) and desktop table (`hidden lg:block`), plus inline `"Add rule"` form using filled `Input`, `Select`, and `Button`.
4. `CategoriesSection.tsx`:
   - Mobile `#F4F5F7` category cards (`lg:hidden`) and desktop table (`hidden lg:block`) with filled `Select`s for `irs_deduction` and `income_type` and primary `Save categories` `Button`.
5. `AccountSecuritySection.tsx` & `ChangePasswordForm.tsx` & `account/page.tsx`:
   - Redesign `ChangePasswordForm.tsx` using filled `Input`s and `Button`.
   - Create `AccountSecuritySection.tsx` combining `ChangePasswordForm` and the `signOut` action card.
   - Update `app/(app)/account/page.tsx` to use `ScreenHero` + `AccountSecuritySection`.

- [ ] **Step 2: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Compare against `09 — Settings & Account` (`G7DXf1`).

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/settings/ app/\(app\)/account/
git commit -m "feat(settings): redesign Settings, RulesSection, CategoriesSection, and Account screens"
```

---

### Task 6: Remove Legacy `@theme` Alias Tokens & Final Sweep

**Files:**
- Modify: `app/(app)/net-worth/_components/NetWorthChart.tsx`
- Modify: `app/(app)/net-worth/_components/BreakdownTable.tsx`
- Modify: `app/(app)/net-worth/_components/SnapshotHistory.tsx`
- Modify: `components/ui/LoadingSpinner.tsx`
- Modify: `components/layout/PageHeader.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace remaining legacy token usages and delete legacy alias block from `app/globals.css`**

1. Replace `text-text-primary` with `text-ink` in `NetWorthChart.tsx`, `BreakdownTable.tsx`, and `SnapshotHistory.tsx`.
2. Update `components/ui/LoadingSpinner.tsx` to use `border-separator border-t-teal`.
3. Update `components/layout/PageHeader.tsx` to use `border-separator bg-surface text-ink`.
4. Remove the `/* Backwards-compatible legacy aliases */` block (`--color-sidebar-bg` through `--color-good-icon-bg`) from `app/globals.css`.
5. Run `grep` across `app/` and `components/` to confirm zero occurrences of any legacy alias token name remain.

- [ ] **Step 2: Run full verification suite (`tsc`, `vitest`, Playwright screenshots)**

Run:
```bash
npx --prefix .worktrees/feat-redesign tsc --noEmit -p .worktrees/feat-redesign/tsconfig.json
npm --prefix .worktrees/feat-redesign run test:run
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css app/\(app\)/net-worth/_components/ components/ui/LoadingSpinner.tsx components/layout/PageHeader.tsx
git commit -m "refactor(tokens): remove legacy @theme alias tokens after Wave 2 migration"
```
