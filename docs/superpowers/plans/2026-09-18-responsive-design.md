# Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Norte finance tracker fully usable on mobile phones.

**Architecture:** Add a `MobileNavContext` to share nav-open state between the Sidebar (which becomes a slide-in overlay on mobile) and PageHeader (which gains a hamburger button). All `flex gap-4` summary rows become responsive grids. Wide tables render a card list on mobile (`sm:hidden`) alongside the existing table (`hidden sm:block`).

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, lucide-react, next-intl.

**Spec:** `docs/superpowers/specs/2026-09-18-responsive-design.md`

## Global Constraints

- Tailwind breakpoints: `sm` = 640 px, `lg` = 1024 px — use these exclusively, no custom breakpoints.
- No new npm dependencies.
- No schema or API changes.
- All existing desktop layouts must be unchanged at `lg:` and above.
- `cn()` utility lives at `@/lib/utils` — import from there.
- All existing `'use client'` / server-component distinctions must be preserved unless the task explicitly changes them.

---

### Task 1: MobileNavContext

**Files:**
- Create: `components/layout/MobileNavContext.tsx`

**Interfaces:**
- Produces:
  - `MobileNavProvider({ children: ReactNode }): JSX.Element` — client component; wrap the app shell with this
  - `useMobileNav(): { isOpen: boolean; open: () => void; close: () => void }` — hook; call inside any client component

- [ ] **Step 1: Create the context file**

```tsx
// components/layout/MobileNavContext.tsx
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type MobileNavContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
}

const MobileNavContext = createContext<MobileNavContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
})

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <MobileNavContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </MobileNavContext.Provider>
  )
}

export function useMobileNav() {
  return useContext(MobileNavContext)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors relating to this file.

- [ ] **Step 3: Commit**

```bash
git add components/layout/MobileNavContext.tsx
git commit -m "feat(responsive): add MobileNavContext for mobile nav state"
```

---

### Task 2: NavItem optional onClick + Sidebar responsive overlay

**Files:**
- Modify: `components/layout/NavItem.tsx`
- Modify: `components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: `useMobileNav` from `components/layout/MobileNavContext.tsx` (Task 1)
- Consumes: `cn` from `@/lib/utils`
- `NavItem` gains optional prop `onClick?: () => void`; all existing callers without this prop continue to work unchanged

- [ ] **Step 1: Add optional `onClick` prop to NavItem**

Replace the entire `NavItem.tsx` with:

```tsx
// components/layout/NavItem.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  href: string
  label: string
  icon: LucideIcon
  onClick?: () => void
}

export function NavItem({ href, label, icon: Icon, onClick }: Props) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      onClick={onClick}
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

- [ ] **Step 2: Replace Sidebar with responsive version**

Replace the entire `Sidebar.tsx` with:

```tsx
// components/layout/Sidebar.tsx
'use client'

import {
  LayoutDashboard, ArrowLeftRight, PieChart, RefreshCw,
  Wallet, Settings, User, TrendingUp, BarChart2, X,
} from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { NavItem } from './NavItem'
import { useMobileNav } from './MobileNavContext'
import { cn } from '@/lib/utils'

