import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Transaction, Category } from '@/types/database'

type Props = {
  transactions: Transaction[]
  categories: Category[]
}

export function RecentTransactionsPanel({ transactions, categories }: Props) {
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-border-col bg-card-bg">
      <div className="flex items-center justify-between border-b border-border-col px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Recent Transactions</h3>
        <Link href="/transactions" className="text-xs text-accent hover:underline">View all</Link>
      </div>
      {transactions.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
          No transactions yet
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border-col">
            {transactions.map(tx => {
              const amount = Number(tx.amount)
              const isExpense = amount < 0
              const categoryName = tx.category_id ? categoryMap[tx.category_id] : null
              return (
                <tr key={tx.id}>
                  <td className="px-5 py-3 text-text-tertiary text-xs whitespace-nowrap">{formatDate(tx.occurred_on)}</td>
                  <td className="px-5 py-3 font-medium text-text-primary">{tx.description ?? tx.merchant ?? '—'}</td>
                  <td className="px-5 py-3">
                    {categoryName && <StatusBadge label={categoryName} color="accent" />}
                  </td>
                  <td className={`px-5 py-3 text-right font-medium whitespace-nowrap ${isExpense ? 'text-status-danger' : 'text-status-good'}`}>
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: tx.currency }).format(Math.abs(amount))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
