'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getBillStatus } from '@/lib/bills'
import type { RecurringBill } from '@/types/database'

type Props = { bills: RecurringBill[] }

export function UpcomingBillsPanel({ bills }: Props) {
  const t = useTranslations('Dashboard')
  const tBills = useTranslations('RecurringBills')
  const tCommon = useTranslations('Common')

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-border-col bg-card-bg">
      <div className="flex items-center justify-between border-b border-border-col px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">{t('upcomingBills')}</h3>
        <Link href="/recurring-bills" className="text-xs text-accent hover:underline">{tCommon('viewAll')}</Link>
      </div>
      {bills.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-text-tertiary">
          {t('noBillsDue')}
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border-col">
            {bills.map(bill => {
              const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
              const statusColor = status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warn' : 'good'
              const statusLabel = status === 'overdue' ? tBills('overdue') : status === 'due_soon' ? tBills('dueSoon') : tBills('active')
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
