import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import { TrendingUp, DollarSign, BarChart2 } from 'lucide-react'
import type { HoldingComputed } from '@/lib/holdings'

type Props = { rows: HoldingComputed[] }

export function InvestmentsSummary({ rows }: Props) {
  const totalValue = rows.reduce((s, r) => s + r.value_eur, 0)
  const totalCost = rows.reduce((s, r) => s + r.cost_eur, 0)
  const totalPnl = rows.reduce((s, r) => s + r.pnl_eur, 0)
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const sign = totalPnl >= 0 ? '+' : ''

  return (
    <div className="flex gap-4">
      <SummaryCard label="Total invested" value={formatEur(totalCost)} icon={DollarSign} />
      <SummaryCard label="Current value"  value={formatEur(totalValue)} icon={BarChart2} accent />
      <SummaryCard
        label="Total P&L"
        value={`${sign}${formatEur(totalPnl)}`}
        subtitle={`${sign}${totalPnlPct.toFixed(2)}%`}
        icon={TrendingUp}
      />
    </div>
  )
}
