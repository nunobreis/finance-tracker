# Norte Redesign (Wave 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Wave 1 of the Norte UI redesign from `new_design/new_design.pen` on branch `feat/redesign` (in `.worktrees/feat-redesign`), covering Design Tokens & Manrope typography, `00 — Foundations` Shared UI components, Liquid Glass App Shell, and the 7 Wave 1 screens (Dashboard, Login, Accounts, Budgets, Recurring Bills, Investments, Net Worth) in EN and PT-PT without touching `transactions/**`, `settings/**`, or backend logic.

**Architecture:** Tailwind v4 `@theme` in `app/globals.css` defines the semantic colour palette, glass tokens, 9 named typography tokens (`text-display` through `text-label`), and all backwards-compatible legacy aliases. Reusable primitives in `components/ui/` (`Button`, `Input`/`Select`, `Card`, `BottomSheet`, `Drawer`, `TransactionRow`, `QuickAction`, `AccountPill`, `StatusBadge`) and layout primitives in `components/layout/` (`TabBar`, `Sidebar`, `NavItem`, `PageHeader`, `ScreenHero`, `WealthNav`) power the 7 Wave 1 screens while keeping existing server queries and actions untouched.

**Tech Stack:** Next.js 16.3.5 App Router, React 19 (`useActionState`), Tailwind CSS v4 (`@theme`), `next/font/google` (`Manrope`), `next-intl` (EN + PT-PT), `lucide-react`, Recharts 3, Vitest 5, Playwright + Pencil MCP.

---

## File Structure & Responsibilities

