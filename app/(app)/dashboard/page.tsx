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
