# Finance Tracker — Sub-project 1: Foundation

**Date:** 2026-09-16
**Scope:** Next.js scaffold, Supabase auth + schema, app shell (sidebar + top bar), stub pages for all routes.
**Delivers:** A runnable app where Nuno can log in and navigate the full sidebar to stub pages, with the complete schema in place for Sub-project 2.

---

## Stack

- **Next.js 14+** — App Router, TypeScript, strict mode
- **Tailwind CSS v3** — design tokens as CSS custom properties
- **Supabase** — Auth (email/password + magic link) + Postgres
- **`@supabase/ssr`** — server-side session management (cookies, not localStorage)
- **`clsx` + `tailwind-merge`** — utility class composition

---

## Schema

Apply `schema.sql` from the repo root to the Supabase project. Before running it, add one column to the `transactions` table:

```sql
-- Add to transactions table definition in schema.sql before applying
external_id text  -- Monzo Transaction ID for exact-match dedup; null for Revolut and manual entries
```

All 11 tables (7 Phase 1, 3 Phase 2 stubs, plus `exchange_rates`) are created in one migration. RLS is already configured in the file — no additional dashboard steps needed beyond running the migration.

**Supabase dashboard steps (one-time, manual):**
1. Create a new Supabase project
2. Run `schema.sql` in the SQL editor
3. Enable email/password auth and magic link in Authentication → Providers
4. After creating Nuno's account, disable "Allow new users to sign up" in Authentication → Settings

---

## Auth

### Login page — `/login`

Supabase Auth form with two options: email/password and magic link. Minimal centered card layout (no sidebar). On successful auth, redirect to `/dashboard`.

Magic link flow: user enters email → Supabase sends link → link lands on `/auth/callback` → session established → redirect to `/dashboard`.

Required route: `app/(auth)/login/page.tsx` and `app/auth/callback/route.ts` (Supabase exchange code for session).

### Middleware — `middleware.ts`

Runs on every request. Two responsibilities:
1. Refresh the Supabase session cookie (required by `@supabase/ssr` to keep sessions alive)
2. Redirect unauthenticated requests to `/login`, except the `/login` and `/auth/callback` routes themselves

```ts
// Matcher: all routes except static assets and Supabase internals
matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/callback).*)']
```

---

## Route Structure

```
middleware.ts                          # Session refresh + auth redirect (project root, not inside app/)
app/
├── layout.tsx                        # Root: html/body, font load (Inter), Tailwind base
├── auth/
│   └── callback/route.ts             # Supabase auth code exchange
├── (auth)/
│   ├── layout.tsx                    # Centered card layout, no sidebar
│   └── login/
│       └── page.tsx                  # Login form
└── (app)/
    ├── layout.tsx                    # Sidebar + TopBar shell (auth-gated)
    ├── dashboard/page.tsx            # Stub
    ├── transactions/
    │   └── page.tsx                  # Stub
    ├── budgets/page.tsx              # Stub
    ├── recurring-bills/page.tsx      # Stub
    ├── accounts/page.tsx             # Stub
    ├── settings/page.tsx             # Stub
    └── account/page.tsx              # Stub
```

Root `/` redirects to `/dashboard` via a `redirect()` in `app/page.tsx`.

---

## App Shell

`(app)/layout.tsx` renders two fixed components plus a scrollable `{children}` area. It is a Server Component — no client state needed at the layout level.

### Sidebar