| File | Action | Responsibility |
|---|---|---|
| `app/layout.tsx` | Modify | Load `Manrope` (`400,500,600,700,800`) via `next/font/google` |
| `app/globals.css` | Modify | Define semantic `@theme` colour tokens, glass tokens, 9 named type scale tokens, and legacy token aliases |
| `messages/en.json` | Modify | Add additive EN translation keys for Wave 1 shell & screens |
| `messages/pt-PT.json` | Modify | Add additive PT-PT translation keys (including `"Início"` tab label) |
| `components/ui/Button.tsx` | Create | `00 — Foundations` pill/rounded button (`primary`, `secondary`, `ghost`, `dark`, `glass`, `danger`; `sm`, `md`, `lg`) |
| `components/ui/Input.tsx` | Create | `Input` & `Select` with `filled` (`#F4F5F7` stacked label) and `bordered` variants |
| `components/ui/Card.tsx` | Create | `00 — Foundations` `Card` (`surface` `#FFFFFF` and `muted` `#F4F5F7` variants) |
| `components/ui/BottomSheet.tsx` | Create | `00 — Foundations` `BottomSheet` with drag handle, Cancel button, Escape/backdrop close, focus & scroll lock |
| `components/ui/Drawer.tsx` | Modify | Thin wrapper around `BottomSheet` preserving exact `Drawer` props and behaviour |
| `tests/components/ui/Drawer.test.tsx` | Create | Unit tests verifying `Drawer`/`BottomSheet` open/close, Escape key, backdrop click, focus & scroll lock |
| `components/ui/TransactionRow.tsx` | Create | `00 — Foundations` `TransactionRow` with `44×44` category icon circle, title/subtitle, and formatted amount |
| `components/ui/QuickAction.tsx` | Create | `00 — Foundations` `QuickAction` (`56×56` circle + `text-label` caption) |
| `components/ui/AccountPill.tsx` | Create | `00 — Foundations` `AccountPill` glass pill with `ChevronRight` |
| `components/ui/StatusBadge.tsx` | Modify | Restyle badge to `text-label font-semibold` and semantic tokens |
| `components/ui/SummaryCard.tsx` | Modify | Restyle summary metric card to `rounded-[20px] bg-surface` and named type scale tokens |
| `components/ui/AsOfPicker.tsx` | Modify | Restyle date picker as a `rounded-full` utility pill with `Calendar` icon (supporting `variant="default" \| "glass"`) |
| `components/layout/TabBar.tsx` | Create | Mobile floating Dark Smoked Liquid Glass `TabBar` (`Home`, `Transactions`, `Budgets`, `Wealth`, `More` sheet) |
| `components/layout/Sidebar.tsx` | Modify | Desktop `260px` Dark Smoked Glass sidebar (`#182235E0 → #0D1525`) matching `01b` |
| `components/layout/NavItem.tsx` | Modify | Luminous Liquid Glass active pill (`#FFFFFF33 → #FFFFFF1A`, `#FFFFFF40` border) |
| `components/layout/PageHeader.tsx` | Modify | Clean desktop utility header bar (no dead bell icon; keeps `actions` slot) |
| `components/layout/ScreenHero.tsx` | Create | Shared mobile Norte gradient hero + overlapping white sheet & desktop utility header wrapper |
| `components/layout/WealthNav.tsx` | Create | Mobile pill switcher between `/investments` and `/net-worth` under the `Wealth` tab |
| `app/(app)/layout.tsx` | Modify | Render desktop `Sidebar` + mobile floating `TabBar` on `bg-canvas` |
| `app/(app)/dashboard/page.tsx` | Modify | Fetch active `accounts` alongside existing queries; render mobile `01` and desktop `01b` layouts |
| `app/(app)/dashboard/_components/DashboardQuickActions.tsx` | Create | Wire `QuickAction` buttons (`Add`, `Import CSV`, `Transfer`, `Add Bill`) to imported `AddTransactionDrawer` & `AddBillDrawer` |
| `app/(app)/dashboard/_components/SpendingCard.tsx` | Modify | Match `01` muted sheet card & `01b` desktop progress card with remaining budget footer |
| `app/(app)/dashboard/_components/RecentTransactionsPanel.tsx` | Modify | Render `TransactionRow` items with account & category metadata and `#F1F5F9` dividers |
| `app/(app)/dashboard/_components/UpcomingBillsPanel.tsx` | Modify | Render upcoming bills using `TransactionRow` and due date metadata |
| `app/(auth)/layout.tsx` | Modify | Full-bleed Norte gradient layout (`#0D1525 → #0EB5D4 → #0A6C82`) |
| `app/(auth)/login/_components/LoginForm.tsx` | Modify | Match `10 — Login` brand hero + `rounded-[24px]` white card with filled `Input`s and `Button` |
| `app/(app)/accounts/page.tsx` | Modify | Use `ScreenHero` with total EUR balance, conversion rate subtitle, `AsOfPicker`, and account cards |
| `app/(app)/accounts/_components/AccountCard.tsx` | Modify | Match `04 — Accounts` card with native balance, EUR conversion subtitle, CSV import link, and delete action (no edit button) |
| `app/(app)/accounts/_components/AddAccountDrawer.tsx` | Modify | Match `04b — Add Account` using `Drawer` (`BottomSheet`), filled `Input`/`Select`, and pill `Button` |
| `app/(app)/budgets/page.tsx` | Modify | Use `ScreenHero` with month navigation, spent/budgeted hero metric, and `+ Add budget` action |
| `app/(app)/budgets/_components/BudgetTable.tsx` | Modify | Match `05 — Budgets` progress cards on mobile (`#0EB5D4`/`#EF4444`/`#059669` bars) & clean table on desktop |
| `app/(app)/budgets/_components/AddBudgetDrawer.tsx` | Modify | Match `05b — Add Budget` using `Drawer` (`BottomSheet`), filled `Input`/`Select`, and pill `Button` |
| `app/(app)/budgets/_components/BudgetVarianceWidget.tsx` | Modify | Restyle 3-month comparison card with new tokens and `Card` container |
| `app/(app)/recurring-bills/page.tsx` | Modify | Use `ScreenHero` with monthly EUR total, due-soon count subtitle, and `+ Add bill` action |
| `app/(app)/recurring-bills/_components/BillsTable.tsx` | Modify | Match `06 — Recurring Bills` cards on mobile & table on desktop with native/EUR amounts and `MarkPaidButton` |
| `app/(app)/recurring-bills/_components/MarkPaidButton.tsx` | Modify | Restyle as a compact pill button matching `06 — Recurring Bills` |
| `app/(app)/recurring-bills/_components/AddBillDrawer.tsx` | Modify | Match `06b — Add Bill` using `Drawer` (`BottomSheet`), filled `Input`/`Select`, and pill `Button` |
| `app/(app)/investments/page.tsx` | Modify | Use `ScreenHero` + `WealthNav`, portfolio EUR total, total P&L subtitle, `RefreshPricesButton`, and `AddHoldingDrawer` |
| `app/(app)/investments/_components/HoldingsTable.tsx` | Modify | Match `07 — Investments` cards (with portfolio weight bar) on mobile & table on desktop |
| `app/(app)/investments/_components/AddHoldingDrawer.tsx` | Modify | Match `07b — Add Holding` using `Drawer` (`BottomSheet`), filled `Input`/`Select`, and pill `Button` |
| `app/(app)/investments/_components/RefreshPricesButton.tsx` | Modify | Restyle as a pill button supporting hero glass and desktop surface contexts |
| `app/(app)/net-worth/page.tsx` | Modify | Use `ScreenHero` + `WealthNav`, total Net Worth, 30d/YTD change subtitle, and `AsOfPicker` |
| `app/(app)/net-worth/_components/NetWorthChart.tsx` | Modify | Add client-side `1M / 3M / 6M / 1Y / ALL` range filter pills and restyle Recharts area chart |
| `app/(app)/net-worth/_components/BreakdownTable.tsx` | Modify | Add Cash & Bank Accounts vs Investments allocation progress cards above the breakdown table |
| `app/(app)/net-worth/_components/SnapshotHistory.tsx` | Modify | Restyle snapshot history cards/table to match `08 — Net Worth` |

