# Norte Redesign — Wave 1 Implementation Specification

**Date:** 2026-11-06
**Branch:** `feat/redesign` (in isolated worktree `.worktrees/feat-redesign`)
**Design Source:** `new_design/new_design.pen`, `new_design/DESIGN_BRIEF.md`
**Scope:** Wave 1 UI-only redesign (Design Tokens, Shared UI, App Shell, Dashboard, Login, Accounts, Budgets, Recurring Bills, Investments, Net Worth)

---

## 1. Goals & Non-Goals

### Goals
- Implement the Revolut-inspired Norte visual language from `new_design/new_design.pen` (`00 — Foundations`, `01`, `01b`, `04`, `04b`, `05`, `05b`, `06`, `06b`, `07`, `07b`, `08`, `10`).
- Consolidate hard-coded `.pen` colours and drifted font sizes into semantic Tailwind v4 `@theme` tokens in `app/globals.css` with **Manrope** (`next/font/google`) — **zero raw hex colours in `className`**.
- Use **one responsive breakpoint (`lg` / `1024px`) everywhere**: mobile/desktop switches at `lg` across `TabBar`/`Sidebar`, `ScreenHero`/utility header, `BottomSheet`/modal, and mobile cards/desktop tables.
- Preserve every existing CSS token name as a backwards-compatible alias so `category-rules` components (`TransactionTable`, `CategoryCell`, `RulesSection`) continue working without modification until Wave 2.
- Build the `00 — Foundations` component library in `components/ui/` (`Button`, `Input`, `Card`, `BottomSheet`, `Drawer` wrapper, `TransactionRow`, `QuickAction`, `AccountPill`, `StatusBadge`).
- Replace the app shell with the mobile floating **Dark Smoked Liquid Glass `TabBar`** (`390px` viewport) and the desktop **Dark Smoked Glass Sidebar** (`>= 1024px` / `1440px` viewport), plus the `"More"` bottom sheet, keeping **Sign out** reachable in both the desktop sidebar bottom nav and the mobile `"More"` sheet.
- Restyle all Wave 1 screens (Dashboard mobile + desktop, Login, Accounts, Budgets, Recurring Bills, Investments, Net Worth) in both **EN** and **PT-PT** with zero dead buttons.

### Non-Goals / Out of Scope for Wave 1
- **No backend or domain logic changes:** Do not change server actions, database queries, `schema.sql`, `types/database.ts`, or `lib/category-rules.ts`.
- **Do not touch `category-rules` files:** Everything under `app/(app)/transactions/**` and `app/(app)/settings/**` is out of scope for Wave 1 and will be redesigned in Wave 2 after `main` (with `category-rules`) is merged/rebased.
- **No destructive i18n edits:** Only add new keys to `messages/en.json` and `messages/pt-PT.json`; never rename or delete existing keys.
- **No dead UI controls:** Omit the notification bell button from mobile and desktop headers (keeping an optional `actions` slot in the header component for future use).

---

## 2. Design Tokens & Typography (`app/globals.css` & `app/layout.tsx`)

### 2.1 Font Loading (`app/layout.tsx`)
Replace `Inter` with `Manrope` from `next/font/google`:
- Subsets: `['latin']`
- Weights: `['400', '500', '600', '700', '800']`
- Variable: `--font-manrope` (and applied via `manrope.className` on `<body>`)

### 2.2 Semantic Colour Tokens (`app/globals.css` `@theme`)
No raw hex values (`bg-[#...]`, `text-[#...]`) are permitted in component `className` strings. Every surface, disabled state, sheet handle, and `TransactionRow` tint pair has a dedicated semantic token in `@theme`:

