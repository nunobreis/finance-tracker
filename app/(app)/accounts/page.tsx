import { Plus } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { getRate } from '@/lib/exchange-rates'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { ScreenHero } from '@/components/layout/ScreenHero'
import { AsOfPicker } from '@/components/ui/AsOfPicker'
import { AccountsSummary } from './_components/AccountsSummary'
import { AccountCard } from './_components/AccountCard'
import { AddAccountDrawer } from './_components/AddAccountDrawer'
import { formatMoney } from '@/lib/utils'

type SearchParams = Promise<{ asOf?: string }>

export default async function AccountsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const asOf = params.asOf ?? today

  const supabase = await createClient()
  const t = await getTranslations('Accounts')
  const locale = await getLocale()
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
      const openingDate = account.created_at.split('T')[0]
      let query = supabase
        .from('transactions')
        .select('amount')
        .eq('account_id', account.id)
        .eq('is_transfer', false)
        .gt('occurred_on', openingDate)
      if (asOf !== today) query = query.lte('occurred_on', asOf)
      const { data } = await query
      const txSum = (data ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0)
      return [account.id, Number(account.opening_balance) + txSum] as [string, number]
    })
  )
  const balances = Object.fromEntries(balanceEntries)
  const gbpToEur = await getRate('GBP', 'EUR')

  const totalEur = accountList.reduce((sum, a) => {
    const balance = balances[a.id] ?? 0
    const rate = a.currency === 'EUR' ? 1 : gbpToEur
    return sum + balance * rate
  }, 0)

  const formattedTotal = formatMoney(totalEur * reportingRate, reportingCurrency, locale)

  return (
    <ScreenHero
      title={t('title')}
      eyebrow={t('totalCashAcross', {
        count: accountList.length,
        currency: reportingCurrency,
      })}
      metric={formattedTotal}
      subtitle={t('conversionSubtitle', { rate: `${gbpToEur.toFixed(4)} EUR/GBP` })}
      mobileActions={<AsOfPicker asOf={asOf} variant="glass" />}
      desktopActions={
        <>
          <AsOfPicker asOf={asOf} />
          <AddAccountDrawer />
        </>
      }
    >
      <div className="hidden lg:block">
        <AccountsSummary
          accounts={accountList}
          balances={balances}
          gbpToEur={gbpToEur}
          reportingCurrency={reportingCurrency}
          reportingRate={reportingRate}
        />
      </div>

      <div className="flex items-center justify-between lg:hidden">
        <h2 className="text-body font-bold text-ink">
          {t('accounts')} ({accountList.length})
        </h2>
        <AddAccountDrawer />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {accountList.map(account => (
          <AccountCard
            key={account.id}
            account={account}
            balance={balances[account.id] ?? 0}
            gbpToEur={gbpToEur}
          />
        ))}
        {accountList.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-separator p-10 text-text-muted">
            <Plus size={24} />
            <p className="text-body-sm">{t('noAccounts')}</p>
          </div>
        )}
      </div>
    </ScreenHero>
  )
}