---

### Task 1: Design Tokens, Manrope Font, and Additive i18n Keys

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `messages/en.json`
- Modify: `messages/pt-PT.json`

- [x] **Step 1: Update `app/layout.tsx` to load `Manrope`**

Replace `Inter` with `Manrope` in `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Norte',
  description: 'Personal finance tracking',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={manrope.variable}>
      <body className={`${manrope.className} bg-canvas text-ink antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [x] **Step 2: Define semantic colour tokens, glass tokens, 9 named type scale tokens, and legacy aliases in `app/globals.css`**

Update `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;

  /* Semantic brand & surface tokens */
  --color-ink:              #0D1525;
  --color-ink-deep:         #0A0F1C;
  --color-ink-slate:        #182235;
  --color-teal:             #0EB5D4;
  --color-teal-deep:        #0A8FA8;
  --color-teal-dark:        #0A6C82;
  --color-teal-tint:        #CFFAFE;
  --color-canvas:           #F4F5F7;
  --color-surface:          #FFFFFF;
  --color-text-secondary:   #64748B;
  --color-text-muted:       #94A3B8;
  --color-separator:        #E2E8F0;
  --color-separator-subtle: #F1F5F9;
  --color-disabled-bg:      #E5E7EB;
  --color-disabled-text:    #9CA3AF;
  --color-sheet-handle:     #CBD5E1;

  /* Semantic status & category accents */
  --color-positive:         #059669;
  --color-positive-tint:    #DCFCE7;
  --color-negative:         #EF4444;
  --color-negative-tint:    #FEE2E2;
  --color-warning:          #F59E0B;
  --color-warning-deep:     #D97706;
  --color-warning-tint:     #FEF3C7;
  --color-info:             #2563EB;
  --color-info-tint:        #DBEAFE;
  --color-purple:           #9333EA;
  --color-purple-tint:      #F3E8FF;

  /* Liquid Glass & white transparency tokens */
  --color-glass-08:         rgba(255, 255, 255, 0.08);
  --color-glass-10:         rgba(255, 255, 255, 0.10);
  --color-glass-12:         rgba(255, 255, 255, 0.12);
  --color-glass-15:         rgba(255, 255, 255, 0.15);
  --color-glass-20:         rgba(255, 255, 255, 0.20);
  --color-glass-25:         rgba(255, 255, 255, 0.25);
  --color-glass-30:         rgba(255, 255, 255, 0.30);
  --color-glass-40:         rgba(255, 255, 255, 0.40);
  --color-glass-60:         rgba(255, 255, 255, 0.60);
  --color-glass-70:         rgba(255, 255, 255, 0.70);
  --color-glass-80:         rgba(255, 255, 255, 0.80);

  /* Named Typography Scale (9 explicit tokens — no unnamed sizes) */
  --text-display:               2.5rem;
  --text-display--line-height:  1.1;
  --text-display--letter-spacing: -0.02em;

  --text-display-sm:               2rem;
  --text-display-sm--line-height:  1.15;
  --text-display-sm--letter-spacing: -0.02em;

  --text-h1:               1.75rem;
  --text-h1--line-height:  1.2;
  --text-h1--letter-spacing: -0.015em;

  --text-h1-sm:               1.375rem;
  --text-h1-sm--line-height:  1.25;
  --text-h1-sm--letter-spacing: -0.01em;

  --text-h2:               1.25rem;
  --text-h2--line-height:  1.3;
  --text-h2--letter-spacing: -0.01em;

  --text-body:               1rem;
  --text-body--line-height:  1.5;

  --text-body-sm:               0.875rem;
  --text-body-sm--line-height:  1.45;

  --text-caption:               0.75rem;
  --text-caption--line-height:  1.4;

  --text-label:               0.6875rem;
  --text-label--line-height:  1.3;

  /* Backwards-compatible legacy aliases (Wave 1 compatibility for category-rules) */
  --color-sidebar-bg:    #0D1525;
  --color-content-bg:    #F4F5F7;
  --color-card-bg:       #FFFFFF;
  --color-accent:        #0EB5D4;
  --color-accent-light:  #E0F7FC;
  --color-text-primary:  #0D1525;
  --color-text-tertiary: #94A3B8;
  --color-border-col:    #E2E8F0;
  --color-nav-icon-col:  #4A6890;
  --color-nav-active-bg: #162236;
  --color-status-good:   #059669;
  --color-status-warn:   #F59E0B;
  --color-status-danger: #EF4444;
  --color-good-bg:       #DCFCE7;
  --color-warn-bg:       #FEF3C7;
  --color-danger-bg:     #FEE2E2;
  --color-warn-icon-bg:  #FEF3C7;
  --color-good-icon-bg:  #DCFCE7;
}
```

