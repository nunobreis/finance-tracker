# Norte Redesign — Wave 1 Implementation Specification

**Date:** 2026-11-06
**Branch:** `feat/redesign` (in isolated worktree `.worktrees/feat-redesign`)
**Design Source:** `new_design/new_design.pen`, `new_design/DESIGN_BRIEF.md`
**Scope:** Wave 1 UI-only redesign (Design Tokens, Shared UI, App Shell, Dashboard, Login, Accounts, Budgets, Recurring Bills, Investments, Net Worth)

---

## 1. Goals & Non-Goals

### Goals
- Implement the Revolut-inspired Norte visual language from `new_design/new_design.pen` (`00 — Foundations`, `01`, `01b`, `04`, `04b`, `05`, `05b`, `06`, `06b`, `07`, `07b`, `08`, `10`).
- Consolidate hard-coded `.pen` colours and drifted font sizes into semantic Tailwind v4 `@theme` tokens in `app/globals.css` with **Manrope** (`next/font/google`).
- Preserve every existing CSS token name as a backwards-compatible alias so `category-rules` components continue working without modification until Wave 2.
- Build the `00 — Foundations` component library in `components/ui/` (`Button`, `Input`, `Card`, `BottomSheet`, `Drawer` wrapper, `TransactionRow`, `QuickAction`, `AccountPill`, `StatusBadge`).
- Replace the app shell with the mobile floating **Dark Smoked Liquid Glass `TabBar`** (`390px` viewport) and the desktop **Dark Smoked Glass Sidebar** (`>= 1024px` / `1440px` viewport), plus the `"More"` bottom sheet.
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

| Token (`@theme`) | Value | Usage |
|---|---|---|
| `--color-ink` | `#0D1525` | Primary text, dark CTAs, hero gradient start, sidebar base |
| `--color-ink-deep` | `#0A0F1C` | Deep navy gradient end |
| `--color-ink-slate` | `#182235` | Smoked glass top stop |
| `--color-teal` | `#0EB5D4` | Primary brand CTA, active accents, links, progress bars |
| `--color-teal-deep` | `#0A8FA8` | Pressed/hover state for primary teal |
| `--color-teal-dark` | `#0A6C82` | Hero gradient end stop |
| `--color-teal-tint` | `#CFFAFE` | Secondary button fill on light surfaces |
| `--color-canvas` | `#F4F5F7` | Page background canvas, muted cards inside sheets, filled inputs |
| `--color-surface` | `#FFFFFF` | Cards, sheets, modals, table containers |
| `--color-text-secondary` | `#64748B` | Subtitles, secondary labels, metadata |
| `--color-text-muted` | `#94A3B8` | Placeholders, disabled text, tertiary hints |
| `--color-separator` | `#E2E8F0` | Card borders, input borders, progress bar tracks |
| `--color-separator-subtle` | `#F1F5F9` | Subtle list row dividers |
| `--color-positive` | `#059669` | Positive amounts, income, on-track badges |
| `--color-positive-tint` | `#DCFCE7` | Positive badge/icon circle background |
| `--color-negative` | `#EF4444` | Negative/over-budget alerts, destructive actions, errors |
| `--color-negative-tint` | `#FEE2E2` | Negative badge/alert background |
| `--color-warning` | `#F59E0B` | GBP exposure accent, warning indicators |
| `--color-warning-deep` | `#D97706` | Warning text/icon foreground on light tint |
| `--color-warning-tint` | `#FEF3C7` | Warning badge/icon circle background |
| `--color-info` | `#2563EB` | Secondary chart/allocation bar & icon accent |
| `--color-info-tint` | `#DBEAFE` | Blue icon circle background |
| `--color-purple` | `#9333EA` | Subscription icon foreground |
| `--color-purple-tint` | `#F3E8FF` | Subscription icon circle background |

### 2.3 Liquid Glass & Translucent White Tokens (`@theme`)

