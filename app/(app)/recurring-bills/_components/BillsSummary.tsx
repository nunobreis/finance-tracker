'use client'

import { Calendar, AlertCircle, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatCurrency } from '@/lib/utils'
import { toMonthlyEur, toAnnualEur, getBillStatus } from '@/lib/bills'
import type { RecurringBill, RecurringFrequency } from '@/types/database'

type Props = {
  bills: RecurringBill[]
  gbpToEur: number
  reportingCurrency: string
  reportingRate: number
}

export function BillsSummary({ bills, gbpToEur, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('RecurringBills')
  const activeBills = bills.filter(b => b.is_active)

  const monthlyTotal = activeBills.reduce(
    (s, b) => s + toMonthlyEur(Number(b.amount), b.currency, b.frequency as RecurringFrequency, gbpToEur), 0
  )
  const annualTotal = activeBills.reduce(
    (s, b) => s + toAnnualEur(Number(b.amount), b.currency, b.frequency as RecurringFrequency, gbpToEur), 0
  )
  const overdueTotal = activeBills
    .filter(b => getBillStatus(b.next_due_on, b.reminder_days_before) === 'overdue')
    .reduce((s, b) => s + toMonthlyEur(Number(b.amount), b.currency, b.frequency as RecurringFrequency, gbpToEur), 0)

  return (
    <div className="flex gap-4">
      <SummaryCard label={t('monthlyTotal')} value={formatCurrency(monthlyTotal * reportingRate, reportingCurrency)} icon={Calendar} accent />
      <SummaryCard label={t('overdue')}      value={formatCurrency(overdueTotal * reportingRate, reportingCurrency)} icon={AlertCircle} />
      <SummaryCard label={t('annualTotal')}  value={formatCurrency(annualTotal * reportingRate, reportingCurrency)}  icon={TrendingUp} />
    </div>
  )
}
