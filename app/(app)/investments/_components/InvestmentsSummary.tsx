'use client'

import { TrendingUp, DollarSign, BarChart2 } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatMoney } from '@/lib/utils'
import type { HoldingComputed } from '@/lib/holdings'

type Props = {
  rows: HoldingComputed[]
  reportingCurrency: string
  reportingRate: number
}

export function InvestmentsSummary({
  rows,
  reportingCurrency,
  reportingRate,
}: Props) {
  const t = useTranslations('Investments')
  const locale = useLocale()

  const totalValue = rows.reduce((s, r) => s + r.value_eur, 0)
  const totalCost = rows.reduce((s, r) => s + r.cost_eur, 0)
  const totalPnl = rows.reduce((s, r) => s + r.pnl_eur, 0)
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const pctSign = totalPnlPct >= 0 ? '+' : '−'

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <SummaryCard
        label={t('totalInvested')}
        value={formatMoney(totalCost * reportingRate, reportingCurrency, locale)}
        icon={DollarSign}
      />
      <SummaryCard
        label={t('currentValue')}
        value={formatMoney(totalValue * reportingRate, reportingCurrency, locale)}
        icon={BarChart2}
        accent
      />
      <SummaryCard
        label={t('totalPnl')}
        value={formatMoney(
          totalPnl * reportingRate,
          reportingCurrency,
          locale,
          { signDisplay: totalPnl > 0 ? 'always' : 'auto' }
        )}
        subtitle={`${pctSign}${Math.abs(totalPnlPct).toFixed(2)}%`}
        icon={TrendingUp}
      />
    </div>
  )
}
