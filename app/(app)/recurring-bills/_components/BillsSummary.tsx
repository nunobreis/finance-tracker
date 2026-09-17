import { Calendar, AlertCircle, TrendingUp } from 'lucide-react'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import { toMonthlyEur, toAnnualEur, getBillStatus } from '@/lib/bills'
import type { RecurringBill, RecurringFrequency } from '@/types/database'

type Props = { bills: RecurringBill[]; gbpToEur: number }

export function BillsSummary({ bills, gbpToEur }: Props) {
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
      <SummaryCard label="Monthly total" value={formatEur(monthlyTotal)} icon={Calendar} accent />
      <SummaryCard label="Overdue"        value={formatEur(overdueTotal)} icon={AlertCircle} />
      <SummaryCard label="Annual total"   value={formatEur(annualTotal)}  icon={TrendingUp} />
    </div>
  )
}