| Token (`@theme`) | Value | Usage |
|---|---|---|
| `--color-glass-08` | `#FFFFFF14` | Sidebar inner border & divider (`8%` white) |
| `--color-glass-10` | `#FFFFFF1A` | Active glass pill bottom stop & inner bottom glow (`10%` white) |
| `--color-glass-12` | `#FFFFFF1F` | QuickAction glass circles & AccountPill fill (`12%` white) |
| `--color-glass-15` | `#FFFFFF24` | Mobile hero header action pill fill (`15%` white) |
| `--color-glass-20` | `#FFFFFF33` | Active glass pill top stop & rim reflection (`20%` white) |
| `--color-glass-25` | `#FFFFFF40` | Active glass pill inner stroke & top highlight (`25%` white) |
| `--color-glass-30` | `#FFFFFF4D` | Hero pill stroke & inner specular shadow (`30%` white) |
| `--color-glass-40` | `#FFFFFF66` | TabBar outer specular rim top-left catch-light (`40%` white) |
| `--color-glass-60` | `#FFFFFF99` | Inactive TabBar & Sidebar nav icons/labels (`60%` white) |
| `--color-glass-70` | `#FFFFFFB3` | Hero metric top label (`70%` white) |
| `--color-glass-80` | `#FFFFFFCC` | Hero metric subtitle/exposure text (`80%` white) |

### 2.4 Backwards-Compatible Legacy Aliases (`@theme`)
All existing tokens remain defined in `@theme` so `app/(app)/transactions/**` and `app/(app)/settings/**` continue to work without changes:
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
- **Styling:**
  - Base: `inline-flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed`
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
  - `surface`: `rounded-[20px] bg-surface border border-separator/80 p-5 shadow-[0_4px_16px_rgba(13,21,37,0.04)]`
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
  - Clicking the backdrop (`fixed inset-0 z-40 bg-ink/50 backdrop-blur-[2px]`) invokes `onClose()`.
- **Layout:**
  - Mobile (`< sm`): Fixed bottom sheet (`fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-[28px] bg-surface px-5 pt-3 pb-7 shadow-2xl`) with a centered drag handle (`h-[5px] w-10 rounded-full bg-[#CBD5E1]`), title row (`text-h1-sm font-bold text-ink` + `"Cancel"` button in `text-body-sm font-semibold text-text-secondary`), and scrollable body (`overflow-y-auto`).
  - Desktop (`>= sm`): Centered modal / bottom-anchored sheet (`sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] sm:p-6`).
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
- **Styling:**
  - `flex items-center gap-3 py-2.5 w-full`
  - Left `44×44px` (`h-11 w-11 rounded-full shrink-0 flex items-center justify-center`) tinted icon circle. Automatic helper maps category names / transfer state / bill types to appropriate Lucide icons (`ShoppingCart`, `Coffee`, `TrendingUp`, `Tv`, `TrainFront`, `ArrowLeftRight`, `Home`, `Zap`, `Wifi`, `HeartPulse`, `Receipt`) and pastel tints (`#DCFCE7`/`#059669`, `#FEF3C7`/`#D97706`, `#EFF6FF`/`#2563EB`, `#F3E8FF`/`#9333EA`, `#E0F7FC`/`#0EB5D4`).
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

### 4.1 Mobile Floating Liquid Glass `TabBar` (`components/layout/TabBar.tsx`)
- Rendered in `app/(app)/layout.tsx` on mobile/tablet (`lg:hidden`).
- **Outer Capsule (`CIhfk`):**
  - Positioned fixed at bottom: `fixed inset-x-4 z-30 mx-auto max-w-[358px] h-16 rounded-[32px] p-[4px_6px] flex items-center justify-between lg:hidden`
  - Safe-area offset: `bottom: calc(16px + env(safe-area-inset-bottom, 0px))`
  - Background gradient: `linear-gradient(180deg, rgba(24, 34, 53, 0.80) 0%, rgba(13, 21, 37, 0.88) 100%)`
  - Backdrop blur: `backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px)`
  - Border & Specular Highlights: `1px solid rgba(255, 255, 255, 0.25)` with layered box-shadows:
    `inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 -1px 2px rgba(255, 255, 255, 0.10), 0 10px 28px rgba(13, 21, 37, 0.28)`
