# Finance Tracker — Sub-project 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Next.js 14 app with Supabase auth, the full 11-table schema, a sidebar + top-bar shell, and stub pages for all 7 routes — enough to log in and navigate the full app.

**Architecture:** App Router with two route groups: `(auth)` for the login page and `(app)` for all authenticated pages. Server Components do all data work; the only Client Components in this sub-project are `NavItem` (needs `usePathname`) and the login form (needs form state). Supabase auth uses `@supabase/ssr` with cookie-based sessions refreshed by middleware on every request.

**Tech Stack:** Next.js 14+, TypeScript (strict), Tailwind CSS v3, Supabase (`@supabase/ssr`), Lucide React (icons), Vitest (unit tests), clsx + tailwind-merge.

**Spec:** `docs/superpowers/specs/2026-09-16-foundation-design.md`

## Global Constraints

- Next.js 14+ App Router — no Pages Router files
- TypeScript strict mode — no `any`, no `ts-ignore`
- All Tailwind colour classes use the design token names from the spec (e.g. `bg-sidebar-bg`, `text-text-primary`) — never raw hex values in JSX
- Font: Inter via `next/font/google` — no other font
- Icons: `lucide-react` only — no other icon library
- Supabase client: `@supabase/ssr` — never `@supabase/auth-helpers-nextjs` (deprecated)
- `middleware.ts` lives at the **project root**, not inside `app/`
- Path alias `@/` maps to the project root (configured in `tsconfig.json`)
- No `console.log` in committed code
- Commit after every task

---

## File Map

```
# Modified from repo root
schema.sql                              # Add external_id column to transactions

# Project root (new Next.js app — these replace create-next-app defaults)
middleware.ts                           # Session refresh + auth redirect
tailwind.config.ts                      # Design tokens
tsconfig.json                           # Strict + @/ alias
vitest.config.ts                        # Vitest + jsdom
.env.local.example                      # Template for env vars

# App root
app/globals.css                         # Tailwind directives only
app/layout.tsx                          # Root: html/body/Inter font
app/page.tsx                            # Redirect to /dashboard

# Auth callback (outside route groups — handled by Supabase)
app/auth/callback/route.ts              # Exchange code for session

# (auth) route group — login, no sidebar
app/(auth)/layout.tsx                   # Centered white card, no sidebar
app/(auth)/login/page.tsx               # Login form (Server Component shell)
app/(auth)/login/_components/LoginForm.tsx  # 'use client' form with error state
app/(auth)/login/actions.ts             # Server Actions: signIn, magicLink, signOut

# (app) route group — all authenticated pages
app/(app)/layout.tsx                    # Sidebar + main area
app/(app)/dashboard/page.tsx            # Stub
app/(app)/transactions/page.tsx         # Stub
app/(app)/budgets/page.tsx              # Stub
app/(app)/recurring-bills/page.tsx      # Stub
app/(app)/accounts/page.tsx             # Stub
app/(app)/settings/page.tsx             # Stub
app/(app)/account/page.tsx              # Stub

# Layout components
components/layout/Sidebar.tsx           # Full sidebar (Server Component)
components/layout/NavItem.tsx           # Single nav link ('use client')
components/layout/PageHeader.tsx        # Sticky page title bar (Server Component)

# Supabase clients
lib/supabase/server.ts                  # createClient() for Server Components/Actions
lib/supabase/browser.ts                 # createClient() for Client Components

# Utilities + types
lib/utils.ts                            # cn(), formatEur(), formatDate()
types/database.ts                       # TypeScript types for all 11 tables

# Tests
tests/lib/utils.test.ts                 # Unit tests for lib/utils.ts
```

---

## Task 1: Scaffold + Dependencies + Design Tokens + Schema

**Files:**
- Create: project (via `create-next-app`)
- Modify: `schema.sql` (add `external_id`)
- Modify: `tailwind.config.ts`, `tsconfig.json`, `app/globals.css`, `app/layout.tsx`
- Create: `vitest.config.ts`, `.env.local.example`

