# Responsive Design

## Overview

Adapt the Norte finance tracker for mobile use. The app was built desktop-first; on a phone the sidebar occupies the full viewport width, flex rows overflow horizontally, and wide tables are unreadable. This spec covers the three areas of change: navigation, page layouts, and data tables.

No new dependencies. No schema changes. Tailwind breakpoints used throughout: `sm` (640px), `lg` (1024px).

---

## 1. Mobile Navigation — Hamburger + Slide-in Drawer

### Context

Create `components/layout/MobileNavContext.tsx` — a small client-side React context:

```ts
type MobileNavContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
}
```

Export `MobileNavProvider` (holds `useState`) and `useMobileNav` hook. The provider wraps the app shell in `app/(app)/layout.tsx`; both Sidebar and PageHeader consume the context.

### AppLayout

`app/(app)/layout.tsx` wraps its existing JSX in `<MobileNavProvider>`. No structural change to the `flex h-screen` shell.

### Sidebar

`components/layout/Sidebar.tsx` — two rendering modes:

**Desktop (`lg:`):** unchanged — `hidden lg:flex h-screen w-60 shrink-0 flex-col bg-sidebar-bg`. Always visible, statically positioned.

**Mobile (default):** `fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-sidebar-bg shadow-xl transition-transform`. Hidden when `isOpen` is false (`-translate-x-full`), visible when true (`translate-x-0`). A backdrop `<div className="fixed inset-0 z-40 bg-black/40 lg:hidden">` renders behind the panel when open; clicking it calls `close()`. Each `<NavItem>` also calls `close()` on click so navigating collapses the drawer automatically. `NavItem` gains an optional `onClick` prop; `Sidebar` passes `onClick={() => close()}` to each one in the mobile context.

### PageHeader

`components/layout/PageHeader.tsx` — add `'use client'`. Import `Menu` from lucide-react and `useMobileNav`. Render a `<button>` with `<Menu size={20} />` at the left of the header (before the title), visible only on mobile (`lg:hidden`). Tapping it calls `open()`.

**Before:** `<h1>` + optional actions right-aligned.  
**After:** hamburger (mobile only) + `<h1>` + optional actions right-aligned.

---

## 2. Page Layouts — Responsive Grids

### Dashboard (`app/(app)/dashboard/page.tsx`)

Two `flex gap-4` rows that overflow on mobile:

- **Summary cards** (net worth, FX rate, spending): `flex gap-4` → `grid grid-cols-1 sm:grid-cols-3 gap-4`
- **Bottom panels** (upcoming bills, recent transactions): `flex gap-4` → `grid grid-cols-1 lg:grid-cols-2 gap-4`

### Other pages with summary rows

Apply the same `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` (or `sm:grid-cols-2`, depending on item count) to any `flex gap-4` summary card rows found in:
- `app/(app)/investments/page.tsx`
- `app/(app)/net-worth/page.tsx`
- `app/(app)/budgets/page.tsx`
- `app/(app)/recurring-bills/page.tsx`

### Page padding

All `p-6` page content wrappers → `p-4 sm:p-6` so content has breathing room on small screens without wasting space.

---

## 3. Tables — Dual Render (card on mobile, table on desktop)

Each wide table uses a dual-render pattern: a mobile card list (`sm:hidden`) and the existing table (`hidden sm:block`). The same props are passed to both; no data logic changes.

### TransactionTable

Mobile card layout per row:
```
[date — muted]                    [amount — coloured red/green]
[merchant or description]         [account name — muted]
[category badge]     [import badge if applicable]
```

### BudgetTable

Mobile card layout per row:
```
[category name — bold]            [status badge]
[progress bar — full width]
[actual spent]  /  [budgeted]     [edit icon button]
```

### BillsTable

Mobile card layout per row:
```
[bill name — bold]                [amount / freq — muted]
[next due date]                   [status badge]
[category badge]                  [mark paid + edit actions]
```

### HoldingsTable

Mobile card layout per row:
```
[symbol — bold]  [type badge]     [value in reporting currency]
[name — muted]                    [PnL% — coloured]
                                  [edit + delete actions]
```

HoldingsTable already has `overflow-x-auto` on its wrapper. The mobile card replaces the need for horizontal scroll on small screens.

---

## 4. Unchanged

- `Drawer.tsx` — already `w-full max-w-md`, mobile-friendly as-is.
- `AccountCard` grid — already `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Auth pages — single-column forms, already fine on mobile.
- Import stepper — `max-w-2xl` centred column, already fine on mobile.

---

## File Index

| File | Change |
|------|--------|
| `components/layout/MobileNavContext.tsx` | **New** — context + provider + hook |
| `app/(app)/layout.tsx` | Wrap with `MobileNavProvider` |
| `components/layout/Sidebar.tsx` | Responsive: `hidden lg:flex` desktop, fixed overlay mobile |
| `components/layout/PageHeader.tsx` | Add `'use client'`, hamburger button (`lg:hidden`) |
| `app/(app)/dashboard/page.tsx` | `flex` rows → responsive grids; `p-6` → `p-4 sm:p-6` |
| `app/(app)/investments/page.tsx` | Summary row → responsive grid; padding |
| `app/(app)/net-worth/page.tsx` | Summary row → responsive grid; padding |
| `app/(app)/budgets/page.tsx` | Summary row → responsive grid; padding |
| `app/(app)/recurring-bills/page.tsx` | Summary row → responsive grid; padding |
| `app/(app)/accounts/page.tsx` | Padding only (`p-6` → `p-4 sm:p-6`) |
| `app/(app)/transactions/page.tsx` | Padding only |
| `app/(app)/transactions/_components/TransactionTable.tsx` | Dual render |
| `app/(app)/budgets/_components/BudgetTable.tsx` | Dual render |
| `app/(app)/recurring-bills/_components/BillsTable.tsx` | Dual render |
| `app/(app)/investments/_components/HoldingsTable.tsx` | Dual render |
