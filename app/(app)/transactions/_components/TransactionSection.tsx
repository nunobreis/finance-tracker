'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { TransactionFilters } from './TransactionFilters'
import { TransactionTable } from './TransactionTable'
import { rerunRules } from './actions'
import type { Account, Category, CategoryRule } from '@/types/database'
import type { Transaction } from '@/types/database'

type TxWithRelations = Transaction & {
  accounts: Pick<Account, 'name'> | null
  categories: Pick<Category, 'id' | 'name' | 'kind' | 'irs_deduction' | 'income_type'> | null
}

type LatestBatch = {
  id: string
  filename: string | null
  row_count: number | null
}

type Props = {
  // Filter props
  accounts: Account[]
  categories: Category[]
  currentAccount: string
  currentCategory: string
  currentFrom: string
  currentTo: string
  currentQ: string
  uncategorisedCount: number
  // Table props
  transactions: TxWithRelations[]
  categoryRules: CategoryRule[]
  hasRules: boolean
  reportingCurrency: string
  gbpToEurRate: number
  locale: string
  latestBatch: LatestBatch | null
}

/**
 * Client shell that owns the rerunRules state and passes the handler
 * down to both TransactionFilters (button placement) and TransactionTable
 * (status toast + category override reset after bulk re-run).
 */
export function TransactionSection({
  accounts,
  categories,
  currentAccount,
  currentCategory,
  currentFrom,
  currentTo,
  currentQ,
  uncategorisedCount,
  transactions,
  categoryRules,
  hasRules,
  reportingCurrency,
  gbpToEurRate,
  locale,
  latestBatch,
}: Props) {
  const tCR = useTranslations('CategoryRules')
  const [bulkPending, startBulkTransition] = useTransition()
  const [bulkStatus, setBulkStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleRerunRules() {
    startBulkTransition(async () => {
      const result = await rerunRules()
      if (result.error) {
        setBulkStatus({ type: 'error', text: tCR('error') })
        return
      }
      if (result.count === 0) {
        setBulkStatus({ type: 'error', text: tCR('bulkNone') })
      } else {
        setBulkStatus({ type: 'success', text: tCR('bulkResult', { count: result.count }) })
      }
    })
  }

  return (
    <>
      <TransactionFilters
        accounts={accounts}
        categories={categories}
        currentAccount={currentAccount}
        currentCategory={currentCategory}
        currentFrom={currentFrom}
        currentTo={currentTo}
        currentQ={currentQ}
        uncategorisedCount={uncategorisedCount}
        onRerunRules={hasRules ? handleRerunRules : undefined}
        rerunPending={bulkPending}
      />

      <TransactionTable
        transactions={transactions}
        categories={categories}
        categoryRules={categoryRules}
        hasRules={hasRules}
        reportingCurrency={reportingCurrency}
        gbpToEurRate={gbpToEurRate}
        locale={locale}
        latestBatch={latestBatch}
        externalBulkStatus={bulkStatus}
        onClearExternalBulkStatus={() => setBulkStatus(null)}
      />
    </>
  )
}
