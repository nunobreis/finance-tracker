'use client'

import { useTranslations } from 'next-intl'
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
  reportingCurrency?: string
  reportingRate?: number
}

function formatBillAmount(amount: number, currency: string, freqLabel: string): string {
  const formatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
  return `${formatted} / ${freqLabel.toLowerCase()}`
}

export function BillsTable({ bills, accounts, categories }: Props) {
  const t = useTranslations('RecurringBills')

  if (bills.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        {t('noBills')}
      </div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-border-col rounded-xl border border-border-col bg-card-bg">
        {bills.map(bill => {
          const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
          const category = categories.find(c => c.id === bill.category_id)
          const account = accounts.find(a => a.id === bill.account_id)
          const statusColor = status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warn' : 'good'
          const statusLabel = status === 'overdue' ? t('overdue') : status === 'due_soon' ? t('dueSoon') : t('active')
          const freqLabel = t(`frequencies.${bill.frequency as RecurringFrequency}`)

          return (
            <div key={bill.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm text-text-primary">{bill.name}</span>
                <span className="shrink-0 text-sm tabular-nums text-text-primary">
                  {formatBillAmount(Number(bill.amount), bill.currency, freqLabel)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">{formatDate(bill.next_due_on)}</span>
                <StatusBadge label={statusLabel} color={statusColor} />
              </div>
              <div className="flex items-center justify-between">
                {category ? <StatusBadge label={category.name} color="accent" /> : <span className="text-xs text-text-tertiary">{account?.name ?? '—'}</span>}
                <div className="flex items-center gap-2">
                  <MarkPaidButton billId={bill.id} />
                  <AddBillDrawer accounts={accounts} categories={categories} prefill={bill} trigger="icon" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-border-col bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-3 text-left">{t('name')}</th>
              <th className="px-4 py-3 text-left">{t('category')}</th>
              <th className="px-4 py-3 text-left">{t('account')}</th>
              <th className="px-4 py-3 text-right">{t('amount')}</th>
              <th className="px-4 py-3 text-left">{t('nextDue')}</th>
              <th className="px-4 py-3 text-left">{t('status')}</th>
              <th className="px-4 py-3 text-left">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-col">
            {bills.map(bill => {
              const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
              const category = categories.find(c => c.id === bill.category_id)
              const account = accounts.find(a => a.id === bill.account_id)
              const statusColor = status === 'overdue' ? 'danger' : status === 'due_soon' ? 'warn' : 'good'
              const statusLabel = status === 'overdue' ? t('overdue') : status === 'due_soon' ? t('dueSoon') : t('active')
              const freqLabel = t(`frequencies.${bill.frequency as RecurringFrequency}`)

              return (
                <tr key={bill.id} className="hover:bg-content-bg">
                  <td className="px-4 py-3 font-medium text-text-primary">{bill.name}</td>
                  <td className="px-4 py-3">
                    {category ? <StatusBadge label={category.name} color="accent" /> : <span className="text-text-tertiary">—</span>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{account?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-primary whitespace-nowrap">
                    {formatBillAmount(Number(bill.amount), bill.currency, freqLabel)}
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
    </>
  )
}
