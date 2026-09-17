import { createClient } from '@/lib/supabase/server'
import { buildBudgetRows } from '@/lib/budgets'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { PageHeader } from '@/components/layout/PageHeader'
import { BudgetSummary } from './_components/BudgetSummary'
import { BudgetTable } from './_components/BudgetTable'
import { BudgetVarianceWidget } from './_components/BudgetVarianceWidget'
import { AddBudgetDrawer } from './_components/AddBudgetDrawer'
import { getTranslations } from 'next-intl/server'

function getPeriodBounds(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number)
  const start = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

function getMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function subtractMonths(yearMonth: string, n: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const d = new Date(year, month - 1 - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

type SearchParams = Promise<{ month?: string }>

export default async function BudgetsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const now = new Date()
  const currentMonth = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const t = await getTranslations('Budgets')
  const reportingCurrency = await getReportingCurrency()
  const reportingRate = await getReportingRate(reportingCurrency)

  const supabase = await createClient()
  const [categoriesResult] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
  ])
  const categories = categoriesResult.data ?? []

  // Fetch current + 2 prior months for variance widget
  const months = [subtractMonths(currentMonth, 2), subtractMonths(currentMonth, 1), currentMonth]

  const monthData = await Promise.all(
    months.map(async (ym) => {
      const { start, end } = getPeriodBounds(ym)
      const [budgetsRes, txRes] = await Promise.all([
        supabase.from('budgets').select('*').eq('period_month', start),
        supabase.from('transactions').select('*').gte('occurred_on', start).lte('occurred_on', end).eq('is_transfer', false),
      ])
      return {
        yearMonth: ym,
        label: getMonthLabel(ym),
        rows: buildBudgetRows(budgetsRes.data ?? [], categories, txRes.data ?? []),
      }
    })
  )

  const currentData = monthData[2]

  // Month navigation
  const prevMonth = subtractMonths(currentMonth, 1)
  const nextMonth = subtractMonths(currentMonth, -1)

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t('title')}
        actions={<AddBudgetDrawer categories={categories} currentMonth={currentMonth} />}
      />
      <div className="flex flex-col gap-6 p-6">
        {/* Month navigation */}
        <div className="flex items-center gap-3">
          <a href={`/budgets?month=${prevMonth}`} className="rounded-lg border border-border-col px-3 py-1.5 text-sm text-text-secondary hover:bg-content-bg">←</a>
          <span className="text-sm font-medium text-text-primary">{getMonthLabel(currentMonth)}</span>
          <a href={`/budgets?month=${nextMonth}`} className="rounded-lg border border-border-col px-3 py-1.5 text-sm text-text-secondary hover:bg-content-bg">→</a>
        </div>

        <BudgetSummary rows={currentData.rows} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <BudgetTable rows={currentData.rows} categories={categories} currentMonth={currentMonth} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <BudgetVarianceWidget months={monthData} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
      </div>
    </div>
  )
}