| Token (`@theme`) | Value | Usage |
|---|---|---|
| `--color-ink` | `#0D1525` | Primary text, dark CTAs, hero gradient start, sidebar base |
| `--color-ink-deep` | `#0A0F1C` | Deep navy gradient end |
| `--color-ink-slate` | `#182235` | Smoked glass top stop |
| `--color-teal` | `#0EB5D4` | Primary brand CTA, active accents, links, progress bars |
| `--color-teal-deep` | `#0A8FA8` | Pressed/hover state for primary teal |
| `--color-teal-dark` | `#0A6C82` | Hero gradient end stop |
| `--color-teal-tint` | `#CFFAFE` | Secondary button fill on light surfaces & `teal` icon tint bg |
| `--color-canvas` | `#F4F5F7` | Page background canvas, muted cards inside sheets, filled inputs, `slate` icon tint bg |
| `--color-surface` | `#FFFFFF` | Cards, sheets, modals, table containers |
| `--color-text-secondary` | `#64748B` | Subtitles, secondary labels, metadata, `slate` icon tint fg |
| `--color-text-muted` | `#94A3B8` | Placeholders, tertiary hints |
| `--color-separator` | `#E2E8F0` | Card borders, input borders, progress bar tracks |
| `--color-separator-subtle` | `#F1F5F9` | Subtle list row dividers |
| `--color-disabled-bg` | `#E5E7EB` | Disabled button background |
| `--color-disabled-text` | `#9CA3AF` | Disabled button text |
| `--color-sheet-handle` | `#CBD5E1` | BottomSheet drag handle pill |
| `--color-positive` | `#059669` | Positive amounts, income, on-track badges, `emerald` icon tint fg |
| `--color-positive-tint` | `#DCFCE7` | Positive badge & `emerald` icon circle background |
| `--color-negative` | `#EF4444` | Negative/over-budget alerts, destructive actions, errors |
| `--color-negative-tint` | `#FEE2E2` | Negative badge/alert background |
| `--color-warning` | `#F59E0B` | GBP exposure accent, warning status |
| `--color-warning-deep` | `#D97706` | `amber` icon circle foreground on light tint |
| `--color-warning-tint` | `#FEF3C7` | Warning badge & `amber` icon circle background |
| `--color-info` | `#2563EB` | Secondary allocation bar & `blue` icon circle foreground |
| `--color-info-tint` | `#DBEAFE` | `blue` icon circle background |
| `--color-purple` | `#9333EA` | `purple` (subscriptions) icon circle foreground |
| `--color-purple-tint` | `#F3E8FF` | `purple` (subscriptions) icon circle background |

### 2.3 Liquid Glass & Translucent White Tokens (`@theme`)

| Token (`@theme`) | Value | Usage |
|---|---|---|
| `--color-glass-08` | `rgba(255, 255, 255, 0.08)` | Sidebar inner border & divider (`8%` white) |
| `--color-glass-10` | `rgba(255, 255, 255, 0.10)` | Active glass pill bottom stop & inner bottom glow (`10%` white) |
| `--color-glass-12` | `rgba(255, 255, 255, 0.12)` | QuickAction glass circles & AccountPill fill (`12%` white) |
| `--color-glass-15` | `rgba(255, 255, 255, 0.15)` | Mobile hero header action pill fill (`15%` white) |
| `--color-glass-20` | `rgba(255, 255, 255, 0.20)` | Active glass pill top stop & rim reflection (`20%` white) |
| `--color-glass-25` | `rgba(255, 255, 255, 0.25)` | Active glass pill inner stroke & top highlight (`25%` white) |
| `--color-glass-30` | `rgba(255, 255, 255, 0.30)` | Hero pill stroke & inner specular shadow (`30%` white) |
| `--color-glass-40` | `rgba(255, 255, 255, 0.40)` | TabBar outer specular rim top-left catch-light (`40%` white) |
| `--color-glass-60` | `rgba(255, 255, 255, 0.60)` | Inactive TabBar & Sidebar nav icons/labels (`60%` white) |
| `--color-glass-70` | `rgba(255, 255, 255, 0.70)` | Hero metric top label (`70%` white) |
| `--color-glass-80` | `rgba(255, 255, 255, 0.80)` | Hero metric subtitle/exposure text (`80%` white) |

### 2.4 Backwards-Compatible Legacy Aliases (`@theme`)
Verified via grep across `app/(app)/transactions/**`, `app/(app)/settings/**` (`TransactionTable.tsx`, `CategoryCell.tsx`, `RulesSection.tsx`, `TransactionFilters.tsx`, `TransactionSummary.tsx`, `AddTransactionDrawer.tsx`, `import/page.tsx`, `SettingsForm.tsx`, `CategoriesSection.tsx`), and `app/(app)/account/**`, those files reference these 14 custom tokens (`accent`, `accent-light`, `card-bg`, `content-bg`, `danger-bg`, `good-bg`, `warn-bg`, `status-good`, `status-warn`, `status-danger`, `border-col`, `text-primary`, `text-secondary`, `text-tertiary`). All 14 — plus the legacy nav/icon tokens — remain defined in `@theme`:

