# Sub-project 5: i18n & Dynamic Reporting Currency — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full English/Portuguese (PT) translation via next-intl and make aggregate totals display in the user's chosen reporting currency (EUR or GBP).

**Architecture:** next-intl v3 in "no URL routing" mode resolves locale from a `locale` cookie set on settings save; a `reporting_currency` cookie feeds a `getReportingCurrency()` utility; internal DB values stay in EUR and are converted at display time by multiplying by a EUR→reportingCurrency rate.

**Tech Stack:** Next.js 16.3.5 / React 19, next-intl v3, Supabase SSR, Tailwind v4

**Spec:** `docs/superpowers/specs/2026-09-17-i18n-reporting-currency-design.md`

## Global Constraints

- Always `await createClient()` — never call synchronously
- Middleware file is `proxy.ts` (not `middleware.ts`) — do not rename or modify it
- Tailwind v4 — tokens in `globals.css` `@theme`; no raw colours
- `useActionState` from `react` (React 19), not `react-dom`
- Sidebar is a Client Component (`'use client'`)
- `@` alias resolves to project root
- No unit tests — translation correctness verified by `npx tsc --noEmit` (next-intl generates types from messages so misspelled keys are compile errors)
- Test runner for existing tests: `npm run test:run` — must stay green throughout

---

## File Map

**New files:**
- `i18n/request.ts` — next-intl request config (locale from cookie)
- `messages/en.json` — English translations
- `messages/pt-PT.json` — Portuguese (Portugal) translations
- `lib/reporting-currency.ts` — `getReportingCurrency()` and `getReportingRate()`

**Modified files:**
- `next.config.ts` — wrap with `createNextIntlPlugin`
- `app/layout.tsx` — add `lang` attr + `NextIntlClientProvider`
- `lib/utils.ts` — add `formatCurrency`, `formatShortCurrency`
- `app/(app)/settings/actions.ts` — set `locale` and `reporting_currency` cookies on save
- `app/(app)/settings/_components/SettingsForm.tsx` — remove "Sub-project 5" helper text `<p>` elements; use `useTranslations('Settings')`
- `app/(auth)/login/_components/LoginForm.tsx` — `useTranslations('Auth')`
- `components/layout/Sidebar.tsx` — `useTranslations('Nav')`
- `app/(app)/account/page.tsx` + `_components/ChangePasswordForm.tsx` — `getTranslations('Account')` / `useTranslations('Account')`
- `app/(app)/dashboard/page.tsx` + `_components/*` — translations + reporting currency
- `app/(app)/accounts/page.tsx` + `_components/*` — `getTranslations('Accounts')`
- `app/(app)/transactions/page.tsx` + `_components/*` + `import/_components/*` — `getTranslations('Transactions')`
- `app/(app)/budgets/page.tsx` + `_components/*` — translations + reporting currency
- `app/(app)/recurring-bills/page.tsx` + `_components/*` — translations + reporting currency
- `app/(app)/investments/page.tsx` + `_components/*` — translations + reporting currency
- `app/(app)/net-worth/page.tsx` + `_components/*` — translations + reporting currency

---

### Task 1: Install next-intl + infrastructure

**Files:**
- Modify: `next.config.ts`
- Create: `i18n/request.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `getTranslations(namespace)` available in server components; `useTranslations(namespace)` available in client components; `getMessages()` for the provider

- [ ] **Step 1: Install next-intl**

```bash
npm install next-intl
```

- [ ] **Step 2: Create `i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'en'
  const valid = ['en', 'pt-PT']
  const resolved = valid.includes(locale) ? locale : 'en'

  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
  }
})
```

- [ ] **Step 3: Update `next.config.ts`**

```ts
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 4: Update `app/layout.tsx`**

Add `NextIntlClientProvider` so client components can call `useTranslations()`. The `lang` attribute on `<html>` uses the resolved locale.

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Finance Tracker',
  description: 'Personal finance tracking',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Create stub message files to unblock TypeScript**

Create `messages/en.json` with a minimal stub (full content comes in Task 2):

```json
{
  "Common": { "save": "Save settings" },
  "Nav": { "dashboard": "Dashboard" }
}
```

Create `messages/pt-PT.json` with the same stub:

```json
{
  "Common": { "save": "Guardar definições" },
  "Nav": { "dashboard": "Painel" }
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors. If next-intl types are not found, ensure `"moduleResolution": "bundler"` or `"node16"` is set in `tsconfig.json`.

- [ ] **Step 7: Verify existing tests still pass**

Run: `npm run test:run`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add i18n/ messages/ next.config.ts app/layout.tsx package.json package-lock.json
git commit -m "feat: install next-intl and set up i18n infrastructure"
```

---

### Task 2: Complete translation files

**Files:**
- Modify: `messages/en.json` (replace stub with full content)
- Create: `messages/pt-PT.json` (full Portuguese translations)

**Interfaces:**
- Produces: all translation keys used in Tasks 3–11; next-intl TypeScript types derived from `messages/en.json`

