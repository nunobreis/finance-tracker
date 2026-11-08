import { createClient } from '@/lib/supabase/server'
import { getRate } from '@/lib/exchange-rates'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { getTranslations, getLocale } from 'next-intl/server'
import { ScreenHero } from '@/components/layout/ScreenHero'
import { toMonthlyEur } from '@/lib/bills'
import { formatMoney } from '@/lib/utils'
import { BillsSummary } from './_components/BillsSummary'
import { BillsTable } from './_components/BillsTable'
import { AddBillDrawer } from './_components/AddBillDrawer'
import type { RecurringFrequency } from '@/types/database'

export default async function RecurringBillsPage() {
  const supabase = await createClient()
  const t = await getTranslations('RecurringBills')
  const locale = await getLocale()
  const reportingCurrency = await getReportingCurrency()
  const reportingRate = await getReportingRate(reportingCurrency)

  const [billsResult, accountsResult, categoriesResult, gbpToEur] = await Promise.all([
    supabase
      .from('recurring_bills')
      .select('*')
      .eq('is_active', true)
      .order('next_due_on', { ascending: true }),
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('*').order('name'),
    getRate('GBP', 'EUR'),
  ])

  const bills = billsResult.data ?? []
  const accounts = accountsResult.data ?? []
  const categories = categoriesResult.data ?? []

  const monthlyTotalEur = bills.reduce(
    (s, b) =>
      s +
      toMonthlyEur(
        Number(b.amount),
        b.currency,
        b.frequency as RecurringFrequency,
        gbpToEur
      ),
    0
  )

  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  const due30Count = bills.filter(
    b => b.next_due_on >= today && b.next_due_on <= in30Days
  ).length
  const gbpCount = bills.filter(b => b.currency === 'GBP').length

  return (
    <ScreenHero
      title={t('title')}
      eyebrow={t('activeCommitments')}
      metric={
        <div className="flex items-baseline gap-1.5">
          <span>
            {formatMoney(
              monthlyTotalEur * reportingRate,
              reportingCurrency,
              locale
            )}
          </span>
          <span className="text-body font-semibold text-glass-70">
            {t('perMonthSuffix')}
          </span>
        </div>
      }
      subtitle={t('heroDueSubtitle', { dueCount: due30Count, gbpCount })}
      desktopActions={<AddBillDrawer accounts={accounts} categories={categories} />}
    >
      <div className="hidden lg:block">
        <BillsSummary
          bills={bills}
          gbpToEur={gbpToEur}
          reportingCurrency={reportingCurrency}
          reportingRate={reportingRate}
        />
      </div>

      <div className="flex items-center justify-between gap-2 lg:hidden">
        <h2 className="text-body font-bold text-ink">
          {t('active')} ({bills.length})
        </h2>
        <AddBillDrawer accounts={accounts} categories={categories} />
      </div>

      <BillsTable
        bills={bills}
        accounts={accounts}
        categories={categories}
        gbpToEur={gbpToEur}
        reportingCurrency={reportingCurrency}
        reportingRate={reportingRate}
      />
    </ScreenHero>
  )
}