- `--color-sidebar-bg: var(--color-ink)` (`#0D1525`)
- `--color-content-bg: var(--color-canvas)` (`#F4F5F7`)
- `--color-card-bg: var(--color-surface)` (`#FFFFFF`)
- `--color-accent: var(--color-teal)` (`#0EB5D4`)
- `--color-accent-light: #E0F7FC`
- `--color-text-primary: var(--color-ink)` (`#0D1525`)
- `--color-text-secondary: #64748B`
- `--color-text-tertiary: var(--color-text-muted)` (`#94A3B8`)
- `--color-border-col: var(--color-separator)` (`#E2E8F0`)
- `--color-nav-icon-col: #4A6890`
- `--color-nav-active-bg: #162236`
- `--color-status-good: var(--color-positive)` (`#059669`)
- `--color-status-warn: var(--color-warning)` (`#F59E0B`)
- `--color-status-danger: var(--color-negative)` (`#EF4444`)
- `--color-good-bg: var(--color-positive-tint)` (`#DCFCE7`)
- `--color-warn-bg: var(--color-warning-tint)` (`#FEF3C7`)
- `--color-danger-bg: var(--color-negative-tint)` (`#FEE2E2`)
- `--color-warn-icon-bg: var(--color-warning-tint)` (`#FEF3C7`)
- `--color-good-icon-bg: var(--color-positive-tint)` (`#DCFCE7`)

> **Note:** Pointing these legacy aliases at the new semantic tokens (`content-bg`: `#F0F4F8 → #F4F5F7`, `text-primary`: `#0F172A → #0D1525`, `status-good`: `#22C55E → #059669`, plus Manrope font) slightly updates the appearance of out-of-scope pages (`Transactions`, `Settings`, `My Account`) during Wave 1. This is expected and keeps the palette unified before Wave 2.

### 2.5 Typography Scale Tokens & `.pen` Drift Mapping
Every permitted font size is defined as an explicit named token in `@theme`. Screens and components **must only** use these 9 named size tokens (`text-display`, `text-display-sm`, `text-h1`, `text-h1-sm`, `text-h2`, `text-body`, `text-body-sm`, `text-caption`, `text-label`):

| Token Name (`@theme`) | Utility Class | Size (`px` / `rem`) | Line Height | Default Weight | `.pen` Drifted Sizes Mapped Into This Token |
|---|---|---|---|---|---|
| `--text-display` | `text-display` | `40px` (`2.5rem`) | `1.1` | `800` (ExtraBold) | `44px` (Foundations title), `42px` (Desktop hero Net Worth), `40px` (Foundations Display), `38px` (Mobile Dashboard hero Net Worth), `36px` (Login `"NORTE"` hero title) |
| `--text-display-sm` | `text-display-sm` | `32px` (`2rem`) | `1.15` | `800` (ExtraBold) | `32px` (Mobile hero primary metrics on Accounts, Budgets, Bills, Investments, Net Worth), `30px` |
| `--text-h1` | `text-h1` | `28px` (`1.75rem`) | `1.2` | `700` (Bold) | `28px` (Foundations H1, Desktop page title, Desktop Spending card figure) |
| `--text-h1-sm` | `text-h1-sm` | `22px` (`1.375rem`) | `1.25` | `700` (Bold) | `24px` (Card big-value, Mobile Spending card figure), `22px` (BottomSheet titles `04b–07b`, Login `"Welcome back"`) |
| `--text-h2` | `text-h2` | `20px` (`1.25rem`) | `1.3` | `700` / `600` | `20px` (Foundations H2, Brand `"Norte"` wordmark, Mobile hero screen titles), `18px` (Foundations BottomSheet title, Desktop `"Recent transactions"` header) |
| `--text-body` | `text-body` | `16px` (`1rem`) | `1.5` | `400` / `600` / `700` | `16px` (Foundations Body, Mobile section headers), `15px` (`TransactionRow` merchant & amount, `Button` large CTA text, `Input` text in Foundations) |
| `--text-body-sm` | `text-body-sm` | `14px` (`0.875rem`) | `1.45` | `500` / `600` | `14px` (Foundations `Button` label, `Card` title, Sidebar nav items, filled `Input` value, `BottomSheet` cancel action) |
| `--text-caption` | `text-caption` | `12px` (`0.75rem`) | `1.4` | `400` / `500` / `600` | `13px` (`AccountPill` label, `"See all"` link, hero label, Login subtitle), `12px` (Foundations Caption, `TransactionRow` subtitle, hero exposure subtitle, header action pills, Desktop utility pills) |
| `--text-label` | `text-label` | `11px` (`0.6875rem`) | `1.3` | `500` / `600` / `700` | `11px` (Foundations Label, `TabBar` labels, `QuickAction` labels, filled `Input` top label, `StatusBadge`), `10px` (Foundations section headers) |

