# Category Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a merchant→category rule engine: auto-categorise Revolut imports, inline category editing in the transaction list with an "always categorise" prompt, bulk re-run, and a Rules section in Settings.

**Architecture:** A pure `lib/category-rules.ts` module handles all matching logic (no Supabase). Server actions in `transactions/actions.ts` handle saving, counting matches, and backfilling. `TransactionTable.tsx` becomes the client component that owns all interactive state (overrides, prompt, status). `RulesSection.tsx` handles CRUD in Settings.

**Tech Stack:** Next.js 16.3.5 App Router, React 19, Supabase (`await createClient()`), Tailwind v4 tokens, `next-intl` (EN + PT-PT with ICU plurals), Vitest 5.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `lib/category-rules.ts` | Create | Pure: `normalise`, `matchTarget`, `applyRules` |
| `tests/lib/category-rules.test.ts` | Create | 14 unit tests |
| `schema.sql` | Modify | Add `category_rules` table + RLS |
| `types/database.ts` | Modify | Add `CategoryRule` type |
| `messages/en.json` | Modify | Add `CategoryRules` namespace |
| `messages/pt-PT.json` | Modify | Add `CategoryRules` namespace |
| `app/(app)/transactions/_components/actions.ts` | Modify | Add `setTransactionCategory`, `createCategoryRule`, `rerunRules`; update `importBatch` |
| `app/(app)/transactions/_components/CategoryCell.tsx` | Create | Inline category editor |
| `app/(app)/transactions/_components/TransactionTable.tsx` | Modify | Client component with state + CategoryCell + prompt bar |
| `app/(app)/transactions/page.tsx` | Modify | Fetch `hasRules` + pass categories to table |
| `app/(app)/settings/actions.ts` | Modify | Add `addRule`, `deleteRule`, `updateRuleCategory` |
| `app/(app)/settings/_components/RulesSection.tsx` | Create | Rules CRUD card |
| `app/(app)/settings/page.tsx` | Modify | Fetch rules; add `RulesSection` |

---

### Task 1: Pure matching utility (TDD)

**Files:**
- Create: `lib/category-rules.ts`
- Create: `tests/lib/category-rules.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/category-rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { normalise, matchTarget, applyRules } from '@/lib/category-rules'

function makeRule(overrides?: Partial<{
  match_key: string
  match_type: 'equals' | 'contains'
  category_id: string
  created_at: string
}>) {
  return {
    match_key: 'uber',
    match_type: 'equals' as const,
    category_id: 'cat-1',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('normalise', () => {
  it('strips accents', () => expect(normalise('Lusíadas')).toBe('lusiadas'))
  it('lowercases', () => expect(normalise('UBER')).toBe('uber'))
  it('trims whitespace', () => expect(normalise('  hello  ')).toBe('hello'))
})

describe('applyRules', () => {
  it('returns null when rules are empty', () => {
    expect(applyRules({ merchant: 'Uber', description: null }, [])).toBeNull()
  })
  it('returns null when both merchant and description are null', () => {
    expect(applyRules({ merchant: null, description: null }, [makeRule()])).toBeNull()
  })
  it('equals match returns correct category_id', () => {
    expect(
      applyRules({ merchant: 'Uber', description: null }, [
        makeRule({ match_key: 'uber', match_type: 'equals', category_id: 'cat-transport' }),
      ])
    ).toBe('cat-transport')
  })
  it('contains match — "uber" rule matches "Uber Eats"', () => {
    expect(
      applyRules({ merchant: 'Uber Eats', description: null }, [
        makeRule({ match_key: 'uber', match_type: 'contains', category_id: 'cat-food' }),
      ])
    ).toBe('cat-food')
  })
  it('equals beats contains when both match', () => {
    expect(
      applyRules({ merchant: 'Uber Eats', description: null }, [
        makeRule({ match_key: 'uber eats', match_type: 'contains', category_id: 'cat-food' }),
        makeRule({ match_key: 'uber eats', match_type: 'equals', category_id: 'cat-transport' }),
      ])
    ).toBe('cat-transport')
  })
  it('longer match_key wins among contains matches', () => {
    expect(
      applyRules({ merchant: 'Uber Eats', description: null }, [
        makeRule({ match_key: 'uber', match_type: 'contains', category_id: 'cat-transport' }),
        makeRule({ match_key: 'uber eats', match_type: 'contains', category_id: 'cat-food' }),
      ])
    ).toBe('cat-food')
  })
  it('newer created_at wins when match_key length is equal', () => {
    expect(
      applyRules({ merchant: 'Uber', description: null }, [
        makeRule({ match_key: 'uber', match_type: 'contains', category_id: 'cat-old', created_at: '2026-01-01T00:00:00Z' }),
        makeRule({ match_key: 'uber', match_type: 'contains', category_id: 'cat-new', created_at: '2026-06-01T00:00:00Z' }),
      ])
    ).toBe('cat-new')
  })
  it('uses merchant over description when both present', () => {
    expect(
      applyRules({ merchant: 'Merchant Co', description: 'Desc Co' }, [
        makeRule({ match_key: 'merchant co', match_type: 'equals', category_id: 'cat-merchant' }),
        makeRule({ match_key: 'desc co', match_type: 'equals', category_id: 'cat-desc' }),
      ])
    ).toBe('cat-merchant')
  })
  it('falls back to description when merchant is null', () => {
    expect(
      applyRules({ merchant: null, description: 'Desc Co' }, [
        makeRule({ match_key: 'desc co', match_type: 'equals', category_id: 'cat-desc' }),
      ])
    ).toBe('cat-desc')
  })
  it('is accent-insensitive', () => {
    expect(
      applyRules({ merchant: 'Café Central', description: null }, [
        makeRule({ match_key: 'cafe', match_type: 'contains', category_id: 'cat-cafe' }),
      ])
    ).toBe('cat-cafe')
  })
  it('empty-string merchant falls back to description', () => {
    expect(
      applyRules({ merchant: '', description: 'Desc Co' }, [
        makeRule({ match_key: 'desc co', match_type: 'equals', category_id: 'cat-desc' }),
      ])
    ).toBe('cat-desc')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/satoridigital/Development/2026/00_PERSONAL_WORK/norte/finance-tracker
npx vitest run tests/lib/category-rules.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/category-rules'`

