import { Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getRate } from '@/lib/exchange-rates'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { PageHeader } from '@/components/layout/PageHeader'
import { AsOfPicker } from '@/components/ui/AsOfPicker'
import { AccountsSummary } from './_components/AccountsSummary'
import { AccountCard } from './_components/AccountCard'
import { AddAccountDrawer } from './_components/AddAccountDrawer'

type SearchParams = Promise<{ asOf?: string }>

export default async function AccountsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const asOf = params.asOf ?? today

  const supabase = await createClient()
  const t = await getTranslations('Accounts')
  const reportingCurrency = await getReportingCurrency()
  const reportingRate = await getReportingRate(reportingCurrency)

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const accountList = accounts ?? []

  // Derive balance for each account from transactions up to asOf date
  const balanceEntries = await Promise.all(
    accountList.map(async (account) => {
      let query = supabase
        .from('transactions')
        .select('amount')
        .eq('account_id', account.id)
        .eq('is_transfer', false)
      if (asOf !== today) query = query.lte('occurred_on', asOf)
      const { data } = await query
      const txSum = (data ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
      return [account.id, Number(account.opening_balance) + txSum] as [string, number]
    })
  )
  const balances = Object.fromEntries(balanceEntries)
  const gbpToEur = await getRate('GBP', 'EUR')

  return (
    <div className="flex flex-col">
      <PageHeader title={t('title')} actions={<AddAccountDrawer />} />
      <div className="flex flex-col gap-6 p-6">
        <AsOfPicker asOf={asOf} />
        <AccountsSummary accounts={accountList} balances={balances} gbpToEur={gbpToEur} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accountList.map(account => (
            <AccountCard key={account.id} account={account} balance={balances[account.id] ?? 0} />
          ))}
          {accountList.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-col p-10 text-text-tertiary">
              <Plus size={24} />
              <p className="text-sm">{t('noAccounts')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