---

## 3. Shared UI Components (`components/ui/`)

### 3.1 `Button.tsx` (`EuRx0` + `00 — Foundations` Button Gallery)
- **Props:**
  - `variant?: 'primary' | 'secondary' | 'ghost' | 'dark' | 'glass' | 'danger'` (default `'primary'`)
  - `size?: 'sm' | 'md' | 'lg'` (default `'md'`)
  - `fullWidth?: boolean`
  - Standard `<button>` attributes (`type`, `disabled`, `onClick`, `className`, `children`)
- **Styling (token-only, zero raw hex):**
  - Base: `inline-flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed`
  - Sizes:
    - `sm`: `h-8 px-3 rounded-full text-caption` (`32px` tall pill for headers and inline actions like `"Mark paid"` / `"+ Add"`)
    - `md`: `h-11 px-5 rounded-full text-body-sm` (`44px` tall pill)
    - `lg`: `h-[52px] px-6 rounded-full text-body font-bold` (`52px` full-width sheet/auth CTA)
  - Variants:
    - `primary`: `bg-teal text-white hover:bg-teal-deep`
    - `secondary`: `bg-teal-tint text-teal hover:opacity-90`
    - `ghost`: `bg-transparent text-teal hover:bg-teal/10`
    - `dark`: `bg-ink text-white hover:bg-ink-slate`
    - `glass`: `bg-glass-15 text-white border border-glass-30 hover:bg-glass-20`
    - `danger`: `bg-negative-tint text-negative hover:bg-negative/20`

### 3.2 `Input.tsx` (`GYeKV` + Filled Sheet Inputs)
- Exports `Input` and `Select`.
- **Props:**
  - `label?: string`
  - `error?: string`
  - `hint?: string`
  - `variant?: 'filled' | 'bordered'` (default `'filled'`)
  - Standard `<input>` / `<select>` props (`id`, `name`, `required`, etc.)
- **Styling:**
  - `filled` variant (matching `04b–07b` and `10 — Login`):
    - Container: `flex flex-col justify-center gap-0.5 rounded-xl bg-canvas px-3.5 py-2 min-h-[56px] border border-transparent focus-within:border-teal focus-within:bg-teal/5` (or `border-negative bg-negative/5` when `error` is set).
    - Top stacked label: `text-label font-medium text-text-secondary` (`text-teal` on focus-within, `text-negative` on error).
    - Native `<input>` / `<select>`: `w-full bg-transparent text-body-sm font-semibold text-ink placeholder:text-text-muted placeholder:font-normal outline-none`.
  - `bordered` variant (matching `GYeKV`):
    - Label above (`text-caption font-medium text-text-secondary`), field (`h-11 rounded-[10px] border border-separator bg-surface px-3.5 text-body-sm text-ink focus:border-teal outline-none`).

### 3.3 `Card.tsx` (`rq5IY`)
- **Props:**
  - `title?: ReactNode`
  - `trailing?: ReactNode`
  - `variant?: 'surface' | 'muted'` (default `'surface'`)
  - `className?: string`
  - `children: ReactNode`
- **Styling:**
  - `surface`: `rounded-[20px] bg-surface border border-separator/80 p-5 shadow-xs`
  - `muted`: `rounded-[16px] bg-canvas p-4` (used inside mobile `#FFFFFF` bottom sheets)
  - Optional header row (`flex items-center justify-between gap-2`) when `title` or `trailing` is passed.

### 3.4 `BottomSheet.tsx` (`NJVBT`) & `Drawer.tsx` Wrapper
- **`BottomSheet` Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `title: string`
  - `cancelLabel?: string`
  - `children: ReactNode`