- **5 Tabs & Icons:**
  1. **Home** (`House` icon): `href="/dashboard"`, active when `pathname.startsWith('/dashboard')`. EN: `"Home"`, PT-PT: `"Início"`.
  2. **Transactions** (`ArrowLeftRight` icon): `href="/transactions"`, active when `pathname.startsWith('/transactions')`. EN: `"Transactions"`, PT-PT: `"Transações"`.
  3. **Budgets** (`PieChart` icon): `href="/budgets"`, active when `pathname.startsWith('/budgets')`. EN: `"Budgets"`, PT-PT: `"Orçamentos"`.
  4. **Wealth** (`TrendingUp` icon): `href="/investments"`, active when `pathname.startsWith('/investments') || pathname.startsWith('/net-worth')`. EN: `"Wealth"`, PT-PT: `"Património"`.
  5. **More** (`Ellipsis` icon): Opens the `"More"` `BottomSheet`, active when the sheet is open or when `pathname` is `/accounts`, `/recurring-bills`, `/settings`, or `/account`. EN: `"More"`, PT-PT: `"Mais"`.
- **PT-PT Label Fit Verification (`358px` bar width):**
  - Outer width `358px` minus `12px` horizontal capsule padding (`6px` each side) = `346px` across 5 equal `flex-1` tabs = **`69.2px` per tab**.
  - Using `px-0.5 py-1` (`2px` horizontal padding inside each tab pill) and `text-label tracking-[-0.01em] whitespace-nowrap` gives **`65.2px` inner text width**, which comfortably fits `"Orçamentos"` (`~60px`), `"Património"` (`~57px`), and `"Transações"` (`~58px`) at `11px` without clipping or truncation.
- **Active Tab Pill (`ZiaRE`):**
  - `background: linear-gradient(180deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.10) 100%)`
  - `border: 1px solid rgba(255, 255, 255, 0.25)`
  - `box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.30)`
  - Icon & label: `text-white font-semibold` (inactive tabs: `text-glass-60 font-medium`).
- **"More" BottomSheet:**
  - Uses `BottomSheet` to display clean navigation rows with tinted icon circles for:
    - **Accounts** (`/accounts`, `Wallet`)
    - **Recurring Bills** (`/recurring-bills`, `RefreshCw`)
    - **Import CSV** (`/transactions/import`, `Upload`)
    - **Settings** (`/settings`, `Settings`)
    - **My Account** (`/account`, `User`)

### 4.2 Desktop Smoked Glass Sidebar (`components/layout/Sidebar.tsx` & `NavItem.tsx`)
- Visible on desktop (`hidden lg:flex h-screen w-[260px] shrink-0 flex-col justify-between px-4 pt-7 pb-6`).
- Background: `linear-gradient(180deg, #182235E0 0%, #0D1525 100%)` over `#0A0F1C`, with `border-r border-glass-08`.
- **Brand Row:** `px-3 flex items-center gap-2.5` with `30×30px` `/logo.png` and `"Norte"` (`text-h2 font-bold text-white`).
- **Primary Nav (`gap-1.5`):**
  - `Dashboard` (`/dashboard`, `House`)
  - `Transactions` (`/transactions`, `ArrowLeftRight`)
  - `Budgets` (`/budgets`, `PieChart`)
  - `Recurring Bills` (`/recurring-bills`, `RefreshCw`)
  - `Accounts` (`/accounts`, `Wallet`)
  - `Investments` (`/investments`, `TrendingUp`)
  - `Net Worth` (`/net-worth`, `BarChart2`)
- **Bottom Nav (`gap-1.5` after `h-px bg-glass-08` divider):**
  - `Settings` (`/settings`, `Settings`)
  - `My Account` (`/account`, `User`)
- **NavItem (`NavItem.tsx`):**
  - Active state matches `01b`: `h-11 rounded-[22px] px-3.5 gap-3 text-body-sm font-semibold text-white` with `linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.10) 100%)`, `border border-glass-25`, and `shadow-[inset_0_1px_1px_rgba(255,255,255,0.30)]`.
  - Inactive state: `h-[42px] rounded-[21px] px-3.5 gap-3 text-body-sm font-medium text-glass-60 hover:bg-white/5 hover:text-white`.