- [ ] **Step 1: Replace `messages/en.json` with full content**

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
    "appName": "Finance Tracker",
    "tagline": "Sign in to your account",
    "email": "Email",
    "emailPlaceholder": "nuno@example.com",
    "password": "Password",
    "signIn": "Sign in",
    "sendMagicLink": "Send magic link",
    "switchToMagic": "Sign in with magic link instead",
    "switchToPassword": "Sign in with password instead",
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
    "importCsv": "Import CSV",
    "balance": "Balance",
    "name": "Name",
    "institution": "Institution",
    "type": "Type",
    "currency": "Currency",
    "types": {
      "checking": "Checking",
      "savings": "Savings",
      "credit_card": "Credit card",
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
    "income": "Income",
    "expenses": "Expenses",
    "net": "Net",
    "filters": {
      "allAccounts": "All accounts",
      "allCategories": "All categories",
      "search": "Search…"
    },
    "import": {
      "title": "Import CSV",
      "selectFile": "Select CSV file",
      "dropzone": "Drop a CSV file here or click to browse",
      "preview": "Preview",
      "confirm": "Confirm import",
      "importing": "Importing…",
      "success": "Import successful",
      "duplicatesWarning": "{count} duplicate(s) will be skipped",
      "back": "Back",
      "next": "Next",
      "upload": "Upload",
      "map": "Map columns",
      "review": "Review"
    }
  },
  "Budgets": {
    "title": "Budgets",
    "addBudget": "Add budget",
    "editBudget": "Edit budget",
    "totalBudgeted": "Total budgeted",
    "totalSpent": "Total spent",
    "remaining": "Remaining",
    "overBudget": "Over budget",
    "category": "Category",
    "budgeted": "Budgeted",
    "actual": "Actual",
    "variance": "Variance",
    "noBudgets": "No budgets set for this month.",
    "budgetVsActual": "Budget vs Actual — Last 3 Months",
    "amount": "Amount (EUR)",
    "period": "Period"
  },
  "RecurringBills": {
    "title": "Recurring Bills",
    "addBill": "Add bill",
    "editBill": "Edit bill",
    "markPaid": "Mark paid",
    "saving": "Saving…",
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
    "actions": "Actions",
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
    "actions": "Actions",
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
    "avgCostPlaceholder": "Per unit",
    "currency": "Currency"
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
    "currencyEquivalent": "{currency} equivalent",
    "date": "Date",
    "netWorthLabel": "Net Worth"
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
    "signOut": "Sign out",
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

- [ ] **Step 2: Create `messages/pt-PT.json` with full Portuguese translations**

```json
{
  "Common": {
    "save": "Guardar definições",
    "cancel": "Cancelar",
    "add": "Adicionar",
    "edit": "Editar",
    "delete": "Eliminar",
    "viewAll": "Ver tudo",
    "loading": "A carregar…",
    "error": "Algo correu mal",
    "of": "de",
    "noData": "Ainda sem dados",
    "stale": "desatualizado",
    "confirm": "Confirmar",
    "close": "Fechar",
    "required": "obrigatório"
  },
  "Nav": {
    "dashboard": "Painel",
    "investments": "Investimentos",
    "netWorth": "Património Líquido",
    "transactions": "Transações",
    "budgets": "Orçamentos",
    "recurringBills": "Despesas Recorrentes",
    "accounts": "Contas",
    "settings": "Definições",
    "myAccount": "A Minha Conta",
    "signOut": "Terminar sessão"
  },
  "Auth": {
    "appName": "Finance Tracker",
    "tagline": "Inicie sessão na sua conta",
    "email": "E-mail",
    "emailPlaceholder": "nuno@example.com",
    "password": "Palavra-passe",
    "signIn": "Entrar",
    "sendMagicLink": "Enviar link mágico",
    "switchToMagic": "Entrar com link mágico",
    "switchToPassword": "Entrar com palavra-passe",
    "checkEmail": "Verifique o seu e-mail para obter o link mágico."
  },
  "Dashboard": {
    "title": "Painel",
    "netWorth": "Património Líquido",
    "netWorthSubtitle": "em todas as contas",
    "gbpEur": "GBP / EUR",
    "asOf": "a {date}",
    "spendingThisMonth": "Gastos este mês",
    "ofBudgetUsed": "{pct}% do orçamento utilizado",
    "upcomingBills": "Próximas Despesas",
    "recentTransactions": "Transações Recentes",
    "noBillsDue": "Sem despesas nos próximos 30 dias",
    "noTransactions": "Ainda sem transações"
  },
  "Accounts": {
    "title": "Contas",
    "addAccount": "Adicionar conta",
    "totalBalance": "Saldo total",
    "noAccounts": "Adicione a sua primeira conta para começar",
    "importCsv": "Importar CSV",
    "balance": "Saldo",
    "name": "Nome",
    "institution": "Instituição",
    "type": "Tipo",
    "currency": "Moeda",
    "types": {
      "checking": "Conta à ordem",
      "savings": "Poupança",
      "credit_card": "Cartão de crédito",
      "cash": "Dinheiro",
      "investment": "Investimento"
    }
  },
  "Transactions": {
    "title": "Transações",
    "importCsv": "Importar CSV",
    "addTransaction": "Adicionar transação",
    "date": "Data",
    "description": "Descrição",
    "merchant": "Comerciante",
    "category": "Categoria",
    "amount": "Valor",
    "account": "Conta",
    "noTransactions": "Ainda sem transações. Importe um CSV ou adicione uma manualmente.",
    "income": "Receita",
    "expenses": "Despesas",
    "net": "Líquido",
    "filters": {
      "allAccounts": "Todas as contas",
      "allCategories": "Todas as categorias",
      "search": "Pesquisar…"
    },
    "import": {
      "title": "Importar CSV",
      "selectFile": "Selecionar ficheiro CSV",
      "dropzone": "Arraste um ficheiro CSV ou clique para procurar",
      "preview": "Pré-visualização",
      "confirm": "Confirmar importação",
      "importing": "A importar…",
      "success": "Importação concluída",
      "duplicatesWarning": "{count} duplicado(s) serão ignorados",
      "back": "Voltar",
      "next": "Seguinte",
      "upload": "Carregar",
      "map": "Mapear colunas",
      "review": "Rever"
    }
  },
  "Budgets": {
    "title": "Orçamentos",
    "addBudget": "Adicionar orçamento",
    "editBudget": "Editar orçamento",
    "totalBudgeted": "Total orçamentado",
    "totalSpent": "Total gasto",
    "remaining": "Restante",
    "overBudget": "Acima do orçamento",
    "category": "Categoria",
    "budgeted": "Orçamentado",
    "actual": "Real",
    "variance": "Variação",
    "noBudgets": "Sem orçamentos definidos para este mês.",
    "budgetVsActual": "Orçamento vs Real — Últimos 3 Meses",
    "amount": "Valor (EUR)",
    "period": "Período"
  },
  "RecurringBills": {
    "title": "Despesas Recorrentes",
    "addBill": "Adicionar despesa",
    "editBill": "Editar despesa",
    "markPaid": "Marcar como pago",
    "saving": "A guardar…",
    "monthlyTotal": "Total mensal",
    "annualTotal": "Total anual",
    "overdue": "Em atraso",
    "dueSoon": "A vencer",
    "active": "Ativo",
    "name": "Nome",
    "category": "Categoria",
    "account": "Conta",
    "amount": "Valor",
    "nextDue": "Próximo vencimento",
    "status": "Estado",
    "frequency": "Frequência",
    "reminderDays": "Dias de antecedência do aviso",
    "noBills": "Ainda sem despesas recorrentes. Clique em \"Adicionar despesa\" para começar.",
    "actions": "Ações",
    "frequencies": {
      "weekly": "Semanal",
      "monthly": "Mensal",
      "quarterly": "Trimestral",
      "yearly": "Anual"
    }
  },
  "Investments": {
    "title": "Investimentos",
    "addHolding": "Adicionar posição",
    "editHolding": "Editar posição",
    "refreshPrices": "Atualizar preços",
    "refreshing": "A atualizar…",
    "pricesAsOf": "Preços a {date}",
    "noPricesYet": "Ainda sem preços",
    "totalInvested": "Total investido",
    "currentValue": "Valor atual",
    "totalPnl": "Ganho/Perda total",
    "symbol": "Símbolo",
    "name": "Nome",
    "type": "Tipo",
    "account": "Conta",
    "quantity": "Quantidade",
    "avgCost": "Custo médio",
    "currentPrice": "Preço atual",
    "value": "Valor",
    "pnl": "G/P",
    "pnlPct": "G/P %",
    "actions": "Ações",
    "noHoldings": "Ainda sem posições. Clique em \"Adicionar posição\" para começar.",
    "assetTypes": {
      "stock": "Ação",
      "etf": "ETF",
      "fund": "Fundo",
      "crypto": "Criptomoeda",
      "other": "Outro"
    },
    "deleteConfirm": "Eliminar esta posição e todo o histórico de preços?",
    "symbolPlaceholder": "ex.: VWCE.DE, BTC-USD",
    "namePlaceholder": "ex.: Vanguard FTSE All-World",
    "avgCostPlaceholder": "Por unidade",
    "currency": "Moeda"
  },
  "NetWorth": {
    "title": "Património Líquido",
    "currentNetWorth": "Património líquido atual",
    "change30d": "Variação (30 dias)",
    "changeYTD": "Variação (este ano)",
    "overTime": "Património Líquido ao Longo do Tempo",
    "noDataYet": "Ainda sem dados — volte após o primeiro registo",
    "todaysBreakdown": "Composição Hoje",
    "snapshotHistory": "Histórico de registos ({count})",
    "accountsSection": "Contas",
    "holdingsSection": "Posições",
    "total": "Total",
    "nativeBalance": "Saldo nativo",
    "currencyEquivalent": "Equivalente em {currency}",
    "date": "Data",
    "netWorthLabel": "Património Líquido"
  },
  "Account": {
    "title": "A Minha Conta",
    "accountSection": "Conta",
    "email": "E-mail",
    "changePassword": "Alterar palavra-passe",
    "newPassword": "Nova palavra-passe",
    "confirmPassword": "Confirmar palavra-passe",
    "newPasswordPlaceholder": "Mín. 6 caracteres",
    "confirmPasswordPlaceholder": "Repetir nova palavra-passe",
    "updatePassword": "Atualizar palavra-passe",
    "passwordUpdated": "Palavra-passe atualizada com sucesso",
    "passwordMismatch": "As palavras-passe não coincidem",
    "passwordTooShort": "A palavra-passe deve ter pelo menos 6 caracteres",
    "session": "Sessão",
    "signOut": "Terminar sessão",
    "notAuthenticated": "Não autenticado"
  },
  "Settings": {
    "title": "Definições",
    "preferences": "Preferências",
    "reportingCurrency": "Moeda de referência",
    "language": "Idioma",
    "saved": "Definições guardadas",
    "languages": {
      "en": "English",
      "pt-PT": "Português (Portugal)"
    },
    "currencies": {
      "EUR": "EUR — Euro",
      "GBP": "GBP — Libra esterlina"
    }
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles with full message files**

Run: `npx tsc --noEmit`
Expected: 0 errors. next-intl will now generate types from the full `en.json` so later tasks get type-checked translation keys.

- [ ] **Step 4: Commit**

```bash
git add messages/
git commit -m "feat: add complete English and Portuguese translation files"
```

---

### Task 3: Cookie management + reporting currency utilities

**Files:**
- Modify: `app/(app)/settings/actions.ts`
- Create: `lib/reporting-currency.ts`
- Modify: `lib/utils.ts`
- Modify: `app/(app)/settings/_components/SettingsForm.tsx`

**Interfaces:**
- Produces:
  - `getReportingCurrency(): Promise<string>` — reads `reporting_currency` cookie, falls back to `'EUR'`
  - `getReportingRate(currency: string): Promise<number>` — returns EUR→currency rate; 1 if EUR
  - `formatCurrency(amount: number, currency: string): string`
  - `formatShortCurrency(amount: number, currency: string): string`

- [ ] **Step 1: Update `app/(app)/settings/actions.ts` to set cookies on save**

Add `cookies()` import and set both cookies inside `saveSettings`. The full updated file:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function saveSettings(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const reporting_currency = formData.get('reporting_currency') as string
  const locale = formData.get('locale') as string

  const { error } = await supabase.auth.updateUser({
    data: { reporting_currency, locale },
  })
  if (error) return { error: error.message }

  const cookieStore = await cookies()
  const maxAge = 60 * 60 * 24 * 365
  cookieStore.set('locale', locale, { path: '/', maxAge })
  cookieStore.set('reporting_currency', reporting_currency, { path: '/', maxAge })

  revalidatePath('/settings')
  return { success: 'Settings saved' }
}
```

- [ ] **Step 2: Create `lib/reporting-currency.ts`**

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

- [ ] **Step 3: Add `formatCurrency` and `formatShortCurrency` to `lib/utils.ts`**

Append these two functions after the existing `formatDate` function. Do NOT remove `formatEur` — it is still used for individual native amounts in some places.

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
  const symbol =
    new Intl.NumberFormat('en-IE', { style: 'currency', currency, maximumFractionDigits: 0 })
      .formatToParts(0)
      .find(p => p.type === 'currency')?.value ?? currency
  if (Math.abs(amount) >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}k`
  return `${symbol}${amount.toFixed(0)}`
}
```

- [ ] **Step 4: Update `SettingsForm.tsx` — remove helper text, add translations**

Replace the full file content:

```tsx
'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { saveSettings } from '../actions'

const initialState: { error?: string; success?: string } = {}

const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

type Props = {
  reportingCurrency: string
  locale: string
}

export function SettingsForm({ reportingCurrency, locale }: Props) {
  const t = useTranslations('Settings')
  const [state, formAction] = useActionState(saveSettings, initialState)

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('preferences')}</h2>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">{t('saved')}</div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">{t('reportingCurrency')}</label>
          <select name="reporting_currency" defaultValue={reportingCurrency} className={inputClass}>
            <option value="EUR">{t('currencies.EUR')}</option>
            <option value="GBP">{t('currencies.GBP')}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">{t('language')}</label>
          <select name="locale" defaultValue={locale} className={inputClass}>
            <option value="en">{t('languages.en')}</option>
            <option value="pt-PT">{t('languages.pt-PT')}</option>
          </select>
        </div>
        <button type="submit" className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          {t('save', { ns: 'Common' })}
        </button>
      </form>
    </div>
  )
}
```

Note: for the save button, use `useTranslations('Common')` as a second `t` instance, or inline it: since `SettingsForm` already imports `useTranslations`, add `const tCommon = useTranslations('Common')` and use `tCommon('save')` for the button.

Corrected version of the button and the component setup:

```tsx
'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { saveSettings } from '../actions'

const initialState: { error?: string; success?: string } = {}

const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

type Props = {
  reportingCurrency: string
  locale: string
}

export function SettingsForm({ reportingCurrency, locale }: Props) {
  const t = useTranslations('Settings')
  const tCommon = useTranslations('Common')
  const [state, formAction] = useActionState(saveSettings, initialState)

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('preferences')}</h2>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">{t('saved')}</div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">{t('reportingCurrency')}</label>
          <select name="reporting_currency" defaultValue={reportingCurrency} className={inputClass}>
            <option value="EUR">{t('currencies.EUR')}</option>
            <option value="GBP">{t('currencies.GBP')}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">{t('language')}</label>
          <select name="locale" defaultValue={locale} className={inputClass}>
            <option value="en">{t('languages.en')}</option>
            <option value="pt-PT">{t('languages.pt-PT')}</option>
          </select>
        </div>
        <button type="submit" className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          {tCommon('save')}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/settings/ lib/reporting-currency.ts lib/utils.ts
git commit -m "feat: add reporting currency utilities, cookie management, and formatCurrency helpers"
```

---

### Task 4: Translate auth + sidebar + account page

**Files:**
- Modify: `app/(auth)/login/_components/LoginForm.tsx`
- Modify: `components/layout/Sidebar.tsx`
- Modify: `app/(app)/account/page.tsx`
- Modify: `app/(app)/account/_components/ChangePasswordForm.tsx`
- Modify: `app/(app)/settings/page.tsx`

**Interfaces:**
- Consumes: `useTranslations('Auth')`, `useTranslations('Nav')`, `getTranslations('Account')`, `getTranslations('Settings')`

**Pattern for client components:**
```tsx
import { useTranslations } from 'next-intl'
// inside component:
const t = useTranslations('Auth')
// replace hardcoded string:
<p>{t('tagline')}</p>  // was: <p>Sign in to your account</p>
```

**Pattern for server components:**
```tsx
import { getTranslations } from 'next-intl/server'
// inside async function:
const t = await getTranslations('Account')
// replace hardcoded string:
<h2>{t('accountSection')}</h2>  // was: <h2>Account</h2>
```

- [ ] **Step 1: Translate `LoginForm.tsx`** (client component — `useTranslations('Auth')`)

Key replacements:
- `"Finance Tracker"` → `{t('appName')}`
- `"Sign in to your account"` → `{t('tagline')}`
- `"Email"` label → `{t('email')}`
- `"Password"` label → `{t('password')}`
- `"Sign in"` / `"Send magic link"` button → `{mode === 'password' ? t('signIn') : t('sendMagicLink')}`
- `"Sign in with magic link instead"` → `{mode === 'password' ? t('switchToMagic') : t('switchToPassword')}`
- Email placeholder `"nuno@example.com"` → `{t('emailPlaceholder')}`

- [ ] **Step 2: Translate `Sidebar.tsx`** (client component — `useTranslations('Nav')`)

Add `const t = useTranslations('Nav')` inside the `Sidebar` function. Replace each `label` string in `NAV_ITEMS` and `BOTTOM_ITEMS` — since these are `as const` arrays defined at module level (outside the component), they cannot use `t()` directly. Move item rendering inline:

```tsx
export function Sidebar() {
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
  // rest of JSX unchanged
}
```

Remove the `as const` since items are now computed inside the function.

- [ ] **Step 3: Translate `app/(app)/account/page.tsx`** (server component — `getTranslations('Account')`)

Add `const t = await getTranslations('Account')` inside the page function.

Key replacements:
- `"My Account"` in `<PageHeader>` → `t('title')`
- `"Account"` section heading → `t('accountSection')`
- `"Email"` label → `t('email')`
- `"Session"` section heading → `t('session')`
- `"Sign out"` button → `{t('signOut')}`

- [ ] **Step 4: Translate `ChangePasswordForm.tsx`** (client component — `useTranslations('Account')`)

Add `const t = useTranslations('Account')` inside the component function.

Key replacements:
- `"Change password"` heading → `{t('changePassword')}`
- `"New password"` label → `{t('newPassword')}`
- `"Confirm password"` label → `{t('confirmPassword')}`
- `"Min. 6 characters"` placeholder → `{t('newPasswordPlaceholder')}`
- `"Repeat new password"` placeholder → `{t('confirmPasswordPlaceholder')}`
- `"Update password"` button → `{t('updatePassword')}`

Also update `app/(app)/account/actions.ts` to use translation keys for error messages — since actions run server-side and don't have access to `t()`, hardcode the English error strings in the action (they are already in English). The client-side display of `state.error` will show whatever string the action returns; for a single-user app this is acceptable.

Actually: keep action error strings hardcoded in English — they match the `Account` namespace values exactly, but since they come from the server action as raw strings, they display as-is. The success message `state.success` should be replaced: instead of returning `{ success: 'Password updated successfully' }` from the action and displaying `state.success`, return `{ success: true }` and display `{t('passwordUpdated')}` when `state.success` is truthy. Apply this pattern to `ChangePasswordForm` only (not the actions file which stays English strings).

Updated `ChangePasswordForm` success display:
```tsx
{state?.success && (
  <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">{t('passwordUpdated')}</div>
)}
```

Updated `changePassword` action to return `{ success: true }` instead of `{ success: 'Password updated successfully' }`:
```ts
return { success: 'ok' }  // any truthy string works; component displays t('passwordUpdated')
```

- [ ] **Step 5: Translate `app/(app)/settings/page.tsx`** (server component — `getTranslations('Settings')`)

```tsx
import { getTranslations } from 'next-intl/server'
// add:
const t = await getTranslations('Settings')
// replace:
<PageHeader title={t('title')} />
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors. Any misspelled translation key will be a compile error.

- [ ] **Step 7: Commit**

```bash
git add app/\(auth\)/ components/layout/Sidebar.tsx app/\(app\)/account/ app/\(app\)/settings/page.tsx
git commit -m "feat: translate auth, sidebar, account, and settings pages"
```

---

### Task 5: Translate dashboard + add reporting currency

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `app/(app)/dashboard/_components/SpendingCard.tsx`
- Modify: `app/(app)/dashboard/_components/UpcomingBillsPanel.tsx`
- Modify: `app/(app)/dashboard/_components/RecentTransactionsPanel.tsx`

**Interfaces:**
- Consumes: `getReportingCurrency`, `getReportingRate` from `@/lib/reporting-currency`; `formatCurrency` from `@/lib/utils`; `getTranslations('Dashboard')`
- Produces: `reportingCurrency: string` and `reportingRate: number` props on panel components; translated text throughout

- [ ] **Step 1: Update `dashboard/page.tsx`**

Add reporting currency reads and translations. The full updated file:

```tsx
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { computeNetWorth } from '@/lib/net-worth'
import { getLatestRateInfo } from '@/lib/exchange-rates'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { PageHeader } from '@/components/layout/PageHeader'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { SpendingCard } from './_components/SpendingCard'
import { UpcomingBillsPanel } from './_components/UpcomingBillsPanel'
import { RecentTransactionsPanel } from './_components/RecentTransactionsPanel'
import { formatCurrency } from '@/lib/utils'
import { Globe, TrendingUp } from 'lucide-react'

function getPeriodBounds() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`
  const start = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  return { start, end, yearMonth }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const t = await getTranslations('Dashboard')
  const { start, end, yearMonth } = getPeriodBounds()
  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const reportingCurrency = await getReportingCurrency()
  const reportingRate = await getReportingRate(reportingCurrency)

  const [
    netWorth,
    rateInfo,
    budgetsResult,
    spendingResult,
    billsResult,
    txResult,
    categoriesResult,
  ] = await Promise.all([
    computeNetWorth(supabase),
    getLatestRateInfo('GBP', 'EUR'),
    supabase.from('budgets').select('amount_eur').eq('period_month', `${yearMonth}-01`),
    supabase.from('transactions').select('amount')
      .gte('occurred_on', start).lte('occurred_on', end)
      .eq('is_transfer', false).lt('amount', 0),
    supabase.from('recurring_bills').select('*')
      .eq('is_active', true)
      .gte('next_due_on', today).lte('next_due_on', in30Days)
      .order('next_due_on', { ascending: true }).limit(5),
    supabase.from('transactions').select('*')
      .order('occurred_on', { ascending: false }).limit(5),
    supabase.from('categories').select('*'),
  ])

  const totalBudgeted = (budgetsResult.data ?? []).reduce((s, b) => s + Number(b.amount_eur), 0)
  const totalSpent = (spendingResult.data ?? []).reduce((s, tx) => s + Math.abs(Number(tx.amount)), 0)

  const rateDate = new Date(rateInfo.rate_date + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  })

  return (
    <div className="flex flex-col">
      <PageHeader title={t('title')} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex gap-4">
          <SummaryCard
            label={t('netWorth')}
            value={formatCurrency(netWorth.total_eur * reportingRate, reportingCurrency)}
            subtitle={t('netWorthSubtitle')}
            icon={TrendingUp}
            accent
          />
          <SummaryCard
            label={t('gbpEur')}
            value={rateInfo.rate.toFixed(4)}
            subtitle={t('asOf', { date: rateDate })}
            icon={Globe}
          />
          <SpendingCard
            spent={totalSpent * reportingRate}
            budgeted={totalBudgeted * reportingRate}
            reportingCurrency={reportingCurrency}
          />
        </div>
        <div className="flex gap-4">
          <UpcomingBillsPanel bills={billsResult.data ?? []} />
          <RecentTransactionsPanel
            transactions={txResult.data ?? []}
            categories={categoriesResult.data ?? []}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `SpendingCard.tsx`**

Add `reportingCurrency` prop and use `formatCurrency`. Also add translations:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/utils'

type Props = { spent: number; budgeted: number; reportingCurrency: string }

export function SpendingCard({ spent, budgeted, reportingCurrency }: Props) {
  const t = useTranslations('Dashboard')
  const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0
  const overBudget = budgeted > 0 && spent > budgeted

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border-col bg-card-bg p-5">
      <span className="text-sm font-medium text-text-secondary">{t('spendingThisMonth')}</span>
      <div>
        <span className="text-2xl font-semibold text-text-primary">{formatCurrency(spent, reportingCurrency)}</span>
        <span className="ml-2 text-sm text-text-tertiary">/ {formatCurrency(budgeted, reportingCurrency)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-content-bg">
        <div
          className={`h-full rounded-full transition-all ${overBudget ? 'bg-status-danger' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-text-tertiary">{t('ofBudgetUsed', { pct: pct.toFixed(0) })}</p>
    </div>
  )
}
```

- [ ] **Step 3: Update `UpcomingBillsPanel.tsx`** (translate only — individual bill amounts stay in native currency)

```tsx
import { useTranslations } from 'next-intl'
// add at top of component:
const t = useTranslations('Dashboard')
// replace:
<h3>Upcoming Bills</h3>  →  <h3>{t('upcomingBills')}</h3>
<Link>View all</Link>  →  <Link>{useTranslations('Common')('viewAll')}</Link>  // use tCommon = useTranslations('Common')
"No bills due in the next 30 days"  →  {t('noBillsDue')}
```

Full updated component replaces the hardcoded heading, "View all" link text, and empty state. Status badge labels for "Overdue" / "Due soon" / "Active" come from `useTranslations('RecurringBills')`.

- [ ] **Step 4: Update `RecentTransactionsPanel.tsx`** (translate only — amounts stay in native transaction currency)

```tsx
// add:
const t = useTranslations('Dashboard')
const tCommon = useTranslations('Common')
// replace:
<h3>Recent Transactions</h3>  →  <h3>{t('recentTransactions')}</h3>
"View all"  →  {tCommon('viewAll')}
"No transactions yet"  →  {t('noTransactions')}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/dashboard/
git commit -m "feat: translate dashboard and wire reporting currency to spending/net worth display"
```

---

### Task 6: Translate accounts page

**Files:**
- Modify: `app/(app)/accounts/page.tsx`
- Modify: `app/(app)/accounts/_components/AccountsSummary.tsx`
- Modify: `app/(app)/accounts/_components/AccountCard.tsx`
- Modify: `app/(app)/accounts/_components/AddAccountDrawer.tsx`

**Interfaces:**
- Consumes: `getTranslations('Accounts')` (server), `useTranslations('Accounts')` (client); `getReportingCurrency`, `getReportingRate`, `formatCurrency`

Note: Account balances in `AccountsSummary` are the total balance — this is an aggregate and uses the reporting currency. Individual account balances in `AccountCard` show in the account's native currency (unchanged).

- [ ] **Step 1: Update `accounts/page.tsx`**

Add reporting currency reads and `getTranslations('Accounts')`:

```tsx
import { getTranslations } from 'next-intl/server'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'