**Interfaces:**
- Produces: a buildable Next.js project with all design tokens available as Tailwind classes and Inter loaded as the default font

- [ ] **Step 1: Scaffold the Next.js project**

Run from the repo root (the existing `finance-tracker/` directory):

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=no \
  --import-alias="@/*" \
  --use-npm
```

When prompted for the project name, use `.` (current directory). Accept all defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge
npm install -D vitest @vitejs/plugin-react jsdom @types/node
```

- [ ] **Step 3: Add `external_id` to `schema.sql`**

Open `schema.sql`. In the `transactions` table definition, add `external_id text` after the `import_batch_id` line:

```sql
  import_batch_id uuid references import_batches(id),
  external_id text,
  source text not null default 'manual' check (source in ('manual','csv_import')),
```

- [ ] **Step 4: Apply the schema to Supabase (manual step)**

1. Create a new Supabase project at supabase.com
2. Go to SQL Editor → New query
3. Paste the full contents of `schema.sql` and run it
4. Verify all 11 tables appear in Table Editor with RLS enabled (padlock icon on each)
5. Go to Authentication → Providers → enable Email (with "Confirm email" on) and enable "Magic Link"
6. Save your `Project URL` and `anon public` key for the next step

- [ ] **Step 5: Create `.env.local` from the template**

Create `.env.local.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Copy to `.env.local` and fill in real values from step 4. Verify `.env.local` is in `.gitignore` (create-next-app adds it automatically).

- [ ] **Step 6: Replace `tailwind.config.ts` with design tokens**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sidebar-bg':    '#0D1525',
        'content-bg':    '#F0F4F8',
        'card-bg':       '#FFFFFF',
        'accent':        '#0EB5D4',
        'accent-light':  '#E0F7FC',
        'text-primary':  '#0F172A',
        'text-secondary':'#64748B',
        'text-tertiary': '#94A3B8',
        'border-col':    '#E2E8F0',
        'nav-icon-col':  '#4A6890',
        'nav-active-bg': '#162236',
        'status-good':   '#22C55E',
        'status-warn':   '#F59E0B',
        'status-danger': '#EF4444',
        'good-bg':       '#DCFCE7',
        'warn-bg':       '#FEF3C7',
        'danger-bg':     '#FEE2E2',
        'warn-icon-bg':  '#FEF3C7',
        'good-icon-bg':  '#DCFCE7',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 7: Update `tsconfig.json` path alias**

Verify (or add) the `paths` entry — `create-next-app` should have set this but confirm:

```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 8: Replace `app/globals.css`**

Remove all default create-next-app styles. Keep only:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Finance Tracker',
  description: 'Personal finance tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 10: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

Add to `package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 11: Delete create-next-app placeholder files**

```bash
rm -rf app/page.tsx          # will be replaced in Task 6
rm -f public/next.svg public/vercel.svg
```

- [ ] **Step 12: Run build to verify the scaffold**

```bash
npm run build
```

Expected: no TypeScript or compilation errors. (There will be a missing `app/page.tsx` error — that's expected until Task 6. Temporarily add `app/page.tsx` with `export default function Home() { return null }` to clear the build, then remove it again in Task 6.)

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js app with design tokens and Supabase deps"
```

---

## Task 2: Supabase Clients, Database Types, and Utilities

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/browser.ts`
- Create: `types/database.ts`
- Create: `lib/utils.ts`
- Create: `tests/lib/utils.test.ts`

**Interfaces:**
- Produces:
  - `createClient()` from `@/lib/supabase/server` — returns a typed Supabase server client
  - `createClient()` from `@/lib/supabase/browser` — returns a typed Supabase browser client
  - `cn(...inputs: ClassValue[]): string` from `@/lib/utils`
  - `formatEur(amount: number): string` from `@/lib/utils`
  - `formatDate(date: string | Date): string` from `@/lib/utils`
  - All types from `@/types/database` (used by every subsequent task)

- [ ] **Step 1: Write utility tests (they fail — no implementation yet)**

Create `tests/lib/utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { cn, formatEur, formatDate } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts — last wins', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, 'bar')).toBe('foo bar')
  })
})

