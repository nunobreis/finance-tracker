import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getBillStatus } from '@/lib/bills'
import type { RecurringBill } from '@/types/database'

type Props = { bills: RecurringBill[] }

export function UpcomingBillsPanel({ bills }: Props) {
  return (
    <div className="flex flex-1 flex-col rounded-xl border border-border-col bg-card-bg">
      <div className="flex items-center justify-between border-b border-border-col px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Upcoming Bills</h3>
        <Link href="/recurring-bills" className="text-xs text-accent hover:underline">View all</Link>
      </div>
      {bills.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
          No bills due in the next 30 days
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border-col">
            {bills.map(bill => {
              const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
              const statusColor = status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warn' : 'good'
              const statusLabel = status === 'overdue' ? 'Overdue' : status === 'due_soon' ? 'Due soon' : 'Active'
              return (
                <tr key={bill.id}>
                  <td className="px-5 py-3 font-medium text-text-primary">{bill.name}</td>
                  <td className="px-5 py-3 text-text-secondary text-xs">{formatDate(bill.next_due_on)}</td>
                  <td className="px-5 py-3 text-right font-medium text-text-primary">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: bill.currency }).format(Number(bill.amount))}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge label={statusLabel} color={statusColor} />
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