// inside the page function, add:
const t = await getTranslations('Accounts')
const reportingCurrency = await getReportingCurrency()
const reportingRate = await getReportingRate(reportingCurrency)

// replace <PageHeader title="Accounts" ...> with:
<PageHeader title={t('title')} actions={<AddAccountDrawer />} />

// pass reportingCurrency and reportingRate to AccountsSummary:
<AccountsSummary accounts={accountList} balances={balances} gbpToEur={gbpToEur} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
```

- [ ] **Step 2: Update `AccountsSummary.tsx`**

Add `reportingCurrency` and `reportingRate` props. Replace `formatEur(totalEur)` with `formatCurrency(totalEur * reportingRate, reportingCurrency)` for the aggregate total. Add `useTranslations('Accounts')` for the label.

- [ ] **Step 3: Update `AccountCard.tsx`**

`ACCOUNT_TYPE_LABELS` is a module-level object — move it inside the component and use `useTranslations('Accounts')`:

```tsx
import { useTranslations } from 'next-intl'

export function AccountCard({ account, balance }: Props) {
  const t = useTranslations('Accounts')

  const typeLabel = t(`types.${account.account_type}` as any)
  // replace ACCOUNT_TYPE_LABELS[account.account_type] with typeLabel

  // replace "Balance" label:
  <p className="text-xs text-text-secondary">{t('balance')}</p>

  // replace "Import CSV" link text:
  <Link ...>{t('importCsv')} <ArrowUpRight size={12} /></Link>
}
```

- [ ] **Step 4: Update `AddAccountDrawer.tsx`** (client component — `useTranslations('Accounts')`)

Add `const t = useTranslations('Accounts')` and replace all visible label strings, button text, and select option text using the `Accounts` namespace keys.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/accounts/
git commit -m "feat: translate accounts page and wire reporting currency to balance total"
```

