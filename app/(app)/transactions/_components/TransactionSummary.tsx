import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import type { Transaction } from '@/types/database'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

type Props = { transactions: Transaction[] }

export async function TransactionSummary({ transactions }: Props) {
  const t = await getTranslations('Transactions')
  const nonTransfers = transactions.filter(tx => !tx.is_transfer)
  const totalIn  = nonTransfers.filter(tx => tx.amount > 0).reduce((s, tx) => s + Number(tx.amount), 0)
  const totalOut = nonTransfers.filter(tx => tx.amount < 0).reduce((s, tx) => s + Number(tx.amount), 0)

  return (
    <div className="flex gap-4">
      <SummaryCard label={t('income')}   value={formatEur(totalIn)}            icon={TrendingUp}  accent />
      <SummaryCard label={t('expenses')} value={formatEur(Math.abs(totalOut))} icon={TrendingDown} />
      <SummaryCard label={t('net')}      value={formatEur(totalIn + totalOut)} icon={Activity} />
    </div>
  )
}