describe('formatEur', () => {
  it('formats positive amount', () => {
    expect(formatEur(1234.56)).toBe('€1,234.56')
  })

  it('formats zero', () => {
    expect(formatEur(0)).toBe('€0.00')
  })

  it('formats negative amount', () => {
    expect(formatEur(-42.5)).toBe('-€42.50')
  })
})

describe('formatDate', () => {
  it('formats a date string', () => {
    expect(formatDate('2026-09-16')).toBe('16 Sep 2026')
  })

  it('formats a Date object', () => {
    expect(formatDate(new Date('2026-01-01'))).toBe('01 Jan 2026')
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm run test:run tests/lib/utils.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/utils'`

- [ ] **Step 3: Create `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm run test:run tests/lib/utils.test.ts
```

Expected: all 7 tests PASS

- [ ] **Step 5: Create `types/database.ts`**

```ts
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'
export type TransactionSource = 'manual' | 'csv_import'
export type ImportBatchStatus = 'pending' | 'completed' | 'failed'
export type CategoryKind = 'income' | 'expense' | 'transfer'
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type AssetType = 'stock' | 'etf' | 'fund' | 'crypto' | 'other'

export type Account = {
  id: string
  user_id: string
  name: string
  institution: string | null
  account_type: AccountType
  currency: string
  is_active: boolean
  created_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  parent_category_id: string | null
  kind: CategoryKind
  is_system: boolean
}

export type ImportBatch = {
  id: string
  user_id: string
  account_id: string
  filename: string | null
  imported_at: string
  row_count: number | null
  status: ImportBatchStatus
}

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  occurred_on: string
  amount: number
  currency: string
  description: string | null
  merchant: string | null
  category_id: string | null
  is_transfer: boolean
  transfer_pair_id: string | null
  import_batch_id: string | null
  external_id: string | null
  source: TransactionSource
  created_at: string
}

export type Budget = {
  id: string
  user_id: string
  category_id: string
  period_month: string
  amount_eur: number
  rollover: boolean
}

export type RecurringBill = {
  id: string
  user_id: string
  name: string
  category_id: string | null
  account_id: string | null
  amount: number
  currency: string
  frequency: RecurringFrequency
  next_due_on: string
  reminder_days_before: number
  is_active: boolean
}

export type ExchangeRate = {
  rate_date: string
  base_currency: string
  quote_currency: string
  rate: number
}

export type Holding = {
  id: string
  user_id: string
  account_id: string
  symbol: string
  name: string | null
  asset_type: AssetType
  quantity: number
  avg_cost_basis: number | null
  currency: string
}

export type HoldingPriceHistory = {
  id: string
  user_id: string
  holding_id: string
  price_date: string
  price: number
}

export type NetWorthSnapshot = {
  id: string
  user_id: string
  snapshot_date: string
  total_eur: number
  breakdown: Record<string, unknown> | null
}

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: Account
        Insert: Omit<Account, 'id' | 'created_at'>
        Update: Partial<Omit<Account, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id'>
        Update: Partial<Omit<Category, 'id'>>
      }
      import_batches: {
        Row: ImportBatch
        Insert: Omit<ImportBatch, 'id' | 'imported_at'>
        Update: Partial<Omit<ImportBatch, 'id'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: Partial<Omit<Transaction, 'id'>>
      }
      budgets: {
        Row: Budget
        Insert: Omit<Budget, 'id'>
        Update: Partial<Omit<Budget, 'id'>>
      }
      recurring_bills: {
        Row: RecurringBill
        Insert: Omit<RecurringBill, 'id'>
        Update: Partial<Omit<RecurringBill, 'id'>>
      }
      exchange_rates: {
        Row: ExchangeRate
        Insert: ExchangeRate
        Update: Partial<ExchangeRate>
      }
      holdings: {
        Row: Holding
        Insert: Omit<Holding, 'id'>
        Update: Partial<Omit<Holding, 'id'>>
      }
      holding_price_history: {
        Row: HoldingPriceHistory
        Insert: Omit<HoldingPriceHistory, 'id'>
        Update: Partial<Omit<HoldingPriceHistory, 'id'>>
      }
      net_worth_snapshots: {
        Row: NetWorthSnapshot
        Insert: Omit<NetWorthSnapshot, 'id'>
        Update: Partial<Omit<NetWorthSnapshot, 'id'>>
      }
    }
  }
}
```

- [ ] **Step 6: Create `lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies are read-only here.
            // The middleware handles writing session cookies.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 7: Create `lib/supabase/browser.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 8: Run build to verify no type errors**

```bash
npm run build
```

Expected: no errors in `lib/` or `types/`

- [ ] **Step 9: Commit**

```bash
git add lib/ types/ tests/
git commit -m "feat: add Supabase clients, database types, and utility functions"
```

---

## Task 3: Middleware and Auth Callback

**Files:**
- Create: `middleware.ts` (project root)
- Create: `app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars
- Produces: session cookie refreshed on every request; unauthenticated requests redirected to `/login`; magic link code exchanged for a session at `/auth/callback`

- [ ] **Step 1: Create `middleware.ts` at the project root**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must call getUser(), not getSession(), per @supabase/ssr docs
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isAuthRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  if (user && request.nextUrl.pathname === '/login') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Create `app/auth/callback/route.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

- [ ] **Step 3: Add the callback URL to Supabase (manual step)**

In the Supabase dashboard → Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: add `http://localhost:3000/auth/callback`

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add middleware.ts app/auth/
git commit -m "feat: add auth middleware and magic link callback route"
```

---

## Task 4: Login Page and Auth Server Actions

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/login/_components/LoginForm.tsx`
- Create: `app/(auth)/login/actions.ts`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server`
- Produces:
  - `signInWithPassword(formData: FormData): Promise<{ error: string } | never>` (redirects on success)
  - `signInWithMagicLink(formData: FormData): Promise<{ error?: string; success?: string }>`
  - `signOut(): Promise<never>` (always redirects)
  - Rendered login page at `/login`

- [ ] **Step 1: Create `app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-content-bg">
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
```

- [ ] **Step 2: Create `app/(auth)/login/actions.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithPassword(
  _: unknown,
  formData: FormData
): Promise<{ error: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function signInWithMagicLink(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: formData.get('email') as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })
  if (error) return { error: error.message }
  return { success: 'Check your email for a magic link.' }
}

export async function signOut(): Promise<never> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 3: Create `app/(auth)/login/_components/LoginForm.tsx`**

```tsx
'use client'

import { useActionState, useState } from 'react'
import { signInWithPassword, signInWithMagicLink } from '../actions'

const initialState = {}

export function LoginForm() {
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [passwordState, passwordAction] = useActionState(signInWithPassword, initialState)
  const [magicState, magicAction] = useActionState(signInWithMagicLink, initialState)

  const state = mode === 'password' ? passwordState : magicState
  const action = mode === 'password' ? passwordAction : magicAction

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-8 shadow-sm">
      <div className="mb-8">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
          <span className="text-sm font-bold text-white">FT</span>
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">Finance Tracker</h1>
        <p className="mt-1 text-sm text-text-secondary">Sign in to your account</p>
      </div>

      {state && 'error' in state && state.error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
          {state.error}
        </div>
      )}
      {state && 'success' in state && state.success && (
        <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">
          {state.success}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="nuno@example.com"
          />
        </div>

        {mode === 'password' && (
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-primary">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-opacity"
        >
          {mode === 'password' ? 'Sign in' : 'Send magic link'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
        className="mt-4 w-full text-center text-sm text-text-secondary hover:text-text-primary"
      >
        {mode === 'password' ? 'Sign in with magic link instead' : 'Sign in with password instead'}
      </button>
    </div>
  )
}
```

> **Note:** `useActionState` requires React 19 / Next.js 15. If on Next.js 14 with React 18, replace `useActionState` with `useFormState` from `react-dom` — the API is identical.

- [ ] **Step 4: Create `app/(auth)/login/page.tsx`**

```tsx
import { LoginForm } from './_components/LoginForm'

export default function LoginPage() {
  return <LoginForm />
}
```

- [ ] **Step 5: Run build**

```bash
npm run build
```

Expected: no errors

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
```

Visit `http://localhost:3000/login`. Verify:
- The login card renders correctly with the FT logo, email + password fields, and "Sign in" button
- "Sign in with magic link instead" toggles the form to show only the email field
- Entering wrong credentials shows an inline error message (not a page reload)

- [ ] **Step 7: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add login page with email/password and magic link auth"
```

---

## Task 5: App Shell — Sidebar, NavItem, PageHeader, Layout

**Files:**
- Create: `components/layout/NavItem.tsx`
- Create: `components/layout/Sidebar.tsx`
- Create: `components/layout/PageHeader.tsx`
- Create: `app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `signOut` from `@/(auth)/login/actions` (for logout button in sidebar)
- Produces:
  - `<Sidebar />` — full sidebar; Server Component
  - `<NavItem href label icon />` — single nav link; Client Component
  - `<PageHeader title actions? />` — sticky title bar; Server Component
  - `app/(app)/layout.tsx` — wraps all authenticated pages in the shell

- [ ] **Step 1: Create `components/layout/NavItem.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  href: string
  label: string
  icon: LucideIcon
}

export function NavItem({ href, label, icon: Icon }: Props) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
        isActive
          ? 'border-l-2 border-accent bg-nav-active-bg text-white'
          : 'border-l-2 border-transparent text-nav-icon-col hover:bg-nav-active-bg hover:text-white'
      )}
    >
      <Icon size={18} className={isActive ? 'text-accent' : 'text-nav-icon-col'} />
      <span>{label}</span>
    </Link>
  )
}
```

- [ ] **Step 2: Create `components/layout/Sidebar.tsx`**

```tsx
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  RefreshCw,
  Wallet,
  Settings,
  User,
  LogOut,
} from 'lucide-react'
import { NavItem } from './NavItem'
import { signOut } from '@/app/(auth)/login/actions'

const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/transactions',    label: 'Transactions',    icon: ArrowLeftRight },
  { href: '/budgets',         label: 'Budgets',         icon: PieChart },
  { href: '/recurring-bills', label: 'Recurring Bills', icon: RefreshCw },
  { href: '/accounts',        label: 'Accounts',        icon: Wallet },
] as const

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/account',  label: 'My Account', icon: User },
] as const

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar-bg">
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="text-xs font-bold text-white">FT</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavItem {...item} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom cluster */}
      <div className="border-t border-nav-active-bg px-3 py-3">
        <ul className="space-y-1">
          {BOTTOM_ITEMS.map((item) => (
            <li key={item.href}>
              <NavItem {...item} />
            </li>
          ))}
          <li>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm text-nav-icon-col transition-colors hover:bg-nav-active-bg hover:text-white"
              >
                <LogOut size={18} />
                <span>Sign out</span>
              </button>
            </form>
          </li>
        </ul>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Create `components/layout/PageHeader.tsx`**

```tsx
import { type ReactNode } from 'react'

type Props = {
  title: string
  actions?: ReactNode
}

export function PageHeader({ title, actions }: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-col bg-card-bg px-6">
      <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </header>
  )
}
```

- [ ] **Step 4: Create `app/(app)/layout.tsx`**

```tsx
import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto bg-content-bg">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Run build**

```bash
npm run build
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add components/ app/\(app\)/layout.tsx
git commit -m "feat: add app shell with sidebar, nav items, and page header"
```

---

## Task 6: Root Redirect and Stub Pages

**Files:**
- Create: `app/page.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Create: `app/(app)/transactions/page.tsx`
- Create: `app/(app)/budgets/page.tsx`
- Create: `app/(app)/recurring-bills/page.tsx`
- Create: `app/(app)/accounts/page.tsx`
- Create: `app/(app)/settings/page.tsx`
- Create: `app/(app)/account/page.tsx`

**Interfaces:**
- Consumes: `<PageHeader />` from `@/components/layout/PageHeader`
- Produces: 7 navigable pages within the authenticated shell; root URL redirects to dashboard

- [ ] **Step 1: Create `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
```

- [ ] **Step 2: Create all 7 stub pages**

Each file follows the same pattern. Create all 7:

`app/(app)/dashboard/page.tsx`:
```tsx
import { PageHeader } from '@/components/layout/PageHeader'

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="flex h-64 items-center justify-center text-text-secondary text-sm">
        Coming in Sub-project 4
      </div>
    </>
  )
}
```

`app/(app)/transactions/page.tsx`:
```tsx
import { PageHeader } from '@/components/layout/PageHeader'