---

### Task 7: Translate transactions page

**Files:**
- Modify: `app/(app)/transactions/page.tsx`
- Modify: `app/(app)/transactions/_components/TransactionTable.tsx`
- Modify: `app/(app)/transactions/_components/TransactionFilters.tsx`
- Modify: `app/(app)/transactions/_components/TransactionSummary.tsx`
- Modify: `app/(app)/transactions/_components/AddTransactionDrawer.tsx`
- Modify: `app/(app)/transactions/import/_components/UploadStep.tsx`
- Modify: `app/(app)/transactions/import/_components/MapStep.tsx`
- Modify: `app/(app)/transactions/import/_components/PreviewStep.tsx`
- Modify: `app/(app)/transactions/import/_components/ConfirmStep.tsx`
- Modify: `app/(app)/transactions/import/_components/ImportStepper.tsx`

**Interfaces:**
- Consumes: `getTranslations('Transactions')` / `useTranslations('Transactions')`

Note: Transaction amounts show in each transaction's native currency — no reporting currency conversion needed here. `TransactionSummary` aggregates (income/expenses/net) are in EUR — these can stay as `formatEur` for now since the summary uses `getRate` conversion internally and this is not listed as a reporting currency target in the spec.

- [ ] **Step 1: Update server component pages and all client components**

