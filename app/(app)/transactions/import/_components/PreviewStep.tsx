'use client'

import { useEffect, useRef, useState } from 'react'
import { flagDuplicates } from '@/lib/csv/dedup'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { findMatchingRule } from '@/lib/category-rules'
import { getCategoryId, getCategoryDisplayName } from '@/lib/categories-utils'
import { createClient } from '@/lib/supabase/browser'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { ExistingTransaction } from '@/lib/csv/dedup'
import type { Category, CategoryRule } from '@/types/database'

type RowStatus =
  | { kind: 'autoRule'; matchText: string; categoryName: string }
  | { kind: 'csvCategory'; categoryName: string }
  | { kind: 'transfer' }
  | { kind: 'duplicate' }
  | { kind: 'uncategorised' }

type Props = {
  rows: NormalisedRow[]
  accountId: string
  categories: Category[]
  rules: CategoryRule[]
  onBack: () => void
  onNext: (checked: boolean[], autoCount: number) => void
}

function getRowStatus(
  row: NormalisedRow,
  rules: CategoryRule[],
  categories: Category[],
  isDuplicate: boolean,
  tCat: (key: string) => string
): RowStatus {
  if (isDuplicate) return { kind: 'duplicate' }
  if (row.is_transfer) return { kind: 'transfer' }

  const matchedRule = findMatchingRule(row, rules)
  if (matchedRule) {
    const cat = categories.find(c => c.id === matchedRule.category_id)
    return { kind: 'autoRule', matchText: matchedRule.match_text, categoryName: cat ? getCategoryDisplayName(cat, tCat) : '?' }
  }

  if (row.raw_category) {
    const catId = getCategoryId(row.raw_category, categories)
    if (catId) {
      const cat = categories.find(c => c.id === catId)
      return { kind: 'csvCategory', categoryName: cat ? getCategoryDisplayName(cat, tCat) : row.raw_category }
    }
  }

  return { kind: 'uncategorised' }
}

function StatusBadge({ status, t }: { status: RowStatus; t: ReturnType<typeof useTranslations<'Transactions'>> }) {
  switch (status.kind) {
    case 'autoRule':
      return (
        <span className="inline-flex items-center rounded-full bg-teal-tint px-2 py-0.5 text-label font-medium text-teal truncate max-w-[180px]">
          {t('import.autoRuleMatch', { matchText: status.matchText, category: status.categoryName })}
        </span>
      )
    case 'csvCategory':
      return (
        <span className="inline-flex items-center rounded-full bg-canvas px-2 py-0.5 text-label font-medium text-text-secondary">
          CSV → {status.categoryName}
        </span>
      )
    case 'transfer':
      return (
        <span className="inline-flex items-center rounded-full bg-canvas px-2 py-0.5 text-label font-medium text-text-secondary">
          {t('import.transferExcluded')}
        </span>
      )
    case 'duplicate':
      return (
        <span className="inline-flex items-center rounded-full bg-negative-tint px-2 py-0.5 text-label font-medium text-negative">
          Duplicate · Skipped
        </span>
      )
    default:
      return null
  }
}

