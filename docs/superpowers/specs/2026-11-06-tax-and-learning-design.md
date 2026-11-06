# Finance Tracker — Sub-project 6: Portuguese Tax (IRS) & Financial Learning

**Date:** 2026-11-06
**Scope:** Make Norte "IRS-ready" for a Portuguese tax resident with UK-sourced income, and add a low-cost AI review + learning agent.
**Delivers:** Deduction tagging, historical FX, investment lots, an IRS calendar, an e-Fatura cross-check, an Anexo J (foreign income) tracker, a year-end IRS pack, and a monthly AI review that produces a digest, tips and a lesson.

> **Non-goal:** Norte does not calculate tax owed, give tax advice, or file anything. Portal das Finanças has no public filing API and the user works with an external tax advisor. Norte's job is to make sure nothing is missing and the numbers are ready to hand over.

---

## Context

- Nuno became Portuguese tax resident in 2025 (moved Aug 2025). The annual IRS return is filed 1 Apr – 30 Jun for the prior year.
- Employed by Deloitte Technology, S.A. — IRS is withheld monthly at source, so the annual return is a reconciliation.
- IFICI ("NHR 2.0") application is in progress with an external advisor. If granted: 20% flat rate on qualifying PT employment income; much foreign-source income exempt but **still declared**.
- UK income: rental income from a London flat (being sold, ~3–4 months from Nov 2026), plus any GBP interest / investment income. All of it is foreign income → **Anexo J**.
- Every IRS rate, cap and sector list changes with each State Budget (OE) → **all tax rules are data, versioned per tax year, never hard-coded.**

### Annual IRS cycle (driver for the calendar)

| When (year N+1) | What |
|---|---|
| By end of Feb | Validate e-Fatura invoices, confirm household composition |
| ~16–31 Mar | Review AT-computed deductions, file complaints |
| 1 Apr – 30 Jun | File Modelo 3 (or confirm IRS Automático) |
| By 31 Aug | Refund / payment |
| One-off | UK: non-resident property disposal return + payment within **60 days of completion** of the London flat sale |

---

## Stack & Runtime Context

Same as previous sub-projects: Next.js 16.3.5 / React 19, Supabase (always `await createClient()`), `proxy.ts`, Tailwind v4 tokens in `globals.css`, `next-intl` (EN + PT-PT — all new strings go in both `messages/*.json`). Migrations applied via Supabase SQL Editor and mirrored in `schema.sql`.

New dependency (Phase C only): `@anthropic-ai/sdk`.

---

## Phase A — Tax groundwork (do first; makes 2026 data usable for the 2027 return)

### A1. Tax-year rules table

```sql
create table tax_rules (
  tax_year int not null,
  rule_key text not null,          -- e.g. 'deduction.health', 'deduction.general_family', 'iva_sector.restaurants'
  label_pt text not null,
  label_en text not null,
  rate numeric(6,4),               -- e.g. 0.15
  cap_eur numeric(10,2),           -- per-taxpayer cap where applicable
  notes text,
  source_url text,                 -- where the value was verified
  primary key (tax_year, rule_key)
);
```

- Global reference data (no `user_id`, read-only RLS like `exchange_rates`).
- Seed for tax year 2026 from the current OE and verify every row against an official/reputable source (`source_url` required). Rows are reviewed each January.
- Also the reference corpus for the learning agent (Phase C).

### A2. Map categories to IRS deduction types

- Add `categories.irs_deduction text null` — references a `tax_rules.rule_key` family (`health`, `education`, `housing_rent`, `housing_interest`, `general_family`, `iva_sector.*`, `none`).
- Add `transactions.irs_deduction_override text null` for one-off exceptions (e.g. a pharmacy purchase that was not health).
- Settings → Categories: a "IRS deduction" select per category. Sensible defaults on seed: Health → `health`, Housing → `housing_rent`, Eating Out → `iva_sector.restaurants`, etc.
- Pure util `lib/tax/deductions.ts` → `getDeductibleSpend(transactions, categories, rules, taxYear)` returns per-type totals + estimated deduction (rate × spend, capped). Unit tested. Labelled "estimate" everywhere in the UI.

### A3. Income classification for Anexo J

- Add `categories.income_type text null` with values: `employment_pt`, `rental_foreign`, `interest_foreign`, `dividends_foreign`, `capital_gains_foreign`, `other_foreign`, `other`.
- Seed new system income categories: **Rental income (UK)**, **Interest**, **Dividends**. Existing "Income" stays as `employment_pt`.
- Country of source derives from the account (add `accounts.country char(2) default 'PT'`; Monzo/GBP accounts → `GB`).

