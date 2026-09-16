-- Finance Tracker — initial schema
-- Postgres / Supabase. Single user, RLS-scoped to auth.uid().
-- See CLAUDE.md in this directory for the decisions behind this schema.

create extension if not exists "pgcrypto";

-- ========== Phase 1: MVP ==========

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  institution text,
  account_type text not null check (account_type in ('checking','savings','credit_card','cash','investment')),
  currency char(3) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  parent_category_id uuid references categories(id),
  kind text not null check (kind in ('income','expense','transfer')),
  is_system boolean not null default false
);

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  account_id uuid not null references accounts(id),
  filename text,
  imported_at timestamptz not null default now(),
  row_count int,
  status text not null default 'pending' check (status in ('pending','completed','failed'))
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  account_id uuid not null references accounts(id),
  occurred_on date not null,
  amount numeric(12,2) not null,
  currency char(3) not null,
  description text,
  merchant text,
  category_id uuid references categories(id),
  is_transfer boolean not null default false,
  transfer_pair_id uuid references transactions(id),
  import_batch_id uuid references import_batches(id),
  external_id text,
  source text not null default 'manual' check (source in ('manual','csv_import')),
  created_at timestamptz not null default now()
);
create index on transactions (account_id, occurred_on);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  category_id uuid not null references categories(id),
  period_month date not null,
  amount_eur numeric(12,2) not null,
  rollover boolean not null default false,
  unique (user_id, category_id, period_month)
);

create table recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  category_id uuid references categories(id),
  account_id uuid references accounts(id),
  amount numeric(12,2) not null,
  currency char(3) not null,
  frequency text not null check (frequency in ('weekly','monthly','quarterly','yearly')),
  next_due_on date not null,
  reminder_days_before int not null default 3,
  is_active boolean not null default true
);

create table exchange_rates (
  rate_date date not null,
  base_currency char(3) not null,
  quote_currency char(3) not null,
  rate numeric(14,6) not null,
  primary key (rate_date, base_currency, quote_currency)
);

-- ========== Phase 2: investments & net worth ==========

create table holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  account_id uuid not null references accounts(id),
  symbol text not null,
  name text,
  asset_type text not null check (asset_type in ('stock','etf','fund','crypto','other')),
  quantity numeric(18,6) not null,
  avg_cost_basis numeric(14,4),
  currency char(3) not null
);

create table holding_price_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  holding_id uuid not null references holdings(id),
  price_date date not null,
  price numeric(14,4) not null,
  unique (holding_id, price_date)
);

create table net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  snapshot_date date not null,
  total_eur numeric(14,2) not null,
  breakdown jsonb,
  unique (user_id, snapshot_date)
);

-- ========== Row Level Security ==========
do $$
declare t text;
begin
  for t in select unnest(array['accounts','categories','import_batches','transactions',
                          'budgets','recurring_bills','holdings',
                          'holding_price_history','net_worth_snapshots'])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "owner access" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t
    );
  end loop;
end $$;
