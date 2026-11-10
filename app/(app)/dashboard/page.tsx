import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import { computeNetWorth } from '@/lib/net-worth'
import { getLatestRateInfo } from '@/lib/exchange-rates'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { AsOfPicker } from '@/components/ui/AsOfPicker'
import { AccountPill } from '@/components/ui/AccountPill'
import { SpendingCard } from './_components/SpendingCard'
import { UpcomingBillsPanel } from './_components/UpcomingBillsPanel'
import { RecentTransactionsPanel } from './_components/RecentTransactionsPanel'
import { DashboardQuickActions } from './_components/DashboardQuickActions'
import { computeSpent } from '@/lib/summary'
import { formatMoney, formatMonthYear } from '@/lib/utils'
import { Globe } from 'lucide-react'

function getPeriodBounds(asOf: string, locale: string) {
  const d = new Date(asOf + 'T00:00:00')
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`
  const start = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  // cap the end at asOf so spending only counts up to the selected date
  const end = monthEnd < asOf ? monthEnd : asOf
  const periodLabel = formatMonthYear(d, locale)
  return { start, end, yearMonth, periodLabel }
}

type SearchParams = Promise<{ asOf?: string }>

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()
  const t = await getTranslations('Dashboard')
  const locale = await getLocale()
  const today = new Date().toISOString().split('T')[0]
  const asOf = params.asOf ?? today
  const { start, end, yearMonth, periodLabel } = getPeriodBounds(asOf, locale)
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
    accountsResult,
  ] = await Promise.all([
    computeNetWorth(supabase, asOf === today ? undefined : asOf),
    getLatestRateInfo('GBP', 'EUR'),
    supabase.from('budgets').select('amount_eur').eq('period_month', `${yearMonth}-01`),
    supabase.from('transactions')
      .select('amount, currency, category_id, accounts!inner(is_active)')
      .gte('occurred_on', start).lte('occurred_on', end)
      .eq('is_transfer', false).lt('amount', 0)
      .eq('accounts.is_active', true),
    supabase.from('recurring_bills').select('*')
      .eq('is_active', true)
      .gte('next_due_on', today).lte('next_due_on', in30Days)
      .order('next_due_on', { ascending: true }).limit(5),
    supabase.from('transactions').select('*')
      .lte('occurred_on', asOf)
      .order('occurred_on', { ascending: false }).limit(5),
    supabase.from('categories').select('*'),
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
  ])

  const totalBudgeted = (budgetsResult.data ?? []).reduce((s, b) => s + Number(b.amount_eur), 0)

  const categories = categoriesResult.data ?? []
  const excludedCategoryIds = new Set(categories.filter(c => c.exclude_from_spending).map(c => c.id))
  const toEur = (amount: number, currency: string) =>
    currency === 'GBP' ? amount * rateInfo.rate : amount
  const totalSpent = computeSpent(spendingResult.data ?? [], excludedCategoryIds, toEur)

  const activeAccounts = accountsResult.data ?? []
  const transactions = txResult.data ?? []
  const bills = billsResult.data ?? []

  const formattedNetWorth = formatMoney(netWorth.total_eur * reportingRate, reportingCurrency, locale)

  const gbpAccountsTotal = netWorth.breakdown.accounts
    .filter(a => a.currency === 'GBP')
    .reduce((sum, a) => sum + a.balance_native, 0)
  const gbpHoldingsTotal = netWorth.breakdown.holdings
    .filter(h => h.currency === 'GBP')
    .reduce((sum, h) => sum + h.value_native, 0)
  const gbpExposureNative = gbpAccountsTotal + gbpHoldingsTotal
  const formattedGbpExposure = formatMoney(gbpExposureNative, 'GBP', locale)

  return (
    <div className="flex flex-1 flex-col bg-surface lg:bg-canvas">
      {/* Mobile Layout (01 — Dashboard) */}
      <div className="flex flex-1 flex-col lg:hidden">
        <div className="bg-linear-to-b from-ink via-teal via-70% to-teal-dark px-6 pt-4 pb-12 text-white">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-[30px] w-[30px] shrink-0 overflow-hidden rounded-lg">
                <Image
                  src="/logo.png"
                  alt="Norte"
                  width={30}
                  height={30}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-h2 font-bold text-white">Norte</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-caption text-glass-70">{t('totalNetWorth')}</span>
            <span className="text-display font-extrabold text-white tabular-nums">
              {formattedNetWorth}
            </span>
            <span className="text-caption text-glass-70 tabular-nums">
              {t('gbpExposure', { amount: formattedGbpExposure })}
            </span>
          </div>

          <div className="flex justify-center pb-4">
            <AccountPill
              label={t('accountsCount', { count: activeAccounts.length })}
              href="/accounts"
            />
          </div>

          <DashboardQuickActions accounts={activeAccounts} categories={categories} />
        </div>

        <div className="-mt-6 flex flex-1 flex-col gap-4 rounded-t-[24px] bg-surface px-5 pt-6 pb-28">
          <SpendingCard
            spent={totalSpent * reportingRate}
            budgeted={totalBudgeted * reportingRate}
            reportingCurrency={reportingCurrency}
            periodLabel={periodLabel}
          />
          <RecentTransactionsPanel
            transactions={transactions}
            categories={categories}
            accounts={activeAccounts}
          />
          <UpcomingBillsPanel
            bills={bills}
            categories={categories}
            accounts={activeAccounts}
          />
        </div>
      </div>

      {/* Desktop Layout (01b — Dashboard Desktop) */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:gap-6 lg:px-9 lg:py-7">
        <div className="flex h-11 items-center justify-between">
          <h1 className="text-h1 font-bold text-ink">{t('title')}</h1>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-[38px] items-center gap-2 rounded-full border border-separator bg-surface px-3.5">
              <Globe size={15} className="text-teal" />
              <span className="text-caption font-semibold text-ink tabular-nums">
                {t('gbpEur')} · {rateInfo.rate.toFixed(4)}
              </span>
            </div>
            <AsOfPicker asOf={asOf} />
          </div>
        </div>

        <div className="flex min-h-[196px] items-center justify-between rounded-[24px] bg-linear-to-br from-ink via-teal via-68% to-teal-dark px-9 py-7 text-white shadow-lg">
          <div className="flex flex-col gap-2">
            <span className="text-caption font-medium text-glass-70">
              {t('totalNetWorth')}
            </span>
            <span className="text-display font-extrabold text-white tabular-nums">
              {formattedNetWorth}
            </span>
            <div className="flex items-center gap-3 pt-0.5">
              <AccountPill
                label={t('accountsCount', { count: activeAccounts.length })}
                href="/accounts"
              />
              <span className="text-caption font-medium text-glass-80 tabular-nums">
                {t('gbpExposure', { amount: formattedGbpExposure })}
              </span>
            </div>
          </div>

          <DashboardQuickActions accounts={activeAccounts} categories={categories} />
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-7">
            <RecentTransactionsPanel
              transactions={transactions}
              categories={categories}
              accounts={activeAccounts}
            />
          </div>
          <div className="col-span-5 flex flex-col gap-6">
            <SpendingCard
              spent={totalSpent * reportingRate}
              budgeted={totalBudgeted * reportingRate}
              reportingCurrency={reportingCurrency}
              periodLabel={periodLabel}
            />
            <UpcomingBillsPanel
              bills={bills}
              categories={categories}
              accounts={activeAccounts}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
