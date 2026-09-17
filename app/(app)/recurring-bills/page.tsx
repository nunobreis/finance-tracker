import { createClient } from '@/lib/supabase/server'
import { getRate } from '@/lib/exchange-rates'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { BillsSummary } from './_components/BillsSummary'
import { BillsTable } from './_components/BillsTable'
import { AddBillDrawer } from './_components/AddBillDrawer'

export default async function RecurringBillsPage() {
  const supabase = await createClient()
  const t = await getTranslations('RecurringBills')
  const reportingCurrency = await getReportingCurrency()
  const reportingRate = await getReportingRate(reportingCurrency)

  const [billsResult, accountsResult, categoriesResult, gbpToEur] = await Promise.all([
    supabase.from('recurring_bills').select('*').eq('is_active', true).order('next_due_on', { ascending: true }),
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('*').order('name'),
    getRate('GBP', 'EUR'),
  ])

  const bills = billsResult.data ?? []
  const accounts = accountsResult.data ?? []
  const categories = categoriesResult.data ?? []

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t('title')}
        actions={<AddBillDrawer accounts={accounts} categories={categories} />}
      />
      <div className="flex flex-col gap-6 p-6">
        <BillsSummary bills={bills} gbpToEur={gbpToEur} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <BillsTable bills={bills} accounts={accounts} categories={categories} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
      </div>
    </div>
  )
}
