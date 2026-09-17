# Finance Tracker — Sub-project 5: i18n & Dynamic Reporting Currency

**Date:** 2026-09-17
**Scope:** Full English/Portuguese (PT) translation via next-intl, and dynamic reporting currency that converts EUR-stored aggregates at display time.
**Delivers:** The UI renders in English or Português (Portugal) based on the user's settings preference; all aggregate totals (net worth, budget totals, bill costs, investments) display in the user's chosen reporting currency (EUR or GBP).

---

## Stack & Runtime Context

- Next.js 16.3.5 / React 19 — always `await createClient()`
- `proxy.ts` at project root (Next.js 16 middleware naming)
- Tailwind v4 — tokens in `globals.css` `@theme`
- `useActionState` from `react` (React 19)
- Sidebar is a Client Component
- `next-intl` v3 — i18n without URL routing (locale from cookie, not URL segments)

---

## What This Sub-project Delivers

1. **`next-intl` infrastructure** — `i18n/request.ts`, plugin in `next.config.ts`, `NextIntlClientProvider` in root layout
2. **Translation files** — `messages/en.json` and `messages/pt-PT.json` covering all UI text
3. **All 56 TSX files translated** — hardcoded strings replaced with `t('key')` calls
4. **Cookie management** — settings action sets `locale` and `reporting_currency` cookies on save
5. **`lib/reporting-currency.ts`** — `getReportingCurrency()` and `getReportingRate()` utilities
6. **`formatCurrency(amount, currency)`** in `lib/utils.ts` — display-layer currency formatter
7. **Aggregate display components updated** — switch from `formatEur` to `formatCurrency` with reporting rate

---

## Architecture: i18n

### Library

`next-intl` v3, "i18n without routing" mode. The locale is resolved per-request from a cookie; all routes stay identical (`/dashboard` serves both languages).

### Request Configuration — `i18n/request.ts`

```ts
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'en'
  const validLocales = ['en', 'pt-PT']
  const resolved = validLocales.includes(locale) ? locale : 'en'

  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
  }
})
```

### Next.js Config — `next.config.ts`

```ts
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')
const nextConfig: NextConfig = {}
export default withNextIntl(nextConfig)
```

### Root Layout — `app/layout.tsx`