export default function TransactionsPage() {
  return (
    <>
      <PageHeader title="Transactions" />
      <div className="flex h-64 items-center justify-center text-text-secondary text-sm">
        Coming in Sub-project 2
      </div>
    </>
  )
}
```

`app/(app)/budgets/page.tsx`:
```tsx
import { PageHeader } from '@/components/layout/PageHeader'

export default function BudgetsPage() {
  return (
    <>
      <PageHeader title="Budgets" />
      <div className="flex h-64 items-center justify-center text-text-secondary text-sm">
        Coming in Sub-project 3
      </div>
    </>
  )
}
```

`app/(app)/recurring-bills/page.tsx`:
```tsx
import { PageHeader } from '@/components/layout/PageHeader'

export default function RecurringBillsPage() {
  return (
    <>
      <PageHeader title="Recurring Bills" />
      <div className="flex h-64 items-center justify-center text-text-secondary text-sm">
        Coming in Sub-project 3
      </div>
    </>
  )
}
```

`app/(app)/accounts/page.tsx`:
```tsx
import { PageHeader } from '@/components/layout/PageHeader'

export default function AccountsPage() {
  return (
    <>
      <PageHeader title="Accounts" />
      <div className="flex h-64 items-center justify-center text-text-secondary text-sm">
        Coming in Sub-project 2
      </div>
    </>
  )
}
```

`app/(app)/settings/page.tsx`:
```tsx
import { PageHeader } from '@/components/layout/PageHeader'

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex h-64 items-center justify-center text-text-secondary text-sm">
        Coming in Sub-project 4
      </div>
    </>
  )
}
```

`app/(app)/account/page.tsx`:
```tsx
import { PageHeader } from '@/components/layout/PageHeader'