### 4.3 `PageHeader.tsx` & Mobile Hero Header Pattern
- **`PageHeader.tsx`** remains backward-compatible (`Props = { title: string; actions?: ReactNode; subtitle?: ReactNode }`) so out-of-scope pages (`transactions`, `settings`, `account`) continue rendering cleanly.
- On desktop (`>= lg`), `PageHeader` renders the clean utility header bar from `01b` (`text-h1 font-bold text-ink` on the left, `actions` slot on the right — **no notification bell**).
- For Wave 1 redesigned screens (`Accounts`, `Budgets`, `Recurring Bills`, `Investments`, `Net Worth`), a shared **`ScreenHero`** component (`components/layout/ScreenHero.tsx`) renders:
  - **Mobile (`< lg`):** The Norte gradient hero (`linear-gradient(180deg, #0D1525 0%, #0EB5D4 70%, #0A6C82 100%)`, `px-5 pt-4 pb-12`) with brand logo + screen title + pill action slot on the top row, metric label (`text-caption text-glass-70`), primary metric (`text-display-sm font-extrabold text-white`), and metric subtitle (`text-caption text-glass-80`), followed by the overlapping white bottom sheet (`-mt-6 rounded-t-[24px] bg-surface px-5 pt-5 pb-28 min-h-[calc(100vh-196px)]`).
  - **Desktop (`>= lg`):** The desktop utility header (`text-h1 font-bold text-ink` + `actions` slot) above the screen's summary/hero cards on the `#F4F5F7` canvas.

---

## 5. Wave 1 Screens Specification

### 5.1 Screen 1: Dashboard (`app/(app)/dashboard/`) — Artboards `01` & `01b`
- **Data Fetched in `app/(app)/dashboard/page.tsx`:**
  - Keeps all existing parallel Supabase queries (`computeNetWorth`, `getLatestRateInfo('GBP', 'EUR')`, `budgets`, `spending`, `recurring_bills`, `transactions`, `categories`) plus fetches active `accounts` (`supabase.from('accounts').select('*').eq('is_active', true).order('created_at')`) so `AccountPill` count, GBP exposure, `TransactionRow` account names, `AddTransactionDrawer`, and `AddBillDrawer` have full data.
  - Computes GBP exposure from `netWorth.breakdown.accounts` + `netWorth.breakdown.holdings` where `currency === 'GBP'`.
- **QuickActions Wiring (`_components/DashboardQuickActions.tsx`):**
  - Imports `AddTransactionDrawer` from `@/app/(app)/transactions/_components/AddTransactionDrawer` and `AddBillDrawer` from `@/app/(app)/recurring-bills/_components/AddBillDrawer` **without modifying `AddTransactionDrawer.tsx`**.
  - Renders 4 `QuickAction` buttons:
    1. **Add** (`Plus`, `variant="primary"`): Triggers the mounted `AddTransactionDrawer` open button via a wrapper ref.
    2. **Import CSV** (`Upload`, `variant="glass"`): Links to `/transactions/import`.
    3. **Transfer** (`ArrowLeftRight`, `variant="glass"`): Triggers the mounted `AddTransactionDrawer` open button via the wrapper ref (since `AddTransactionDrawer` does not take a default-transfer prop, it opens the drawer directly per Requirement 5).
    4. **Add Bill** (`Receipt`, `variant="glass"`): Triggers the mounted `AddBillDrawer` open button.
- **Mobile Layout (`< lg`, matching `01 — Dashboard`):**
  - Norte gradient hero (`#0D1525 → #0EB5D4 → #0A6C82`):
    - Brand row: `30×30px` `/logo.png` + `"Norte"` (`text-h2 font-bold text-white`) on the left; optional `AsOfPicker` compact pill on the right (no bell icon).
    - Centered Net Worth block: label (`text-caption text-glass-70`), value (`text-display font-extrabold text-white`), GBP exposure & FX rate subtitle (`text-caption text-glass-80`).
    - Centered `AccountPill` (`"{count} accounts"` → `/accounts`).
    - 4 `QuickAction` buttons (`Add`, `Import CSV`, `Transfer`, `Add Bill`).
  - Overlapping white sheet (`-mt-6 rounded-t-[24px] bg-surface px-5 pt-6 pb-28 flex flex-col gap-5`):
    - `SpendingCard` (`variant="muted"` `#F4F5F7` card on mobile): Header (`"Spending this month"` + month label), `text-h1-sm font-extrabold text-ink` spent figure + `"of € ... budget"`, `6px`/`8px` rounded progress bar (`bg-teal` or `bg-negative` when over budget), and `% used` / `remaining` footer.
    - `RecentTransactionsPanel`: Section header (`text-body font-bold text-ink` + `"See all"` link in `text-caption font-semibold text-teal`) + 5 `TransactionRow` items.
    - `UpcomingBillsPanel`: Section header (`text-body font-bold text-ink` + `"See all"` link) + upcoming bills rendered with `TransactionRow`.
