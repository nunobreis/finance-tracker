'use client'

import { Target, TrendingDown, PiggyBank } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatMoney } from '@/lib/utils'
import type { BudgetRow } from '@/lib/budgets'

type Props = {
  rows: BudgetRow[]
  reportingCurrency: string
  reportingRate: number
}

export function BudgetSummary({ rows, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('Budgets')
  const locale = useLocale()
  const totalBudgeted = rows.filter(r => r.hasBudget).reduce((s, r) => s + r.budgetEur, 0)
  const totalSpent = rows.reduce((s, r) => s + r.actualEur, 0)
  const remaining = totalBudgeted - totalSpent

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <SummaryCard
        label={t('totalBudgeted')}
        value={formatMoney(totalBudgeted * reportingRate, reportingCurrency, locale)}
        icon={Target}
        accent
      />
      <SummaryCard
        label={t('totalSpent')}
        value={formatMoney(totalSpent * reportingRate, reportingCurrency, locale)}
        icon={TrendingDown}
      />
      <SummaryCard
        label={t('remaining')}
        value={formatMoney(remaining * reportingRate, reportingCurrency, locale)}
        icon={PiggyBank}
      />
    </div>
  )
}
