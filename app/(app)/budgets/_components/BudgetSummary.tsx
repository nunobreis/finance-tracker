'use client'

import { Target, TrendingDown, PiggyBank } from 'lucide-react'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatCurrency } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { BudgetRow } from '@/lib/budgets'

type Props = {
  rows: BudgetRow[]
  reportingCurrency: string
  reportingRate: number
}

export function BudgetSummary({ rows, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('Budgets')
  const totalBudgeted = rows.filter(r => r.hasBudget).reduce((s, r) => s + r.budgetEur, 0)
  const totalSpent = rows.reduce((s, r) => s + r.actualEur, 0)
  const remaining = totalBudgeted - totalSpent

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SummaryCard label={t('totalBudgeted')} value={formatCurrency(totalBudgeted * reportingRate, reportingCurrency)} icon={Target} accent />
      <SummaryCard label={t('totalSpent')}    value={formatCurrency(totalSpent * reportingRate, reportingCurrency)}    icon={TrendingDown} />
      <SummaryCard label={t('remaining')}     value={formatCurrency(remaining * reportingRate, reportingCurrency)}     icon={PiggyBank} />
    </div>
  )
}
