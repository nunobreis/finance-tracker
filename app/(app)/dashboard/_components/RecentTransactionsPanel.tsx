'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { formatMoney, formatDate } from '@/lib/utils'
import { TransactionRow } from '@/components/ui/TransactionRow'
import type { Transaction, Category, Account } from '@/types/database'

type Props = {
  transactions: Transaction[]
  categories: Category[]
  accounts?: Account[]
}

export function RecentTransactionsPanel({ transactions, categories, accounts = [] }: Props) {
  const t = useTranslations('Dashboard')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.name]))

  return (
    <div className="flex flex-col lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-6 lg:shadow-xs">
      <div className="flex items-center justify-between pt-2 pb-1 lg:pt-0 lg:pb-2">
        <h3 className="text-body font-bold text-ink lg:text-h2">
          {t('recentTransactions')}
        </h3>
        <Link
          href="/transactions"
          className="text-body-sm font-semibold text-teal hover:underline"
        >
          {tCommon('seeAll')}
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-body-sm text-text-muted">
          {t('noTransactions')}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-separator-subtle">
          {transactions.map(tx => {
            const amount = Number(tx.amount)
            const isIncome = amount > 0 && !tx.is_transfer
            const category = tx.category_id ? categoryMap[tx.category_id] : null
            const categoryName = category?.name ?? null
            const accountName = accountMap[tx.account_id]
            const signedAmount = formatMoney(amount, tx.currency, locale, {
              signDisplay: isIncome ? 'always' : 'auto',
            })
            const shortDate = formatDate(tx.occurred_on, locale)
            const subtitleParts = [categoryName, accountName, shortDate].filter(Boolean)

            return (
              <TransactionRow
                key={tx.id}
                categoryName={categoryName}
                categoryKind={category?.kind ?? null}
                isPositive={isIncome}
                isTransfer={tx.is_transfer}
                title={tx.merchant ?? tx.description ?? '—'}
                subtitle={subtitleParts.join(' · ')}
                amount={signedAmount}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
