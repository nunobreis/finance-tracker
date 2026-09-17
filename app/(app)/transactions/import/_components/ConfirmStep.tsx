'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { importBatch } from '@/app/(app)/transactions/_components/actions'
import { getCategoryId } from '@/lib/categories-utils'
import { useTranslations } from 'next-intl'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { Account, Category } from '@/types/database'
import { formatEur } from '@/lib/utils'

type Props = {
  rows: NormalisedRow[]
  checked: boolean[]
  accountId: string
  accounts: Account[]
  categories: Category[]
  onBack: () => void
}

export function ConfirmStep({ rows, checked, accountId, accounts, categories, onBack }: Props) {
  const t = useTranslations('Transactions')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedRows = rows.filter((_, i) => checked[i])
  const skippedCount = rows.length - selectedRows.length
  const accountName = accounts.find(a => a.id === accountId)?.name ?? 'Unknown'
  const totalAmount = selectedRows.reduce((s, r) => s + r.amount, 0)

  async function handleImport() {
    setLoading(true)
    setError(null)

    const categoryIdMap: Record<string, string> = {}
    for (const row of selectedRows) {
      if (row.raw_category && !categoryIdMap[row.raw_category]) {
        const id = getCategoryId(row.raw_category, categories)
        if (id) categoryIdMap[row.raw_category] = id
      }
    }

    const result = await importBatch(accountId, selectedRows, categoryIdMap)

    if (!result.success) {
      setError(result.error ?? 'Import failed')
      setLoading(false)
      return
    }

    router.push(`/transactions?account=${accountId}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border-col bg-card-bg p-5">
        <h3 className="mb-4 font-semibold text-text-primary">{t('import.confirmHeading')}</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <div className="flex justify-between"><span>{t('account')}</span><span className="font-medium text-text-primary">{accountName}</span></div>
          <div className="flex justify-between"><span>{t('import.transactionsToImport')}</span><span className="font-medium text-status-good">{selectedRows.length}</span></div>
          <div className="flex justify-between"><span>{t('import.skippedDuplicates')}</span><span>{skippedCount}</span></div>
          <div className="flex justify-between border-t border-border-col pt-2"><span>{t('import.netTotal')}</span><span className={`font-medium ${totalAmount >= 0 ? 'text-status-good' : 'text-status-danger'}`}>{formatEur(totalAmount)}</span></div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{error}</div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} disabled={loading} className="flex-1 rounded-lg border border-border-col py-2 text-sm font-medium text-text-primary hover:bg-content-bg disabled:opacity-40">{t('import.back')}</button>
        <button onClick={handleImport} disabled={loading || selectedRows.length === 0} className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? t('import.importing') : t('import.confirm')}
        </button>
      </div>
    </div>
  )
}
