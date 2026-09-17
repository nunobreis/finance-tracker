'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Account } from '@/types/database'

type Props = {
  account: Account
  balance: number
}

function formatBalance(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function AccountCard({ account, balance }: Props) {
  const t = useTranslations('Accounts')
  const initial = (account.institution ?? account.name).charAt(0).toUpperCase()
  const typeLabel = t(`types.${account.account_type}` as Parameters<typeof t>[0])

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-col bg-card-bg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="font-medium text-text-primary">{account.name}</p>
            {account.institution && (
              <p className="text-xs text-text-tertiary">{account.institution}</p>
            )}
          </div>
        </div>
        <span className="rounded-full bg-content-bg px-2.5 py-0.5 text-xs text-text-secondary">
          {typeLabel}
        </span>
      </div>

      <div>
        <p className="text-xs text-text-secondary">{t('balance')}</p>
        <p className="text-2xl font-semibold text-text-primary">
          {formatBalance(balance, account.currency)}
        </p>
      </div>

      <Link
        href={`/transactions/import?account=${account.id}`}
        className="flex items-center gap-1 text-xs text-accent hover:underline"
      >
        {t('importCsv')} <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}
