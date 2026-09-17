import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { TransactionTable } from './_components/TransactionTable'
import { TransactionFilters } from './_components/TransactionFilters'
import { TransactionSummary } from './_components/TransactionSummary'
import { AddTransactionDrawer } from './_components/AddTransactionDrawer'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

type SearchParams = {
  account?: string
  category?: string
  from?: string
  to?: string
  q?: string
}

function defaultDateRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const t = await getTranslations('Transactions')
  const params = await searchParams
  const defaults = defaultDateRange()
  const from = params.from ?? defaults.from
  const to   = params.to   ?? defaults.to

  const [accountsResult, categoriesResult] = await Promise.all([
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('*').order('name'),
  ])

  let txQuery = supabase
    .from('transactions')
    .select('*, accounts(name), categories(name)')
    .gte('occurred_on', from)
    .lte('occurred_on', to)
    .order('occurred_on', { ascending: false })

  if (params.account)  txQuery = txQuery.eq('account_id', params.account)
  if (params.category) txQuery = txQuery.eq('category_id', params.category)
  if (params.q)        txQuery = txQuery.or(`description.ilike.%${params.q}%,merchant.ilike.%${params.q}%`)

  const { data: transactions } = await txQuery

  const accounts   = accountsResult.data   ?? []
  const categories = categoriesResult.data ?? []
  const txList     = (transactions ?? []) as Parameters<typeof TransactionTable>[0]['transactions']

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t('title')}
        actions={
          <div className="flex gap-2">
            <Link
              href="/transactions/import"
              className="flex items-center gap-2 rounded-lg border border-border-col bg-card-bg px-4 py-2 text-sm font-medium text-text-primary hover:bg-content-bg"
            >
              <Upload size={16} />
              {t('importCsv')}
            </Link>
            <AddTransactionDrawer accounts={accounts} categories={categories} />
          </div>
        }
      />
      <div className="flex flex-col gap-5 p-6">
        <TransactionSummary transactions={txList} />
        <TransactionFilters
          accounts={accounts}
          categories={categories}
          currentAccount={params.account ?? ''}
          currentCategory={params.category ?? ''}
          currentFrom={from}
          currentTo={to}
        />
        <TransactionTable transactions={txList} />
      </div>
    </div>
  )
}