export default function AccountPage() {
  return (
    <>
      <PageHeader title="My Account" />
      <div className="flex h-64 items-center justify-center text-text-secondary text-sm">
        Coming in Sub-project 4
      </div>
    </>
  )
}
```

- [ ] **Step 3: Run build and all tests**

```bash
npm run build && npm run test:run
```

Expected: build passes with no TypeScript errors; all 7 utility tests pass

- [ ] **Step 4: Manual verification checklist**

```bash
npm run dev
```

Work through the full verification checklist from the spec:

- [ ] `/login` loads with the FT card, email + password inputs, sign-in button
- [ ] Email/password login succeeds and redirects to `/dashboard`
- [ ] Magic link toggle shows the single-email form
- [ ] After login: sidebar is visible with all 7 nav items (Dashboard → Transactions → Budgets → Recurring Bills → Accounts at top; Settings → My Account → Sign out at bottom)
- [ ] Clicking each nav item routes to the correct stub page
- [ ] Active nav item is highlighted (accent border + darker background)
- [ ] Visiting any `/dashboard`, `/transactions`, etc. while logged out redirects to `/login`
- [ ] Clicking "Sign out" in the sidebar signs out and redirects to `/login`
- [ ] All 11 tables visible in Supabase Table Editor with RLS enabled
- [ ] `npm run build` completes cleanly

- [ ] **Step 5: Final commit**

```bash
git add app/
git commit -m "feat: add root redirect and all 7 stub pages — foundation complete"
```

---

## Post-completion: Disable public sign-up

After creating your account (via the login page), go to Supabase dashboard → Authentication → Settings → toggle off "Allow new users to sign up". This prevents anyone who discovers your URL from creating an account.
