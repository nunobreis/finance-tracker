'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CategoryCell } from './CategoryCell'
import { createCategoryRule, rerunRules } from './actions'
import type { SetCategoryResult } from './actions'
import type { Transaction, Account, Category } from '@/types/database'
import { formatDate } from '@/lib/utils'

type TxWithRelations = Transaction & {
  accounts: Pick<Account, 'name'> | null
  categories: Pick<Category, 'name'> | null
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

type Props = {
  transactions: TxWithRelations[]
  categories: Pick<Category, 'id' | 'name'>[]
  hasRules: boolean
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function TransactionTable({ transactions, categories, hasRules }: Props) {
  const tTx = useTranslations('Transactions')
  const tCR = useTranslations('CategoryRules')

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string | null>>({})
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [rulePending, startRuleTransition] = useTransition()
  const [bulkPending, startBulkTransition] = useTransition()

  useEffect(() => {
    if (!statusMessage) return
    const id = setTimeout(() => setStatusMessage(null), 4000)
    return () => clearTimeout(id)
  }, [statusMessage])

  if (transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
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

  function getEffectiveCategoryId(tx: TxWithRelations): string | null {
    return tx.id in categoryOverrides ? categoryOverrides[tx.id] : tx.category_id
  }

  function getEffectiveCategoryName(tx: TxWithRelations): string | null {
    const id = getEffectiveCategoryId(tx)
    if (!id) return null
    return categories.find(c => c.id === id)?.name ?? tx.categories?.name ?? null
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
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-content-bg px-4 py-2.5 text-sm text-text-primary">
        <span className="flex-1">{leadText} {extraText}</span>
        <div className="flex gap-2">
          <button
            onClick={handleCreateRule}
            disabled={rulePending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {rulePending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
            {btnLabel}
          </button>
          <button
            onClick={() => setPrompt(null)}
            className="rounded-lg border border-border-col px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-card-bg"
          >
            {tCR('prompt.skip')}
          </button>
        </div>
      </div>
    )
  }

  const toolbar = (
    <div className="flex items-center justify-between gap-4 flex-wrap min-h-[36px]">
      {statusMessage ? (
        <div
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-3 py-2 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-good-bg text-status-good'
              : 'bg-danger-bg text-status-danger'
          }`}
        >
          {statusMessage.text}
        </div>
      ) : (
        <div />
      )}
      {hasRules && (
        <button
          onClick={handleBulk}
          disabled={bulkPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border-col bg-card-bg px-4 py-2 text-sm font-medium text-text-primary hover:bg-content-bg disabled:opacity-60"
        >
          {bulkPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {tCR('bulkAction')}
        </button>
      )}
    </div>
  )

  return (
    <>
      {toolbar}

      {/* Mobile card list */}
      <div className="sm:hidden divide-y divide-border-col rounded-xl border border-border-col bg-card-bg">
        {transactions.map(tx => (
          <React.Fragment key={tx.id}>
            <div className="flex flex-col gap-1.5 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">{formatDate(tx.occurred_on)}</span>
                <span className={`text-sm font-medium tabular-nums ${Number(tx.amount) >= 0 ? 'text-status-good' : 'text-status-danger'}`}>
                  {formatAmount(Number(tx.amount), tx.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-text-primary">
                  {tx.merchant ?? tx.description ?? '—'}
                  {tx.source === 'csv_import' && (
                    <span className="ml-1.5 rounded bg-accent-light px-1.5 py-0.5 text-xs text-accent">
                      {tTx('importBadge')}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-text-secondary">{tx.accounts?.name ?? '—'}</span>
              </div>
              <div>
                {tx.is_transfer ? (
                  <StatusBadge label={tTx('transferBadge')} color="neutral" />
                ) : (
                  <CategoryCell
                    txId={tx.id}
                    merchant={tx.merchant}
                    description={tx.description}
                    categoryId={getEffectiveCategoryId(tx)}
                    categoryName={getEffectiveCategoryName(tx)}
                    categories={categories}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    onSaved={(newId, result) => handleSaved(tx.id, newId, result)}
                    onEditStart={() => setPrompt(null)}
                  />
                )}
              </div>
            </div>
            {prompt?.txId === tx.id && (
              <div className="border-t border-border-col px-4 py-3">
                <PromptBar p={prompt} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-border-col bg-card-bg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-3 text-left">{tTx('date')}</th>
              <th className="px-4 py-3 text-left">{tTx('description')}</th>
              <th className="px-4 py-3 text-left">{tTx('category')}</th>
              <th className="px-4 py-3 text-left">{tTx('account')}</th>
              <th className="px-4 py-3 text-right">{tTx('amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-col">
            {transactions.map(tx => (
              <React.Fragment key={tx.id}>
                <tr className="hover:bg-content-bg">
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {formatDate(tx.occurred_on)}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {tx.merchant ?? tx.description ?? '—'}
                    {tx.source === 'csv_import' && (
                      <span className="ml-2 rounded bg-accent-light px-1.5 py-0.5 text-xs text-accent">
                        {tTx('importBadge')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tx.is_transfer ? (
                      <StatusBadge label={tTx('transferBadge')} color="neutral" />
                    ) : (
                      <CategoryCell
                        txId={tx.id}
                        merchant={tx.merchant}
                        description={tx.description}
                        categoryId={getEffectiveCategoryId(tx)}
                        categoryName={getEffectiveCategoryName(tx)}
                        categories={categories}
                        onOptimisticUpdate={handleOptimisticUpdate}
                        onSaved={(newId, result) => handleSaved(tx.id, newId, result)}
                        onEditStart={() => setPrompt(null)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{tx.accounts?.name ?? '—'}</td>
                  <td className={`px-4 py-3 text-right font-medium tabular-nums ${Number(tx.amount) >= 0 ? 'text-status-good' : 'text-status-danger'}`}>
                    {formatAmount(Number(tx.amount), tx.currency)}
                  </td>
                </tr>
                {prompt?.txId === tx.id && (
                  <tr>
                    <td colSpan={5} className="px-4 pb-3 pt-0">
                      <PromptBar p={prompt} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
