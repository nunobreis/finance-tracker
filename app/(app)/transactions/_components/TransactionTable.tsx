import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Transaction, Account, Category } from '@/types/database'

type TxWithRelations = Transaction & {
  accounts: Pick<Account, 'name'> | null
  categories: Pick<Category, 'name'> | null
}

type Props = { transactions: TxWithRelations[] }

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export function TransactionTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No transactions found. Import a CSV or add one manually.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-col bg-card-bg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Description</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Account</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {transactions.map(tx => (
            <tr key={tx.id} className="hover:bg-content-bg">
              <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                {formatDate(tx.occurred_on)}
              </td>
              <td className="px-4 py-3 text-text-primary">
                {tx.merchant ?? tx.description ?? '—'}
                {tx.source === 'csv_import' && (
                  <span className="ml-2 rounded bg-accent-light px-1.5 py-0.5 text-xs text-accent">Import</span>
                )}
              </td>
              <td className="px-4 py-3">
                {tx.is_transfer ? (
                  <StatusBadge label="Transfer" color="neutral" />
                ) : tx.categories ? (
                  <StatusBadge label={tx.categories.name} color="accent" />
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-text-secondary">{tx.accounts?.name ?? '—'}</td>
              <td className={`px-4 py-3 text-right font-medium tabular-nums ${Number(tx.amount) >= 0 ? 'text-status-good' : 'text-status-danger'}`}>
                {formatAmount(Number(tx.amount), tx.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
