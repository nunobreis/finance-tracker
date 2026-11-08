'use client'

import { Wallet, Hash, Calendar } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatMoney, formatDate } from '@/lib/utils'
import type { Account } from '@/types/database'

type Props = {
  accounts: Account[]
  balances: Record<string, number>
  gbpToEur: number
  reportingCurrency: string
  reportingRate: number
}

export function AccountsSummary({
  accounts,
  balances,
  gbpToEur,
  reportingCurrency,
  reportingRate,
}: Props) {
  const t = useTranslations('Accounts')
  const locale = useLocale()

  const totalEur = accounts.reduce((sum, a) => {
    const balance = balances[a.id] ?? 0
    const rate = a.currency === 'EUR' ? 1 : gbpToEur
    return sum + balance * rate
  }, 0)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <SummaryCard
        label={t('totalBalance')}
        value={formatMoney(totalEur * reportingRate, reportingCurrency, locale)}
        icon={Wallet}
        accent
      />
      <SummaryCard
        label={t('accounts')}
        value={String(accounts.length)}
        icon={Hash}
      />
      <SummaryCard
        label={t('today')}
        value={formatDate(new Date(), locale, { includeYear: true })}
        icon={Calendar}
      />
    </div>
  )
}
