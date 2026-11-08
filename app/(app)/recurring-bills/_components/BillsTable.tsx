'use client'

import { useTranslations, useLocale } from 'next-intl'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { resolveCategoryVisual, type IconTone } from '@/components/ui/TransactionRow'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import { getBillStatus } from '@/lib/bills'
import { MarkPaidButton } from './MarkPaidButton'
import { AddBillDrawer } from './AddBillDrawer'
import type {
  RecurringBill,
  Account,
  Category,
  RecurringFrequency,
} from '@/types/database'

type Props = {
  bills: RecurringBill[]
  accounts: Account[]
  categories: Category[]
  gbpToEur?: number
  reportingCurrency?: string
  reportingRate?: number
}

const toneClasses: Record<IconTone, string> = {
  emerald: 'bg-positive-tint text-positive',
  amber: 'bg-warning-tint text-warning-deep',
  blue: 'bg-info-tint text-info',
  purple: 'bg-purple-tint text-purple',
  teal: 'bg-teal-tint text-teal',
  rose: 'bg-negative-tint text-negative',
  slate: 'bg-surface text-text-secondary',
}

export function BillsTable({
  bills,
  accounts,
  categories,
  gbpToEur = 1,
}: Props) {
  const t = useTranslations('RecurringBills')
  const locale = useLocale()

  if (bills.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-separator bg-surface px-4 text-center text-body-sm text-text-muted">
        {t('noBills')}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Card List (< lg) */}
      <div className="flex flex-col gap-3 lg:hidden">
        {bills.map(bill => {
          const status = getBillStatus(bill.next_due_on, bill.reminder_days_before)
          const category = categories.find(c => c.id === bill.category_id)
          const account = accounts.find(a => a.id === bill.account_id)
          const statusColor =
            status === 'overdue'
              ? 'danger'
              : status === 'due_soon'
                ? 'warn'
                : 'good'
          const statusLabel =
            status === 'overdue'
              ? t('overdue')
              : status === 'due_soon'
                ? t('dueSoon')
                : t('active')
          const freqLabel = t(`frequencies.${bill.frequency as RecurringFrequency}`)
          const { icon: Icon, tone } = resolveCategoryVisual(
            category?.name ?? null,
            category?.kind ?? null
          )
          const subtitleParts = [category?.name, freqLabel, account?.name].filter(
            Boolean
          )
          const amountNum = Number(bill.amount)

          return (
            <div
              key={bill.id}
              className="flex flex-col gap-3 rounded-[16px] bg-canvas p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      toneClasses[tone]
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-body font-bold text-ink">
                      {bill.name}
                    </span>
                    <span className="truncate text-caption text-text-secondary">
                      {subtitleParts.join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end">
                  <span className="text-body font-bold text-ink tabular-nums">
                    {formatMoney(amountNum, bill.currency, locale)}
                  </span>
                  {bill.currency !== 'EUR' && (
                    <span className="text-caption text-text-secondary tabular-nums">
                      ≈ {formatMoney(amountNum * gbpToEur, 'EUR', locale)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-separator/70 pt-2.5">
                <StatusBadge
                  label={`${t('dueDateShort', { date: formatDate(bill.next_due_on, locale) })} · ${statusLabel}`}
                  color={statusColor}
                />
                <div className="flex items-center gap-1.5">
                  <MarkPaidButton billId={bill.id} />
                  <AddBillDrawer
                    accounts={accounts}
                    categories={categories}
                    prefill={bill}
                    trigger="icon"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table (>= lg) */}
      <div className="hidden lg:block overflow-hidden rounded-[20px] border border-separator/80 bg-surface shadow-xs">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-separator bg-canvas text-label font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-5 py-3.5 text-left">{t('name')}</th>
              <th className="px-5 py-3.5 text-left">{t('category')}</th>
              <th className="px-5 py-3.5 text-left">{t('account')}</th>
              <th className="px-5 py-3.5 text-right">{t('amount')}</th>
              <th className="px-5 py-3.5 text-left">{t('nextDue')}</th>
              <th className="px-5 py-3.5 text-left">{t('status')}</th>
              <th className="px-5 py-3.5 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator-subtle">
            {bills.map(bill => {
              const status = getBillStatus(
                bill.next_due_on,
                bill.reminder_days_before
              )
              const category = categories.find(c => c.id === bill.category_id)
              const account = accounts.find(a => a.id === bill.account_id)
              const statusColor =
                status === 'overdue'
                  ? 'danger'
                  : status === 'due_soon'
                    ? 'warn'
                    : 'good'
              const statusLabel =
                status === 'overdue'
                  ? t('overdue')
                  : status === 'due_soon'
                    ? t('dueSoon')
                    : t('active')
              const freqLabel = t(
                `frequencies.${bill.frequency as RecurringFrequency}`
              )
              const { icon: Icon, tone } = resolveCategoryVisual(
                category?.name ?? null,
                category?.kind ?? null
              )
              const amountNum = Number(bill.amount)

              return (
                <tr key={bill.id} className="transition-colors hover:bg-row-hover">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          toneClasses[tone]
                        )}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="font-semibold text-ink">{bill.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {category ? (
                      <StatusBadge label={category.name} color="accent" />
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-text-secondary">
                    {account?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap tabular-nums">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-ink">
                        {formatMoney(amountNum, bill.currency, locale)} /{' '}
                        {freqLabel.toLowerCase()}
                      </span>
                      {bill.currency !== 'EUR' && (
                        <span className="text-caption text-text-secondary">
                          ≈ {formatMoney(amountNum * gbpToEur, 'EUR', locale)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap tabular-nums">
                    {formatDate(bill.next_due_on, locale, { includeYear: true })}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={statusLabel} color={statusColor} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <MarkPaidButton billId={bill.id} />
                      <AddBillDrawer
                        accounts={accounts}
                        categories={categories}
                        prefill={bill}
                        trigger="icon"
                      />
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