### A4. Historical exchange rates

`exchange_rates` is already keyed by `rate_date`; only the fetcher is "latest only".

- Add `getRateOn(base, quote, date)` in `lib/exchange-rates.ts`: DB lookup for `rate_date = date`; on miss call `https://api.frankfurter.app/{date}?from=&to=` (ECB reference rates; returns the previous business day's rate on weekends/holidays — store it under the requested date **and** record the actual ECB date in a new `source_date` column).
- Backfill helper: `ensureRatesForRange(base, quote, from, to)` using Frankfurter's time-series endpoint (one call per range).
- Charts keep using current rates (existing decision). **Tax views always use `getRateOn(transaction.occurred_on)`.**

### A5. Investment lots

`holdings.avg_cost_basis` can't produce realised gains. Add:

```sql
create table holding_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  holding_id uuid not null references holdings(id) on delete cascade,
  kind text not null check (kind in ('buy','sell','dividend','fee')),
  occurred_on date not null,
  quantity numeric(18,6),
  price numeric(14,4),
  amount numeric(14,2) not null,   -- native currency, signed
  currency char(3) not null,
  notes text
);
```

- Investments drawer gains a "Transactions" tab (add buy/sell/dividend).
- `holdings.quantity` / `avg_cost_basis` become derived from buys/sells when `holding_transactions` exist (keep manual values as fallback for holdings with no history).
- Pure util `lib/tax/realised-gains.ts` → FIFO matching (PT rule), each leg converted to EUR at its own date's rate. Unit tested.

---

## Phase B — IRS features

New sidebar item **IRS** (`/irs`, icon `Landmark` from lucide) with a tax-year selector (default: previous year from Jan–Jun, current year otherwise).

### B1. IRS calendar

- Static per-year deadlines in `tax_rules` (`rule_key = 'deadline.*'`, with date in `notes` → or a small `tax_deadlines` table if cleaner during implementation).
- Dashboard card: "Next IRS deadline: Validate e-Fatura — in 12 days".
- Optional: expose deadlines to the external morning-briefing workflow later (out of scope here).

### B2. Deductible spend overview

- Cards per deduction type: spend so far, estimated deduction, cap progress bar.
- Uses A2 utils. Clear "estimate — AT figures are authoritative" note.

### B3. e-Fatura cross-check (January–February)

- Upload the CSV exported from e-Fatura ("Consultar faturas" → export). New parser `lib/csv/parsers/efatura.ts` (columns validated against a real export during implementation; parser must reject unknown layouts loudly).
- Match e-Fatura rows to Norte transactions by date (±3 days) + amount (±€0.01) + merchant similarity.
- Output three lists: **matched**, **in Norte but no invoice** (only for deductible categories — likely purchase without NIF), **invoice with no Norte transaction** (likely cash / other account).
- e-Fatura uploads stored as a separate `efatura_imports` batch (reversible, like `import_batches`) — not mixed into `transactions`.

### B4. Foreign income tracker (Anexo J)

- Table grouped by income type and source country: gross amount (native), EUR at date-of-receipt rate, count of entries.
- Realised capital gains from A5, per sale: acquisition date/value, disposal date/value, gain in EUR.
- **Property sale (London flat):** not modelled as a feature. Record proceeds as a GBP transaction in category "Property sale" (`income_type = capital_gains_foreign`) with a free-text note; the advisor computes the gain. A one-off reminder banner for the UK 60-day return is created manually via a simple `reminders` row (or skipped if out of scope).

### B5. Year-end IRS pack

- `/irs/pack` — printable page (and CSV download) summarising, per tax year: PT employment income (from transactions, for sanity check vs the AT pre-fill), deductible spend by type, Anexo J lines, realised gains, FX rates used.
- Designed to be handed to the tax advisor as-is.

---

## Phase C — Monthly review & learning agent

### Cadence (cost control)

- **Trigger:** after a CSV import completes (server action in `app/(app)/transactions/_components/actions.ts`), **only if** no review exists in the last 14 days. Fallback: manual "Run review" button on the dashboard (same 14-day guard, overridable).
- No AI calls on page load. The dashboard widget only reads stored output.

### Input — compact summary, never raw rows

`lib/review/build-summary.ts` (pure, unit tested) produces ~2–4k tokens of JSON:
- Period covered; income/expense totals by category (EUR) vs previous period and vs budget
- Recurring bills total and changes; subscriptions added/removed
- Net worth now vs 30/90 days; cash vs invested split; GBP exposure
- Tax-year-to-date: deductible spend per type, Anexo J totals, next deadline
- Learning progress: completed lesson ids, current track

Merchant names and transaction descriptions are excluded by default.

### Call

- Route: server action `runMonthlyReview()` → Anthropic Messages API, model from env `NORTE_REVIEW_MODEL` (default a current Sonnet-class model), `ANTHROPIC_API_KEY` server-only.
- System prompt + curriculum + current-year `tax_rules` sent as a **cached prefix** (prompt caching); only the summary varies.
- Structured output via a single tool / JSON schema:

```ts
type ReviewOutput = {
  digest: string                    // 3–5 sentences, plain language
  tips: { title: string; body: string; severity: 'info' | 'action' }[]  // 2–3, grounded in the summary
  lesson: { id: string; title: string; body_md: string; uses_user_data: boolean }
}
```

- Language follows the user's locale (EN / PT-PT).
- Guardrails in system prompt: explain, don't recommend specific products or trades; tax statements must reference a `tax_rules.source_url`; always defer to the tax advisor for anything IFICI-, property- or filing-specific.

### Storage

```sql
create table ai_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  model text not null,
  input_tokens int, output_tokens int, cached_tokens int,
  output jsonb not null
);

create table lesson_progress (
  user_id uuid not null references auth.users(id) default auth.uid(),
  lesson_id text not null,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);
```

Token counts stored so cost is visible in Settings ("AI usage this year").

### Curriculum (static file `lib/review/curriculum.ts`)

Ordered tracks; the agent picks the next incomplete lesson and personalises it with the summary:
1. **Foundations** — cash flow, savings rate, emergency fund, inflation, compound interest
2. **Investing** — ETFs vs funds, fees/TER, diversification, risk vs time horizon, rebalancing
3. **Portugal** — how IRS works, deductions & e-Fatura, PPR, Certificados de Aforro/Tesouro, capital gains (28% vs englobamento)
4. **Cross-border** — what changes for UK accounts/pensions as a non-resident, FX risk and moving large GBP sums, UK–PT treaty basics

### UI

- Dashboard **"This month"** card: digest + tips (from latest `ai_reviews`), "Run review" button with last-run date.
- **`/learn`** page: lesson history, current lesson, mark as done, track progress.
- Optional later (not in this spec): an "Ask a question" box with a monthly call cap.

---

## Build order

1. **A4** historical FX + **A2/A3** category tagging — smallest changes, highest leverage; do before Jan 2027
2. **A1** tax_rules seed (2026) + **B1** calendar + **B2** deductible overview
3. **B3** e-Fatura cross-check — needed by Feb 2027
4. **A5** lots + **B4** Anexo J + **B5** IRS pack — needed by Apr 2027
5. **Phase C** review agent + `/learn`

Each step is its own plan in `docs/superpowers/plans/`.

---

## Testing

Unit tests in `tests/lib/`:
- `tax/deductions.test.ts` — rate × spend, cap applied, override precedence, category with no mapping
- `tax/realised-gains.test.ts` — FIFO across multiple buys, partial sells, per-leg FX, sell with no prior buy (error)
- `exchange-rates.test.ts` — `getRateOn` cache hit/miss, weekend → previous business day, `source_date` stored
- `csv/efatura.test.ts` — parses fixture, rejects unknown layout
- `tax/efatura-match.test.ts` — tolerance windows, one-to-one matching, unmatched buckets
- `review/build-summary.test.ts` — excludes merchant/description, stable shape, token-size budget

No tests against Frankfurter or the Anthropic API — mock at the boundary; test the transformation logic.

---

## Error Handling

- **Frankfurter historical fetch fails:** tax views show the affected rows with a "rate missing" badge and exclude them from totals (never silently use today's rate).
- **e-Fatura CSV layout unknown:** reject with a clear message listing expected columns.
- **Review call fails / malformed output:** log, keep previous review on the dashboard, show "last review failed — retry". No partial writes.
- **No tax_rules for selected year:** IRS page shows "rules for {year} not configured yet" instead of estimates.

---

## Open questions

- e-Fatura export column layout — confirm against a real export before building B3.
- Whether IFICI status should change any displayed estimate (likely no: show a note only, since the advisor owns the computation).
- Whether the IRS calendar should feed the external morning-briefing workflow.