- [x] **Step 3: Add additive Wave 1 translation keys to `messages/en.json` and `messages/pt-PT.json`**

Add the new keys under `Nav`, `Auth`, `Dashboard`, `Accounts`, `Budgets`, `RecurringBills`, `Investments`, and `NetWorth` without renaming or removing any existing keys. Ensure `Nav.home` is `"Home"` in `en.json` and `"Início"` in `pt-PT.json`.

- [x] **Step 4: Run type-check and tests**

Run:
```bash
npx tsc --noEmit && npm run test:run
```
Expected: 0 TypeScript errors, 12 test files passing.

- [x] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css messages/en.json messages/pt-PT.json
git commit -m "feat(tokens): add Manrope font, @theme design tokens, type scale, and Wave 1 i18n keys"
```

---

### Task 2: Shared UI Components (`components/ui/`) & `Drawer` Unit Tests (TDD)

**Files:**
- Create: `tests/components/ui/Drawer.test.tsx`
- Create: `components/ui/BottomSheet.tsx`
- Modify: `components/ui/Drawer.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/TransactionRow.tsx`
- Create: `components/ui/QuickAction.tsx`
- Create: `components/ui/AccountPill.tsx`
- Modify: `components/ui/StatusBadge.tsx`
- Modify: `components/ui/SummaryCard.tsx`
- Modify: `components/ui/AsOfPicker.tsx`

- [x] **Step 1: Write failing unit tests for `Drawer` / `BottomSheet` in `tests/components/ui/Drawer.test.tsx`**

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { Drawer } from '@/components/ui/Drawer'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

describe('Drawer (BottomSheet wrapper)', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <Drawer isOpen={false} onClose={() => {}} title="Add Account">
        <p>Sheet content</p>
      </Drawer>
    )
    expect(screen.queryByText('Add Account')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  it('renders title, children, and locks body scroll when isOpen is true', () => {
    render(
      <Drawer isOpen={true} onClose={() => {}} title="Add Account">
        <input aria-label="Account Name" />
      </Drawer>
    )
    expect(screen.getByText('Add Account')).toBeDefined()
    expect(screen.getByLabelText('Account Name')).toBeDefined()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <Drawer isOpen={true} onClose={onClose} title="Add Account">
        <p>Content</p>
      </Drawer>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop overlay is clicked', () => {
    const onClose = vi.fn()
    render(
      <Drawer isOpen={true} onClose={onClose} title="Add Account">
        <p>Content</p>
      </Drawer>
    )
    const backdrop = screen.getByTestId('bottom-sheet-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [x] **Step 2: Run Vitest to confirm `tests/components/ui/Drawer.test.tsx` fails**

Run:
```bash
npx vitest run tests/components/ui/Drawer.test.tsx
```
Expected: FAIL (missing `bottom-sheet-backdrop` / scroll lock on old `Drawer`).

- [x] **Step 3: Implement `components/ui/BottomSheet.tsx` and update `components/ui/Drawer.tsx`**

Create `components/ui/BottomSheet.tsx`:

```tsx
'use client'