- **Desktop Layout (`>= lg`, matching `01b — Dashboard (Desktop)`):**
  - Top Utility Header (`h-11 flex items-center justify-between`):
    - Left: `"Dashboard"` (`text-h1 font-bold text-ink`).
    - Right: `GBP / EUR · {rate}` pill (`h-[38px] rounded-full bg-surface border border-separator px-3.5 flex items-center gap-2 text-caption font-semibold text-ink` with `Globe` icon in `text-teal`) + `AsOfPicker` styled as a matching `h-[38px] rounded-full bg-surface border border-separator px-3.5` pill with `Calendar` icon (no bell button).
  - Hero Banner (`h-[196px] rounded-[24px] px-9 py-7 flex items-center justify-between` with `linear-gradient(135deg, #0D1525 0%, #0EB5D4 68%, #0A6C82 100%)` and `shadow-[0_12px_28px_rgba(13,21,37,0.12)]`):
    - Left cluster: `"Total net worth"` (`text-caption font-medium text-glass-70`), Net Worth value (`text-display font-extrabold text-white`), meta row with `AccountPill` + GBP exposure subtitle (`text-caption text-glass-80`).
    - Right cluster: 4 `QuickAction` buttons (`gap-6`).
  - 2-Column Content Grid (`grid grid-cols-[minmax(0,640px)_minmax(0,1fr)] gap-6 items-start`):
    - Left Column: `RecentTransactionsPanel` in a white `rounded-[20px]` card (`p-6`), header row (`text-h2 font-bold text-ink` + `"See all"` link), and `TransactionRow` items separated by `1px` `bg-separator-subtle` dividers.
    - Right Column (`flex flex-col gap-6`):
      - `SpendingCard` in a white `rounded-[20px]` card (`p-6`), `text-h1 font-extrabold text-ink` spent figure, progress bar, and footer with `% of monthly budget` + `€ ... left` in `text-positive`.
      - `UpcomingBillsPanel` in a white `rounded-[20px]` card (`p-6`) with `TransactionRow` items for bills due in the next 30 days.

### 5.2 Screen 2: Login (`app/(auth)/layout.tsx` & `app/(auth)/login/_components/LoginForm.tsx`) — Artboard `10`
- **Full-Bleed Gradient Background (`app/(auth)/layout.tsx`):**
  - `min-h-screen w-full flex flex-col justify-between bg-[linear-gradient(180deg,#0D1525_0%,#0EB5D4_70%,#0A6C82_100%)] px-6 py-8 sm:items-center sm:justify-center`
- **Brand Header & Hero Block (`LoginForm.tsx`):**
  - Top bar: `26×26px` `/logo.png` + `"Norte"` (`text-h2 font-bold text-white`) on left; `"Private"` glass badge (`rounded-full bg-glass-15 border border-glass-30 px-3 py-1 text-caption font-semibold text-white`) on right.
  - Centered Hero Brand: `64×64px` `/logo.png`, `"NORTE"` (`text-display font-extrabold text-white tracking-tight`), and subtitle (`text-caption text-glass-80 text-center`).
- **Authentication Card:**
  - `w-full max-w-md rounded-[24px] bg-surface p-6 shadow-[0_16px_32px_rgba(13,21,37,0.25)] flex flex-col gap-4`
  - Heading (`text-h1-sm font-extrabold text-ink`) + subtitle (`text-caption text-text-secondary`).
  - Error / success alerts using `bg-negative-tint text-negative` / `bg-positive-tint text-positive`.
  - Filled `Input` for `email` (`name="email"`, `type="email"`, `required`) and `password` (`name="password"`, `type="password"`, `required`, when in password mode).
  - Full-width `Button` (`variant="primary"`, `size="lg"`, `fullWidth`) for submit (`signIn` / `sendMagicLink`).
  - Magic-link / password mode toggle button (`text-caption font-medium text-text-secondary hover:text-ink`).
  - Security footer (`text-label text-text-secondary text-center` with `Lock` icon).

### 5.3 Screen 3: Accounts (`app/(app)/accounts/`) — Artboards `04` & `04b`
- **Header / Hero (`ScreenHero`):**
  - Mobile hero shows `"Accounts"`, `+ Add account` glass pill trigger (`AddAccountDrawer`), total cash in reporting currency (`text-display-sm font-extrabold text-white`), and native EUR & GBP conversion subtitle (`1 GBP = {rate} EUR`).
  - Desktop shows utility header (`"Accounts"`, `AsOfPicker` pill, `+ Add account` primary pill) + `AccountsSummary` cards restyled to the new `Card` design.