export function PreviewStep({ rows, accountId, categories, rules, onBack, onNext }: Props) {
  const t = useTranslations('Transactions')
  const tCat = useTranslations('Categories')
  const [duplicates, setDuplicates] = useState<boolean[]>(rows.map(() => false))
  const [checked, setChecked] = useState<boolean[]>(rows.map(() => true))
  const [loading, setLoading] = useState(true)
  const [dedupFailed, setDedupFailed] = useState(false)
  const hasRunRef = useRef(false)

  function toggle(index: number) {
    setChecked(prev => prev.map((v, i) => (i === index ? !v : v)))
  }

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    const supabase = createClient()
    const dates = rows.map(r => r.occurred_on).filter(Boolean).sort()
    const minDate = dates[0]
    const maxDate = dates[dates.length - 1]

    supabase
      .from('transactions')
      .select('occurred_on, amount, currency, external_id')
      .eq('account_id', accountId)
      .gte('occurred_on', minDate)
      .lte('occurred_on', maxDate)
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setDedupFailed(true)
          setChecked(rows.map(() => true))
          setLoading(false)
          return
        }
        const existing: ExistingTransaction[] = (data ?? []).map(tx => ({
          occurred_on: tx.occurred_on,
          amount: Number(tx.amount),
          currency: tx.currency,
          external_id: tx.external_id ?? null,
        }))
        const flags = flagDuplicates(rows, existing)
        setDuplicates(flags)
        setChecked(flags.map(isDup => !isDup))
        setLoading(false)
      })
  }, [rows, accountId])

  const statuses = rows.map((row, i) => getRowStatus(row, rules, categories, duplicates[i], tCat))
  const selectedCount = checked.filter(Boolean).length
  const autoCount = statuses.filter(s => s.kind === 'autoRule').length
  const transferCount = statuses.filter(s => s.kind === 'transfer').length
  const dupCount = duplicates.filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">
      {/* Summary pill */}
      <div className="rounded-xl bg-canvas px-4 py-3 text-caption text-text-secondary">
        {loading ? (
          <span>{t('import.preview')}</span>
        ) : (
          <>
            <span className="font-semibold text-teal">{autoCount} auto-categorised</span>
            {' · '}
            <span>{transferCount} transfers</span>
            {' · '}
            <span>{dupCount} duplicate(s) skipped</span>
          </>
        )}
      </div>

      {dedupFailed && (
        <div className="rounded-xl bg-negative-tint px-4 py-3 text-body-sm text-negative">
          {t('import.dedupFailed')}
        </div>
      )}

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 lg:hidden">
        {rows.map((row, i) => {
          const status = statuses[i]
          const isDup = duplicates[i]
          const isTransfer = row.is_transfer
          const isSelectable = !isDup && !isTransfer

          return (
            <label
              key={i}
              className={`flex items-center gap-3 rounded-[12px] bg-canvas px-4 py-3 cursor-pointer ${!isSelectable ? 'opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked[i]}
                disabled={!isSelectable}
                onChange={() => isSelectable && toggle(i)}
                className="h-4 w-4 shrink-0 rounded border-separator accent-teal"
              />
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body-sm font-semibold text-ink truncate">
                    {row.merchant ?? row.description ?? '—'}
                  </span>
                  <span className={`text-body-sm font-semibold tabular-nums shrink-0 ${row.amount >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(row.amount, row.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-caption text-text-muted">{formatDate(row.occurred_on)}</span>
                  {status.kind !== 'uncategorised' && (
                    <StatusBadge status={status} t={t} />
                  )}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block max-h-[480px] overflow-y-auto rounded-xl border border-separator/80 bg-surface">
        <table className="w-full text-body-sm">
          <thead className="sticky top-0 border-b border-separator bg-canvas">
            <tr>
              <th className="w-10 px-3 py-2.5" />
              <th className="px-3 py-2.5 text-left text-caption font-medium text-text-secondary">{t('import.colDate')}</th>
              <th className="px-3 py-2.5 text-left text-caption font-medium text-text-secondary">{t('import.colMerchant')}</th>
              <th className="px-3 py-2.5 text-left text-caption font-medium text-text-secondary">{t('import.colCategory')}</th>
              <th className="px-3 py-2.5 text-right text-caption font-medium text-text-secondary">{t('import.colAmount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator/50">
            {rows.map((row, i) => {
              const status = statuses[i]
              const isDup = duplicates[i]
              const isTransfer = row.is_transfer
              const isSelectable = !isDup && !isTransfer

              return (
                <tr key={i} className={isDup ? 'opacity-50' : ''}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      disabled={!isSelectable}
                      onChange={() => isSelectable && toggle(i)}
                      className="h-4 w-4 rounded border-separator accent-teal"
                      aria-label={t('import.selectRow', { merchant: row.merchant ?? row.description ?? '—' })}
                    />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-text-secondary">{formatDate(row.occurred_on)}</td>
                  <td className="px-3 py-2.5 text-ink font-medium">
                    {row.merchant ?? row.description ?? '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={status} t={t} />
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${row.amount >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(row.amount, row.currency)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack} className="flex-1">
          {t('import.back')}
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={selectedCount === 0}
          onClick={() => onNext(checked, autoCount)}
          className="flex-1"
        >
          {t('import.confirmImportCount', { count: selectedCount })}
        </Button>
      </div>
    </div>
  )
}