- **Behaviour & Accessibility:**
  - Returns `null` when `!isOpen`.
  - Locks page scroll (`document.body.style.overflow = 'hidden'`) while open and restores on unmount/close.
  - Listens for `Escape` keydown to invoke `onClose()`.
  - Moves focus into the dialog container on open (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).
  - Clicking the backdrop (`fixed inset-0 z-40 bg-ink/55 backdrop-blur-[2px]`) invokes `onClose()`.
- **Layout (switches at `lg` to match the single breakpoint rule):**
  - Mobile (`< lg`): Fixed bottom sheet (`fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-[28px] bg-surface px-5 pt-3 pb-7 shadow-2xl`) with a centered drag handle (`h-[5px] w-10 rounded-full bg-sheet-handle`), title row (`text-h1-sm font-bold text-ink` + `"Cancel"` button in `text-body-sm font-semibold text-text-secondary`), and scrollable body (`overflow-y-auto`).
  - Desktop (`>= lg`): Centered modal (`lg:inset-auto lg:left-1/2 lg:top-1/2 lg:w-full lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[24px] lg:border lg:border-separator lg:p-6`).
- **`Drawer.tsx` Wrapper:**
  - Keeps the exact signature `export function Drawer({ isOpen, onClose, title, children }: Props)` and delegates directly to `<BottomSheet isOpen={isOpen} onClose={onClose} title={title}>{children}</BottomSheet>`.
  - Verified by unit tests in `tests/components/ui/Drawer.test.tsx` (render when open, hidden when closed, Escape key, overlay click, focus management, body scroll lock).

### 3.5 `TransactionRow.tsx` (`YeYyc`)
- **Props:**
  - `title: string`
  - `subtitle: string`
  - `amount: string`
  - `secondaryAmount?: string`
  - `isPositive?: boolean`
  - `isTransfer?: boolean`
  - `categoryName?: string | null`
  - `icon?: LucideIcon`
  - `iconTone?: 'emerald' | 'amber' | 'blue' | 'purple' | 'teal' | 'slate'`
  - `trailingAction?: ReactNode`
- **Styling (token-only icon tint pairs):**
  - `emerald`: `bg-positive-tint text-positive`
  - `amber`: `bg-warning-tint text-warning-deep`
  - `blue`: `bg-info-tint text-info`
  - `purple`: `bg-purple-tint text-purple`
  - `teal`: `bg-teal-tint text-teal`
  - `slate`: `bg-canvas text-text-secondary`
  - Middle column (`flex-1 min-w-0 flex flex-col gap-0.5`): `title` (`text-body font-semibold text-ink truncate`) + `subtitle` (`text-caption text-text-secondary truncate`).
  - Right column (`shrink-0 flex flex-col items-end gap-0.5`): `amount` (`text-body font-semibold tabular-nums` in `text-positive` when `isPositive`, `text-text-secondary` when `isTransfer`, `text-ink` for standard expenses) + optional `secondaryAmount` (`text-caption text-text-secondary tabular-nums`) or `trailingAction`.

### 3.6 `QuickAction.tsx` (`toLWw`)
- **Props:**
  - `icon: LucideIcon`
  - `label: string`
  - `variant?: 'primary' | 'glass'` (default `'glass'`)
  - `href?: string`
  - `onClick?: () => void`
- **Styling:**
  - `w-16 flex flex-col items-center justify-center gap-2 group cursor-pointer`
  - Circle (`h-14 w-14 rounded-full flex items-center justify-center transition-transform group-active:scale-95`):
    - `primary`: `bg-surface text-teal shadow-sm`
    - `glass`: `bg-glass-12 text-white border border-glass-20 hover:bg-glass-20`
  - Label: `text-label font-medium text-white text-center leading-tight`

### 3.7 `AccountPill.tsx` (`kKfB9`)
- **Props:**
  - `label: string`
  - `href?: string` (default `'/accounts'`)
- **Styling:**
  - `inline-flex items-center justify-center gap-1.5 rounded-full bg-glass-12 hover:bg-glass-20 border border-glass-20 py-2 pl-4 pr-3.5 text-caption font-medium text-white transition-colors` with `ChevronRight` (`size={16}`).

### 3.8 `StatusBadge.tsx`
- Preserves existing `Props = { label: string; color?: 'good' | 'warn' | 'danger' | 'neutral' | 'accent' }` and updates typography to `text-label font-semibold rounded-full px-2.5 py-0.5`.

