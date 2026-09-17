import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getRate } from '@/lib/exchange-rates'
import { PageHeader } from '@/components/layout/PageHeader'
import { AccountsSummary } from './_components/AccountsSummary'
import { AccountCard } from './_components/AccountCard'
import { AddAccountDrawer } from './_components/AddAccountDrawer'

export default async function AccountsPage() {
  const supabase = await createClient()

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const accountList = accounts ?? []

  // Derive balance for each account from transactions
  const balanceEntries = await Promise.all(
    accountList.map(async (account) => {
      const { data } = await supabase
        .from('transactions')
        .select('amount')
        .eq('account_id', account.id)
        .eq('is_transfer', false)
      const balance = (data ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
      return [account.id, balance] as [string, number]
    })
  )
  const balances = Object.fromEntries(balanceEntries)
  const gbpToEur = await getRate('GBP', 'EUR')

  return (
    <div className="flex flex-col">
      <PageHeader title="Accounts" actions={<AddAccountDrawer />} />
      <div className="flex flex-col gap-6 p-6">
        <AccountsSummary accounts={accountList} balances={balances} gbpToEur={gbpToEur} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accountList.map(account => (
            <AccountCard key={account.id} account={account} balance={balances[account.id] ?? 0} />
          ))}
          {accountList.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-col p-10 text-text-tertiary">
              <Plus size={24} />
              <p className="text-sm">Add your first account to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