- Width: 240px, fixed, full viewport height
- Background: `sidebar-bg` (#0D1525)
- Three sections (top to bottom): Logo area, Nav items, Bottom cluster (Settings + Avatar)
- Logo area: square `accent`-coloured box with "FT" text
- Nav items: icon + label, each linking to one of the 7 routes
- Active item background: `nav-active-bg` (#162236), accent left border
- Icon colour: `nav-icon-col` (#4A6890); active: `accent` (#0EB5D4)
- Active state detected via `usePathname()` — `NavItem` is a `'use client'` component

**Nav items in order:**
| Label | Route | Icon (lucide) |
|---|---|---|
| Dashboard | /dashboard | `LayoutDashboard` |
| Transactions | /transactions | `ArrowLeftRight` |
| Budgets | /budgets | `PieChart` |
| Recurring Bills | /recurring-bills | `RefreshCw` |
| Accounts | /accounts | `Wallet` |
| Settings | /settings | `Settings` |
| My Account | /account | `User` |

### Top Bar

- Height: 56px, white (`card-bg`), border-bottom `border-col`
- Left: page title (derived from current route, title-cased)
- Right: slot for page-specific actions (empty in stubs, filled in later sub-projects)
- `TopBar` is a Server Component; page title passed as a prop from each page

### Content area

- Background: `content-bg` (#F0F4F8)
- Padding: 24px all sides
- Fills remaining viewport width and height (sidebar fixed, content scrolls)

---

## Design Tokens

Defined as Tailwind CSS custom properties in `tailwind.config.ts` and as CSS variables in `globals.css`. Named to match the pen.dev variable names exactly.

```ts
// tailwind.config.ts — extend.colors
{
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
}
```

Font: **Inter** via `next/font/google`.

---

## Shared Utilities & Types

### `lib/supabase/server.ts`
`createServerClient` from `@supabase/ssr`, wired to Next.js cookie store. Used in Server Components, Server Actions, and `middleware.ts`.

### `lib/supabase/browser.ts`
`createBrowserClient` from `@supabase/ssr`. Used only in Client Components that need Supabase access (minimal in this sub-project — just the login form).

### `lib/utils.ts`
Three utilities, nothing more:
- `cn(...inputs)` — `clsx` + `tailwind-merge` for conditional class composition
- `formatEur(amount: number)` — formats a number as `€1,234.56`
- `formatDate(date: string | Date)` — formats as `16 Sep 2026`

### `types/database.ts`
Hand-written TypeScript types for all 11 tables, matching `schema.sql` column names and types exactly. Pattern:

```ts
export type Account = {
  id: string
  user_id: string
  name: string
  institution: string | null
  account_type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'
  currency: string
  is_active: boolean
  created_at: string
}
// ... repeat for all tables
```

Also export a `Database` type matching the Supabase client generic if using the typed client.

---

## Stub Pages

Each of the 7 `page.tsx` files in `(app)/` renders a `PageHeader` with the correct title and a centered placeholder:

```tsx
// Example: app/(app)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="flex items-center justify-center h-64 text-text-secondary">
        Coming in Sub-project 4
      </div>
    </>
  )
}
```

The placeholder text reflects which sub-project will fill each page:
- Dashboard → "Coming in Sub-project 4"
- Transactions → "Coming in Sub-project 2"
- Budgets → "Coming in Sub-project 3"
- Recurring Bills → "Coming in Sub-project 3"
- Accounts → "Coming in Sub-project 2"
- Settings → "Coming in Sub-project 4"
- My Account → "Coming in Sub-project 4"

---

## Error Handling

- Auth errors (wrong password, expired magic link): display inline on the login form, no full-page errors
- Middleware redirect is the safety net — any session gap lands on `/login`
- No data fetching in this sub-project, so no data error states yet

---

## Verification

Manual checklist before calling this sub-project done:

- [ ] `npm run build` completes with no TypeScript errors
- [ ] `/login` loads; email/password login works; magic link sends an email
- [ ] After login, redirected to `/dashboard`; sidebar visible with all 7 nav items
- [ ] Clicking each nav item routes to the correct stub page; active item highlighted
- [ ] Navigating to any `(app)` route while logged out redirects to `/login`
- [ ] Logging out (Supabase `signOut()`) redirects to `/login`
- [ ] All 11 tables visible in Supabase Table Editor; RLS enabled on each
- [ ] Direct unauthenticated Supabase query returns 0 rows (RLS working)

---

## Out of Scope for This Sub-project

- Any real data fetching or display (all pages are stubs)
- Transaction forms, CSV import, budgets, bills (Sub-projects 2–3)
- Dashboard aggregations, exchange rates (Sub-project 4)
- Category seeding (Sub-project 3)
- Phase 2 tables (`holdings`, `holding_price_history`, `net_worth_snapshots`) — created by the schema but not used until a future phase
