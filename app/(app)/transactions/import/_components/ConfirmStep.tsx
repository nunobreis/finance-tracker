'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { importBatch, deleteImportBatch } from '@/app/(app)/transactions/_components/actions'
import { getCategoryId } from '@/lib/categories-utils'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, Undo2 } from 'lucide-react'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { Account, Category } from '@/types/database'

type Props = {
  rows: NormalisedRow[]
  checked: boolean[]
  accountId: string
  fileName: string | null
  accounts: Account[]
  categories: Category[]
  autoRuleCount: number
  onBack: () => void
}

type CompletedState = {
  batchId: string
  autoCategorisedCount: number
  totalCount: number
}

function SummaryCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-canvas px-4 py-3">
      <span className="block text-caption text-text-secondary">{label}</span>
      <span className="block text-body-sm font-semibold text-ink">{value}</span>
      {sub && <span className="block text-caption text-text-muted">{sub}</span>}
    </div>
  )
}

export function ConfirmStep({ rows, checked, accountId, fileName, accounts, categories, autoRuleCount, onBack }: Props) {
  const t = useTranslations('Transactions')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState<CompletedState | null>(null)
  const [confirmingUndo, setConfirmingUndo] = useState(false)
  const [undoing, setUndoing] = useState(false)

  const selectedRows = rows.filter((_, i) => checked[i])
  const skippedCount = rows.length - selectedRows.length
  const targetAccount = accounts.find(a => a.id === accountId)
  const totalAmount = selectedRows.reduce((s, r) => s + r.amount, 0)
  const rowCurrencies = new Set(selectedRows.map(r => r.currency))
  const displayCurrency = selectedRows[0]?.currency ?? targetAccount?.currency ?? 'EUR'
  const isMixedCurrency = rowCurrencies.size > 1

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

    const result = await importBatch(accountId, selectedRows, categoryIdMap, fileName)

    if (!result.success || !result.batchId) {
      setError(result.error ?? 'Import failed')
      setLoading(false)
      return
    }

    setCompleted({
      batchId: result.batchId,
      autoCategorisedCount: result.autoCategorisedCount ?? 0,
      totalCount: selectedRows.length,
    })
    setLoading(false)
  }

  async function handleUndoBatch() {
    if (!completed) return
    setUndoing(true)
    const result = await deleteImportBatch(completed.batchId)
    setUndoing(false)
    setConfirmingUndo(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/transactions')
    }
  }

  // ── Post-import completion state ────────────────────────────────────────────
  if (completed) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-tint">
            <CheckCircle2 size={22} className="text-teal" />
          </div>
          <div>
            <p className="text-body font-bold text-ink">{t('import.stepLabelComplete')}</p>
            <p className="text-caption text-text-secondary">{targetAccount?.name}</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="flex flex-col gap-3">
          <SummaryCard
            label={t('import.importBatch')}
            value={`${fileName ?? 'CSV Import'} (${completed.totalCount} rows)`}
            sub={targetAccount?.name}
          />
          <SummaryCard
            label={t('import.categorisedByRules')}
            value={t('import.autoCategorisedOf', {
              auto: completed.autoCategorisedCount,
              total: completed.totalCount,
            })}
          />
          <SummaryCard
            label="Reversibility"
            value={t('import.reversibility')}
          />
        </div>

        {/* Undo batch immediately */}
        {confirmingUndo ? (
          <div className="flex flex-col gap-3 rounded-[12px] border border-negative/30 bg-negative-tint px-4 py-3">
            <p className="text-caption text-negative">
              {t('import.undoBatchConfirm', { count: completed.totalCount })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                disabled={undoing}
                onClick={handleUndoBatch}
              >
                {undoing ? '…' : t('import.undoBatch')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingUndo(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="md"
            className="flex w-full items-center gap-3 rounded-[12px] bg-canvas px-4 py-3 text-left hover:bg-negative-tint/60 transition-colors justify-start"
            onClick={() => setConfirmingUndo(true)}
          >
            <Undo2 size={18} className="shrink-0 text-text-secondary" />
            <div>
              <span className="block text-body-sm font-semibold text-ink">{t('import.undoBatchImmediately')}</span>
              <span className="text-caption text-text-secondary">Removes all {completed.totalCount} imported transactions</span>
            </div>
          </Button>
        )}

        {error && (
          <div className="rounded-xl bg-negative-tint px-4 py-3 text-body-sm text-negative">{error}</div>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => router.push(`/transactions?account=${accountId}`)}
        >
          {t('import.backToTransactions')}
        </Button>
      </div>
    )
  }

  // ── Pre-import summary state ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SummaryCard
          label={t('import.targetAccount')}
          value={targetAccount?.name ?? '—'}
          sub={targetAccount?.currency}
        />
        <SummaryCard
          label={t('import.transactionsToImport')}
          value={selectedRows.length}
        />
        <SummaryCard
          label={t('import.categorisedByRules')}
          value={autoRuleCount}
        />
        <SummaryCard
          label={t('import.skippedDuplicates')}
          value={skippedCount}
        />
        <SummaryCard
          label={t('import.netTotal')}
          value={
            <span className={totalAmount >= 0 ? 'text-positive' : 'text-negative'}>
              {formatCurrency(totalAmount, displayCurrency)}
            </span>
          }
          sub={isMixedCurrency ? t('import.mixedCurrencyWarning', { currency: targetAccount?.currency ?? 'EUR' }) : undefined}
        />
      </div>

      {error && (
        <div className="rounded-xl bg-negative-tint px-4 py-3 text-body-sm text-negative">{error}</div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack} disabled={loading} className="flex-1">
          {t('import.back')}
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={loading || selectedRows.length === 0}
          onClick={handleImport}
          className="flex-1"
        >
          {loading ? t('import.importing') : t('import.confirmImportCount', { count: selectedRows.length })}
        </Button>
      </div>
    </div>
  )
}
