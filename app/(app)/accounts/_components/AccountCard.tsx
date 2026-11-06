'use client'

import Link from 'next/link'
import {
  ArrowUpRight,
  Trash2,
  Landmark,
  PiggyBank,
  CreditCard,
  Wallet,
  TrendingUp,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatMoney, cn } from '@/lib/utils'
import type { Account } from '@/types/database'
import { deleteAccount } from './actions'

type Props = {
  account: Account
  balance: number
  gbpToEur?: number
}

export function AccountCard({ account, balance, gbpToEur = 1 }: Props) {
  const t = useTranslations('Accounts')
  const locale = useLocale()
  const typeLabel = t(`types.${account.account_type}` as Parameters<typeof t>[0])

  const Icon =
    account.account_type === 'savings'
      ? PiggyBank
      : account.account_type === 'credit_card'
        ? CreditCard
        : account.account_type === 'cash'
          ? Wallet
          : account.account_type === 'investment'
            ? TrendingUp
            : Landmark

  const tintClass =
    account.account_type === 'savings'
      ? 'bg-positive-tint text-positive'
      : account.account_type === 'investment'
        ? 'bg-purple-tint text-purple'
        : account.currency === 'GBP'
          ? 'bg-info-tint text-info'
          : 'bg-teal-tint text-teal'

  async function handleDelete() {
    if (!confirm(t('deleteConfirm'))) return
    await deleteAccount(account.id)
  }

  const showInstitution =
    account.institution &&
    !account.institution.toLowerCase().startsWith(account.name.toLowerCase())

  const subtitleParts = [
    showInstitution ? account.institution : null,
    typeLabel,
    account.currency,
    account.country,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-3 rounded-[16px] bg-canvas p-4 lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-5 lg:shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
              tintClass
            )}
          >
            <Icon size={20} />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-body font-bold text-ink">{account.name}</p>
            <p className="truncate text-caption text-text-secondary">
              {subtitleParts.join(' · ')}
            </p>
          </div>
        </div>

        <StatusBadge
          label={t('nativeCurrencyBadge', { currency: account.currency })}
          color={account.currency === 'GBP' ? 'info' : 'accent'}
        />
      </div>

      <div className="h-px w-full bg-separator" />

      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-h1-sm font-extrabold text-ink tabular-nums">
            {formatMoney(balance, account.currency, locale)}
          </p>
          {account.currency !== 'EUR' && (
            <p className="text-caption text-text-secondary tabular-nums">
              ≈ {formatMoney(balance * gbpToEur, 'EUR', locale)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/transactions/import?account=${account.id}`}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-separator bg-surface px-3 text-caption font-semibold text-teal transition-colors hover:bg-teal-tint/30"
          >
            <span>{t('importCsv')}</span>
            <ArrowUpRight size={13} />
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-negative-tint hover:text-negative cursor-pointer"
            aria-label={t('deleteAccount')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
