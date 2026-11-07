'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { TransactionRow, resolveCategoryVisual } from '@/components/ui/TransactionRow'
import { CategoryCell } from './CategoryCell'
import { createCategoryRule, rerunRules, deleteImportBatch } from './actions'
import type { SetCategoryResult } from './actions'
import type { Transaction, Account, Category, CategoryRule } from '@/types/database'
import { formatDate, formatMoney } from '@/lib/utils'
import { findMatchingRule } from '@/lib/category-rules'

type TxWithRelations = Transaction & {
  accounts: Pick<Account, 'name'> | null
  categories: Pick<Category, 'id' | 'name' | 'kind' | 'irs_deduction' | 'income_type'> | null
}

type Prompt = {
  txId: string
  matchText: string
  matchKey: string
  categoryId: string
  categoryName: string
  matchCount: number
  existingRule: boolean
}

type LatestBatch = {
  id: string
  filename: string | null
  row_count: number | null
}

type Props = {
  transactions: TxWithRelations[]
  categories: Pick<Category, 'id' | 'name' | 'kind' | 'irs_deduction' | 'income_type'>[]
  categoryRules: CategoryRule[]
  hasRules: boolean
  reportingCurrency: string
  gbpToEurRate: number
  locale: string
  latestBatch: LatestBatch | null
}

/** Compute the IRS / Rule Status cell content for a transaction */
function computeIrsRuleStatus(
  tx: TxWithRelations,
  effectiveCategoryId: string | null,
  categories: Pick<Category, 'id' | 'name' | 'kind' | 'irs_deduction' | 'income_type'>[],
  rules: CategoryRule[],
  tTx: ReturnType<typeof useTranslations>,
  tCat: ReturnType<typeof useTranslations>,
): string {
  if (tx.is_transfer) {
    return tTx('ruleStatus.transferExcluded')
  }

  const matchedRule = findMatchingRule(tx, rules)
  if (matchedRule && matchedRule.category_id === effectiveCategoryId) {
    return tTx('ruleStatus.autoRule', { matchText: matchedRule.match_text })
  }

  const category = effectiveCategoryId
    ? categories.find(c => c.id === effectiveCategoryId)
    : null

  if (!category) return '—'

  // IRS deduction
  const irsDeduction = (tx.irs_deduction_override ?? category.irs_deduction) as string | null | undefined
  if (irsDeduction && irsDeduction !== 'none') {
    // Map dotted key e.g. "iva_sector.restaurants" → nested lookup
    const parts = irsDeduction.split('.')
    try {
      if (parts.length === 2) {
        return tCat(`irsDeductionOptions.${parts[0]}.${parts[1]}`)
      }
      return tCat(`irsDeductionOptions.${irsDeduction}`)
    } catch {
      return irsDeduction
    }
  }

  // Income type
  const incomeType = category.income_type as string | null | undefined
  if (incomeType) {
    try {
      return tCat(`incomeTypeOptions.${incomeType}`)
    } catch {
      return incomeType
    }
  }

  return '—'
}

