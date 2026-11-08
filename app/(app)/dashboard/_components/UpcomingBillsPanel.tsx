'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { formatMoney, formatDate } from '@/lib/utils'
import { TransactionRow } from '@/components/ui/TransactionRow'
import { getCategoryDisplayName } from '@/lib/categories-utils'
import type { RecurringBill, Category, Account } from '@/types/database'

type Props = {
  bills: RecurringBill[]
  categories?: Category[]
  accounts?: Account[]
}

export function UpcomingBillsPanel({ bills, categories = [], accounts = [] }: Props) {
  const t = useTranslations('Dashboard')
  const tCommon = useTranslations('Common')
  const tCat = useTranslations('Categories')
  const locale = useLocale()
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.name]))

  return (
    <div className="flex flex-col lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-6 lg:shadow-xs">
      <div className="flex items-center justify-between pt-2 pb-1 lg:pt-0 lg:pb-2">
        <h3 className="text-body font-bold text-ink">
          {t('upcomingBills')}
        </h3>
        <Link
          href="/recurring-bills"
          className="text-body-sm font-semibold text-teal hover:underline lg:hidden"
        >
          {tCommon('seeAll')}
        </Link>
        <span className="hidden text-caption font-semibold text-text-secondary lg:inline">
          {t('next30Days')}
        </span>
      </div>

      {bills.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-body-sm text-text-muted">
          {t('noBillsDue')}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-separator-subtle">
          {bills.map(bill => {
            const category = bill.category_id ? categoryMap[bill.category_id] : null
            const categoryName = category?.name ?? null  // kept as stored name for icon resolution
            const categoryDisplayName = category ? getCategoryDisplayName(category, tCat) : null
            const accountName = bill.account_id ? accountMap[bill.account_id] : null
            const shortDate = formatDate(bill.next_due_on, locale)
            const subtitleParts = [categoryDisplayName, shortDate, accountName].filter(Boolean)

            return (
              <TransactionRow
                key={bill.id}
                categoryName={categoryName}
                categoryKind={category?.kind ?? null}
                title={bill.name}
                subtitle={subtitleParts.join(' · ')}
                amount={formatMoney(Number(bill.amount), bill.currency, locale)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