---

## 4. App Shell (`components/layout/` & `app/(app)/layout.tsx`)

### 4.1 Single Breakpoint Rule (`lg` / `1024px`)
Every layout and component switch between mobile and desktop uses `lg:` (`lg:hidden` vs `hidden lg:flex` / `hidden lg:block`). Never mix `sm:` or `md:` for the mobile-sheet vs desktop-table/modal transition.

### 4.2 Mobile Floating Liquid Glass `TabBar` (`components/layout/TabBar.tsx`)
- Rendered in `app/(app)/layout.tsx` below `lg` (`lg:hidden`).
- **Outer Capsule (`CIhfk`):**
  - Positioned fixed at bottom: `fixed inset-x-4 z-30 mx-auto max-w-[358px] h-16 rounded-[32px] px-1.5 py-1 flex items-center justify-between lg:hidden`
  - Safe-area offset: `bottom: calc(16px + env(safe-area-inset-bottom, 0px))`
  - Smoked glass gradient, `backdrop-filter: blur(28px)`, inner specular rim, and floating drop shadow.
- **5 Tabs & Icons:**
  1. **Home** (`House` icon): `href="/dashboard"`, EN: `"Home"`, PT-PT: `"Início"`.
  2. **Transactions** (`ArrowLeftRight` icon): `href="/transactions"`, EN: `"Transactions"`, PT-PT: `"Transações"`.
  3. **Budgets** (`PieChart` icon): `href="/budgets"`, EN: `"Budgets"`, PT-PT: `"Orçamentos"`.
  4. **Wealth** (`TrendingUp` icon): `href="/investments"` (active on `/investments` and `/net-worth`), EN: `"Wealth"`, PT-PT: `"Património"`.
  5. **More** (`Ellipsis` icon): Opens the `"More"` `BottomSheet`, EN: `"More"`, PT-PT: `"Mais"`.
- **PT-PT Label Fit (`358px` bar width):**
  - Outer width `358px` minus `12px` horizontal capsule padding = `346px` across 5 equal `flex-1` tabs = **`69.2px` per tab**.
  - Using `px-0.5 py-1` and `text-label tracking-[-0.01em] whitespace-nowrap` gives **`65.2px` inner text width**, fitting `"Orçamentos"` (`~60px`), `"Património"` (`~57px`), and `"Transações"` (`~58px`) on one line without shortening.
- **"More" BottomSheet (includes Sign out):**
  - Displays navigation rows with tinted icon circles for:
    - **Accounts** (`/accounts`, `Wallet`)
    - **Recurring Bills** (`/recurring-bills`, `RefreshCw`)
    - **Import CSV** (`/transactions/import`, `Upload`)
    - **Settings** (`/settings`, `Settings`)
    - **My Account** (`/account`, `User`)
  - Followed by a divider and a **Sign out** form button (`<form action={signOut}>` importing `signOut` from `@/app/(auth)/login/actions` with `LogOut` icon in `text-negative`).

### 4.3 Desktop Smoked Glass Sidebar (`components/layout/Sidebar.tsx` & `NavItem.tsx`)
- Visible on desktop (`hidden lg:flex h-screen w-[260px] shrink-0 flex-col justify-between px-4 pt-7 pb-6`).
- Background: smoked glass linear gradient over `bg-ink-deep`, with `border-r border-glass-08`.
- **Brand Row:** `px-3 flex items-center gap-2.5` with `30×30px` `/logo.png` and `"Norte"` (`text-h2 font-bold text-white`).
- **Primary Nav (`gap-1.5`):** `Dashboard` (`House`), `Transactions` (`ArrowLeftRight`), `Budgets` (`PieChart`), `Recurring Bills` (`RefreshCw`), `Accounts` (`Wallet`), `Investments` (`TrendingUp`), `Net Worth` (`BarChart2`).
- **Bottom Nav (`gap-1.5` after `h-px bg-glass-08` divider):**
  - `Settings` (`/settings`, `Settings`)
  - `My Account` (`/account`, `User`)
  - **Sign out** (`<form action={signOut}>` button with `LogOut` icon and `t('signOut')` label, styled to match inactive `NavItem` with `hover:text-negative`).

