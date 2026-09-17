'use client'

import { useEffect, useState } from 'react'
import { flagDuplicates } from '@/lib/csv/dedup'
import { formatDate } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { ExistingTransaction } from '@/lib/csv/dedup'
import type { Category } from '@/types/database'
import { getCategoryId } from '@/lib/categories-utils'
import { createClient } from '@/lib/supabase/browser'

type Props = {
  rows: NormalisedRow[]
  accountId: string
  categories: Category[]
  onBack: () => void
  onNext: (checked: boolean[]) => void
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export function PreviewStep({ rows, accountId, categories, onBack, onNext }: Props) {
  const t = useTranslations('Transactions')
  const [duplicates, setDuplicates] = useState<boolean[]>(rows.map(() => false))
  const [checked, setChecked] = useState<boolean[]>(rows.map(() => true))
  const [loading, setLoading] = useState(true)
  const [dedupFailed, setDedupFailed] = useState(false)

  function toggle(index: number) {
    setChecked(prev => prev.map((v, i) => (i === index ? !v : v)))
  }

  useEffect(() => {
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
        const existing: ExistingTransaction[] = (data ?? []).map(t => ({
          occurred_on: t.occurred_on,
          amount: Number(t.amount),
          currency: t.currency,
          external_id: t.external_id ?? null,
        }))
        const flags = flagDuplicates(rows, existing)
        setDuplicates(flags)
        setChecked(flags.map(isDup => !isDup))
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCount = checked.filter(Boolean).length
  const dupCount = duplicates.filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-content-bg px-4 py-3 text-sm text-text-secondary">
        {loading ? t('import.preview') : (
          <>{t('import.rowCount', { count: rows.length })} · <span className="text-status-warn">{t('import.duplicatesWarning', { count: dupCount })}</span> · <span className="text-status-good">{t('import.willBeImported', { count: selectedCount })}</span></>
        )}
      </div>

      {dedupFailed && (
        <div className="rounded-lg bg-warn-bg px-4 py-3 text-sm text-status-warn">
          {t('import.dedupFailed')}
        </div>
      )}

      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-border-col bg-card-bg">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-border-col bg-content-bg">
            <tr>
              <th className="px-3 py-2 text-left text-xs text-text-tertiary">{t('import.colImport')}</th>
              <th className="px-3 py-2 text-left text-xs text-text-tertiary">{t('import.colDate')}</th>
              <th className="px-3 py-2 text-left text-xs text-text-tertiary">{t('import.colMerchant')}</th>
              <th className="px-3 py-2 text-left text-xs text-text-tertiary">{t('import.colCategory')}</th>
              <th className="px-3 py-2 text-right text-xs text-text-tertiary">{t('import.colAmount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-col">
            {rows.map((row, i) => {
              const isDup = duplicates[i]
              const categoryId = row.raw_category ? getCategoryId(row.raw_category, categories) : null
              const categoryName = categoryId ? categories.find(c => c.id === categoryId)?.name : null

              return (
                <tr key={i} className={isDup ? 'bg-warn-bg' : ''}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      onChange={() => toggle(i)}
                      className="h-4 w-4 rounded border-border-col text-accent"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-text-secondary">{formatDate(row.occurred_on)}</td>
                  <td className="px-3 py-2 text-text-primary">
                    {row.merchant ?? row.description ?? '—'}
                    {isDup && <span className="ml-2 text-xs text-status-warn">{t('import.duplicate')}</span>}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">{categoryName ?? '—'}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${row.amount >= 0 ? 'text-status-good' : 'text-status-danger'}`}>
                    {formatAmount(row.amount, row.currency)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-lg border border-border-col py-2 text-sm font-medium text-text-primary hover:bg-content-bg">{t('import.back')}</button>
        <button disabled={selectedCount === 0} onClick={() => onNext(checked)} className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
          {t('import.next')}
        </button>
      </div>
    </div>
  )
}
