import type { RecurringFrequency } from '@/types/database'

export type BillStatus = 'overdue' | 'due_soon' | 'active'

export function getBillStatus(
  nextDueOn: string,
  reminderDaysBefore: number
): BillStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(nextDueOn)
  due.setHours(0, 0, 0, 0)
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue <= reminderDaysBefore) return 'due_soon'
  return 'active'
}

export function advanceDueDate(
  nextDueOn: string,
  frequency: RecurringFrequency
): string {
  const date = new Date(nextDueOn)
  switch (frequency) {
    case 'weekly':    date.setDate(date.getDate() + 7);         break
    case 'monthly':   date.setMonth(date.getMonth() + 1);       break
    case 'quarterly': date.setMonth(date.getMonth() + 3);       break
    case 'yearly':    date.setFullYear(date.getFullYear() + 1); break
  }
  return date.toISOString().split('T')[0]
}

const MONTHLY_MULTIPLIER: Record<RecurringFrequency, number> = {
  weekly:    52 / 12,
  monthly:   1,
  quarterly: 1 / 3,
  yearly:    1 / 12,
}

export function toMonthlyEur(
  amount: number,
  currency: string,
  frequency: RecurringFrequency,
  gbpToEur: number
): number {
  const rate = currency === 'EUR' ? 1 : gbpToEur
  return amount * rate * MONTHLY_MULTIPLIER[frequency]
}

export function toAnnualEur(
  amount: number,
  currency: string,
  frequency: RecurringFrequency,
  gbpToEur: number
): number {
  return toMonthlyEur(amount, currency, frequency, gbpToEur) * 12
}
