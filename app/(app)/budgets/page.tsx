import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buildBudgetRows } from '@/lib/budgets'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { getRate } from '@/lib/exchange-rates'
import { ScreenHero } from '@/components/layout/ScreenHero'
import { BudgetSummary } from './_components/BudgetSummary'
import { BudgetTable } from './_components/BudgetTable'
import { BudgetVarianceWidget } from './_components/BudgetVarianceWidget'
import { AddBudgetDrawer } from './_components/AddBudgetDrawer'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatMoney, formatMonthYear } from '@/lib/utils'

function getPeriodBounds(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number)
  const start = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

function getMonthLabel(yearMonth: string, locale: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  return formatMonthYear(new Date(year, month - 1, 1), locale)
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
  const currentMonth =
    params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const t = await getTranslations('Budgets')
  const locale = await getLocale()
  const reportingCurrency = await getReportingCurrency()
  const [reportingRate, gbpToEurRate] = await Promise.all([
    getReportingRate(reportingCurrency),
    getRate('GBP', 'EUR'),
  ])

  const supabase = await createClient()
  const [categoriesResult] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
  ])
  const categories = categoriesResult.data ?? []
  const excludedCategoryIds = new Set(categories.filter(c => c.exclude_from_spending).map(c => c.id))
  const toEur = (amount: number, currency: string): number =>
    currency === 'GBP' ? amount * gbpToEurRate : amount

  // Fetch current + 2 prior months for variance widget
  const months = [
    subtractMonths(currentMonth, 2),
    subtractMonths(currentMonth, 1),
    currentMonth,
  ]

  const monthData = await Promise.all(
    months.map(async ym => {
      const { start, end } = getPeriodBounds(ym)
      const [budgetsRes, txRes] = await Promise.all([
        supabase.from('budgets').select('*').eq('period_month', start),
        supabase
          .from('transactions')
          .select('*, accounts!inner(is_active)')
          .gte('occurred_on', start)
          .lte('occurred_on', end)
          .eq('is_transfer', false)
          .eq('accounts.is_active', true),
      ])
      return {
        yearMonth: ym,
        label: getMonthLabel(ym, locale),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows: buildBudgetRows(budgetsRes.data ?? [], categories, (txRes.data ?? []) as any, toEur, excludedCategoryIds),
      }
    })
  )

  const currentData = monthData[2]
  const prevMonth = subtractMonths(currentMonth, 1)
  const nextMonth = subtractMonths(currentMonth, -1)

  const budgetedRows = currentData.rows.filter(r => r.hasBudget)
  const totalBudgeted = budgetedRows.reduce((s, r) => s + r.budgetEur, 0)
  const totalSpent = currentData.rows.reduce((s, r) => s + r.actualEur, 0)
  const remaining = Math.max(totalBudgeted - totalSpent, 0)
  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  return (
    <ScreenHero
      title={t('title')}
      eyebrow={t('monthlyBudgetSubtitle', { month: currentData.label })}
      metric={
        <div className="flex items-baseline gap-2">
          <span>
            {formatMoney(totalSpent * reportingRate, reportingCurrency, locale)}
          </span>
          <span className="text-body font-semibold text-glass-70">
            / {formatMoney(totalBudgeted * reportingRate, reportingCurrency, locale)}
          </span>
        </div>
      }
      subtitle={
        <div className="flex flex-col gap-2">
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-glass-20 lg:hidden">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
          <span>
            {t('heroUsageSubtitle', {
              pct: overallPct.toFixed(0),
              remaining: formatMoney(
                remaining * reportingRate,
                reportingCurrency,
                locale
              ),
              count: budgetedRows.length,
            })}
          </span>
        </div>
      }
      mobileActions={
        <div className="inline-flex h-8 items-center gap-1.5 rounded-full border border-glass-25 bg-glass-12 px-2.5 text-caption font-semibold text-white">
          <Link href={`/budgets?month=${prevMonth}`} className="px-1 hover:text-teal-tint">
            ‹
          </Link>
          <span className="tabular-nums">{currentData.label}</span>
          <Link href={`/budgets?month=${nextMonth}`} className="px-1 hover:text-teal-tint">
            ›
          </Link>
        </div>
      }
      desktopActions={
        <>
          <div className="inline-flex h-[38px] items-center gap-2 rounded-full border border-separator bg-surface px-3 text-caption font-semibold text-ink">
            <Link
              href={`/budgets?month=${prevMonth}`}
              className="px-1 text-text-secondary hover:text-ink"
            >
              ‹
            </Link>
            <span className="tabular-nums">{currentData.label}</span>
            <Link
              href={`/budgets?month=${nextMonth}`}
              className="px-1 text-text-secondary hover:text-ink"
            >
              ›
            </Link>
          </div>
          <AddBudgetDrawer categories={categories} currentMonth={currentMonth} />
        </>
      }
    >
      <div className="hidden lg:block">
        <BudgetSummary
          rows={currentData.rows}
          reportingCurrency={reportingCurrency}
          reportingRate={reportingRate}
        />
      </div>

      <div className="flex items-center justify-between lg:hidden">
        <h2 className="text-body font-bold text-ink">
          {t('category')} ({currentData.rows.length})
        </h2>
        <AddBudgetDrawer categories={categories} currentMonth={currentMonth} />
      </div>

      <BudgetTable
        rows={currentData.rows}
        categories={categories}
        currentMonth={currentMonth}
        reportingCurrency={reportingCurrency}
        reportingRate={reportingRate}
      />

      <BudgetVarianceWidget
        months={monthData}
        reportingCurrency={reportingCurrency}
        reportingRate={reportingRate}
      />
    </ScreenHero>
  )
}