export function TransactionTable({
  transactions,
  categories,
  categoryRules,
  hasRules,
  reportingCurrency,
  gbpToEurRate,
  locale,
  latestBatch,
}: Props) {
  const tTx = useTranslations('Transactions')
  const tCR = useTranslations('CategoryRules')
  const tCat = useTranslations('Categories')

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string | null>>({})
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [rulePending, startRuleTransition] = useTransition()
  const [bulkPending, startBulkTransition] = useTransition()
  const [batchConfirm, setBatchConfirm] = useState(false)
  const [batchPending, startBatchTransition] = useTransition()

  useEffect(() => {
    if (!statusMessage) return
    const id = setTimeout(() => setStatusMessage(null), 4000)
    return () => clearTimeout(id)
  }, [statusMessage])

  if (transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-separator bg-surface text-body-sm text-text-secondary">
        {tTx('noTransactions')}
      </div>
    )
  }

  function handleOptimisticUpdate(txId: string, newCategoryId: string | null) {
    setCategoryOverrides(prev => ({ ...prev, [txId]: newCategoryId }))
  }

  function handleSaved(txId: string, newCategoryId: string | null, result: SetCategoryResult) {
    if (!newCategoryId || !result.matchText) {
      setPrompt(null)
      return
    }
    const catName = categories.find(c => c.id === newCategoryId)?.name ?? ''
    setPrompt({
      txId,
      matchText: result.matchText,
      matchKey: result.matchKey,
      categoryId: newCategoryId,
      categoryName: catName,
      matchCount: result.matchCount,
      existingRule: result.existingRule,
    })
  }

  function handleCreateRule() {
    if (!prompt) return
    startRuleTransition(async () => {
      const result = await createCategoryRule(
        prompt.matchText,
        prompt.matchKey,
        'equals',
        prompt.categoryId,
      )
      if (result.error) {
        setStatusMessage({ type: 'error', text: tCR('error') })
        return
      }
      setCategoryOverrides({})
      setPrompt(null)
      const msgKey = result.wasUpdate ? 'prompt.ruleUpdated' : 'prompt.ruleCreated'
      setStatusMessage({ type: 'success', text: tCR(msgKey, { count: result.backfillCount }) })
    })
  }

  function handleBulk() {
    startBulkTransition(async () => {
      const result = await rerunRules()
      if (result.error) {
        setStatusMessage({ type: 'error', text: tCR('error') })
        return
      }
      setCategoryOverrides({})
      if (result.count === 0) {
        setStatusMessage({ type: 'error', text: tCR('bulkNone') })
      } else {
        setStatusMessage({ type: 'success', text: tCR('bulkResult', { count: result.count }) })
      }
    })
  }

  function handleUndoBatch() {
    if (!latestBatch) return
    if (!batchConfirm) { setBatchConfirm(true); return }
    startBatchTransition(async () => {
      const result = await deleteImportBatch(latestBatch.id)
      if (result.error) {
        setStatusMessage({ type: 'error', text: result.error })
        setBatchConfirm(false)
      }
    })
  }

  function getEffectiveCategoryId(tx: TxWithRelations): string | null {
    return tx.id in categoryOverrides ? categoryOverrides[tx.id] : tx.category_id
  }

  function getEffectiveCategoryName(tx: TxWithRelations): string | null {
    const id = getEffectiveCategoryId(tx)
    if (!id) return null
    return categories.find(c => c.id === id)?.name ?? tx.categories?.name ?? null
  }

  function getEffectiveCategory(tx: TxWithRelations) {
    const id = getEffectiveCategoryId(tx)
    if (!id) return null
    return categories.find(c => c.id === id) ?? null
  }

  function toEur(amount: number, currency: string): number {
    if (currency === 'EUR') return amount
    if (currency === 'GBP') return amount * gbpToEurRate
    return amount
  }

  function PromptBar({ p }: { p: Prompt }) {
    const isUpdate = p.existingRule
    const leadText = isUpdate
      ? tCR('prompt.update', { merchant: p.matchText, category: p.categoryName })
      : tCR('prompt.create', { merchant: p.matchText, category: p.categoryName })
    const extraText = p.matchCount > 0
      ? tCR('prompt.matches', { count: p.matchCount })
      : tCR('prompt.noMatches')
    const btnLabel = isUpdate ? tCR('prompt.updateRule') : tCR('prompt.createRule')

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-teal/30 bg-teal-tint/40 px-4 py-2.5 text-caption text-ink">
        <span className="flex-1">{leadText} {extraText}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleCreateRule}
            disabled={rulePending}
          >
            {rulePending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
            {btnLabel}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPrompt(null)}
          >
            {tCR('prompt.skip')}
          </Button>
        </div>
      </div>
    )
  }

  const toolbar = (
    <div className="flex items-center justify-between gap-4 flex-wrap min-h-[36px]">
      {statusMessage ? (
        <div
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          className={`rounded-full px-4 py-2 text-caption font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-positive-tint text-positive'
              : 'bg-negative-tint text-negative'
          }`}
        >
          {statusMessage.text}
        </div>
      ) : (
        <div />
      )}
      {hasRules && (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleBulk}
          disabled={bulkPending}
        >
          {bulkPending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
          {tCR('bulkAction')}
        </Button>
      )}
    </div>
  )

  // Mobile import batch banner
  const mobileBatchBanner = latestBatch ? (
    <div className="rounded-[12px] bg-teal-tint/50 px-3.5 py-2.5 flex items-center justify-between gap-2 lg:hidden">
      <span className="text-caption font-semibold text-ink truncate">
        {latestBatch.filename ?? tTx('import.title')} ({latestBatch.row_count ?? 0} {tTx('import.rowCount', { count: latestBatch.row_count ?? 0 }).replace(/^\d+ /, '')})
      </span>
      {batchConfirm ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-caption text-negative">{tTx('undoBatchConfirm', { count: latestBatch.row_count ?? 0 })}</span>
          <Button size="sm" variant="danger" onClick={handleUndoBatch} disabled={batchPending}>
            {tTx('undoBatch')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setBatchConfirm(false)} disabled={batchPending}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="shrink-0 text-teal" onClick={handleUndoBatch} disabled={batchPending}>
          {tTx('undoBatch')}
        </Button>
      )}
    </div>
  ) : null

  return (
    <>
      {toolbar}

      {mobileBatchBanner}

      {/* Mobile card list */}
      <div className="lg:hidden divide-y divide-separator rounded-2xl border border-separator bg-surface overflow-hidden">
        {transactions.map(tx => {
          const isPositive   = Number(tx.amount) > 0
          const effectiveCatId = getEffectiveCategoryId(tx)
          const effectiveCat   = getEffectiveCategory(tx)
          const categoryName   = getEffectiveCategoryName(tx)
          const categoryKind   = effectiveCat?.kind ?? tx.categories?.kind ?? null
          const { icon, tone } = resolveCategoryVisual(categoryName, categoryKind, tx.is_transfer, isPositive)

          const nativeAmount = formatMoney(Number(tx.amount), tx.currency, locale)
          const eurEquiv =
            tx.currency !== 'EUR' && tx.currency !== reportingCurrency
              ? `≈ ${formatMoney(toEur(Number(tx.amount), tx.currency), 'EUR', locale)}`
              : undefined

          return (
            <React.Fragment key={tx.id}>
              <div className="px-4">
                <TransactionRow
                  title={tx.merchant ?? tx.description ?? '—'}
                  subtitle={`${tx.accounts?.name ?? '—'} · ${formatDate(tx.occurred_on, locale)}`}
                  amount={nativeAmount}
                  secondaryAmount={eurEquiv}
                  isPositive={isPositive}
                  isTransfer={tx.is_transfer}
                  categoryName={categoryName}
                  categoryKind={categoryKind}
                  icon={icon}
                  iconTone={tone}
                  trailingAction={
                    tx.is_transfer ? (
                      <StatusBadge label={tTx('transferBadge')} color="neutral" />
                    ) : (
                      <CategoryCell
                        txId={tx.id}
                        merchant={tx.merchant}
                        description={tx.description}
                        categoryId={effectiveCatId}
                        categoryName={categoryName}
                        categories={categories}
                        onOptimisticUpdate={handleOptimisticUpdate}
                        onSaved={(newId, result) => handleSaved(tx.id, newId, result)}
                        onEditStart={() => setPrompt(null)}
                      />
                    )
                  }
                />
                {tx.import_batch_id && (
                  <span className="ml-auto mb-2 inline-flex rounded-full bg-teal-tint px-2 py-0.5 text-caption text-teal font-semibold">
                    {tTx('importBadge')}
                  </span>
                )}
              </div>
              {prompt?.txId === tx.id && (
                <div className="border-t border-separator px-4 py-3">
                  <PromptBar p={prompt} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-hidden rounded-[20px] border border-separator/80 bg-surface shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-separator bg-canvas text-caption font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 text-left">{tTx('date')}</th>
              <th className="px-4 py-3 text-left">{tTx('description')}</th>
              <th className="px-4 py-3 text-left">{tTx('account')}</th>
              <th className="px-4 py-3 text-left">{tTx('category')}</th>
              <th className="px-4 py-3 text-left">{tTx('irsRuleStatus')}</th>
              <th className="px-4 py-3 text-right">{tTx('amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {transactions.map(tx => {
              const isPositive       = Number(tx.amount) > 0
              const effectiveCatId   = getEffectiveCategoryId(tx)
              const effectiveCat     = getEffectiveCategory(tx)
              const categoryName     = getEffectiveCategoryName(tx)
              const categoryKind     = effectiveCat?.kind ?? tx.categories?.kind ?? null
              const { icon: Icon, tone } = resolveCategoryVisual(categoryName, categoryKind, tx.is_transfer, isPositive)

              const nativeAmount = formatMoney(Number(tx.amount), tx.currency, locale)
              const eurEquiv =
                tx.currency !== 'EUR' && tx.currency !== reportingCurrency
                  ? `≈ ${formatMoney(toEur(Number(tx.amount), tx.currency), 'EUR', locale)}`
                  : undefined

              const irsStatus = computeIrsRuleStatus(tx, effectiveCatId, categories, categoryRules, tTx, tCat)

              const toneColorMap: Record<string, string> = {
                emerald: 'bg-positive-tint text-positive',
                amber:   'bg-warning-tint text-warning-deep',
                blue:    'bg-info-tint text-info',
                purple:  'bg-purple-tint text-purple',
                teal:    'bg-teal-tint text-teal',
                rose:    'bg-negative-tint text-negative',
                slate:   'bg-canvas text-text-secondary',
              }

              return (
                <React.Fragment key={tx.id}>
                  <tr className="hover:bg-canvas">
                    {/* Date */}
                    <td className="px-4 py-3 text-caption text-text-secondary whitespace-nowrap">
                      {formatDate(tx.occurred_on, locale, { includeYear: true })}
                    </td>

                    {/* Merchant & description */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] ${toneColorMap[tone] ?? 'bg-canvas text-text-secondary'}`}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-body-sm font-semibold text-ink truncate max-w-[200px]">
                              {tx.merchant ?? tx.description ?? '—'}
                            </span>
                            {tx.import_batch_id && (
                              <span className="shrink-0 rounded-full bg-teal-tint px-2 py-0.5 text-caption text-teal font-semibold">
                                {tTx('importBadge')}
                              </span>
                            )}
                          </div>
                          {tx.merchant && tx.description && (
                            <span className="text-caption text-text-secondary truncate max-w-[200px] block">
                              {tx.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Account */}
                    <td className="px-4 py-3">
                      <div className="text-body-sm text-ink">{tx.accounts?.name ?? '—'}</div>
                      <div className="text-caption text-text-secondary">{tx.currency}</div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {tx.is_transfer ? (
                        <StatusBadge label={tTx('transferBadge')} color="neutral" />
                      ) : (
                        <CategoryCell
                          txId={tx.id}
                          merchant={tx.merchant}
                          description={tx.description}
                          categoryId={effectiveCatId}
                          categoryName={categoryName}
                          categories={categories}
                          onOptimisticUpdate={handleOptimisticUpdate}
                          onSaved={(newId, result) => handleSaved(tx.id, newId, result)}
                          onEditStart={() => setPrompt(null)}
                        />
                      )}
                    </td>

                    {/* IRS / Rule Status */}
                    <td className="px-4 py-3 text-caption text-text-secondary">
                      {irsStatus}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right">
                      <div
                        className={`text-body-sm font-semibold tabular-nums ${
                          isPositive ? 'text-positive' : tx.is_transfer ? 'text-text-secondary' : 'text-ink'
                        }`}
                      >
                        {nativeAmount}
                      </div>
                      {eurEquiv && (
                        <div className="text-caption text-text-secondary tabular-nums">
                          ({eurEquiv})
                        </div>
                      )}
                    </td>
                  </tr>

                  {prompt?.txId === tx.id && (
                    <tr>
                      <td colSpan={6} className="px-4 pb-3 pt-0">
                        <PromptBar p={prompt} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
