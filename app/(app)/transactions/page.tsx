import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import { getRate } from '@/lib/exchange-rates'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { buildSearchOrFilter } from '@/lib/category-rules'
import { formatMoney, formatMonthYear } from '@/lib/utils'
import { ScreenHero } from '@/components/layout/ScreenHero'
import { Button } from '@/components/ui/Button'
import { TransactionSection } from './_components/TransactionSection'
import { TransactionSummary } from './_components/TransactionSummary'
import { AddTransactionDrawer } from './_components/AddTransactionDrawer'
import Link from 'next/link'
import type { CategoryRule } from '@/types/database'

type SearchParams = {
  account?: string
  category?: string
  from?: string
  to?: string
  q?: string
}

function defaultDateRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  return {
    from: `${year}-${month}-01`,
    to:   `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const t = await getTranslations('Transactions')
  const locale = await getLocale()
  const params = await searchParams
  const defaults = defaultDateRange()
  const from = params.from ?? defaults.from
  const to   = params.to   ?? defaults.to

  const [
    reportingCurrency,
    accountsResult,
    categoriesResult,
    rulesResult,
  ] = await Promise.all([
    getReportingCurrency(),
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('id, user_id, name, parent_category_id, kind, is_system, irs_deduction, income_type').order('name'),
    supabase
      .from('category_rules')
      .select('id, match_text, match_key, match_type, category_id, created_at')
      .order('created_at', { ascending: false }),
  ])

  const [reportingRate, gbpToEurRate] = await Promise.all([
    getReportingRate(reportingCurrency),
    getRate('GBP', 'EUR'),
  ])

  // Fetch latest completed import batch for display
  type LatestBatchRow = {
    id: string
    filename: string | null
    row_count: number | null
    imported_at: string
    accounts: { name: string } | null
  }
  const { data: latestBatchRaw } = await supabase
    .from('import_batches')
    .select('id, filename, row_count, imported_at, accounts(name)')
    .eq('status', 'completed')
    .order('imported_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestBatch = latestBatchRaw as LatestBatchRow | null

  // Build main transaction query
  let txQuery = supabase
    .from('transactions')
    .select('*, accounts(name), categories(id, name, kind, irs_deduction, income_type)')
    .gte('occurred_on', from)
    .lte('occurred_on', to)
    .order('occurred_on', { ascending: false })

  if (params.account)  txQuery = txQuery.eq('account_id', params.account)

  if (params.category === 'uncategorised' || params.category === 'uncategorized') {
    txQuery = txQuery.is('category_id', null).eq('is_transfer', false)
  } else if (params.category) {
    txQuery = txQuery.eq('category_id', params.category)
  }

  if (params.q) {
    const orFilter = buildSearchOrFilter(params.q)
    if (orFilter) txQuery = txQuery.or(orFilter)
  }

  // Uncategorised count for the active period/account
  let uncatQuery = supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .gte('occurred_on', from)
    .lte('occurred_on', to)
    .is('category_id', null)
    .eq('is_transfer', false)
  if (params.account) uncatQuery = uncatQuery.eq('account_id', params.account)

  const [txResult, uncatResult] = await Promise.all([txQuery, uncatQuery])

  const accounts          = accountsResult.data   ?? []
  const categories        = categoriesResult.data ?? []
  const categoryRules     = (rulesResult.data ?? []) as CategoryRule[]
  const transactions      = (txResult.data ?? []) as Parameters<typeof TransactionSection>[0]['transactions']
  const uncategorisedCount = uncatResult.count ?? 0

  // Compute hero metric: total out (expenses only) in reporting currency
  const nonTransfers = transactions.filter(tx => !tx.is_transfer)
  const totalOutNative = nonTransfers.filter(tx => Number(tx.amount) < 0).reduce((s, tx) => s + Number(tx.amount), 0)
  const totalInNative  = nonTransfers.filter(tx => Number(tx.amount) > 0).reduce((s, tx) => s + Number(tx.amount), 0)
  const transferCount  = transactions.filter(tx => tx.is_transfer).length
  const incomeCount    = nonTransfers.filter(tx => Number(tx.amount) > 0).length
  const expenseCount   = nonTransfers.filter(tx => Number(tx.amount) < 0).length

  // Convert totals to reporting currency (approximate using GBP→EUR + then EUR→reporting)
  // For the hero display we use a simplified approach: convert each tx's native amount
  // to EUR via gbpToEurRate, then to reporting via reportingRate
  function toReporting(amount: number, currency: string): number {
    if (currency === reportingCurrency) return amount
    const toEur = currency === 'EUR' ? amount : (currency === 'GBP' ? amount * gbpToEurRate : amount)
    return toEur * reportingRate
  }

  const totalOutReporting = nonTransfers
    .filter(tx => Number(tx.amount) < 0)
    .reduce((s, tx) => s + toReporting(Number(tx.amount), tx.currency), 0)

  const totalInReporting = nonTransfers
    .filter(tx => Number(tx.amount) > 0)
    .reduce((s, tx) => s + toReporting(Number(tx.amount), tx.currency), 0)

  const spentMetric   = formatMoney(-Math.abs(totalOutReporting), reportingCurrency, locale)
  const incomeMetric  = formatMoney(totalInReporting, reportingCurrency, locale, { signDisplay: 'always' })
  const monthLabel    = formatMonthYear(from, locale)
  const gbpEurLabel   = `GBP / EUR · ${gbpToEurRate.toFixed(4)}`

  return (
    <ScreenHero
      title={t('title')}
      metric={spentMetric}
      eyebrow={`${t('spentIn')} ${monthLabel}`}
      subtitle={
        <span className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
          <span className="text-positive-tint lg:text-positive">{t('incomeLabel')} · {incomeMetric}</span>
          {transferCount > 0 && (
            <span className="text-glass-70 lg:text-text-secondary">{t('transfersExcluded', { count: transferCount })}</span>
          )}
        </span>
      }
      mobileActions={
        <div className="flex items-center gap-2">
          <Link
            href="/transactions/import"
            className="inline-flex items-center gap-1.5 rounded-full bg-glass-15 px-3 py-1.5 text-caption font-semibold text-white border border-glass-30 hover:bg-glass-20"
          >
            {t('importCsv')}
          </Link>
          <AddTransactionDrawer
            accounts={accounts}
            categories={categories}
            triggerVariant="glass"
          />
        </div>
      }
      desktopActions={
        <div className="flex items-center gap-2">
          {/* Month switcher */}
          <MonthSwitcherPill currentFrom={from} monthLabel={monthLabel} />
          {/* GBP/EUR rate pill */}
          <span className="inline-flex items-center rounded-full border border-separator bg-canvas px-3 h-9 text-caption font-semibold text-text-secondary">
            {gbpEurLabel}
          </span>
          <Link
            href="/transactions/import"
            className="inline-flex items-center gap-1.5 rounded-full border border-separator bg-canvas px-3 h-9 text-caption font-semibold text-ink hover:bg-surface"
          >
            {t('importCsv')}
          </Link>
          <AddTransactionDrawer accounts={accounts} categories={categories} />
        </div>
      }
    >
      <TransactionSummary
        transactions={transactions}
        categories={categories}
        reportingCurrency={reportingCurrency}
        gbpToEurRate={gbpToEurRate}
        reportingRate={reportingRate}
        locale={locale}
        from={from}
        transferCount={transferCount}
        expenseCount={expenseCount}
        incomeCount={incomeCount}
        totalOutReporting={totalOutReporting}
        totalInReporting={totalInReporting}
        latestBatch={latestBatch ? {
          id:          latestBatch.id,
          filename:    latestBatch.filename,
          row_count:   latestBatch.row_count,
          imported_at: latestBatch.imported_at,
        } : null}
      />

      <TransactionSection
        accounts={accounts}
        categories={categories}
        currentAccount={params.account ?? ''}
        currentCategory={params.category ?? ''}
        currentFrom={from}
        currentTo={to}
        currentQ={params.q ?? ''}
        uncategorisedCount={uncategorisedCount}
        transactions={transactions}
        categoryRules={categoryRules}
        hasRules={categoryRules.length > 0}
        reportingCurrency={reportingCurrency}
        gbpToEurRate={gbpToEurRate}
        locale={locale}
        latestBatch={latestBatch ? {
          id:        latestBatch.id,
          filename:  latestBatch.filename,
          row_count: latestBatch.row_count,
        } : null}
      />
    </ScreenHero>
  )
}

/** Server-renderable pill — posts month offset as search params via a form or uses links */
function MonthSwitcherPill({ currentFrom, monthLabel }: { currentFrom: string; monthLabel: string }) {
  function offsetMonth(from: string, offset: number): { from: string; to: string } {
    const d = new Date(from + 'T00:00:00')
    d.setMonth(d.getMonth() + offset)
    const year  = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const last  = new Date(year, d.getMonth() + 1, 0).getDate()
    return {
      from: `${year}-${month}-01`,
      to:   `${year}-${month}-${String(last).padStart(2, '0')}`,
    }
  }
  const prev = offsetMonth(currentFrom, -1)
  const next = offsetMonth(currentFrom, 1)

  return (
    <span className="inline-flex items-center rounded-full border border-separator bg-canvas h-9 text-caption font-semibold text-ink overflow-hidden">
      <Link
        href={`/transactions?from=${prev.from}&to=${prev.to}`}
        className="flex h-full items-center px-3 hover:bg-surface"
        aria-label="Previous month"
      >
        ←
      </Link>
      <span className="px-2 text-ink">{monthLabel}</span>
      <Link
        href={`/transactions?from=${next.from}&to=${next.to}`}
        className="flex h-full items-center px-3 hover:bg-surface"
        aria-label="Next month"
      >
        →
      </Link>
    </span>
  )
}
