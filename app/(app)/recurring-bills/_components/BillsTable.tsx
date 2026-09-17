import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getBillStatus } from '@/lib/bills'
import { MarkPaidButton } from './MarkPaidButton'
import { AddBillDrawer } from './AddBillDrawer'
import type { RecurringBill, Account, Category, RecurringFrequency } from '@/types/database'

type Props = {
  bills: RecurringBill[]
  accounts: Account[]
  categories: Category[]
}

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
}

function formatBillAmount(amount: number, currency: string, frequency: RecurringFrequency): string {
  const formatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  return `${formatted} / ${FREQ_LABEL[frequency].toLowerCase()}`
}

export function BillsTable({ bills, accounts, categories }: Props) {
  if (bills.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No recurring bills yet. Click &quot;Add bill&quot; to get started.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-col bg-card-bg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Account</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3 text-left">Next due</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {bills.map(bill => {
            const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
            const category = categories.find(c => c.id === bill.category_id)
            const account = accounts.find(a => a.id === bill.account_id)
            const statusColor = status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warn' : 'good'
            const statusLabel = status === 'overdue' ? 'Overdue' : status === 'due_soon' ? 'Due soon' : 'Active'

            return (
              <tr key={bill.id} className="hover:bg-content-bg">
                <td className="px-4 py-3 font-medium text-text-primary">{bill.name}</td>
                <td className="px-4 py-3">
                  {category ? <StatusBadge label={category.name} color="accent" /> : <span className="text-text-tertiary">—</span>}
                </td>
                <td className="px-4 py-3 text-text-secondary">{account?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums text-text-primary whitespace-nowrap">
                  {formatBillAmount(Number(bill.amount), bill.currency, bill.frequency as RecurringFrequency)}
                </td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(bill.next_due_on)}</td>
                <td className="px-4 py-3"><StatusBadge label={statusLabel} color={statusColor} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MarkPaidButton billId={bill.id} />
                    <AddBillDrawer accounts={accounts} categories={categories} prefill={bill} trigger="icon" />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
