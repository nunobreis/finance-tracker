# Finance Tracker — Project Context

Personal finance tracking app for Nuno. Single user, personal use only — this
file (plus `schema.sql` beside it) is the planning context to load before
any code gets written. Put both files in this project's root directory
alongside the pen.dev design file.

## What it does

Tracks everything: day-to-day expenses/budget, net worth over time,
investments/portfolio, and recurring bills/subscriptions.

## Stack

- **Next.js + Supabase** — same stack as an existing project (Dobby's Health
  Tracker), so there's no new tooling to learn.
- Supabase free tier allows 2 active projects per org — confirmed this app
  fits on the free tier alongside the existing one without upgrading. Free
  projects pause after a week of inactivity (manual resume, no data loss).

## Key decisions

**Data entry — CSV import, not bank APIs.** Genuinely free open-banking
APIs are largely gone (GoCardless Bank Account Data dropped its free tier
in Aug 2026); direct PSD2 access would need an eIDAS certificate
(~€3,000–8,000/year), not worth it for a personal project. MVP path is
manual entry + CSV import. Main banks are Revolut and Monzo — both support
native CSV export (not just PDF), so build the importer around CSV, not
PDF parsing. Revisit a paid aggregator (~€3–4/month per connected account)
later only if the manual workflow proves too tedious.

**Multi-currency, EUR reporting.** Accounts exist in both EUR and GBP.
Every account/transaction keeps its native currency; anything that
aggregates across accounts (net worth, overall budget totals) converts to
EUR via a cached daily exchange rate. Home/reporting currency is EUR.
Historical charts intentionally use the *current* rate rather than
re-pricing past transactions at historical rates — simpler for an MVP,
revisit only if EUR/GBP drift ever makes it matter.

**Transfers don't inflate spending.** Moving money between the user's own
accounts (e.g. Revolut → Monzo) should create two linked transaction rows
(`is_transfer = true`, linked via `transfer_pair_id`) so budget/expense
totals exclude them.

**CSV imports are reversible.** Group each upload into an `import_batches`
row; transactions reference it via `import_batch_id`, so a bad import can
be deleted as a unit.

**Authentication is required.** This is personal financial data — no one
else should ever have access. Use Supabase Auth (email/password or magic
link) and disable public sign-up in the Supabase dashboard once the one
account exists. Pair with Row Level Security on every table, scoped to
`auth.uid()` (already in `schema.sql`).

**Design reference — read the pen.dev file first.** There's a pen.dev file
in this same directory with an artboard reference for the UI/UX look and
feel (color palette, typography, spacing, component style, layout
patterns). Read it before scaffolding any screens, and use it as the
consistent visual foundation across the dashboard, transactions list,
budgets, recurring bills, and (Phase 2) investments/net worth screens.
Summarize your understanding of it back before generating screens.

## Data model

Full schema and design rationale: see `schema.sql` in this directory
(11 tables — 7 for the Phase 1 MVP, 3 more for a Phase 2 investments
layer). Reference version with more explanation of the design notes above:
https://claude.ai/artifact/K1qYRBV9DngqySbi1NMo2h

Phase 1 — MVP: `accounts`, `categories`, `transactions`, `budgets`,
`recurring_bills`, `import_batches`, `exchange_rates`.

Phase 2 — investments & net worth: `holdings`, `holding_price_history`,
`net_worth_snapshots`. Net worth is computed as periodic snapshots rather
than live, so historical charts stay fast.

## Getting started

Plan is to kick this off with the "superpowers" plugin's brainstorm
feature, pointing it at this file and `schema.sql` as the starting
context, so the brainstorm builds on these decisions rather than
re-litigating them.