### 4.4 `PageHeader.tsx` & `ScreenHero.tsx`
- **`PageHeader.tsx`** remains backward-compatible (`Props = { title: string; actions?: ReactNode }`) for out-of-scope pages (`transactions`, `settings`, `account`). No notification bell button is rendered.
- **`ScreenHero.tsx`** renders the mobile Norte gradient hero + overlapping white sheet on `< lg` (`lg:hidden`) and the desktop utility header (`text-h1 font-bold text-ink` + `actions` slot, no bell button) on `>= lg` (`hidden lg:flex`).

---

## 5. Wave 1 Screens Specification

### 5.1 Screen 1: Dashboard (`app/(app)/dashboard/`) — Artboards `01` & `01b`
- **Data Fetched in `app/(app)/dashboard/page.tsx`:**
  - Keeps all existing parallel Supabase queries plus fetches active `accounts` so `AccountPill`, GBP exposure, `TransactionRow` account names, `AddTransactionDrawer`, and `AddBillDrawer` have complete data.
- **QuickActions Wiring (`_components/DashboardQuickActions.tsx`):**
  - Imports `AddTransactionDrawer` from `@/app/(app)/transactions/_components/AddTransactionDrawer` and `AddBillDrawer` from `@/app/(app)/recurring-bills/_components/AddBillDrawer` **without modifying `AddTransactionDrawer.tsx`**.
  - Renders 4 `QuickAction` buttons:
    1. **Add** (`Plus`, `variant="primary"`): Clicks the hidden mounted `AddTransactionDrawer` trigger button via a wrapper `ref`.
    2. **Import CSV** (`Upload`, `variant="glass"`): Links to `/transactions/import`.
    3. **Transfer** (`ArrowLeftRight`, `variant="glass"`): Clicks the hidden mounted `AddTransactionDrawer` trigger button via the wrapper `ref`.
    4. **Add Bill** (`Receipt`, `variant="glass"`): Clicks the hidden mounted `AddBillDrawer` trigger button via a wrapper `ref`.
  - > **Wave 2 Note:** Triggering `AddTransactionDrawer` via a wrapper `ref` click is a temporary Wave 1 bridge because `app/(app)/transactions/**` is out of scope. In Wave 2, `AddTransactionDrawer` will be refactored to accept controlled `isOpen`, `onOpenChange`, and `defaultTransfer` props.
- **Mobile (`< lg`, `01`) & Desktop (`>= lg`, `01b`) Layouts:**
  - Mobile (`lg:hidden`): Gradient hero (brand row without bell icon, Net Worth in `text-display`, GBP exposure, `AccountPill`, 4 `QuickAction`s) + overlapping white sheet (`SpendingCard` in `bg-canvas`, `RecentTransactionsPanel`, `UpcomingBillsPanel`).
  - Desktop (`hidden lg:flex`): Utility header (`"Dashboard"`, `GBP / EUR · {rate}` pill, `AsOfPicker` pill — no bell icon), `196px` full-width gradient Hero Banner, and 2-column content grid (`640px` `RecentTransactionsPanel` card on left; stacked `SpendingCard` + `UpcomingBillsPanel` cards on right).

### 5.2 Screen 2: Login (`app/(auth)/`) — Artboard `10`
- Full-bleed Norte gradient layout, top brand bar (`Norte` + `"Private"` glass pill), centered `64×64` `/logo.png` + `"NORTE"` (`text-display font-extrabold text-white`) + subtitle, and white `rounded-[24px]` auth card with filled `Input`s, `size="lg" fullWidth` primary `Button`, magic-link toggle, and private single-user security footer.

### 5.3 Screen 3: Accounts (`app/(app)/accounts/`) — Artboards `04` & `04b`
- `ScreenHero` with total balance in reporting currency, native EUR & GBP conversion note, `AsOfPicker`, and `+ Add account` pill (`AddAccountDrawer`).
- `AccountCard.tsx`: Shows native balance (`EUR` or `GBP`), muted `≈ €` conversion subtitle for GBP accounts, type/country badge, CSV import link, and delete button (**no edit button**).
- `AddAccountDrawer.tsx`: Uses `Drawer` (`BottomSheet`), filled `Input`/`Select`, and `size="lg" fullWidth` primary `Button`.

