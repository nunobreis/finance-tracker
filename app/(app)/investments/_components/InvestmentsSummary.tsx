'use client'

import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, DollarSign, BarChart2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { HoldingComputed } from '@/lib/holdings'

type Props = {
  rows: HoldingComputed[]
  reportingCurrency: string
  reportingRate: number
}

export function InvestmentsSummary({ rows, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('Investments')

  const totalValue = rows.reduce((s, r) => s + r.value_eur, 0)
  const totalCost = rows.reduce((s, r) => s + r.cost_eur, 0)
  const totalPnl = rows.reduce((s, r) => s + r.pnl_eur, 0)
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const sign = totalPnl >= 0 ? '+' : ''

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SummaryCard label={t('totalInvested')} value={formatCurrency(totalCost * reportingRate, reportingCurrency)} icon={DollarSign} />
      <SummaryCard label={t('currentValue')}  value={formatCurrency(totalValue * reportingRate, reportingCurrency)} icon={BarChart2} accent />
      <SummaryCard
        label={t('totalPnl')}
        value={`${sign}${formatCurrency(totalPnl * reportingRate, reportingCurrency)}`}
        subtitle={`${sign}${totalPnlPct.toFixed(2)}%`}
        icon={TrendingUp}
      />
    </div>
  )
}