For each file, add the appropriate `getTranslations('Transactions')` (server) or `useTranslations('Transactions')` (client) call. Replace every visible hardcoded string using the `Transactions` namespace keys. Key replacements by file:

`page.tsx` (server):
- `"Transactions"` page title → `t('title')`
- `"Import CSV"` button → `t('importCsv')`
- `"Add transaction"` → `t('addTransaction')`

`TransactionFilters.tsx` (client):
- `"All accounts"` placeholder → `t('filters.allAccounts')`
- `"All categories"` → `t('filters.allCategories')`
- `"Search…"` → `t('filters.search')`

`TransactionTable.tsx` (server or client — check file):
- Column headers: `"Date"` → `t('date')`, `"Description"` → `t('description')`, `"Category"` → `t('category')`, `"Amount"` → `t('amount')`, `"Account"` → `t('account')`
- Empty state → `t('noTransactions')`

`TransactionSummary.tsx`:
- `"Income"` → `t('income')`, `"Expenses"` → `t('expenses')`, `"Net"` → `t('net')`

Import components (`UploadStep`, `MapStep`, `PreviewStep`, `ConfirmStep`, `ImportStepper`):
- All button labels, headings, and status text → `t('import.*')` keys

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/transactions/
git commit -m "feat: translate transactions page and CSV import flow"
```

---

### Task 8: Translate budgets + reporting currency

**Files:**
- Modify: `app/(app)/budgets/page.tsx`
- Modify: `app/(app)/budgets/_components/BudgetSummary.tsx`
- Modify: `app/(app)/budgets/_components/BudgetTable.tsx`
- Modify: `app/(app)/budgets/_components/BudgetVarianceWidget.tsx`
- Modify: `app/(app)/budgets/_components/AddBudgetDrawer.tsx`

**Interfaces:**
- Consumes: `getReportingCurrency`, `getReportingRate`, `formatCurrency`; `getTranslations('Budgets')`

- [ ] **Step 1: Update `budgets/page.tsx`**

Add reporting currency reads:

```tsx
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { getTranslations } from 'next-intl/server'