import { type ReactNode, useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  cancelLabel?: string
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, cancelLabel = 'Cancel', children }: Props) {
  const titleId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)

    const focusable = sheetRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, button:not([data-close-sheet])'
    )
    if (focusable) focusable.focus()
    else sheetRef.current?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        data-testid="bottom-sheet-backdrop"
        className="fixed inset-0 z-40 bg-ink/55 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] w-full flex-col rounded-t-[28px] border-t border-separator bg-surface px-5 pt-3 pb-7 shadow-2xl outline-none lg:inset-auto lg:left-1/2 lg:top-1/2 lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[24px] lg:border lg:p-6"
      >
        <div className="mb-3 flex justify-center lg:hidden" aria-hidden="true">
          <div className="h-[5px] w-10 rounded-full bg-sheet-handle" />
        </div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-h1-sm font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            data-close-sheet="true"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-body-sm font-semibold text-text-secondary hover:bg-canvas hover:text-ink"
            aria-label={cancelLabel}
          >
            <span className="lg:hidden">{cancelLabel}</span>
            <X size={18} className="hidden lg:block" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
```

Update `components/ui/Drawer.tsx`:

```tsx
'use client'

import { type ReactNode } from 'react'
import { BottomSheet } from './BottomSheet'

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Drawer({ isOpen, onClose, title, children }: Props) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      {children}
    </BottomSheet>
  )
}
```

- [x] **Step 4: Run `tests/components/ui/Drawer.test.tsx` to verify PASS**

Run:
```bash
npx vitest run tests/components/ui/Drawer.test.tsx
```
Expected: PASS (4 tests).

- [x] **Step 5: Create `Button.tsx`, `Input.tsx`, `Card.tsx`, `TransactionRow.tsx`, `QuickAction.tsx`, `AccountPill.tsx`, and update `StatusBadge.tsx`, `SummaryCard.tsx`, `AsOfPicker.tsx`**

Implement each component matching `00 — Foundations` in `new_design.pen` and Section 3 of the spec, using only the named typography tokens (`text-display`, `text-display-sm`, `text-h1`, `text-h1-sm`, `text-h2`, `text-body`, `text-body-sm`, `text-caption`, `text-label`).

- [x] **Step 6: Run type-check and all unit tests**

Run:
```bash
npx tsc --noEmit && npm run test:run
```
Expected: 0 TypeScript errors, 13 test files passing.

- [x] **Step 7: Commit**

```bash
git add components/ui/ tests/components/ui/Drawer.test.tsx
git commit -m "feat(ui): add Foundations shared UI components and BottomSheet Drawer wrapper with tests"
```

---

### Task 3: App Shell (`TabBar`, Desktop Glass `Sidebar`, `ScreenHero`, `WealthNav`, `AppLayout`)

**Files:**
- Create: `components/layout/TabBar.tsx`
- Modify: `components/layout/NavItem.tsx`
- Modify: `components/layout/Sidebar.tsx`
- Modify: `components/layout/PageHeader.tsx`
- Create: `components/layout/ScreenHero.tsx`
- Create: `components/layout/WealthNav.tsx`
- Modify: `app/(app)/layout.tsx`

- [x] **Step 1: Create `components/layout/TabBar.tsx` with Dark Smoked Liquid Glass capsule and `"More"` `BottomSheet`**

Implement the 5 tabs (`Home` / `Início`, `Transactions` / `Transações`, `Budgets` / `Orçamentos`, `Wealth` / `Património`, `More` / `Mais`) with `House`, `ArrowLeftRight`, `PieChart`, `TrendingUp`, and `Ellipsis` icons, safe-area inset bottom padding, luminous active pill (`#FFFFFF33 → #FFFFFF1A`, `#FFFFFF40` border), and the `"More"` `BottomSheet` linking to `/accounts`, `/recurring-bills`, `/transactions/import`, `/settings`, `/account`, plus a **Sign out** form button (`<form action={signOut}>` importing `signOut` from `@/app/(auth)/login/actions`).