Wrap children with `<NextIntlClientProvider>` so client components can call `useTranslations()`:

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export default async function RootLayout({ children }) {
  const messages = await getMessages()
  return (
    <html>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### Consumption Pattern

**Server components:**
```ts
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('Dashboard')
// usage: t('title'), t('netWorth'), etc.
```

**Client components:**
```ts
import { useTranslations } from 'next-intl'
const t = useTranslations('RecurringBills')
// usage: t('addBill'), t('markPaid'), etc.
```

---

## Architecture: Cookie Lifecycle

### On Settings Save — `app/(app)/settings/actions.ts`

The `saveSettings` server action writes both cookies in addition to updating Supabase metadata:

```ts
import { cookies } from 'next/headers'

const cookieStore = await cookies()
cookieStore.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
cookieStore.set('reporting_currency', reporting_currency, { path: '/', maxAge: 60 * 60 * 24 * 365 })
```

### Fallback for New Users

New users with no cookies default to `locale = 'en'` and `reporting_currency = 'EUR'` (no conversion). The app is fully functional before settings are ever saved.

---

## Translation Namespace Structure

Both `messages/en.json` and `messages/pt-PT.json` use the same key structure. Every visible UI string lives in one of these namespaces. Data values (user-entered account names, transaction descriptions, category names) are never translated — they stay as stored.

```json
{
  "Common": {
    "save": "Save settings",
    "cancel": "Cancel",
    "add": "Add",
    "edit": "Edit",
    "delete": "Delete",
    "viewAll": "View all",
    "loading": "Loading…",
    "error": "Something went wrong",
    "of": "of",
    "noData": "No data yet",
    "stale": "stale",
    "confirm": "Confirm",
    "close": "Close",
    "required": "required"
  },
  "Nav": {
    "dashboard": "Dashboard",
    "investments": "Investments",
    "netWorth": "Net Worth",
    "transactions": "Transactions",
    "budgets": "Budgets",
    "recurringBills": "Recurring Bills",
    "accounts": "Accounts",
    "settings": "Settings",
    "myAccount": "My Account",
    "signOut": "Sign out"
  },
  "Auth": {
    "signIn": "Sign in",
    "magicLink": "Send magic link",
    "email": "Email",
    "password": "Password",
    "signInWithPassword": "Sign in with password",
    "checkEmail": "Check your email for a magic link."
  },
  "Dashboard": {
    "title": "Dashboard",
    "netWorth": "Net Worth",
    "netWorthSubtitle": "across all accounts",
    "gbpEur": "GBP / EUR",
    "asOf": "as of {date}",
    "spendingThisMonth": "Spending this month",
    "ofBudgetUsed": "{pct}% of budget used",
    "upcomingBills": "Upcoming Bills",
    "recentTransactions": "Recent Transactions",
    "noBillsDue": "No bills due in the next 30 days",
    "noTransactions": "No transactions yet"
  },
  "Accounts": {
    "title": "Accounts",
    "addAccount": "Add account",
    "totalBalance": "Total balance",
    "noAccounts": "Add your first account to get started",
    "name": "Name",
    "institution": "Institution",
    "type": "Type",
    "currency": "Currency",
    "balance": "Balance",
    "types": {
      "checking": "Checking",
      "savings": "Savings",
      "credit_card": "Credit Card",
      "cash": "Cash",
      "investment": "Investment"
    }
  },
  "Transactions": {
    "title": "Transactions",
    "importCsv": "Import CSV",
    "addTransaction": "Add transaction",
    "date": "Date",
    "description": "Description",
    "merchant": "Merchant",
    "category": "Category",
    "amount": "Amount",
    "account": "Account",
    "noTransactions": "No transactions yet. Import a CSV or add one manually.",
    "filters": {
      "allAccounts": "All accounts",
      "allCategories": "All categories",
      "search": "Search…"
    },
    "import": {
      "title": "Import CSV",
      "selectFile": "Select CSV file",
      "preview": "Preview",
      "confirm": "Confirm import",
      "success": "Import successful",
      "duplicatesWarning": "{count} duplicate(s) will be skipped"
    }
  },
  "Budgets": {
    "title": "Budgets",
    "addBudget": "Add budget",
    "totalBudgeted": "Total budgeted",
    "totalSpent": "Total spent",
    "remaining": "Remaining",
    "overBudget": "Over budget",
    "category": "Category",
    "budgeted": "Budgeted",
    "actual": "Actual",
    "variance": "Variance",
    "noBudgets": "No budgets set for this month.",
    "budgetVsActual": "Budget vs Actual — Last 3 Months"
  },
  "RecurringBills": {
    "title": "Recurring Bills",
    "addBill": "Add bill",
    "editBill": "Edit bill",
    "markPaid": "Mark paid",
    "monthlyTotal": "Monthly total",
    "annualTotal": "Annual total",
    "overdue": "Overdue",
    "dueSoon": "Due soon",
    "active": "Active",
    "name": "Name",
    "category": "Category",
    "account": "Account",
    "amount": "Amount",
    "nextDue": "Next due",
    "status": "Status",
    "frequency": "Frequency",
    "reminderDays": "Reminder days before",
    "noBills": "No recurring bills yet. Click \"Add bill\" to get started.",
    "frequencies": {
      "weekly": "Weekly",
      "monthly": "Monthly",
      "quarterly": "Quarterly",
      "yearly": "Yearly"
    }
  },
  "Investments": {
    "title": "Investments",
    "addHolding": "Add holding",
    "editHolding": "Edit holding",
    "refreshPrices": "Refresh prices",
    "refreshing": "Refreshing…",
    "pricesAsOf": "Prices as of {date}",
    "noPricesYet": "No prices yet",
    "totalInvested": "Total invested",
    "currentValue": "Current value",
    "totalPnl": "Total P&L",
    "symbol": "Symbol",
    "name": "Name",
    "type": "Type",
    "account": "Account",
    "quantity": "Quantity",
    "avgCost": "Avg cost",
    "currentPrice": "Current price",
    "value": "Value",
    "pnl": "P&L",
    "pnlPct": "P&L %",
    "noHoldings": "No holdings yet. Click \"Add holding\" to get started.",
    "assetTypes": {
      "stock": "Stock",
      "etf": "ETF",
      "fund": "Fund",
      "crypto": "Crypto",
      "other": "Other"
    },
    "deleteConfirm": "Delete this holding and all its price history?",
    "symbolPlaceholder": "e.g. VWCE.DE, BTC-USD",
    "namePlaceholder": "e.g. Vanguard FTSE All-World",
    "avgCostPlaceholder": "Per unit"
  },
  "NetWorth": {
    "title": "Net Worth",
    "currentNetWorth": "Current net worth",
    "change30d": "Change (30 days)",
    "changeYTD": "Change (this year)",
    "overTime": "Net Worth Over Time",
    "noDataYet": "No data yet — check back after your first snapshot",
    "todaysBreakdown": "Today's Breakdown",
    "snapshotHistory": "Snapshot history ({count})",
    "accountsSection": "Accounts",
    "holdingsSection": "Holdings",
    "total": "Total",
    "nativeBalance": "Native balance",
    "eurEquivalent": "{currency} equivalent",
    "date": "Date"
  },
  "Account": {
    "title": "My Account",
    "accountSection": "Account",
    "email": "Email",
    "changePassword": "Change password",
    "newPassword": "New password",
    "confirmPassword": "Confirm password",
    "newPasswordPlaceholder": "Min. 6 characters",
    "confirmPasswordPlaceholder": "Repeat new password",
    "updatePassword": "Update password",
    "passwordUpdated": "Password updated successfully",
    "passwordMismatch": "Passwords do not match",
    "passwordTooShort": "Password must be at least 6 characters",
    "session": "Session",
    "notAuthenticated": "Not authenticated"
  },
  "Settings": {
    "title": "Settings",
    "preferences": "Preferences",
    "reportingCurrency": "Reporting currency",
    "language": "Language",
    "saved": "Settings saved",
    "languages": {
      "en": "English",
      "pt-PT": "Português (Portugal)"
    },
    "currencies": {
      "EUR": "EUR — Euro",
      "GBP": "GBP — British Pound"
    }
  }
}
```

The `pt-PT.json` file mirrors this structure with Portuguese translations for every value.

### Date & Number Formatting

`next-intl`'s `useFormatter()` / `getFormatter()` handles locale-aware formatting automatically:
- Dates: `format.dateTime(date, { dateStyle: 'medium' })` → "17 Sep 2026" (en) / "17 de set. de 2026" (pt-PT)
- Numbers: handled by `Intl.NumberFormat` via `formatCurrency` which already uses locale implicitly

Existing `formatDate()` and `formatEur()` in `lib/utils.ts` are not locale-aware. They are replaced/supplemented in the display layer (see Dynamic Currency section).

---

## Architecture: Dynamic Reporting Currency

### Internal Storage

All DB columns remain named and valued in EUR (`amount_eur`, `total_eur`, `budgets.amount_eur`). No schema changes. Conversion happens only at display time.

### New File — `lib/reporting-currency.ts`

```ts
import { cookies } from 'next/headers'
import { getRate } from './exchange-rates'

export async function getReportingCurrency(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('reporting_currency')?.value ?? 'EUR'
}

export async function getReportingRate(reportingCurrency: string): Promise<number> {
  if (reportingCurrency === 'EUR') return 1
  return getRate('EUR', reportingCurrency)
}
```

### New Functions in `lib/utils.ts`

```ts
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatShortCurrency(amount: number, currency: string): string {
  const symbol = new Intl.NumberFormat('en-IE', { style: 'currency', currency, maximumFractionDigits: 0 })
    .formatToParts(0)
    .find(p => p.type === 'currency')?.value ?? currency
  if (Math.abs(amount) >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}k`
  return `${symbol}${amount.toFixed(0)}`
}
```

`formatEur` is kept for backward compatibility in places that explicitly format EUR values (e.g., budget form inputs, individual transaction amounts in native currency). Aggregate totals switch to `formatCurrency`.

`formatShortCurrency` replaces the hardcoded `formatShortEur` in `NetWorthChart.tsx` — the chart receives `reportingCurrency` as a prop and passes it to this function for Y-axis tick labels.

### Page-Level Pattern

Every page that shows aggregate totals reads reporting currency and rate at the top:

```ts
const reportingCurrency = await getReportingCurrency()
const reportingRate = await getReportingRate(reportingCurrency)
```

Then passes them as props to display components:
```tsx
<BillsSummary bills={bills} gbpToEur={gbpToEur} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
```

### Components That Change

The following components currently call `formatEur(amount)` on aggregates and must switch to `formatCurrency(amount * reportingRate, reportingCurrency)`:

| Component | Aggregates affected |
|-----------|-------------------|
| `dashboard/_components/SpendingCard` | spent, budgeted totals |
| `dashboard/_components/UpcomingBillsPanel` | — (native currency, unchanged) |
| `accounts/_components/AccountsSummary` | total balance |
| `budgets/_components/BudgetSummary` | total budgeted, total spent, remaining |
| `budgets/_components/BudgetTable` | per-row budgeted/actual/variance |
| `budgets/_components/BudgetVarianceWidget` | axis scale, bar values |
| `recurring-bills/_components/BillsSummary` | monthly/annual/overdue totals |
| `investments/_components/InvestmentsSummary` | total invested, current value, P&L |
| `investments/_components/HoldingsTable` | value (EUR) column, P&L columns |
| `net-worth/_components/NetWorthSummary` | current, 30d change, YTD change |
| `net-worth/_components/NetWorthChart` | Y-axis labels, tooltip |
| `net-worth/_components/BreakdownTable` | EUR equivalent column, total footer |
| `net-worth/_components/SnapshotHistory` | total_eur column |

### What Does NOT Change

- Individual transaction row amounts — shown in native transaction currency, unchanged
- Per-holding current price and avg cost — shown in holding's native currency, unchanged
- Budget input forms — budgets are entered and stored in EUR; the form stays as-is
- `computeNetWorth` internal computation — still computes in EUR; the reporting rate is applied at display time

---

## File Structure

**New files:**
- `i18n/request.ts`
- `messages/en.json`
- `messages/pt-PT.json`
- `lib/reporting-currency.ts`

**Modified files:**
- `next.config.ts` — next-intl plugin
- `app/layout.tsx` — NextIntlClientProvider
- `lib/utils.ts` — add `formatCurrency` and `formatShortCurrency`
- `app/(app)/settings/actions.ts` — set locale + reporting_currency cookies on save
- `app/(app)/settings/_components/SettingsForm.tsx` — remove the "Sub-project 5" helper text `<p>` elements (feature is now live); replace strings with `t()` calls
- All remaining TSX files — replace hardcoded strings with `t('key')` calls
- Pages showing aggregates — add `getReportingCurrency()` / `getReportingRate()` + pass to components
- `app/(app)/net-worth/_components/NetWorthChart.tsx` — receives `reportingCurrency` prop; replaces `formatShortEur` with `formatShortCurrency(value, reportingCurrency)`

---

## Testing

No new unit tests. The translation correctness is verified manually (render the app in each locale, verify strings). The `formatCurrency` function is trivially correct (delegates to `Intl.NumberFormat`). The `getReportingCurrency`/`getReportingRate` utilities are thin wrappers tested by running the app.

TypeScript provides a useful safety net: `next-intl` generates types from the translation files so missing or misspelled keys are caught at compile time.

---

## Error Handling

- **Unknown locale in cookie:** `getRequestConfig` validates against `['en', 'pt-PT']` and falls back to `'en'`.
- **Unknown reporting currency:** `getReportingCurrency` falls back to `'EUR'`. `getReportingRate('EUR')` returns 1.
- **Exchange rate fetch fails for reporting currency:** `getRate('EUR', 'GBP')` throws; page renders with Next.js error boundary. The risk is low since GBP→EUR is the most commonly fetched pair and will almost always be cached.