// inside page function:
const t = await getTranslations('Budgets')
const reportingCurrency = await getReportingCurrency()
const reportingRate = await getReportingRate(reportingCurrency)

// update PageHeader:
<PageHeader title={t('title')} ... />

// pass reportingCurrency and reportingRate to BudgetSummary, BudgetTable, BudgetVarianceWidget
```

- [ ] **Step 2: Update `BudgetSummary.tsx`**

Add `reportingCurrency: string` and `reportingRate: number` props. Replace `formatEur(amount)` with `formatCurrency(amount * reportingRate, reportingCurrency)` for the three summary totals (budgeted, spent, remaining). Add `useTranslations('Budgets')` for label text.

- [ ] **Step 3: Update `BudgetTable.tsx`**

Add `reportingCurrency` and `reportingRate` props. Replace `formatEur` calls on budget row amounts with `formatCurrency(amount * reportingRate, reportingCurrency)`. Column headers and labels use `useTranslations('Budgets')`.

- [ ] **Step 4: Update `BudgetVarianceWidget.tsx`**

Add `reportingCurrency` and `reportingRate` props. The widget renders bar widths as percentages (no currency formatting), but any displayed currency amounts use `formatCurrency`. Title uses `t('budgetVsActual')`.

- [ ] **Step 5: Update `AddBudgetDrawer.tsx`** (client — translations only, no reporting currency)

Add `useTranslations('Budgets')` and replace all visible label strings.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/budgets/
git commit -m "feat: translate budgets page and wire reporting currency to budget totals"
```