### 5.4 Screen 4: Budgets (`app/(app)/budgets/`) — Artboards `05` & `05b`
- `ScreenHero` with month navigation, spent vs budgeted hero metric, and `+ Add budget` action (`AddBudgetDrawer`).
- `BudgetTable.tsx`: Switches at `lg` (`lg:hidden` mobile `#F4F5F7` progress cards with `bg-teal` / `bg-negative` / `bg-positive` bars and edit icon trigger; `hidden lg:block` desktop table).
- `BudgetVarianceWidget.tsx` & `AddBudgetDrawer.tsx`: Restyled with the new tokens and filled inputs.

### 5.5 Screen 5: Recurring Bills (`app/(app)/recurring-bills/`) — Artboards `06` & `06b`
- `ScreenHero` with monthly EUR total, due-soon count subtitle, and `+ Add bill` action (`AddBillDrawer`).
- `BillsTable.tsx`: Switches at `lg` (`lg:hidden` mobile `#F4F5F7` cards; `hidden lg:block` desktop table) with native amount, EUR equivalent for GBP bills, `StatusBadge`, pill `MarkPaidButton`, and edit trigger.
- `AddBillDrawer.tsx`: Uses `Drawer` (`BottomSheet`), filled `Input`/`Select`, and `size="lg" fullWidth` primary `Button`.

### 5.6 Screen 6: Investments (`app/(app)/investments/`) — Artboards `07` & `07b`
- `ScreenHero` + mobile `WealthNav` (`Investments` | `Net Worth`), portfolio EUR total, total P&L subtitle, `RefreshPricesButton` + `AddHoldingDrawer` pills.
- `HoldingsTable.tsx`: Switches at `lg` (`lg:hidden` mobile `#F4F5F7` cards with portfolio weight progress bar; `hidden lg:block` desktop table), edit & delete buttons.
- `AddHoldingDrawer.tsx`: Uses `Drawer` (`BottomSheet`), filled `Input`/`Select`, and `size="lg" fullWidth` primary `Button`.

### 5.7 Screen 7: Net Worth (`app/(app)/net-worth/`) — Artboard `08`
- `ScreenHero` + mobile `WealthNav` (`Investments` | `Net Worth`), total Net Worth, 30d/YTD change subtitle, and `AsOfPicker`.
- `NetWorthChart.tsx`: Client-side range pills (`1M`, `3M`, `6M`, `1Y`, `ALL`) filtering the already-loaded `snapshots` prop in memory (zero new queries).
- `BreakdownTable.tsx` & `SnapshotHistory.tsx`: Adds Cash & Bank Accounts (`bg-teal`) and Investments & Holdings (`bg-info`) allocation progress cards above the breakdown table, and restyles snapshot history.

---

## 6. Bilingual (EN & PT-PT) Strings (`messages/en.json` & `messages/pt-PT.json`)

Only additive keys are added:
- `Nav.home`: EN `"Home"`, PT-PT `"Início"`
- `Nav.wealth`: EN `"Wealth"`, PT-PT `"Património"`
- `Nav.more`: EN `"More"`, PT-PT `"Mais"`
- `Nav.importCsv`: EN `"Import CSV"`, PT-PT `"Importar CSV"`
- `Dashboard.quickAdd`: EN `"Add"`, PT-PT `"Adicionar"`
- `Dashboard.quickImport`: EN `"Import CSV"`, PT-PT `"Importar CSV"`
- `Dashboard.quickTransfer`: EN `"Transfer"`, PT-PT `"Transferir"`
- `Dashboard.quickAddBill`: EN `"Add Bill"`, PT-PT **`"Despesa fixa"`**
- Plus additive subtitle keys for `Dashboard`, `Auth`, `Accounts`, `Budgets`, `RecurringBills`, `Investments`, and `NetWorth`.

---

## 7. Playwright Auth & Visual Verification Setup

- Gitignored `playwright/.auth/` and `playwright/screenshots/` directories in `.gitignore`.
- One-off interactive auth script `scripts/playwright-auth.mjs`: opens a headed browser at `/login`, waits for Nuno to sign in and reach `/dashboard`, and saves `playwright/.auth/user.json` via `context.storageState()`.
- Reusable screenshot runner `scripts/playwright-screenshot.mjs <route>`: loads `playwright/.auth/user.json` and captures `390×844` and `1440×900` screenshots in both `en` and `pt-PT` locales (via the `NEXT_LOCALE` cookie).
