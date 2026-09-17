'use client'

import { useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/utils'

type Props = { spent: number; budgeted: number; reportingCurrency: string }

export function SpendingCard({ spent, budgeted, reportingCurrency }: Props) {
  const t = useTranslations('Dashboard')
  const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0
  const overBudget = budgeted > 0 && spent > budgeted

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border-col bg-card-bg p-5">
      <span className="text-sm font-medium text-text-secondary">{t('spendingThisMonth')}</span>
      <div>
        <span className="text-2xl font-semibold text-text-primary">{formatCurrency(spent, reportingCurrency)}</span>
        <span className="ml-2 text-sm text-text-tertiary">/ {formatCurrency(budgeted, reportingCurrency)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-content-bg">
        <div
          className={`h-full rounded-full transition-all ${overBudget ? 'bg-status-danger' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-text-tertiary">{t('ofBudgetUsed', { pct: pct.toFixed(0) })}</p>
    </div>
  )
}