---

### Task 9: Translate recurring bills + reporting currency

**Files:**
- Modify: `app/(app)/recurring-bills/page.tsx`
- Modify: `app/(app)/recurring-bills/_components/BillsSummary.tsx`
- Modify: `app/(app)/recurring-bills/_components/BillsTable.tsx`
- Modify: `app/(app)/recurring-bills/_components/AddBillDrawer.tsx`
- Modify: `app/(app)/recurring-bills/_components/MarkPaidButton.tsx`

**Interfaces:**
- Consumes: `getReportingCurrency`, `getReportingRate`, `formatCurrency`; `getTranslations('RecurringBills')`

- [ ] **Step 1: Update `recurring-bills/page.tsx`**

```tsx
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { getTranslations } from 'next-intl/server'

const t = await getTranslations('RecurringBills')
const reportingCurrency = await getReportingCurrency()
const reportingRate = await getReportingRate(reportingCurrency)

<PageHeader title={t('title')} ... />
// pass reportingCurrency and reportingRate to BillsSummary and BillsTable
```

- [ ] **Step 2: Update `BillsSummary.tsx`**

Add `reportingCurrency` and `reportingRate` props. Replace `formatEur(monthlyTotal)` etc. with `formatCurrency(amount * reportingRate, reportingCurrency)`. The `toMonthlyEur` and `toAnnualEur` functions already compute in EUR — multiply by `reportingRate` for display. Use `useTranslations('RecurringBills')` for card labels.

- [ ] **Step 3: Update `BillsTable.tsx`**

Status badge labels use `t('overdue')`, `t('dueSoon')`, `t('active')`. Column headers use `t('name')` etc. Frequency labels use `t('frequencies.weekly')` etc. Empty state uses `t('noBills')`.

- [ ] **Step 4: Update `AddBillDrawer.tsx`** (client — translations only)

Add `useTranslations('RecurringBills')` and replace all visible strings.

- [ ] **Step 5: Update `MarkPaidButton.tsx`** (client)

```tsx
import { useTranslations } from 'next-intl'

export function MarkPaidButton({ billId }: Props) {
  const t = useTranslations('RecurringBills')
  // replace:
  {loading ? 'Saving…' : 'Mark paid'}
  // with:
  {loading ? t('saving') : t('markPaid')}
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/recurring-bills/
git commit -m "feat: translate recurring bills page and wire reporting currency to bill totals"
```

---

### Task 10: Translate investments + reporting currency

**Files:**
- Modify: `app/(app)/investments/page.tsx`
- Modify: `app/(app)/investments/_components/InvestmentsSummary.tsx`
- Modify: `app/(app)/investments/_components/HoldingsTable.tsx`
- Modify: `app/(app)/investments/_components/AddHoldingDrawer.tsx`
- Modify: `app/(app)/investments/_components/DeleteHoldingButton.tsx`
- Modify: `app/(app)/investments/_components/RefreshPricesButton.tsx`

**Interfaces:**
- Consumes: `getReportingCurrency`, `getReportingRate`, `formatCurrency`; `getTranslations('Investments')`

- [ ] **Step 1: Update `investments/page.tsx`**

```tsx
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { getTranslations } from 'next-intl/server'

const t = await getTranslations('Investments')
const reportingCurrency = await getReportingCurrency()
const reportingRate = await getReportingRate(reportingCurrency)

<PageHeader title={t('title')} ... />
// pass reportingCurrency and reportingRate to InvestmentsSummary and HoldingsTable
// update "last refreshed" text:
<p>{lastRefreshedDate ? t('pricesAsOf', { date: lastRefreshedDate }) : t('noPricesYet')}</p>
```

- [ ] **Step 2: Update `InvestmentsSummary.tsx`**

