# Finance Tracker — Sub-project 7: Merchant → Category Rules

**Date:** 2026-11-06
**Scope:** Auto-categorise Revolut (and other uncategorised) transactions using merchant-matching rules; inline category edit in the transaction list; a "Create rule" prompt; bulk re-run; and a Rules section in Settings.
**Prerequisite for:** IRS Phase B2 (deductible spend overview needs categorised data).

---

## Context

Revolut CSV imports arrive with no category — every transaction shows "—". The tax deduction mapping built in Step 1 is useless until transactions are categorised. This feature adds a lightweight rule engine: rules match on merchant name (or description when merchant is absent), are created organically from the transaction list, and can be managed in Settings.

---

## Stack & Runtime Context

Same as previous sub-projects: Next.js 16.3.5 / React 19, Supabase (`await createClient()`), Tailwind v4 tokens in `globals.css`, `next-intl` (EN + PT-PT). No new dependencies.

Status feedback: inline `bg-good-bg / bg-danger-bg` divs (same pattern as `SettingsForm`). No toast library.

---

## Data Model

```sql
create table category_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) default auth.uid(),
  match_text  text not null,
  match_key   text not null,  -- normalise(match_text), set by app before insert
  match_type  text not null check (match_type in ('contains', 'equals')),
  category_id uuid not null references categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, match_type, match_key)
);
```

**`match_key`** is `normalise(match_text)` stored by the app. The unique constraint on `(user_id, match_type, match_key)` enforces one rule per normalised text + type per user, and enables the upsert pattern.

**No `priority` column.** Conflict resolution among matching rules is deterministic:
1. `equals` beats `contains`
2. Longer `match_key` wins among same type
3. Newer `created_at` wins when length is equal

**RLS:** owner-scoped policy on all four operations (`select`, `insert`, `update`, `delete`) using `user_id = auth.uid()`, added to the loop in `schema.sql` alongside the other tables.

---

## Pure Matching Utility — `lib/category-rules.ts`

Three exports; no Supabase dependency.

### `normalise(s: string): string`

```
trim → lower-case → Unicode NFD decompose → strip combining marks (category \p{M})
```

"Lusíadas" → "lusiadas", "UBER EATS" → "uber eats".

### `matchTarget(tx: { merchant: string | null; description: string | null }): string | null`

```ts
export function matchTarget(tx: { merchant: string | null; description: string | null }): string | null
```

Returns `tx.merchant?.trim() || tx.description`. Empty-string merchant (e.g. `""`) falls back to `description`. If the result is null or empty string → returns `null`.

Used in three places: `applyRules`, the `setTransactionCategory` match-count query, and the `createCategoryRule` backfill query.

### `applyRules(tx, rules): string | null`

```ts
applyRules(
  tx: { merchant: string | null; description: string | null },
  rules: Array<{ match_key: string; match_type: 'equals' | 'contains'; category_id: string; created_at: string }>
): string | null
```

**Match target:** `matchTarget(tx)`. If null → `null` immediately.

**Filtering:** for each rule, normalise the match target once and test:
- `equals`: `normTarget === rule.match_key`
- `contains`: `normTarget.includes(rule.match_key)`

**Sorting matches** (ascending priority, so `[0]` is the winner):
1. `equals` before `contains`
2. Longer `match_key` first
3. Newer `created_at` first

Returns `matches[0].category_id` or `null` if no matches.

---

## CSV Import Integration

In `app/(app)/transactions/_components/actions.ts`, inside `importBatch`, load all rules once before the row-mapping loop:

```ts
const { data: rules } = await supabase
  .from('category_rules')
  .select('match_key, match_type, category_id, created_at')
  .eq('user_id', user.id)
```

Then for each row:

```ts
const mappedCategory = row.raw_category ? categoryIdMap[row.raw_category] : undefined
category_id: mappedCategory ?? applyRules({ merchant: row.merchant, description: row.description }, rules ?? []) ?? null
```