- **Account Cards (`AccountCard.tsx`):**
  - Mobile sheet uses `bg-canvas` (`#F4F5F7`) `rounded-[16px]` cards; desktop uses `bg-surface` `rounded-[20px]` cards in a 3-column grid.
  - Displays:
    - Left: Tinted/teal initial badge + Account name (`text-body font-semibold text-ink`) + subtitle (`{typeLabel} · {account.country}` + optional `institution` in `text-caption text-text-secondary`).
    - Right: Native balance (`text-body font-bold text-ink tabular-nums` on mobile row / `text-h1-sm font-bold` on desktop card) + muted EUR equivalent (`≈ € ... at {rate}`) when `account.currency !== reportingCurrency`.
    - Bottom/Actions row: `"Import CSV"` link (`/transactions/import?account=${account.id}`, `text-caption font-semibold text-teal`) and Delete button (`Trash2` icon calling `deleteAccount`). **No edit trigger** (per Requirement 4).
- **Add Account BottomSheet (`AddAccountDrawer.tsx` — Artboard `04b`):**
  - Uses `Drawer` (which renders `BottomSheet`), filled `Input` and `Select` components for `name`, `institution`, `account_type`, `currency`, `country`, `opening_balance`, and a `size="lg" fullWidth` primary pill submit button.

### 5.4 Screen 4: Budgets (`app/(app)/budgets/`) — Artboards `05` & `05b`
- **Header / Hero (`ScreenHero`):**
  - Displays month navigation pills (`←` / `{monthLabel}` / `→`), total spent vs total budgeted (`€ {spent} / € {budgeted}` in `text-display-sm font-extrabold`), subtitle (`{pct}% used · € {remaining} remaining`), and `+ Add budget` trigger (`AddBudgetDrawer`).
- **Category Budget Cards & Desktop Table (`BudgetTable.tsx`):**
  - Mobile (`< sm`): Renders each category row as a `#F4F5F7` (`bg-canvas`) `rounded-[16px]` card (`p-4 gap-2`):
    - Top row: Left shows category name (`text-body font-semibold text-ink`) + IRS deduction / status subtitle (`text-caption text-text-secondary`); Right shows `€ {actual} / € {budget}` (`text-body-sm font-bold text-ink tabular-nums`), `%` or over-budget label (`text-caption font-semibold` in `text-negative` if over, `text-positive` if <= 50%, `text-teal` otherwise), and the edit icon trigger (`AddBudgetDrawer` with `prefillCategoryId` & `prefillAmount`).
    - Progress bar (`h-1.5 w-full rounded-full bg-separator overflow-hidden`): fill is `bg-negative` (`#EF4444`) when `isOver`, `bg-positive` (`#059669`) when `< 50%`, and `bg-teal` (`#0EB5D4`) when `50%–100%`.
  - Desktop (`>= sm`): Clean `rounded-[20px] bg-surface` table + `BudgetSummary` cards + `BudgetVarianceWidget` restyled with the new tokens.
- **Add / Edit Budget BottomSheet (`AddBudgetDrawer.tsx` — Artboard `05b`):**
  - Uses `Drawer` (`BottomSheet`), filled `Select` (`category_id`) and filled `Input`s (`amount_eur`, `period_month`), and a `size="lg" fullWidth` primary pill submit button.

### 5.5 Screen 5: Recurring Bills (`app/(app)/recurring-bills/`) — Artboards `06` & `06b`
- **Header / Hero (`ScreenHero`):**
  - Mobile hero shows `"Recurring Bills"`, `+ Add bill` pill (`AddBillDrawer`), monthly total (`€ {monthlyTotal} / mo` in `text-display-sm font-extrabold`), and subtitle (`{dueSoonCount} bills due in the next 30 days`).
  - Desktop shows utility header + `BillsSummary` cards.
