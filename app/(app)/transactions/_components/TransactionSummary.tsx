'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { formatMoney, formatMonthYear } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { deleteImportBatch } from './actions'
import type { Transaction, Category } from '@/types/database'

type LatestBatch = {
  id: string
  filename: string | null
  row_count: number | null
  imported_at?: string
}

type Props = {
  transactions: (Transaction & {
    accounts: { name: string } | null
    categories: Pick<Category, 'id' | 'name' | 'kind' | 'irs_deduction' | 'income_type'> | null
  })[]
  categories: Pick<Category, 'id' | 'name' | 'kind' | 'irs_deduction' | 'income_type'>[]
  reportingCurrency: string
  gbpToEurRate: number
  reportingRate: number
  locale: string
  from: string
  transferCount: number
  expenseCount: number
  incomeCount: number
  totalOutReporting: number
  totalInReporting: number
  latestBatch: LatestBatch | null
}

function SummaryCard({
  label,
  value,
  subtitle,
  valueClass,
  children,
}: {
  label: string
  value?: string
  subtitle?: string
  valueClass?: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-separator/80 bg-surface p-4 shadow-xs flex flex-col gap-1.5">
      <span className="text-caption font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
      {value && (
        <span className={`text-h2 font-extrabold tabular-nums ${valueClass ?? 'text-ink'}`}>
          {value}
        </span>
      )}
      {subtitle && <span className="text-caption text-text-secondary">{subtitle}</span>}
      {children}
    </div>
  )
}

export function TransactionSummary({
  reportingCurrency,
  locale,
  from,
  transferCount,
  expenseCount,
  incomeCount,
  totalOutReporting,
  totalInReporting,
  latestBatch,
}: Props) {
  const t = useTranslations('Transactions')
  const [confirmBatch, setConfirmBatch] = useState(false)
  const [batchPending, startBatchTransition] = useTransition()
  const [batchError, setBatchError] = useState<string | null>(null)

  const monthLabel = formatMonthYear(from, locale)

  function handleUndoBatch() {
    if (!latestBatch) return
    if (!confirmBatch) { setConfirmBatch(true); return }
    startBatchTransition(async () => {
      const result = await deleteImportBatch(latestBatch.id)
      if (result.error) { setBatchError(result.error); return }
      setConfirmBatch(false)
    })
  }

  const spentValue  = formatMoney(-Math.abs(totalOutReporting), reportingCurrency, locale)
  const incomeValue = formatMoney(totalInReporting, reportingCurrency, locale, { signDisplay: 'always' })
  const netValue    = formatMoney(totalInReporting + totalOutReporting, reportingCurrency, locale)

  const transfersLabel = t('transfersExcluded', { count: transferCount })

  return (
    <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
      {/* Card 1: Spent */}
      <SummaryCard
        label={t('spentInMonth', { month: monthLabel })}
        value={spentValue}
        subtitle={t('acrossTransactions', {
          count: expenseCount,
          transfers: transfersLabel,
        })}
      />

      {/* Card 2: Income */}
      <SummaryCard
        label={t('incomeInMonth', { month: monthLabel })}
        value={incomeValue}
        valueClass="text-positive"
        subtitle={t('acrossIncomeTransactions', { count: incomeCount })}
      />

      {/* Card 3: Latest batch OR Net */}
      {latestBatch ? (
        <SummaryCard label={t('latestBatch')}>
          <span className="text-h2 font-extrabold tabular-nums text-ink">
            {t('batchTitle', { count: latestBatch.row_count ?? 0 })}
          </span>
          {latestBatch.filename && (
            <span className="text-caption text-text-secondary truncate">{latestBatch.filename}</span>
          )}
          {batchError && <span className="text-caption text-negative">{batchError}</span>}
          <div className="mt-1">
            {confirmBatch ? (
              <div className="flex flex-col gap-2">
                <span className="text-caption text-negative">
                  {t('undoBatchConfirm', { count: latestBatch.row_count ?? 0 })}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleUndoBatch}
                    disabled={batchPending}
                  >
                    {t('undoBatch')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmBatch(false)}
                    disabled={batchPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={handleUndoBatch} disabled={batchPending}>
                {t('undoBatch')}
              </Button>
            )}
          </div>
        </SummaryCard>
      ) : (
        <SummaryCard
          label={t('netCashflow')}
          value={netValue}
          subtitle={monthLabel}
        />
      )}
    </div>
  )
}