Monzo rows with a mapped raw category are unchanged. Revolut rows (and Monzo rows whose raw category isn't in the map) fall through to `applyRules`.

---

## Inline Category Edit — Transaction List

### State (lifted to the transactions page client wrapper)

```ts
type Prompt = {
  txId: string
  matchText: string   // display form (merchant or description)
  matchKey: string    // normalise(matchText)
  categoryId: string
  categoryName: string
  matchCount: number  // other uncategorised non-transfer transactions with same matchKey, excluding the current txId
  existingRule: boolean
}

const [prompt, setPrompt] = useState<Prompt | null>(null)
const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string | null>>({})
const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
```

`statusMessage` replaces a toast — rendered as the standard inline `bg-good-bg` / `bg-danger-bg` div in the page, above the table, auto-cleared after 4 s via `useEffect`.

### `CategoryCell` client component

Renders either a `StatusBadge` (read state) or a `<select>` (edit state). Receives:
- `txId`, `merchant`, `description`, current `categoryId | null`
- `categories` list (for select options — fetched once on the page)
- `onSaved(result: SetCategoryResult)` callback
- `onEditStart()` callback (dismisses any active prompt as Skip)

**Flow:**

1. Click badge → switch to `<select>` pre-selected on current value.
2. `onChange` → optimistically apply the new category to `categoryOverrides`. Call `setTransactionCategory(txId, categoryId)`.
3. **On success:** call `onSaved(result)` → parent sets `prompt`. If a different row was already prompting, it silently dismisses (its save already succeeded).
4. **On failure:** revert `categoryOverrides[txId]`, show inline cell error (small red text under the select), leave `prompt` unchanged.
5. Any click on a different `CategoryCell` → `onEditStart()` dismisses the active prompt as Skip before the new cell opens its select.

The transactions page fetches categories separately for the select options:

```ts
const { data: categories } = await supabase.from('categories').select('id, name, kind').order('name')
```

### `setTransactionCategory` server action

```ts
type SetCategoryResult = {
  matchText: string
  matchKey: string
  matchCount: number       // other uncategorised, non-transfer transactions with normalised merchant/description = matchKey
  existingRule: boolean    // true if a rule with (match_type='equals', match_key) already exists
}
```

Updates `transactions.category_id`, then fetches all uncategorised non-transfer transactions (`category_id IS NULL AND is_transfer = false AND id != txId`) and filters in TypeScript with `normalise(matchTarget(tx) ?? '') === matchKey` to produce the count. Returns `SetCategoryResult`.

---

## "Always Categorise" Prompt

Rendered as a one-line bar below the edited row (desktop) / card (mobile). Dismisses on navigation (component unmounts) or when `onEditStart` fires for another row.

**Prompt text:**

> *Always categorise 'Iqos' as Shopping? Also applies to 6 other uncategorised transactions. [Create rule] [Skip]*

- When `matchCount === 0`: omit "Also applies to…"; append *"Future imports with this merchant will be categorised automatically."*
- When `existingRule === true`: replace "Create rule" button label with "Update rule"; lead text becomes *"Update rule for 'Iqos' to Shopping?"*

### `createCategoryRule` server action

```ts
createCategoryRule(
  matchText: string,
  matchKey: string,
  matchType: 'equals' | 'contains',
  categoryId: string
): Promise<{ wasUpdate: boolean; backfillCount: number }>
```

Steps:
1. `SELECT id FROM category_rules WHERE user_id = auth.uid() AND match_type = $matchType AND match_key = $matchKey LIMIT 1` — if found, set `wasUpdate = true`.
2. Upsert into `category_rules` on conflict `(user_id, match_type, match_key)` → `DO UPDATE SET category_id = EXCLUDED.category_id, match_text = EXCLUDED.match_text`.
3. Fetch all uncategorised, non-transfer (`is_transfer = false`) transactions whose `matchTarget(tx)` normalises to `matchKey`. Collect their ids.
4. Chunk ids into batches of 100; run one `UPDATE transactions SET category_id = $categoryId WHERE id IN (...)` per batch (PostgREST URL length limit).
5. Return `{ wasUpdate, backfillCount: rows updated }`.

After success, `statusMessage` → *"Rule created. 6 transactions categorised."* (or "Rule updated.")

The prompt uses `match_type = 'equals'` always — the user is acting on a specific merchant they can see.

---

## Bulk "Categorise Uncategorised" Action

A **"Categorise uncategorised"** button in the transactions page toolbar (top-right, next to "Import CSV"). Hidden when the user has no rules. Calls `rerunRules()`.

### `rerunRules` server action

1. Load all rules for the user.
2. Load all uncategorised (`category_id IS NULL`), non-transfer transactions.
3. For each transaction, run `applyRules`. Collect results as `Map<categoryId, txId[]>`.
4. For each entry in the map, chunk the ids into batches of 100 and run one `UPDATE transactions SET category_id = $catId WHERE id = ANY($ids)` per batch (PostgREST URL length limit).
5. Return total count of updated rows.

`statusMessage` → *"42 transactions categorised."* or *"No matching rules found."* on 0.

---

## Settings → Rules Section

New card below the Categories section in `/settings`. Fetched server-side:

```ts
const { data: rules } = await supabase
  .from('category_rules')
  .select('id, match_text, match_type, category_id, created_at, categories(name)')
  .order('created_at', { ascending: false })
```

### Rules table

| Matches | Type | Category | Created | |
|---|---|---|---|---|
| Iqos | Equals | Shopping | 6 Nov 2026 | [change ▾] [Delete] |

- **Change category:** inline `<select>` for the category, saves on change via `updateRuleCategory(ruleId, categoryId)`. Optimistic update; revert on error.
- **Delete:** no confirmation. Calls `deleteRule(ruleId)`. Row removed from list.
- **Hint** below the list (always visible when rules exist): *"Deleting a rule doesn't change transactions that have already been categorised."*
- **Empty state:** *"No rules yet. Set a category on a transaction to create one."*

### "Add rule" form (bottom of the card)

Three inline fields + an "Add" button:

| Match text (input) | Type (equals/contains select) | Category (select) | [Add] |

Calls `addRule(matchText, matchType, categoryId)` in `app/(app)/settings/actions.ts`. Same pre-check + upsert logic as `createCategoryRule` but no backfill — does NOT apply to existing transactions. Pre-check (`SELECT id WHERE match_type = $matchType AND match_key = $matchKey`) determines `wasUpdate`; if true the status says *"Rule updated."* `revalidatePath('/settings')` causes the list to refresh.

---

## i18n Strings

New top-level key `"CategoryRules"` in both message files.

**`messages/en.json`:**

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

**`messages/pt-PT.json`:**

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

---

## Testing — `tests/lib/category-rules.test.ts`

All tests are pure (no Supabase mock needed).

**`normalise`**
1. Strips accents — `"Lusíadas"` → `"lusiadas"`
2. Lowercases — `"UBER"` → `"uber"`
3. Trims whitespace

**`applyRules`**
4. No rules → `null`
5. No merchant and no description → `null`
6. `equals` match returns correct `category_id`
7. `contains` match returns correct `category_id` — `"uber"` rule matches merchant `"Uber Eats"`
8. `equals` beats `contains` when both match
9. Longer `match_key` wins among two `contains` matches
10. Newer `created_at` wins when match_key length is equal
11. Merchant preferred over description when both present
12. Falls back to description when merchant is null
13. Accent-insensitive — `"Café Central"` matches a `contains` rule for `"cafe"`
14. Empty-string merchant (`""`) falls back to description (not treated as a match target)

---

## Error Handling

| Failure | Behaviour |
|---|---|
| `setTransactionCategory` fails | Revert `categoryOverrides[txId]`; small red text under the cell; prompt does not appear |
| `createCategoryRule` fails | `statusMessage` error; category already saved is not rolled back |
| `rerunRules` fails | `statusMessage` error |
| `deleteRule` / `updateRuleCategory` / `addRule` fails | Revert optimistic update; inline error in the Rules card |

---

## File Map

**New files:**
- `lib/category-rules.ts` — exports `normalise`, `matchTarget`, `applyRules`
- `tests/lib/category-rules.test.ts`
- `app/(app)/transactions/_components/CategoryCell.tsx`
- `app/(app)/settings/_components/RulesSection.tsx`

**Modified files:**
- `schema.sql` — add `category_rules` table + RLS
- `types/database.ts` — add `CategoryRule` type
- `app/(app)/transactions/_components/actions.ts` — add `setTransactionCategory`, `createCategoryRule`, `rerunRules`; update `importBatch`
- `app/(app)/transactions/_components/TransactionTable.tsx` — replace category badge with `CategoryCell`; lift prompt + overrides state
- `app/(app)/transactions/page.tsx` — fetch categories for select; pass state; add bulk button
- `app/(app)/settings/actions.ts` — add `addRule`, `deleteRule`, `updateRuleCategory`
- `app/(app)/settings/page.tsx` — fetch rules; add `RulesSection`
- `messages/en.json`
- `messages/pt-PT.json`

---

## Open Questions

None — scope is fully defined.