- **Bills Cards & Table (`BillsTable.tsx` & `MarkPaidButton.tsx`):**
  - Mobile (`< sm`): `#F4F5F7` (`bg-canvas`) `rounded-[16px]` cards (`p-4 gap-2.5`):
    - Top row: Left shows bill name (`text-body font-semibold text-ink`) + subtitle (`{category || account} · {freqLabel} · Due {nextDue}` in `text-caption text-text-secondary`); Right shows native amount (`text-body font-bold text-ink tabular-nums`) + optional EUR equivalent when GBP (`≈ € ...`).
    - Bottom row: `StatusBadge` (`Overdue` / `Due soon` / `Active`) on the left; pill `MarkPaidButton` + edit `AddBillDrawer` (`trigger="icon"`) on the right.
  - Desktop (`>= sm`): Restyled `rounded-[20px] bg-surface` table with `MarkPaidButton` and edit trigger.
- **Add / Edit Bill BottomSheet (`AddBillDrawer.tsx` — Artboard `06b`):**
  - Uses `Drawer` (`BottomSheet`), filled `Input` and `Select` fields (`name`, `category_id`, `account_id`, `amount`, `currency`, `frequency`, `next_due_on`, `reminder_days_before`), and a `size="lg" fullWidth` primary pill submit button.

### 5.6 Screen 6: Investments (`app/(app)/investments/`) — Artboards `07` & `07b`
- **Wealth Sub-Navigation (`components/layout/WealthNav.tsx`):**
  - Because the mobile `TabBar` groups Investments and Net Worth under the **Wealth** (`Património`) tab, both `/investments` and `/net-worth` include a compact pill switcher (`Investments` | `Net Worth`) on mobile (`lg:hidden`) so Nuno can switch between the two screens in one tap.
- **Header / Hero (`ScreenHero`):**
  - Mobile hero shows `"Investments"`, `RefreshPricesButton` + `+ Add holding` pills, current portfolio value in reporting currency (`text-display-sm font-extrabold text-white`), and total P&L subtitle (`{sign}€ {pnl} ({sign}{pnlPct}%)`).
  - Desktop shows utility header (`"Investments"`, `RefreshPricesButton`, `AddHoldingDrawer`) + `InvestmentsSummary` cards.
- **Holdings Cards & Table (`HoldingsTable.tsx`):**
  - Mobile (`< sm`): `#F4F5F7` (`bg-canvas`) `rounded-[16px]` cards (`p-4 gap-2`):
    - Top row: Left shows `{symbol} · {name}` (`text-body font-semibold text-ink`) + subtitle (`{quantity} sh · {latestPrice} · {assetType}`); Right shows EUR value (`text-body font-bold text-ink tabular-nums`) + P&L percentage (`text-caption font-semibold` in `text-positive` / `text-negative`).
    - Portfolio weight progress bar (`h-1.5 w-full rounded-full bg-separator`) with `bg-teal` fill proportional to `computed.value_eur / totalPortfolioEur`.
    - Actions row: Stale badge (if `isStale`) + edit `AddHoldingDrawer` (`trigger="icon"`) + `DeleteHoldingButton`.
  - Desktop (`>= sm`): Restyled `rounded-[20px] bg-surface` table with all columns and edit/delete actions.
- **Add / Edit Holding BottomSheet (`AddHoldingDrawer.tsx` — Artboard `07b`):**
  - Uses `Drawer` (`BottomSheet`), filled `Input` and `Select` fields (`symbol`, `name`, `asset_type`, `account_id`, `quantity`, `currency`, `avg_cost_basis`), and a `size="lg" fullWidth` primary pill submit button.

### 5.7 Screen 7: Net Worth (`app/(app)/net-worth/`) — Artboard `08`
- **Header / Hero (`ScreenHero`):**
  - Mobile hero shows `"Net Worth"`, `AsOfPicker` compact pill, `WealthNav` switcher (`Investments` | `Net Worth`), total Net Worth (`text-display-sm font-extrabold text-white`), and 30d/YTD change subtitle.
  - Desktop shows utility header (`"Net Worth"`, `AsOfPicker` pill) + `NetWorthSummary` cards.
- **Client-Side Range Filter Pills & Chart (`NetWorthChart.tsx`):**
  - Adds client-side range pills (`1M`, `3M`, `6M`, `1Y`, `ALL`, defaulting to `'6M'` or `'ALL'` if fewer snapshots exist) inside `NetWorthChart.tsx` that filter the already-loaded `snapshots` prop by `snapshot_date` relative to the latest snapshot date — **zero new server queries**.
  - Restyles the Recharts `AreaChart` with `--color-teal` (`#0EB5D4`) stroke/gradient, `--color-separator` grid lines, and `--color-surface` tooltip.