- [x] **Step 2: Update `NavItem.tsx` and `Sidebar.tsx` to match the `01b` Desktop Smoked Glass Sidebar**

Update `Sidebar.tsx` to `w-[260px]`, linear gradient `180deg` `#182235E0 → #0D1525` over `#0A0F1C`, right border `border-glass-08`, `/logo.png` + `"Norte"` brand header, `NavItem.tsx` with the luminous Liquid Glass active pill, and a **Sign out** form button in the bottom nav section alongside `Settings` and `My Account`.

- [x] **Step 3: Create `ScreenHero.tsx` and `WealthNav.tsx`, and update `PageHeader.tsx` & `app/(app)/layout.tsx`**

Ensure neither `ScreenHero` nor `PageHeader` renders a dead notification bell button (keeping only the `actions` prop slot). Update `app/(app)/layout.tsx` to render `<Sidebar />`, `<main className="flex flex-1 flex-col overflow-y-auto bg-canvas">`, and `<TabBar />`.

- [x] **Step 4: Run type-check and unit tests**

Run:
```bash
npx tsc --noEmit && npm run test:run
```
Expected: 0 TypeScript errors, all tests passing.

- [x] **Step 5: Commit**

```bash
git add components/layout/ app/\(app\)/layout.tsx
git commit -m "feat(shell): add mobile Liquid Glass TabBar, desktop glass Sidebar, and ScreenHero"
```

---

### Task 4: Dashboard Screen (Mobile `01` + Desktop `01b`)

**Files:**
- Create: `app/(app)/dashboard/_components/DashboardQuickActions.tsx`
- Modify: `app/(app)/dashboard/_components/SpendingCard.tsx`
- Modify: `app/(app)/dashboard/_components/RecentTransactionsPanel.tsx`
- Modify: `app/(app)/dashboard/_components/UpcomingBillsPanel.tsx`
- Modify: `app/(app)/dashboard/page.tsx`

- [x] **Step 1: Create `DashboardQuickActions.tsx` wiring `Add`, `Import CSV`, `Transfer`, and `Add Bill` to imported `AddTransactionDrawer` & `AddBillDrawer`**

Render the 4 `QuickAction` buttons and trigger the hidden mounted `<AddTransactionDrawer accounts={accounts} categories={categories} />` (for `Add` and `Transfer`) and `<AddBillDrawer accounts={accounts} categories={categories} />` (for `Add Bill`) without modifying `AddTransactionDrawer.tsx`.

- [x] **Step 2: Update `SpendingCard.tsx`, `RecentTransactionsPanel.tsx`, and `UpcomingBillsPanel.tsx`**

Use `TransactionRow` for recent transactions and upcoming bills, and match the `01` (mobile `#F4F5F7` card) and `01b` (desktop `#FFFFFF` card with remaining budget footer) layouts.

- [x] **Step 3: Update `app/(app)/dashboard/page.tsx` for responsive `01` (mobile) and `01b` (desktop) layouts**

Fetch active `accounts` alongside existing queries; compute GBP exposure from `netWorth.breakdown`; render the mobile hero + white bottom sheet (`lg:hidden`) and desktop utility header + hero banner + 2-column asymmetric grid (`hidden lg:flex`).