Add `reportingCurrency: string` and `reportingRate: number` props. Replace `formatEur(amount)` with `formatCurrency(amount * reportingRate, reportingCurrency)` for all three summary cards. Card labels from `useTranslations('Investments')`.

- [ ] **Step 3: Update `HoldingsTable.tsx`**

Add `reportingCurrency: string` and `reportingRate: number` props. Replace the "Value (EUR)" and "P&L (EUR)" column header text with `t('value')` and `t('pnl')`. Replace `formatEur`/inline EUR formatting on the value and P&L columns with `formatCurrency(computed.value_eur * reportingRate, reportingCurrency)` and `formatCurrency(computed.pnl_eur * reportingRate, reportingCurrency)`. Column headers from `useTranslations('Investments')`. Empty state from `t('noHoldings')`. Asset type badge label from `t('assetTypes.' + holding.asset_type)`.

- [ ] **Step 4: Update `AddHoldingDrawer.tsx`** (client — translations only)

Add `useTranslations('Investments')`. Replace all field labels, placeholders, button text, and asset type option labels using the `Investments` namespace keys.

- [ ] **Step 5: Update `DeleteHoldingButton.tsx`** (client)

```tsx
const t = useTranslations('Investments')
// replace:
if (!confirm('Delete this holding and all its price history?')) return
// with:
if (!confirm(t('deleteConfirm'))) return
```

- [ ] **Step 6: Update `RefreshPricesButton.tsx`** (client)

```tsx
const t = useTranslations('Investments')
// replace:
{loading ? 'Refreshing…' : 'Refresh prices'}
// with:
{loading ? t('refreshing') : t('refreshPrices')}
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add app/\(app\)/investments/
git commit -m "feat: translate investments page and wire reporting currency to portfolio values"
```

---

### Task 11: Translate net worth + reporting currency

**Files:**
- Modify: `app/(app)/net-worth/page.tsx`
- Modify: `app/(app)/net-worth/_components/NetWorthSummary.tsx`
- Modify: `app/(app)/net-worth/_components/NetWorthChart.tsx`
- Modify: `app/(app)/net-worth/_components/BreakdownTable.tsx`
- Modify: `app/(app)/net-worth/_components/SnapshotHistory.tsx`

**Interfaces:**
- Consumes: `getReportingCurrency`, `getReportingRate`, `formatCurrency`, `formatShortCurrency`; `getTranslations('NetWorth')`

- [ ] **Step 1: Update `net-worth/page.tsx`**

```tsx
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { getTranslations } from 'next-intl/server'

const t = await getTranslations('NetWorth')
const reportingCurrency = await getReportingCurrency()
const reportingRate = await getReportingRate(reportingCurrency)

<PageHeader title={t('title')} />

// pass reportingCurrency and reportingRate to all child components
<NetWorthSummary current={netWorth.total_eur} snapshots={snapshots} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
<NetWorthChart snapshots={snapshots} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
<BreakdownTable breakdown={netWorth.breakdown} total_eur={netWorth.total_eur} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
<SnapshotHistory snapshots={snapshots} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
```

- [ ] **Step 2: Update `NetWorthSummary.tsx`**

Add `reportingCurrency: string` and `reportingRate: number` props. Replace `formatEur(current)` and change values with `formatCurrency(current * reportingRate, reportingCurrency)`. Card labels from `getTranslations('NetWorth')` (this is a server component — use `getTranslations`).

The `formatChange` helper inside the component:
```ts
function formatChange(current: number, previous: NetWorthSnapshot | undefined, reportingRate: number, reportingCurrency: string) {
  if (!previous) return null
  const change = current - Number(previous.total_eur)
  const pct = Number(previous.total_eur) > 0 ? (change / Number(previous.total_eur)) * 100 : 0
  const sign = change >= 0 ? '+' : ''
  return `${sign}${formatCurrency(change * reportingRate, reportingCurrency)} (${sign}${pct.toFixed(2)}%)`
}
```

- [ ] **Step 3: Update `NetWorthChart.tsx`** (client component)

Add `reportingCurrency: string` and `reportingRate: number` props. Import `formatShortCurrency` from `@/lib/utils`. Replace `formatShortEur` with `formatShortCurrency`. Convert each snapshot's `total_eur` by multiplying by `reportingRate` in the data array:

```tsx
const data = snapshots.map(s => ({
  date: s.snapshot_date,
  label: formatMonthLabel(s.snapshot_date),
  total: Number(s.total_eur) * reportingRate,
}))
```

Replace `formatShortEur` in `YAxis tickFormatter`:
```tsx
tickFormatter={(value: number) => formatShortCurrency(value, reportingCurrency)}
```

Replace tooltip formatter:
```tsx
formatter={(value: unknown) =>
  formatCurrency(typeof value === 'number' ? value : Number(value), reportingCurrency)
}
```

Add `formatCurrency` import from `@/lib/utils`. Remove `formatShortEur` (it's now replaced by `formatShortCurrency`). The chart title uses `useTranslations('NetWorth')`: `t('netWorthLabel')`. The empty state uses `t('noDataYet')`.

- [ ] **Step 4: Update `BreakdownTable.tsx`**

Add `reportingCurrency: string` and `reportingRate: number` props. The column header `"{currency} equivalent"` uses `t('currencyEquivalent', { currency: reportingCurrency })`. EUR equivalent cells: `formatCurrency(amount * reportingRate, reportingCurrency)`. Total footer: `formatCurrency(total_eur * reportingRate, reportingCurrency)`. Section headings use `t('accountsSection')` and `t('holdingsSection')`. Total label uses `t('total')`. Native balance column header uses `t('nativeBalance')`.

- [ ] **Step 5: Update `SnapshotHistory.tsx`**

Add `reportingCurrency: string` and `reportingRate: number` props. The `<summary>` text: `t('snapshotHistory', { count: sorted.length })`. Date column header: `t('date')`. Value column: `formatCurrency(Number(s.total_eur) * reportingRate, reportingCurrency)`.

- [ ] **Step 6: Verify TypeScript compiles and existing tests pass**

Run: `npx tsc --noEmit && npm run test:run`
Expected: 0 errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/net-worth/
git commit -m "feat: translate net worth page and wire reporting currency to all net worth displays"
```