- [ ] **Step 3: Implement `lib/category-rules.ts`**

```ts
export function normalise(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function matchTarget(tx: { merchant: string | null; description: string | null }): string | null {
  const target = tx.merchant?.trim() || tx.description
  return target || null
}

type Rule = {
  match_key: string
  match_type: 'equals' | 'contains'
  category_id: string
  created_at: string
}

export function applyRules(
  tx: { merchant: string | null; description: string | null },
  rules: Rule[]
): string | null {
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

  return matches[0].category_id
}
```

- [ ] **Step 4: Run tests to confirm all 13 pass**

```bash
npx vitest run tests/lib/category-rules.test.ts
```

Expected: PASS — 13 tests (3 normalise + 10 applyRules + empty-string merchant = 11 applyRules total = 14 total)

- [ ] **Step 5: Commit**

```bash
git add lib/category-rules.ts tests/lib/category-rules.test.ts
git commit -m "feat: add category-rules pure matching utility with tests"
```

---

### Task 2: DB migration + types

**Files:**
- Modify: `schema.sql`
- Modify: `types/database.ts`

- [ ] **Step 1: Run migration in Supabase SQL Editor**

Navigate to your Supabase project → SQL Editor, paste and run:

```sql
create table category_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) default auth.uid(),
  match_text  text not null,
  match_key   text not null,
  match_type  text not null check (match_type in ('contains', 'equals')),
  category_id uuid not null references categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, match_type, match_key)
);

alter table category_rules enable row level security;
create policy "owner access" on category_rules
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

Expected: no error.

- [ ] **Step 2: Mirror in `schema.sql`**

After the `exchange_rates` table definition (before the `-- ========== Phase 2` comment), add:

```sql
create table category_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) default auth.uid(),
  match_text  text not null,
  match_key   text not null,
  match_type  text not null check (match_type in ('contains', 'equals')),
  category_id uuid not null references categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, match_type, match_key)
);
```

Also add `'category_rules'` to the RLS loop array at the bottom of `schema.sql`:

```sql
-- Change this line:
  for t in select unnest(array['accounts','categories','import_batches','transactions',
                          'budgets','recurring_bills','holdings',
                          'holding_price_history','net_worth_snapshots'])
-- To:
  for t in select unnest(array['accounts','categories','import_batches','transactions',
                          'budgets','recurring_bills','category_rules','holdings',
                          'holding_price_history','net_worth_snapshots'])