- **Asset Allocation Cards & Breakdown (`BreakdownTable.tsx` & `SnapshotHistory.tsx`):**
  - Adds the 2 Asset Allocation summary cards from `08 — Net Worth` above the breakdown table:
    1. **Cash & Bank Accounts**: Sum of `breakdown.accounts` in reporting currency, share `%` of total net worth, and `#0EB5D4` (`bg-teal`) progress bar.
    2. **Investments & Holdings**: Sum of `breakdown.holdings` in reporting currency, share `%` of total net worth, and `#2563EB` (`bg-info`) progress bar.
  - Restyles `BreakdownTable` (showing native currency balance and reporting currency equivalent per account and holding) and `SnapshotHistory` to match the new `Card` and typography tokens.

---

## 6. Bilingual (EN & PT-PT) Strings (`messages/en.json` & `messages/pt-PT.json`)

Only additive keys will be added:
- `Nav`:
  - `home`: EN `"Home"`, PT-PT `"Início"`
  - `wealth`: EN `"Wealth"`, PT-PT `"Património"`
  - `more`: EN `"More"`, PT-PT `"Mais"`
  - `importCsv`: EN `"Import CSV"`, PT-PT `"Importar CSV"`
- `Dashboard`:
  - `totalNetWorth`: EN `"Total net worth"`, PT-PT `"Património líquido total"`
  - `accountsCount`: EN `"{count, plural, one {# account} other {# accounts}}"`, PT-PT `"{count, plural, one {# conta} other {# contas}}"`
  - `gbpExposure`: EN `"GBP exposure: {amount}"`, PT-PT `"Exposição GBP: {amount}"`
  - `quickAdd`: EN `"Add"`, PT-PT `"Adicionar"`
  - `quickImport`: EN `"Import CSV"`, PT-PT `"Importar CSV"`
  - `quickTransfer`: EN `"Transfer"`, PT-PT `"Transferir"`
  - `quickAddBill`: EN `"Add Bill"`, PT-PT `"Despesa"`
  - `budgetLeft`: EN `"{amount} left"`, PT-PT `"{amount} restante"`
  - `next30Days`: EN `"Next 30 days"`, PT-PT `"Próximos 30 dias"`
- `Auth`:
  - `privateBadge`: EN `"Private"`, PT-PT `"Privado"`
  - `welcomeBack`: EN `"Welcome back"`, PT-PT `"Bem-vindo de volta"`
  - `heroSubtitle`: EN `"Personal Finance & Wealth Tracker"`, PT-PT `"Gestão Pessoal de Finanças e Património"`
  - `securityNote`: EN `"Private single-user instance · Public sign-up disabled"`, PT-PT `"Instância privada de utilizador único · Registo público desativado"`
- `Accounts`, `Budgets`, `RecurringBills`, `Investments`, `NetWorth`:
  - Additive subtitle/helper keys (`convertedAt`, `dueInNext30Days`, `cashAndAccounts`, `investmentsAndHoldings`, `ofNetWorth`) in both EN and European Portuguese (`PT-PT`).

---

## 7. Verification Criteria

1. **Automated Type & Unit Tests:**
   - `npx tsc --noEmit` passes with 0 errors.
   - `npm run test:run` passes all existing tests plus the new `Drawer`/`BottomSheet` unit tests (`tests/components/ui/Drawer.test.tsx`).
2. **Visual & Responsive Verification (`390×844` Mobile & `1440×900` Desktop, EN & PT-PT):**
   - Each Wave 1 screen is rendered in Playwright at `390×844` and `1440×900` in both `en` and `pt-PT` locales, compared against its corresponding `new_design.pen` artboard screenshot, and verified for spacing, typography tokens, colour accuracy, and zero text clipping (including `"Orçamentos"`, `"Transações"`, and `"Património"` in the `390px` TabBar).
3. **Git Hygiene:**
   - All commits happen on `feat/redesign` inside `.worktrees/feat-redesign` using conventional commit messages, one logical component group or screen per commit.
   - Zero modifications to `app/(app)/transactions/**`, `app/(app)/settings/**`, `lib/category-rules.ts`, `schema.sql`, or `types/database.ts`.
