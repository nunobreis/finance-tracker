'use client'

import { Wallet, Hash, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Account } from '@/types/database'

type Props = {
  accounts: Account[]
  balances: Record<string, number>  // account.id → balance in native currency
  gbpToEur: number
  reportingCurrency: string
  reportingRate: number
}

export function AccountsSummary({ accounts, balances, gbpToEur, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('Accounts')

  const totalEur = accounts.reduce((sum, a) => {
    const balance = balances[a.id] ?? 0
    const rate = a.currency === 'EUR' ? 1 : gbpToEur
    return sum + balance * rate
  }, 0)

  return (
    <div className="flex gap-4">
      <SummaryCard
        label={t('totalBalance')}
        value={formatCurrency(totalEur * reportingRate, reportingCurrency)}
        icon={Wallet}
        accent
      />
      <SummaryCard
        label="Accounts"
        value={String(accounts.length)}
        icon={Hash}
      />
      <SummaryCard
        label="Today"
        value={formatDate(new Date())}
        icon={Calendar}
      />
    </div>
  )
}