```

- [ ] **Step 3: Add `CategoryRule` type to `types/database.ts`**

After the `ExchangeRate` type definition, add:

```ts
export type CategoryRule = {
  id: string
  user_id: string
  match_text: string
  match_key: string
  match_type: 'equals' | 'contains'
  category_id: string
  created_at: string
}
```

Also add to `Database.public.Tables` (after `exchange_rates`):

```ts
category_rules: {
  Row: CategoryRule
  Insert: Omit<CategoryRule, 'id' | 'created_at'>
  Update: Partial<Omit<CategoryRule, 'id'>>
  Relationships: []
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add schema.sql types/database.ts
git commit -m "feat: add category_rules table, RLS, and CategoryRule type"
```

---

### Task 3: i18n strings

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/pt-PT.json`

- [ ] **Step 1: Add `CategoryRules` to `messages/en.json`**

Add before the closing `}` of the JSON (after the `"Settings"` key):

```json
"CategoryRules": {
  "title": "Categorisation Rules",
  "noRules": "No rules yet. Set a category on a transaction to create one.",
  "deleteHint": "Deleting a rule doesn't change transactions that have already been categorised.",
  "matchText": "Matches",
  "matchType": "Type",
  "category": "Category",
  "createdAt": "Created",
  "deleteRule": "Delete",
  "matchTypes": { "equals": "Equals", "contains": "Contains" },
  "addRule": "Add rule",
  "matchTextPlaceholder": "e.g. Uber",
  "saved": "Rule saved",
  "deleted": "Rule deleted",
  "prompt": {
    "create": "Always categorise '{merchant}' as {category}?",
    "update": "Update rule for '{merchant}' to {category}?",
    "matches": "Also applies to {count, plural, one {# other uncategorised transaction} other {# other uncategorised transactions}}.",
    "noMatches": "Future imports with this merchant will be categorised automatically.",
    "createRule": "Create rule",
    "updateRule": "Update rule",
    "skip": "Skip",
    "ruleCreated": "Rule created. {count, plural, one {# transaction categorised} other {# transactions categorised}}.",
    "ruleUpdated": "Rule updated. {count, plural, one {# transaction categorised} other {# transactions categorised}}."
  },
  "bulkAction": "Categorise uncategorised",
  "bulkResult": "{count, plural, one {# transaction categorised} other {# transactions categorised}}.",
  "bulkNone": "No matching rules found.",
  "error": "Something went wrong"
}
```

- [ ] **Step 2: Add `CategoryRules` to `messages/pt-PT.json`**

```json
"CategoryRules": {
  "title": "Regras de Categorização",
  "noRules": "Sem regras. Defina uma categoria numa transação para criar uma.",
  "deleteHint": "Eliminar uma regra não altera as transações já categorizadas.",
  "matchText": "Corresponde a",
  "matchType": "Tipo",
  "category": "Categoria",
  "createdAt": "Criada",
  "deleteRule": "Eliminar",
  "matchTypes": { "equals": "Igual a", "contains": "Contém" },
  "addRule": "Adicionar regra",
  "matchTextPlaceholder": "ex.: Uber",
  "saved": "Regra guardada",
  "deleted": "Regra eliminada",
  "prompt": {
    "create": "Categorizar sempre '{merchant}' como {category}?",
    "update": "Atualizar a regra de '{merchant}' para {category}?",
    "matches": "Aplica-se também a {count, plural, one {# outra transação não categorizada} other {# outras transações não categorizadas}}.",
    "noMatches": "As importações futuras com este comerciante serão categorizadas automaticamente.",
    "createRule": "Criar regra",
    "updateRule": "Atualizar regra",
    "skip": "Ignorar",
    "ruleCreated": "Regra criada. {count, plural, one {# transação categorizada} other {# transações categorizadas}}.",
    "ruleUpdated": "Regra atualizada. {count, plural, one {# transação categorizada} other {# transações categorizadas}}."
  },
  "bulkAction": "Categorizar não categorizadas",
  "bulkResult": "{count, plural, one {# transação categorizada} other {# transações categorizadas}}.",
  "bulkNone": "Nenhuma regra correspondente encontrada.",
  "error": "Algo correu mal"
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/pt-PT.json
git commit -m "feat: add CategoryRules i18n strings (EN + PT-PT) with ICU plurals"
```

---

### Task 4: Transaction server actions

**Files:**
- Modify: `app/(app)/transactions/_components/actions.ts`

- [ ] **Step 1: Add imports and exported types at the top of `actions.ts`**

Replace the existing imports block with:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { NormalisedRow } from '@/lib/csv/normalize'
import { normalise, matchTarget, applyRules } from '@/lib/category-rules'

export type SetCategoryResult = {
  matchText: string
  matchKey: string
  matchCount: number
  existingRule: boolean
}
```

- [ ] **Step 2: Update `importBatch` to apply rules**

In `importBatch`, before the `const transactions = rows.map(...)` line, add the rules fetch:

```ts
  const { data: rules } = await supabase
    .from('category_rules')
    .select('match_key, match_type, category_id, created_at')
    .eq('user_id', user.id)
```

Then replace the `category_id` line inside `rows.map`:

```ts
// Before:
category_id: row.raw_category ? (categoryIdMap[row.raw_category] ?? null) : null,

// After:
category_id: row.raw_category
  ? (categoryIdMap[row.raw_category] ?? applyRules({ merchant: row.merchant, description: row.description }, rules ?? []) ?? null)
  : (applyRules({ merchant: row.merchant, description: row.description }, rules ?? []) ?? null),
```

- [ ] **Step 3: Add `setTransactionCategory` action**

After `importBatch`, add:

```ts
export async function setTransactionCategory(
  txId: string,
  categoryId: string | null,
  matchText: string,
): Promise<{ data: SetCategoryResult | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .eq('id', txId)
    .eq('user_id', user.id)
  if (error) return { data: null, error: error.message }

  if (!matchText) return { data: { matchText: '', matchKey: '', matchCount: 0, existingRule: false } }

  const matchKey = normalise(matchText)

  const [{ data: uncategorised }, { data: existing }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, merchant, description')
      .is('category_id', null)
      .eq('is_transfer', false)
      .neq('id', txId)
      .eq('user_id', user.id),
    supabase
      .from('category_rules')
      .select('id')
      .eq('user_id', user.id)
      .eq('match_type', 'equals')
      .eq('match_key', matchKey)
      .maybeSingle(),
  ])

  const matchCount = (uncategorised ?? []).filter(tx => {
    const target = matchTarget(tx)
    return target ? normalise(target) === matchKey : false
  }).length

  return { data: { matchText, matchKey, matchCount, existingRule: !!existing } }
}
```

- [ ] **Step 4: Add `createCategoryRule` action**

```ts
export async function createCategoryRule(
  matchText: string,
  matchKey: string,
  matchType: 'equals' | 'contains',
  categoryId: string,
): Promise<{ wasUpdate: boolean; backfillCount: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { wasUpdate: false, backfillCount: 0, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('category_rules')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_type', matchType)
    .eq('match_key', matchKey)
    .maybeSingle()
  const wasUpdate = !!existing

  const { error: upsertError } = await supabase
    .from('category_rules')
    .upsert(
      { user_id: user.id, match_text: matchText, match_key: matchKey, match_type: matchType, category_id: categoryId },
      { onConflict: 'user_id,match_type,match_key' }
    )
  if (upsertError) return { wasUpdate, backfillCount: 0, error: upsertError.message }

  const { data: uncategorised } = await supabase
    .from('transactions')
    .select('id, merchant, description')
    .is('category_id', null)
    .eq('is_transfer', false)
    .eq('user_id', user.id)

  const ids = (uncategorised ?? [])
    .filter(tx => {
      const target = matchTarget(tx)
      return target ? normalise(target) === matchKey : false
    })
    .map(tx => tx.id)

  if (ids.length === 0) {
    revalidatePath('/transactions')
    return { wasUpdate, backfillCount: 0 }
  }

  const BATCH = 100
  let backfillCount = 0
  for (let i = 0; i < ids.length; i += BATCH) {
    const { error } = await supabase
      .from('transactions')
      .update({ category_id: categoryId })
      .in('id', ids.slice(i, i + BATCH))
      .eq('user_id', user.id)
    if (!error) backfillCount += Math.min(BATCH, ids.length - i)
  }

  revalidatePath('/transactions')
  return { wasUpdate, backfillCount }
}
```

- [ ] **Step 5: Add `rerunRules` action**

```ts
export async function rerunRules(): Promise<{ count: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { count: 0, error: 'Not authenticated' }

  const [{ data: rules }, { data: uncategorised }] = await Promise.all([
    supabase
      .from('category_rules')
      .select('match_key, match_type, category_id, created_at'),
    supabase
      .from('transactions')
      .select('id, merchant, description')
      .is('category_id', null)
      .eq('is_transfer', false)
      .eq('user_id', user.id),
  ])

  if (!rules?.length || !uncategorised?.length) return { count: 0 }

  const byCategory = new Map<string, string[]>()
  for (const tx of uncategorised) {
    const catId = applyRules(tx, rules)
    if (catId) {
      const existing = byCategory.get(catId) ?? []
      existing.push(tx.id)
      byCategory.set(catId, existing)
    }
  }

  if (byCategory.size === 0) return { count: 0 }

  const BATCH = 100
  let total = 0
  for (const [catId, ids] of byCategory) {
    for (let i = 0; i < ids.length; i += BATCH) {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: catId })
        .in('id', ids.slice(i, i + BATCH))
        .eq('user_id', user.id)
      if (!error) total += Math.min(BATCH, ids.length - i)
    }
  }

  revalidatePath('/transactions')
  return { count: total }
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/transactions/_components/actions.ts
git commit -m "feat: add setTransactionCategory, createCategoryRule, rerunRules; wire rules into importBatch"
```

---

### Task 5: CategoryCell component

**Files:**
- Create: `app/(app)/transactions/_components/CategoryCell.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { setTransactionCategory } from './actions'
import type { SetCategoryResult } from './actions'
import type { Category } from '@/types/database'
import { matchTarget as computeMatchTarget } from '@/lib/category-rules'