function SidebarContent({ onNavClick }: { onNavClick: () => void }) {
  const t = useTranslations('Nav')

  const NAV_ITEMS = [
    { href: '/dashboard',       label: t('dashboard'),       icon: LayoutDashboard },
    { href: '/investments',     label: t('investments'),     icon: TrendingUp },
    { href: '/net-worth',       label: t('netWorth'),        icon: BarChart2 },
    { href: '/transactions',    label: t('transactions'),    icon: ArrowLeftRight },
    { href: '/budgets',         label: t('budgets'),         icon: PieChart },
    { href: '/recurring-bills', label: t('recurringBills'),  icon: RefreshCw },
    { href: '/accounts',        label: t('accounts'),        icon: Wallet },
  ]

  const BOTTOM_ITEMS = [
    { href: '/settings', label: t('settings'), icon: Settings },
    { href: '/account',  label: t('myAccount'), icon: User },
  ]

  return (
    <>
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-8 w-8 overflow-hidden rounded-lg shrink-0">
          <Image src="/logo.png" alt="Norte" width={32} height={32} className="h-full w-full object-cover" />
        </div>
        <span className="text-sm font-bold text-white tracking-wide">Norte</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <NavItem {...item} onClick={onNavClick} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-nav-active-bg px-3 py-3">
        <ul className="space-y-1">
          {BOTTOM_ITEMS.map(item => (
            <li key={item.href}>
              <NavItem {...item} onClick={onNavClick} />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export function Sidebar() {
  const { isOpen, close } = useMobileNav()

  return (
    <>
      {/* Desktop: always visible, in flex flow */}
      <aside className="hidden lg:flex h-screen w-60 shrink-0 flex-col bg-sidebar-bg">
        <SidebarContent onNavClick={() => {}} />
      </aside>

      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Mobile slide-in panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-sidebar-bg shadow-xl transition-transform duration-200 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={close}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-nav-icon-col hover:bg-nav-active-bg"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        <SidebarContent onNavClick={close} />
      </aside>
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add components/layout/NavItem.tsx components/layout/Sidebar.tsx
git commit -m "feat(responsive): responsive Sidebar with mobile slide-in overlay"
```

---

### Task 3: AppLayout provider + PageHeader hamburger

**Files:**
- Modify: `app/(app)/layout.tsx`
- Modify: `components/layout/PageHeader.tsx`

**Interfaces:**
- Consumes: `MobileNavProvider` from `components/layout/MobileNavContext.tsx` (Task 1)
- Consumes: `useMobileNav` from `components/layout/MobileNavContext.tsx` (Task 1)

- [ ] **Step 1: Wrap AppLayout with MobileNavProvider**

In `app/(app)/layout.tsx`, add the import and wrap the returned JSX:

```tsx
// app/(app)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNavProvider } from '@/components/layout/MobileNavContext'
import { seedCategoriesIfEmpty } from '@/lib/categories'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await seedCategoriesIfEmpty(user.id)

  return (
    <MobileNavProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-y-auto bg-content-bg">
          {children}
        </main>
      </div>
    </MobileNavProvider>
  )
}
```

- [ ] **Step 2: Add hamburger button to PageHeader**

Replace the entire `PageHeader.tsx` with:

```tsx
// components/layout/PageHeader.tsx
'use client'

import { type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { useMobileNav } from './MobileNavContext'

type Props = {
  title: string
  actions?: ReactNode
}

export function PageHeader({ title, actions }: Props) {
  const { open } = useMobileNav()

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-col bg-card-bg px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={open}
          className="rounded-lg p-1.5 text-text-tertiary hover:bg-content-bg hover:text-text-primary lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      </div>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </header>
  )
}
```

- [ ] **Step 3: Start dev server and verify on mobile viewport**

```bash
npm run dev
```

Open `http://localhost:3000` in browser. Resize to 390 px wide (or use DevTools device emulation). Verify:
- Hamburger icon visible in header; sidebar not visible
- Tapping hamburger slides the sidebar in from the left
- Tapping a nav link closes the sidebar and navigates
- Tapping the backdrop or X button closes the sidebar
- At 1024 px+ the sidebar is always visible; no hamburger shown

- [ ] **Step 4: Commit**

```bash
git add app/(app)/layout.tsx components/layout/PageHeader.tsx
git commit -m "feat(responsive): wire hamburger button and MobileNavProvider into app shell"
```

---

### Task 4: Summary card rows → responsive grids + page padding

Five Summary components and one page currently use `flex gap-4` to place 3 SummaryCards side by side. On mobile these overflow. The dashboard also has a two-panel flex row.

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `app/(app)/investments/_components/InvestmentsSummary.tsx`
- Modify: `app/(app)/net-worth/_components/NetWorthSummary.tsx`
- Modify: `app/(app)/budgets/_components/BudgetSummary.tsx`
- Modify: `app/(app)/recurring-bills/_components/BillsSummary.tsx`
- Modify (padding only): `app/(app)/accounts/page.tsx`
- Modify (padding only): `app/(app)/transactions/page.tsx`
- Modify (padding only): `app/(app)/investments/page.tsx`
- Modify (padding only): `app/(app)/net-worth/page.tsx`
- Modify (padding only): `app/(app)/budgets/page.tsx`
- Modify (padding only): `app/(app)/recurring-bills/page.tsx`

- [ ] **Step 1: Fix Dashboard flex rows and padding**

In `app/(app)/dashboard/page.tsx`, make two changes:

1. `<div className="flex flex-col gap-6 p-6">` → `<div className="flex flex-col gap-6 p-4 sm:p-6">`
2. `<div className="flex gap-4">` (the 3-card row with SummaryCard, SummaryCard, SpendingCard) → `<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">`
3. `<div className="flex gap-4">` (UpcomingBillsPanel + RecentTransactionsPanel) → `<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">`

- [ ] **Step 2: Fix InvestmentsSummary**

In `app/(app)/investments/_components/InvestmentsSummary.tsx`:

```tsx
// Change:
<div className="flex gap-4">
// To:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

- [ ] **Step 3: Fix NetWorthSummary**

In `app/(app)/net-worth/_components/NetWorthSummary.tsx`:

```tsx
// Change:
<div className="flex gap-4">
// To:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

- [ ] **Step 4: Fix BudgetSummary**

In `app/(app)/budgets/_components/BudgetSummary.tsx`:

```tsx
// Change:
<div className="flex gap-4">
// To:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

- [ ] **Step 5: Fix BillsSummary**

In `app/(app)/recurring-bills/_components/BillsSummary.tsx`:

```tsx
// Change:
<div className="flex gap-4">
// To:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

- [ ] **Step 6: Fix page padding on remaining pages**

In each of the following files, change `p-6` to `p-4 sm:p-6` inside the `<div className="flex flex-col gap-6 p-6">` wrapper:
- `app/(app)/accounts/page.tsx`
- `app/(app)/transactions/page.tsx` (uses `gap-5` not `gap-6`, keep that)
- `app/(app)/investments/page.tsx`
- `app/(app)/net-worth/page.tsx`
- `app/(app)/budgets/page.tsx`
- `app/(app)/recurring-bills/page.tsx`

- [ ] **Step 7: Verify on mobile viewport**

At 390 px, check each page. Summary cards should stack vertically (one per row). At 640 px+ they should be 3 across.

- [ ] **Step 8: Commit**

```bash
git add \
  app/(app)/dashboard/page.tsx \
  app/(app)/investments/_components/InvestmentsSummary.tsx \
  app/(app)/net-worth/_components/NetWorthSummary.tsx \
  app/(app)/budgets/_components/BudgetSummary.tsx \
  app/(app)/recurring-bills/_components/BillsSummary.tsx \
  app/(app)/accounts/page.tsx \
  app/(app)/transactions/page.tsx \
  app/(app)/investments/page.tsx \
  app/(app)/net-worth/page.tsx \
  app/(app)/budgets/page.tsx \
  app/(app)/recurring-bills/page.tsx
git commit -m "feat(responsive): stack summary cards vertically on mobile; reduce page padding"
```

---

### Task 5: TransactionTable mobile card list

**Files:**
- Modify: `app/(app)/transactions/_components/TransactionTable.tsx`

Note: `TransactionTable` is a server component (async function, no `'use client'`). Keep it that way.

- [ ] **Step 1: Replace the file with dual-render version**

```tsx
// app/(app)/transactions/_components/TransactionTable.tsx
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Transaction, Account, Category } from '@/types/database'
import { getTranslations } from 'next-intl/server'

type TxWithRelations = Transaction & {
  accounts: Pick<Account, 'name'> | null
  categories: Pick<Category, 'name'> | null
}

type Props = { transactions: TxWithRelations[] }

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export async function TransactionTable({ transactions }: Props) {
  const t = await getTranslations('Transactions')

  if (transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        {t('noTransactions')}
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-border-col rounded-xl border border-border-col bg-card-bg">
        {transactions.map(tx => (
          <div key={tx.id} className="flex flex-col gap-1.5 px-4 py-3">
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
                  <span className="ml-1.5 rounded bg-accent-light px-1.5 py-0.5 text-xs text-accent">{t('importBadge')}</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-text-secondary">{tx.accounts?.name ?? '—'}</span>
            </div>
            <div>
              {tx.is_transfer ? (
                <StatusBadge label={t('transferBadge')} color="neutral" />
              ) : tx.categories ? (
                <StatusBadge label={tx.categories.name} color="accent" />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-border-col bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-3 text-left">{t('date')}</th>
              <th className="px-4 py-3 text-left">{t('description')}</th>
              <th className="px-4 py-3 text-left">{t('category')}</th>
              <th className="px-4 py-3 text-left">{t('account')}</th>
              <th className="px-4 py-3 text-right">{t('amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-col">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-content-bg">
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                  {formatDate(tx.occurred_on)}
                </td>
                <td className="px-4 py-3 text-text-primary">
                  {tx.merchant ?? tx.description ?? '—'}
                  {tx.source === 'csv_import' && (
                    <span className="ml-2 rounded bg-accent-light px-1.5 py-0.5 text-xs text-accent">{t('importBadge')}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {tx.is_transfer ? (
                    <StatusBadge label={t('transferBadge')} color="neutral" />
                  ) : tx.categories ? (
                    <StatusBadge label={tx.categories.name} color="accent" />
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">{tx.accounts?.name ?? '—'}</td>
                <td className={`px-4 py-3 text-right font-medium tabular-nums ${Number(tx.amount) >= 0 ? 'text-status-good' : 'text-status-danger'}`}>
                  {formatAmount(Number(tx.amount), tx.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify on mobile viewport**

Open `/transactions` at 390 px. Cards should show: date + amount on row 1, description + account on row 2, category badge on row 3. At 640 px+ the full table should appear.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/transactions/_components/TransactionTable.tsx"
git commit -m "feat(responsive): mobile card list for TransactionTable"
```

---

### Task 6: BudgetTable mobile card list

**Files:**
- Modify: `app/(app)/budgets/_components/BudgetTable.tsx`

Note: `BudgetTable` is a client component (`'use client'`). Keep it.

- [ ] **Step 1: Replace the file with dual-render version**

```tsx
// app/(app)/budgets/_components/BudgetTable.tsx
'use client'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/lib/utils'
import { AddBudgetDrawer } from './AddBudgetDrawer'
import { useTranslations } from 'next-intl'
import type { BudgetRow } from '@/lib/budgets'
import type { Category } from '@/types/database'

type Props = {
  rows: BudgetRow[]
  categories: Category[]
  currentMonth: string
  reportingCurrency: string
  reportingRate: number
}

export function BudgetTable({ rows, categories, currentMonth, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('Budgets')

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        {t('noBudgets')}
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-border-col rounded-xl border border-border-col bg-card-bg">
        {rows.map(row => {
          const pct = row.hasBudget && row.budgetEur > 0 ? Math.min(row.actualEur / row.budgetEur, 1) : 0
          const isOver = row.hasBudget && row.actualEur > row.budgetEur

          let statusLabel: string
          let statusColor: 'good' | 'danger' | 'neutral'
          if (!row.hasBudget)   { statusLabel = t('noBudgetSet'); statusColor = 'neutral' }
          else if (isOver)      { statusLabel = t('overBudget');  statusColor = 'danger'  }
          else                  { statusLabel = t('onTrack');     statusColor = 'good'    }

          return (
            <div key={row.category.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-text-primary">{row.category.name}</span>
                <StatusBadge label={statusLabel} color={statusColor} />
              </div>
              {row.hasBudget && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-content-bg">
                  <div
                    className={`h-full rounded-full ${isOver ? 'bg-status-danger' : 'bg-accent'}`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  {formatCurrency(row.actualEur * reportingRate, reportingCurrency)}
                  {row.hasBudget && (
                    <span className="text-text-tertiary"> / {formatCurrency(row.budgetEur * reportingRate, reportingCurrency)}</span>
                  )}
                </span>
                <AddBudgetDrawer
                  categories={categories}
                  currentMonth={currentMonth}
                  prefillCategoryId={row.category.id}
                  prefillAmount={row.hasBudget ? row.budgetEur : undefined}
                  trigger="icon"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-border-col bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-3 text-left">{t('category')}</th>
              <th className="px-4 py-3 text-right">{t('budgeted')}</th>
              <th className="px-4 py-3 text-right">{t('actual')}</th>
              <th className="px-4 py-3 text-left w-40">{t('progress')}</th>
              <th className="px-4 py-3 text-right">{t('variance')}</th>
              <th className="px-4 py-3 text-left">{t('statusLabel')}</th>
              <th className="px-4 py-3 text-left">{t('editBudget')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-col">
            {rows.map(row => {
              const pct = row.hasBudget && row.budgetEur > 0 ? Math.min(row.actualEur / row.budgetEur, 1) : 0
              const isOver = row.hasBudget && row.actualEur > row.budgetEur
              const variance = Math.abs(row.varianceEur)

              let statusLabel: string
              let statusColor: 'good' | 'danger' | 'neutral'
              if (!row.hasBudget)   { statusLabel = t('noBudgetSet'); statusColor = 'neutral' }
              else if (isOver)      { statusLabel = t('overBudget');  statusColor = 'danger'  }
              else                  { statusLabel = t('onTrack');     statusColor = 'good'    }

              return (
                <tr key={row.category.id} className="hover:bg-content-bg">
                  <td className="px-4 py-3 font-medium text-text-primary">{row.category.name}</td>
                  <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                    {row.hasBudget ? formatCurrency(row.budgetEur * reportingRate, reportingCurrency) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary tabular-nums">
                    {formatCurrency(row.actualEur * reportingRate, reportingCurrency)}
                  </td>
                  <td className="px-4 py-3">
                    {row.hasBudget && (
                      <div className="h-2 w-full overflow-hidden rounded-full bg-content-bg">
                        <div
                          className={`h-full rounded-full ${isOver ? 'bg-status-danger' : 'bg-accent'}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums text-xs font-medium ${isOver ? 'text-status-danger' : 'text-status-good'}`}>
                    {row.hasBudget ? `${isOver ? '+' : '-'}${formatCurrency(variance * reportingRate, reportingCurrency)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={statusLabel} color={statusColor} />
                  </td>
                  <td className="px-4 py-3">
                    <AddBudgetDrawer
                      categories={categories}
                      currentMonth={currentMonth}
                      prefillCategoryId={row.category.id}
                      prefillAmount={row.hasBudget ? row.budgetEur : undefined}
                      trigger="icon"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify on mobile viewport**

Open `/budgets` at 390 px. Each budget row should show: category + status badge, progress bar, actual/budget amounts + edit icon. At 640 px+ the full 7-column table appears.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/budgets/_components/BudgetTable.tsx"
git commit -m "feat(responsive): mobile card list for BudgetTable"
```

---

### Task 7: BillsTable mobile card list

**Files:**
- Modify: `app/(app)/recurring-bills/_components/BillsTable.tsx`

- [ ] **Step 1: Replace the file with dual-render version**

```tsx
// app/(app)/recurring-bills/_components/BillsTable.tsx
'use client'

import { useTranslations } from 'next-intl'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getBillStatus } from '@/lib/bills'
import { MarkPaidButton } from './MarkPaidButton'
import { AddBillDrawer } from './AddBillDrawer'
import type { RecurringBill, Account, Category, RecurringFrequency } from '@/types/database'

type Props = {
  bills: RecurringBill[]
  accounts: Account[]
  categories: Category[]
  reportingCurrency?: string
  reportingRate?: number
}

function formatBillAmount(amount: number, currency: string, freqLabel: string): string {
  const formatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  return `${formatted} / ${freqLabel.toLowerCase()}`
}

export function BillsTable({ bills, accounts, categories }: Props) {
  const t = useTranslations('RecurringBills')

  if (bills.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        {t('noBills')}
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-border-col rounded-xl border border-border-col bg-card-bg">
        {bills.map(bill => {
          const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
          const category = categories.find(c => c.id === bill.category_id)
          const account = accounts.find(a => a.id === bill.account_id)
          const statusColor = status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warn' : 'good'
          const statusLabel = status === 'overdue' ? t('overdue') : status === 'due_soon' ? t('dueSoon') : t('active')
          const freqLabel = t(`frequencies.${bill.frequency as RecurringFrequency}`)

          return (
            <div key={bill.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm text-text-primary">{bill.name}</span>
                <span className="shrink-0 text-sm tabular-nums text-text-primary">
                  {formatBillAmount(Number(bill.amount), bill.currency, freqLabel)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">{formatDate(bill.next_due_on)}</span>
                <StatusBadge label={statusLabel} color={statusColor} />
              </div>
              <div className="flex items-center justify-between">
                {category ? <StatusBadge label={category.name} color="accent" /> : <span className="text-xs text-text-tertiary">{account?.name ?? '—'}</span>}
                <div className="flex items-center gap-2">
                  <MarkPaidButton billId={bill.id} />
                  <AddBillDrawer accounts={accounts} categories={categories} prefill={bill} trigger="icon" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-border-col bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-3 text-left">{t('name')}</th>
              <th className="px-4 py-3 text-left">{t('category')}</th>
              <th className="px-4 py-3 text-left">{t('account')}</th>
              <th className="px-4 py-3 text-right">{t('amount')}</th>
              <th className="px-4 py-3 text-left">{t('nextDue')}</th>
              <th className="px-4 py-3 text-left">{t('status')}</th>
              <th className="px-4 py-3 text-left">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-col">
            {bills.map(bill => {
              const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
              const category = categories.find(c => c.id === bill.category_id)
              const account = accounts.find(a => a.id === bill.account_id)
              const statusColor = status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warn' : 'good'
              const statusLabel = status === 'overdue' ? t('overdue') : status === 'due_soon' ? t('dueSoon') : t('active')
              const freqLabel = t(`frequencies.${bill.frequency as RecurringFrequency}`)

              return (
                <tr key={bill.id} className="hover:bg-content-bg">
                  <td className="px-4 py-3 font-medium text-text-primary">{bill.name}</td>
                  <td className="px-4 py-3">
                    {category ? <StatusBadge label={category.name} color="accent" /> : <span className="text-text-tertiary">—</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{account?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-primary whitespace-nowrap">
                    {formatBillAmount(Number(bill.amount), bill.currency, freqLabel)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(bill.next_due_on)}</td>
                  <td className="px-4 py-3"><StatusBadge label={statusLabel} color={statusColor} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MarkPaidButton billId={bill.id} />
                      <AddBillDrawer accounts={accounts} categories={categories} prefill={bill} trigger="icon" />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify on mobile viewport**

Open `/recurring-bills` at 390 px. Each bill card shows: name + amount, due date + status badge, category badge + actions.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/recurring-bills/_components/BillsTable.tsx"
git commit -m "feat(responsive): mobile card list for BillsTable"
```

---

### Task 8: HoldingsTable mobile card list

**Files:**
- Modify: `app/(app)/investments/_components/HoldingsTable.tsx`

- [ ] **Step 1: Replace the file with dual-render version**

```tsx
// app/(app)/investments/_components/HoldingsTable.tsx
'use client'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { AddHoldingDrawer } from './AddHoldingDrawer'
import { DeleteHoldingButton } from './DeleteHoldingButton'
import { useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/utils'
import type { Holding, Account, AssetType } from '@/types/database'
import type { HoldingComputed } from '@/lib/holdings'

type HoldingRow = {
  holding: Holding
  computed: HoldingComputed
  latestPrice: number | null
  isStale: boolean
}

type Props = {
  rows: HoldingRow[]
  accounts: Account[]
  reportingCurrency: string
  reportingRate: number
}

function formatNativeCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

export function HoldingsTable({ rows, accounts, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('Investments')
  const tCommon = useTranslations('Common')

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        {t('noHoldings')}
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-border-col rounded-xl border border-border-col bg-card-bg">
        {rows.map(({ holding, computed, latestPrice, isStale }) => {
          const pnlColor = computed.cost_eur > 0
            ? (computed.pnl_eur >= 0 ? 'text-status-good' : 'text-status-danger')
            : 'text-text-tertiary'
          const sign = computed.pnl_eur >= 0 ? '+' : ''

          return (
            <div key={holding.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">{holding.symbol}</span>
                  <StatusBadge label={t(`assetTypes.${holding.asset_type as AssetType}`)} color="neutral" />
                  {isStale && <StatusBadge label={tCommon('stale')} color="warn" />}
                </div>
                <span className="font-medium text-text-primary">
                  {formatCurrency(computed.value_eur * reportingRate, reportingCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{holding.name ?? '—'}</span>
                {computed.cost_eur > 0 && (
                  <span className={`text-sm font-medium ${pnlColor}`}>
                    {sign}{computed.pnl_pct.toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="flex items-center justify-end gap-1">
                <AddHoldingDrawer accounts={accounts} prefill={holding} trigger="icon" />
                <DeleteHoldingButton holdingId={holding.id} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border-col bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-3 text-left">{t('symbol')}</th>
              <th className="px-4 py-3 text-left">{t('name')}</th>
              <th className="px-4 py-3 text-left">{t('type')}</th>
              <th className="px-4 py-3 text-left">{t('account')}</th>
              <th className="px-4 py-3 text-right">{t('quantity')}</th>
              <th className="px-4 py-3 text-right">{t('avgCost')}</th>
              <th className="px-4 py-3 text-right">{t('currentPrice')}</th>
              <th className="px-4 py-3 text-right">{t('value')}</th>
              <th className="px-4 py-3 text-right">{t('pnl')}</th>
              <th className="px-4 py-3 text-right">{t('pnlPct')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-col">
            {rows.map(({ holding, computed, latestPrice, isStale }) => {
              const pnlColor = computed.cost_eur > 0
                ? (computed.pnl_eur >= 0 ? 'text-status-good' : 'text-status-danger')
                : 'text-text-tertiary'
              const account = accounts.find(a => a.id === holding.account_id)

              return (
                <tr key={holding.id} className="hover:bg-content-bg">
                  <td className="px-4 py-3 font-semibold text-text-primary">{holding.symbol}</td>
                  <td className="px-4 py-3 text-text-secondary">{holding.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={t(`assetTypes.${holding.asset_type as AssetType}`)} color="neutral" />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{account?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-text-primary">{Number(holding.quantity).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {holding.avg_cost_basis != null
                      ? formatNativeCurrency(Number(holding.avg_cost_basis), holding.currency)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    <span>
                      {latestPrice != null
                        ? formatNativeCurrency(latestPrice, holding.currency)
                        : '—'}
                    </span>
                    {isStale && <StatusBadge label={tCommon('stale')} color="warn" />}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text-primary">
                    {formatCurrency(computed.value_eur * reportingRate, reportingCurrency)}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${pnlColor}`}>
                    {computed.cost_eur > 0
                      ? `${computed.pnl_eur >= 0 ? '+' : ''}${formatCurrency(computed.pnl_eur * reportingRate, reportingCurrency)}`
                      : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${pnlColor}`}>
                    {computed.cost_eur > 0
                      ? `${computed.pnl_pct >= 0 ? '+' : ''}${computed.pnl_pct.toFixed(2)}%`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <AddHoldingDrawer accounts={accounts} prefill={holding} trigger="icon" />
                      <DeleteHoldingButton holdingId={holding.id} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify on mobile viewport**

Open `/investments` at 390 px. Each holding card shows: symbol + type badge + value, name + PnL%, edit + delete actions. At 640 px+ the full 11-column table appears.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/investments/_components/HoldingsTable.tsx"
git commit -m "feat(responsive): mobile card list for HoldingsTable"
```

---

### Task 9: Push and smoke-test

- [ ] **Step 1: TypeScript final check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Final mobile smoke-test**

At 390 px, visit each route and confirm:
- `/dashboard` — hamburger works, cards stack, bottom panels stack
- `/transactions` — card list shows; table at 640 px+
- `/budgets` — card list with progress bars; table at 640 px+
- `/recurring-bills` — card list; table at 640 px+
- `/investments` — card list; table at 640 px+
- `/net-worth` — summary cards stack; chart/tables scroll fine
- `/accounts` — account cards already responsive; padding reduced

- [ ] **Step 3: Push**

```bash
git push
```