- [x] **Step 4: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Run `npx tsc --noEmit && npm run test:run`, capture Playwright screenshots at `390×844` and `1440×900` in EN and PT-PT, compare against `01 — Dashboard` (`abtTa`) and `01b — Dashboard (Desktop)` (`zYivG`), and fix any spacing/type/clipping differences.

- [x] **Step 5: Commit**

```bash
git add app/\(app\)/dashboard/
git commit -m "feat(dashboard): redesign mobile and desktop Dashboard screens"
```

---

### Task 5: Login Screen (`10 — Login`)

**Files:**
- Modify: `app/(auth)/layout.tsx`
- Modify: `app/(auth)/login/_components/LoginForm.tsx`

- [x] **Step 1: Update `app/(auth)/layout.tsx` and `app/(auth)/login/_components/LoginForm.tsx` to match `10 — Login`**

Render the full-bleed Norte gradient (`#0D1525 → #0EB5D4 → #0A6C82`), top brand bar (`Norte` + `"Private"` glass pill), centered `64×64` `/logo.png` + `"NORTE"` display heading + subtitle, and the `rounded-[24px]` white authentication card with filled `Input` components, full-width primary pill `Button`, magic-link toggle, and private single-user security note.

- [x] **Step 2: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Compare against `10 — Login` (`k3qTHx`) and verify zero clipping or alignment issues.

- [x] **Step 3: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat(auth): redesign Login screen to match 10 — Login artboard"
```

---

### Task 6: Accounts Screen (`04 — Accounts` & `04b — Add Account`)

**Files:**
- Modify: `app/(app)/accounts/page.tsx`
- Modify: `app/(app)/accounts/_components/AccountsSummary.tsx`
- Modify: `app/(app)/accounts/_components/AccountCard.tsx`
- Modify: `app/(app)/accounts/_components/AddAccountDrawer.tsx`

- [x] **Step 1: Update `AccountCard.tsx`, `AccountsSummary.tsx`, `AddAccountDrawer.tsx`, and `accounts/page.tsx`**

Use `ScreenHero` with total balance in reporting currency and FX rate subtitle; show native balance (`EUR` or `GBP`) and muted `≈ €` conversion on GBP cards, CSV import link, and delete button (**no edit button**); restyle `AddAccountDrawer` with filled `Input`/`Select` and full-width pill `Button`.

- [x] **Step 2: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Compare against `04 — Accounts` (`Qmfpt`) and `04b — Add Account` (`e4OPdY`).

- [x] **Step 3: Commit**

```bash
git add app/\(app\)/accounts/
git commit -m "feat(accounts): redesign Accounts screen and AddAccountDrawer"
```

---

### Task 7: Budgets Screen (`05 — Budgets` & `05b — Add Budget`)

**Files:**
- Modify: `app/(app)/budgets/page.tsx`
- Modify: `app/(app)/budgets/_components/BudgetSummary.tsx`
- Modify: `app/(app)/budgets/_components/BudgetTable.tsx`
- Modify: `app/(app)/budgets/_components/BudgetVarianceWidget.tsx`
- Modify: `app/(app)/budgets/_components/AddBudgetDrawer.tsx`

- [x] **Step 1: Update `budgets/page.tsx`, `BudgetSummary.tsx`, `BudgetTable.tsx`, `BudgetVarianceWidget.tsx`, and `AddBudgetDrawer.tsx`**

Use `ScreenHero` with month navigation pills and spent/budgeted hero summary; render `#F4F5F7` category progress cards on mobile (`#0EB5D4`, `#EF4444` over budget, `#059669` low usage) with edit triggers, restyled desktop table + 3-month variance widget, and filled-input `AddBudgetDrawer`.

- [x] **Step 2: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Compare against `05 — Budgets` (`ewPRn`) and `05b — Add Budget` (`cyrEh`).

- [x] **Step 3: Commit**

```bash
git add app/\(app\)/budgets/
git commit -m "feat(budgets): redesign Budgets screen, progress cards, and AddBudgetDrawer"
```

---

### Task 8: Recurring Bills Screen (`06 — Recurring Bills` & `06b — Add Bill`)