type Props = {
  txId: string
  merchant: string | null
  description: string | null
  categoryId: string | null
  categoryName: string | null
  categories: Pick<Category, 'id' | 'name'>[]
  onOptimisticUpdate: (txId: string, categoryId: string | null) => void
  onSaved: (newCategoryId: string | null, result: SetCategoryResult) => void
  onEditStart: () => void
}

const selectClass =
  'rounded border border-border-col bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60'

export function CategoryCell({
  txId,
  merchant,
  description,
  categoryId,
  categoryName,
  categories,
  onOptimisticUpdate,
  onSaved,
  onEditStart,
}: Props) {
  const t = useTranslations('Transactions')
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (!editing) {
    return (
      <button
        onClick={() => { onEditStart(); setEditing(true); setLocalError(null) }}
        className="text-left"
      >
        {categoryName ? (
          <StatusBadge label={categoryName} color="accent" />
        ) : (
          <span className="text-sm text-text-tertiary">—</span>
        )}
      </button>
    )
  }

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value || null
    const originalId = categoryId
    const matchText = computeMatchTarget({ merchant, description }) ?? ''

    setLocalError(null)
    setPending(true)
    onOptimisticUpdate(txId, newId)

    const result = await setTransactionCategory(txId, newId, matchText)

    setPending(false)

    if (result.error || !result.data) {
      onOptimisticUpdate(txId, originalId)
      setLocalError(result.error ?? 'Error')
      return
    }

    setEditing(false)
    onSaved(newId, result.data)
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        autoFocus
        defaultValue={categoryId ?? ''}
        onChange={handleChange}
        disabled={pending}
        className={selectClass}
      >
        <option value="">{t('form.noCategory')}</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      {localError && (
        <span className="text-xs text-status-danger">{localError}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/transactions/_components/CategoryCell.tsx
git commit -m "feat: add CategoryCell inline category editor"
```

---

### Task 6: TransactionTable → client component with state

**Files:**
- Modify: `app/(app)/transactions/_components/TransactionTable.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CategoryCell } from './CategoryCell'
import { createCategoryRule, rerunRules } from './actions'
import type { SetCategoryResult } from './actions'
import type { Transaction, Account, Category } from '@/types/database'
import { formatDate } from '@/lib/utils'

type TxWithRelations = Transaction & {
  accounts: Pick<Account, 'name'> | null
  categories: Pick<Category, 'name'> | null
}

type Prompt = {
  txId: string
  matchText: string
  matchKey: string
  categoryId: string
  categoryName: string
  matchCount: number
  existingRule: boolean
}

type Props = {
  transactions: TxWithRelations[]
  categories: Pick<Category, 'id' | 'name'>[]
  hasRules: boolean
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function TransactionTable({ transactions, categories, hasRules }: Props) {
  const tTx = useTranslations('Transactions')
  const tCR = useTranslations('CategoryRules')

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string | null>>({})
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [rulePending, startRuleTransition] = useTransition()
  const [bulkPending, startBulkTransition] = useTransition()

  useEffect(() => {
    if (!statusMessage) return
    const id = setTimeout(() => setStatusMessage(null), 4000)
    return () => clearTimeout(id)
  }, [statusMessage])

  if (transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        {tTx('noTransactions')}
      </div>
    )
  }

  function handleOptimisticUpdate(txId: string, newCategoryId: string | null) {
    setCategoryOverrides(prev => ({ ...prev, [txId]: newCategoryId }))
  }

  function handleSaved(txId: string, newCategoryId: string | null, result: SetCategoryResult) {
    if (!newCategoryId || !result.matchText) {
      setPrompt(null)
      return
    }
    const catName = categories.find(c => c.id === newCategoryId)?.name ?? ''
    setPrompt({
      txId,
      matchText: result.matchText,
      matchKey: result.matchKey,
      categoryId: newCategoryId,
      categoryName: catName,
      matchCount: result.matchCount,
      existingRule: result.existingRule,
    })
  }

  function handleCreateRule() {
    if (!prompt) return
    startRuleTransition(async () => {
      const result = await createCategoryRule(
        prompt.matchText,
        prompt.matchKey,
        'equals',
        prompt.categoryId,
      )
      if (result.error) {
        setStatusMessage({ type: 'error', text: tCR('error') })
        return
      }
      setCategoryOverrides({})
      setPrompt(null)
      const msgKey = result.wasUpdate ? 'prompt.ruleUpdated' : 'prompt.ruleCreated'
      setStatusMessage({ type: 'success', text: tCR(msgKey, { count: result.backfillCount }) })
    })
  }

  function handleBulk() {
    startBulkTransition(async () => {
      const result = await rerunRules()
      if (result.error) {
        setStatusMessage({ type: 'error', text: tCR('error') })
        return
      }
      setCategoryOverrides({})
      if (result.count === 0) {
        setStatusMessage({ type: 'error', text: tCR('bulkNone') })
      } else {
        setStatusMessage({ type: 'success', text: tCR('bulkResult', { count: result.count }) })
      }
    })
  }

  function getEffectiveCategoryId(tx: TxWithRelations): string | null {
    return tx.id in categoryOverrides ? categoryOverrides[tx.id] : tx.category_id
  }

  function getEffectiveCategoryName(tx: TxWithRelations): string | null {
    const id = getEffectiveCategoryId(tx)
    if (!id) return null
    return categories.find(c => c.id === id)?.name ?? tx.categories?.name ?? null
  }

  function PromptBar({ p }: { p: Prompt }) {
    const isUpdate = p.existingRule
    const leadText = isUpdate
      ? tCR('prompt.update', { merchant: p.matchText, category: p.categoryName })
      : tCR('prompt.create', { merchant: p.matchText, category: p.categoryName })
    const extraText = p.matchCount > 0
      ? tCR('prompt.matches', { count: p.matchCount })
      : tCR('prompt.noMatches')
    const btnLabel = isUpdate ? tCR('prompt.updateRule') : tCR('prompt.createRule')

    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-content-bg px-4 py-2.5 text-sm text-text-primary">
        <span className="flex-1">{leadText} {extraText}</span>
        <div className="flex gap-2">
          <button
            onClick={handleCreateRule}
            disabled={rulePending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {rulePending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
            {btnLabel}
          </button>
          <button
            onClick={() => setPrompt(null)}
            className="rounded-lg border border-border-col px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-card-bg"
          >
            {tCR('prompt.skip')}
          </button>
        </div>
      </div>
    )
  }

  const toolbar = (
    <div className="flex items-center justify-between gap-4 flex-wrap min-h-[36px]">
      {statusMessage ? (
        <div
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-3 py-2 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-good-bg text-status-good'
              : 'bg-danger-bg text-status-danger'
          }`}
        >
          {statusMessage.text}
        </div>
      ) : (
        <div />
      )}
      {hasRules && (
        <button
          onClick={handleBulk}
          disabled={bulkPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border-col bg-card-bg px-4 py-2 text-sm font-medium text-text-primary hover:bg-content-bg disabled:opacity-60"
        >
          {bulkPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {tCR('bulkAction')}
        </button>
      )}
    </div>
  )

  return (
    <>
      {toolbar}

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-border-col rounded-xl border border-border-col bg-card-bg">
        {transactions.map(tx => (
          <React.Fragment key={tx.id}>
            <div className="flex flex-col gap-1.5 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">{formatDate(tx.occurred_on)}</span>
                <span className={`text-sm font-medium tabular-nums ${Number(tx.amount) >= 0 ? 'text-status-good' : 'text-status-danger'}`}>
                  {formatAmount(Number(tx.amount), tx.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-text-primary">
                  {tx.merchant ?? tx.description ?? '—'}
                  {tx.source === 'csv_import' && (
                    <span className="ml-1.5 rounded bg-accent-light px-1.5 py-0.5 text-xs text-accent">
                      {tTx('importBadge')}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-text-secondary">{tx.accounts?.name ?? '—'}</span>
              </div>
              <div>
                {tx.is_transfer ? (
                  <StatusBadge label={tTx('transferBadge')} color="neutral" />
                ) : (
                  <CategoryCell
                    txId={tx.id}
                    merchant={tx.merchant}
                    description={tx.description}
                    categoryId={getEffectiveCategoryId(tx)}
                    categoryName={getEffectiveCategoryName(tx)}
                    categories={categories}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    onSaved={(newId, result) => handleSaved(tx.id, newId, result)}
                    onEditStart={() => setPrompt(null)}
                  />
                )}
              </div>
            </div>
            {prompt?.txId === tx.id && (
              <div className="border-t border-border-col px-4 py-3">
                <PromptBar p={prompt} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-border-col bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-3 text-left">{tTx('date')}</th>
              <th className="px-4 py-3 text-left">{tTx('description')}</th>
              <th className="px-4 py-3 text-left">{tTx('category')}</th>
              <th className="px-4 py-3 text-left">{tTx('account')}</th>
              <th className="px-4 py-3 text-right">{tTx('amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-col">
            {transactions.map(tx => (
              <React.Fragment key={tx.id}>
                <tr className="hover:bg-content-bg">
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {formatDate(tx.occurred_on)}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {tx.merchant ?? tx.description ?? '—'}
                    {tx.source === 'csv_import' && (
                      <span className="ml-2 rounded bg-accent-light px-1.5 py-0.5 text-xs text-accent">
                        {tTx('importBadge')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tx.is_transfer ? (
                      <StatusBadge label={tTx('transferBadge')} color="neutral" />
                    ) : (
                      <CategoryCell
                        txId={tx.id}
                        merchant={tx.merchant}
                        description={tx.description}
                        categoryId={getEffectiveCategoryId(tx)}
                        categoryName={getEffectiveCategoryName(tx)}
                        categories={categories}
                        onOptimisticUpdate={handleOptimisticUpdate}
                        onSaved={(newId, result) => handleSaved(tx.id, newId, result)}
                        onEditStart={() => setPrompt(null)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{tx.accounts?.name ?? '—'}</td>
                  <td className={`px-4 py-3 text-right font-medium tabular-nums ${Number(tx.amount) >= 0 ? 'text-status-good' : 'text-status-danger'}`}>
                    {formatAmount(Number(tx.amount), tx.currency)}
                  </td>
                </tr>
                {prompt?.txId === tx.id && (
                  <tr>
                    <td colSpan={5} className="px-4 pb-3 pt-0">
                      <PromptBar p={prompt} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/transactions/_components/TransactionTable.tsx
git commit -m "feat: convert TransactionTable to client component with CategoryCell, prompt bar, and bulk action"
```

---

### Task 7: Transactions page update

**Files:**
- Modify: `app/(app)/transactions/page.tsx`

- [ ] **Step 1: Add `hasRules` fetch and pass new props to TransactionTable**

Replace the entire file content:

```tsx
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { TransactionTable } from './_components/TransactionTable'
import { TransactionFilters } from './_components/TransactionFilters'
import { TransactionSummary } from './_components/TransactionSummary'
import { AddTransactionDrawer } from './_components/AddTransactionDrawer'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

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

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const t = await getTranslations('Transactions')
  const params = await searchParams
  const defaults = defaultDateRange()
  const from = params.from ?? defaults.from
  const to   = params.to   ?? defaults.to

  const [accountsResult, categoriesResult, rulesCountResult] = await Promise.all([
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('*').order('name'),
    supabase.from('category_rules').select('id', { count: 'exact', head: true }),
  ])

  let txQuery = supabase
    .from('transactions')
    .select('*, accounts(name), categories(name)')
    .gte('occurred_on', from)
    .lte('occurred_on', to)
    .order('occurred_on', { ascending: false })

  if (params.account)  txQuery = txQuery.eq('account_id', params.account)
  if (params.category) txQuery = txQuery.eq('category_id', params.category)
  if (params.q)        txQuery = txQuery.or(`description.ilike.%${params.q}%,merchant.ilike.%${params.q}%`)

  const { data: transactions } = await txQuery

  const accounts   = accountsResult.data   ?? []
  const categories = categoriesResult.data ?? []
  const hasRules   = (rulesCountResult.count ?? 0) > 0
  const txList     = (transactions ?? []) as Parameters<typeof TransactionTable>[0]['transactions']

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t('title')}
        actions={
          <div className="flex gap-2">
            <Link
              href="/transactions/import"
              className="flex items-center gap-2 rounded-lg border border-border-col bg-card-bg px-4 py-2 text-sm font-medium text-text-primary hover:bg-content-bg"
            >
              <Upload size={16} />
              {t('importCsv')}
            </Link>
            <AddTransactionDrawer accounts={accounts} categories={categories} />
          </div>
        }
      />
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <TransactionSummary transactions={txList} />
        <TransactionFilters
          accounts={accounts}
          categories={categories}
          currentAccount={params.account ?? ''}
          currentCategory={params.category ?? ''}
          currentFrom={from}
          currentTo={to}
        />
        <TransactionTable
          transactions={txList}
          categories={categories}
          hasRules={hasRules}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Smoke-test in the browser**

Start the dev server (`npm run dev`), navigate to `/transactions`. Verify:
- Transactions load
- Clicking a category badge opens a `<select>`
- Selecting a new category closes the select and shows the prompt bar
- "Create rule" button is visible in the prompt
- "Skip" dismisses the prompt

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/transactions/page.tsx
git commit -m "feat: wire TransactionTable with categories and hasRules props"
```

---

### Task 8: Settings actions

**Files:**
- Modify: `app/(app)/settings/actions.ts`

- [ ] **Step 1: Add imports at the top**

After the existing imports, add:

```ts
import { normalise } from '@/lib/category-rules'
```

- [ ] **Step 2: Add `addRule` at the end of the file**

```ts
export async function addRule(
  matchText: string,
  matchType: 'equals' | 'contains',
  categoryId: string,
): Promise<{ wasUpdate: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { wasUpdate: false, error: 'Not authenticated' }

  const matchKey = normalise(matchText)

  const { data: existing } = await supabase
    .from('category_rules')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_type', matchType)
    .eq('match_key', matchKey)
    .maybeSingle()
  const wasUpdate = !!existing

  const { error } = await supabase
    .from('category_rules')
    .upsert(
      { user_id: user.id, match_text: matchText, match_key: matchKey, match_type: matchType, category_id: categoryId },
      { onConflict: 'user_id,match_type,match_key' }
    )
  if (error) return { wasUpdate, error: error.message }

  revalidatePath('/settings')
  return { wasUpdate }
}

export async function deleteRule(ruleId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('category_rules')
    .delete()
    .eq('id', ruleId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  return {}
}

export async function updateRuleCategory(
  ruleId: string,
  categoryId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('category_rules')
    .update({ category_id: categoryId })
    .eq('id', ruleId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  return {}
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/settings/actions.ts
git commit -m "feat: add addRule, deleteRule, updateRuleCategory settings actions"
```

---

### Task 9: RulesSection component

**Files:**
- Create: `app/(app)/settings/_components/RulesSection.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { addRule, deleteRule, updateRuleCategory } from '../actions'
import type { Category } from '@/types/database'

type RuleRow = {
  id: string
  match_text: string
  match_type: 'equals' | 'contains'
  category_id: string
  created_at: string
  categories: { name: string } | null
}

type Props = {
  rules: RuleRow[]
  categories: Pick<Category, 'id' | 'name'>[]
}

const selectClass =
  'rounded-lg border border-border-col bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

export function RulesSection({ rules: initialRules, categories }: Props) {
  const t = useTranslations('CategoryRules')
  const [rules, setRules] = useState(initialRules)
  const [addStatus, setAddStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [addPending, startAddTransition] = useTransition()
  const [addMatchText, setAddMatchText] = useState('')
  const [addMatchType, setAddMatchType] = useState<'equals' | 'contains'>('equals')
  const [addCategoryId, setAddCategoryId] = useState('')

  // Sync with server-refreshed props (after revalidatePath)
  useEffect(() => { setRules(initialRules) }, [initialRules])

  async function handleDelete(ruleId: string) {
    const deleted = rules.find(r => r.id === ruleId)
    if (!deleted) return
    setRules(prev => prev.filter(r => r.id !== ruleId))
    const result = await deleteRule(ruleId)
    if (result.error) {
      setRules(prev =>
        [...prev, deleted].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      )
    }
  }

  async function handleUpdateCategory(ruleId: string, newCategoryId: string) {
    const originalRule = rules.find(r => r.id === ruleId)
    if (!originalRule) return
    const newCategoryName = categories.find(c => c.id === newCategoryId)?.name ?? ''
    setRules(prev =>
      prev.map(r =>
        r.id === ruleId ? { ...r, category_id: newCategoryId, categories: { name: newCategoryName } } : r
      )
    )
    const result = await updateRuleCategory(ruleId, newCategoryId)
    if (result.error) {
      setRules(prev =>
        prev.map(r => (r.id === ruleId ? originalRule : r))
      )
    }
  }

  function handleAdd() {
    if (!addMatchText.trim() || !addCategoryId) return
    startAddTransition(async () => {
      const result = await addRule(addMatchText.trim(), addMatchType, addCategoryId)
      if (result.error) {
        setAddStatus({ type: 'error', text: result.error })
      } else {
        setAddMatchText('')
        setAddStatus({ type: 'success', text: t('saved') })
      }
    })
  }

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('title')}</h2>

      {rules.length === 0 ? (
        <p className="mb-4 text-sm text-text-tertiary">{t('noRules')}</p>
      ) : (
        <>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-col text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="pb-2 pr-4 text-left">{t('matchText')}</th>
                  <th className="pb-2 pr-4 text-left">{t('matchType')}</th>
                  <th className="pb-2 pr-4 text-left">{t('category')}</th>
                  <th className="pb-2 pr-4 text-left">{t('createdAt')}</th>
                  <th className="pb-2 text-left" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-col">
                {rules.map(rule => (
                  <tr key={rule.id}>
                    <td className="py-2 pr-4 text-text-primary">{rule.match_text}</td>
                    <td className="py-2 pr-4 text-text-secondary">
                      {t(`matchTypes.${rule.match_type}`)}
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={rule.category_id}
                        onChange={e => handleUpdateCategory(rule.id, e.target.value)}
                        className={selectClass}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4 text-text-secondary whitespace-nowrap">
                      {new Date(rule.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-xs text-status-danger hover:underline"
                      >
                        {t('deleteRule')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mb-4 text-xs text-text-tertiary">{t('deleteHint')}</p>
        </>
      )}

      {/* Add rule form */}
      <div className="border-t border-border-col pt-4">
        <p className="mb-3 text-xs font-medium text-text-secondary uppercase tracking-wide">{t('addRule')}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={addMatchText}
              onChange={e => setAddMatchText(e.target.value)}
              placeholder={t('matchTextPlaceholder')}
              className="rounded-lg border border-border-col bg-white px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <select
            value={addMatchType}
            onChange={e => setAddMatchType(e.target.value as 'equals' | 'contains')}
            className={selectClass}
          >
            <option value="equals">{t('matchTypes.equals')}</option>
            <option value="contains">{t('matchTypes.contains')}</option>
          </select>
          <select
            value={addCategoryId}
            onChange={e => setAddCategoryId(e.target.value)}
            className={selectClass}
          >
            <option value="">— {t('category')} —</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={addPending || !addMatchText.trim() || !addCategoryId}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t('addRule')}
          </button>
        </div>
        {addStatus && (
          <div
            role={addStatus.type === 'error' ? 'alert' : 'status'}
            className={`mt-2 rounded-lg px-3 py-1.5 text-sm ${
              addStatus.type === 'success'
                ? 'bg-good-bg text-status-good'
                : 'bg-danger-bg text-status-danger'
            }`}
          >
            {addStatus.text}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/settings/_components/RulesSection.tsx
git commit -m "feat: add RulesSection component for settings rules management"
```

---

### Task 10: Settings page update

**Files:**
- Modify: `app/(app)/settings/page.tsx`

- [ ] **Step 1: Update the page to fetch rules and render RulesSection**

```tsx
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { SettingsForm } from './_components/SettingsForm'
import { CategoriesSection } from './_components/CategoriesSection'
import { RulesSection } from './_components/RulesSection'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('Settings')

  const metadata = user?.user_metadata ?? {}
  const reportingCurrency = (metadata.reporting_currency as string) ?? 'EUR'
  const locale = (metadata.locale as string) ?? 'en'

  const [{ data: categories }, { data: rules }] = await Promise.all([
    supabase.from('categories').select('*').order('kind').order('name'),
    supabase
      .from('category_rules')
      .select('id, match_text, match_type, category_id, created_at, categories(name)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="flex flex-col">
      <PageHeader title={t('title')} />
      <div className="flex max-w-2xl flex-col gap-6 p-6">
        <SettingsForm reportingCurrency={reportingCurrency} locale={locale} />
        <CategoriesSection categories={categories ?? []} />
        <RulesSection
          rules={(rules ?? []) as React.ComponentProps<typeof RulesSection>['rules']}
          categories={(categories ?? []).filter(c => c.kind !== 'transfer')}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Smoke-test in the browser**

Navigate to `/settings`. Verify:
- Rules section renders below Categories (empty state shows the hint text)
- Add rule form is visible
- After adding a rule, it appears in the list
- Delete removes the row
- Changing category updates inline

Navigate to `/transactions`, categorise a transaction, click "Create rule", verify:
- Rule appears in `/settings` Rules section
- Bulk "Categorise uncategorised" button appears
- Clicking it shows a count in the status message

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/settings/page.tsx
git commit -m "feat: add RulesSection to settings page"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| `category_rules` table + RLS + unique constraint | Task 2 |
| `normalise` / `matchTarget` / `applyRules` pure functions | Task 1 |
| `matchTarget` = `merchant?.trim() \|\| description` | Task 1 |
| 14 unit tests | Task 1 |
| `importBatch` applies rules (Revolut fallback, Monzo unchanged) | Task 4 |
| `setTransactionCategory` server action + `SetCategoryResult` type | Task 4 |
| `CategoryCell` inline editor with optimistic update + revert | Task 5 |
| Prompt bar with Create/Update rule + Skip | Task 6 |
| `createCategoryRule` pre-check + upsert + 100-id batched backfill | Task 4 |
| `rerunRules` bulk action + 100-id batched updates | Task 4 |
| Status message auto-clear (4 s) | Task 6 |
| Bulk "Categorise uncategorised" button (hidden when no rules) | Task 6 |
| `addRule` / `deleteRule` / `updateRuleCategory` settings actions | Task 8 |
| `RulesSection` with table, inline change, delete, add form | Task 9 |
| Settings page renders RulesSection | Task 10 |
| ICU plurals in EN + PT-PT | Task 3 |
| `wasUpdate` via pre-check (not upsert result) | Tasks 4, 8 |
