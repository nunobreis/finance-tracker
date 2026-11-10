'use client'

import Link from 'next/link'
import { useState } from 'react'
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
import { Button } from '@/components/ui/Button'
import { formatMoney, cn } from '@/lib/utils'
import type { Account } from '@/types/database'
import { deleteAccount, getAccountDeletionImpact } from './actions'
import type { AccountDeletionImpact } from './actions'

type Props = {
  account: Account
  balance: number
  gbpToEur?: number
}

export function AccountCard({ account, balance, gbpToEur = 1 }: Props) {
  const t = useTranslations('Accounts')
  const locale = useLocale()
  const typeLabel = t(`types.${account.account_type}` as Parameters<typeof t>[0])

  const [showDialog, setShowDialog] = useState(false)
  const [impact, setImpact] = useState<AccountDeletionImpact | null>(null)
  const [checking, setChecking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  async function handleDeleteClick() {
    setChecking(true)
    setDeleteError(null)
    const result = await getAccountDeletionImpact(account.id)
    setChecking(false)
    if (result.error || !result.data) {
      setDeleteError(result.error ?? 'Failed to load impact')
      return
    }
    setImpact(result.data)
    setShowDialog(true)
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    const result = await deleteAccount(account.id)
    setDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
      setShowDialog(false)
      return
    }
    setShowDialog(false)
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

  const isBlocked = (impact?.holdingsCount ?? 0) > 0

  return (
    <>
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
              onClick={handleDeleteClick}
              disabled={checking || deleting}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-negative-tint hover:text-negative cursor-pointer disabled:opacity-50"
              aria-label={checking ? t('deleteDialogChecking') : t('deleteAccount')}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {deleteError && (
          <p className="rounded-xl bg-negative/10 px-3 py-2 text-caption text-negative">
            {deleteError}
          </p>
        )}
      </div>

      {showDialog && impact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !deleting && setShowDialog(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-[20px] bg-canvas p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="mb-2 text-h2 font-bold text-ink">
              {t('deleteDialogTitle', { name: account.name })}
            </h2>
            <p className="mb-3 text-body-sm text-text-secondary">
              {t('deleteDialogBody')}
            </p>

            {isBlocked ? (
              <p className="mb-5 rounded-xl bg-negative/10 px-3 py-2 text-body-sm text-negative">
                {t('deleteDialogHoldingsBlock', { count: impact.holdingsCount })}
              </p>
            ) : (
              <p className="mb-5 text-caption text-text-secondary">
                {t('deleteDialogImpact', {
                  txCount: impact.transactionCount,
                  batchCount: impact.importBatchCount,
                  billCount: impact.recurringBillCount,
                })}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setShowDialog(false)}
                disabled={deleting}
                className="flex-1"
              >
                {t('deleteDialogCancel')}
              </Button>
              {!isBlocked && (
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  aria-busy={deleting}
                  className="flex-1"
                >
                  {deleting ? t('deleteDialogDeleting') : t('deleteDialogConfirm')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