**Files:**
- Modify: `app/(app)/recurring-bills/page.tsx`
- Modify: `app/(app)/recurring-bills/_components/BillsSummary.tsx`
- Modify: `app/(app)/recurring-bills/_components/BillsTable.tsx`
- Modify: `app/(app)/recurring-bills/_components/MarkPaidButton.tsx`
- Modify: `app/(app)/recurring-bills/_components/AddBillDrawer.tsx`

- [x] **Step 1: Update `recurring-bills/page.tsx`, `BillsSummary.tsx`, `BillsTable.tsx`, `MarkPaidButton.tsx`, and `AddBillDrawer.tsx`**

Use `ScreenHero` with monthly EUR commitment total and 30-day due count; render `#F4F5F7` bill cards on mobile and clean table on desktop with native currency + EUR equivalent for GBP bills, pill-styled `MarkPaidButton`, and filled-input `AddBillDrawer`.

- [x] **Step 2: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Compare against `06 — Recurring Bills` (`N9Cb1l`) and `06b — Add Bill` (`V14l3`).

- [x] **Step 3: Commit**

```bash
git add app/\(app\)/recurring-bills/
git commit -m "feat(bills): redesign Recurring Bills screen, MarkPaidButton, and AddBillDrawer"
```

---

### Task 9: Investments Screen (`07 — Investments` & `07b — Add Holding`)

**Files:**
- Modify: `app/(app)/investments/page.tsx`
- Modify: `app/(app)/investments/_components/InvestmentsSummary.tsx`
- Modify: `app/(app)/investments/_components/HoldingsTable.tsx`
- Modify: `app/(app)/investments/_components/RefreshPricesButton.tsx`
- Modify: `app/(app)/investments/_components/AddHoldingDrawer.tsx`

- [ ] **Step 1: Update `investments/page.tsx`, `InvestmentsSummary.tsx`, `HoldingsTable.tsx`, `RefreshPricesButton.tsx`, and `AddHoldingDrawer.tsx`**

Use `ScreenHero` with `WealthNav`, portfolio EUR total, total P&L subtitle, `RefreshPricesButton` + `AddHoldingDrawer` pills, mobile `#F4F5F7` holding cards with portfolio weight progress bars, desktop table, and filled-input `AddHoldingDrawer`.

- [ ] **Step 2: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Compare against `07 — Investments` (`lXMXy`) and `07b — Add Holding` (`xFaph`).

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/investments/
git commit -m "feat(investments): redesign Investments screen, holdings cards, and AddHoldingDrawer"
```

---

### Task 10: Net Worth Screen (`08 — Net Worth`)

**Files:**
- Modify: `app/(app)/net-worth/page.tsx`
- Modify: `app/(app)/net-worth/_components/NetWorthSummary.tsx`
- Modify: `app/(app)/net-worth/_components/NetWorthChart.tsx`
- Modify: `app/(app)/net-worth/_components/BreakdownTable.tsx`
- Modify: `app/(app)/net-worth/_components/SnapshotHistory.tsx`

- [ ] **Step 1: Update `net-worth/page.tsx`, `NetWorthSummary.tsx`, `NetWorthChart.tsx`, `BreakdownTable.tsx`, and `SnapshotHistory.tsx`**

Use `ScreenHero` with `WealthNav`, total Net Worth, 30d/YTD change subtitle, client-side range filter pills (`1M`, `3M`, `6M`, `1Y`, `ALL`) in `NetWorthChart.tsx`, Cash vs Investments allocation cards with `#0EB5D4` and `#2563EB` progress bars in `BreakdownTable.tsx`, and restyled `SnapshotHistory.tsx`.

- [ ] **Step 2: Verify TypeScript, tests, and Playwright screenshots (`390×844` & `1440×900`, EN & PT-PT)**

Compare against `08 — Net Worth` (`y3o1a2`). Confirm `git status` shows zero changes to `app/(app)/transactions/**`, `app/(app)/settings/**`, `lib/category-rules.ts`, `schema.sql`, or `types/database.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/net-worth/
git commit -m "feat(net-worth): redesign Net Worth screen, allocation cards, and client range chart"
```
