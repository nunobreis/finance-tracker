import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import type { Transaction } from '@/types/database'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

type Props = { transactions: Transaction[] }

export function TransactionSummary({ transactions }: Props) {
  const nonTransfers = transactions.filter(t => !t.is_transfer)
  const totalIn  = nonTransfers.filter(t => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0)
  const totalOut = nonTransfers.filter(t => t.amount < 0).reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="flex gap-4">
      <SummaryCard label="Money in"  value={formatEur(totalIn)}         icon={TrendingUp}  accent />
      <SummaryCard label="Money out" value={formatEur(Math.abs(totalOut))} icon={TrendingDown} />
      <SummaryCard label="Net"       value={formatEur(totalIn + totalOut)} icon={Activity} />
    </div>
  )
}
