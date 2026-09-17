'use client'

import { formatCurrency } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { BudgetRow } from '@/lib/budgets'

type MonthData = {
  label: string   // e.g. 'Aug 2026'
  rows: BudgetRow[]
}

type Props = {
  months: MonthData[]
  reportingCurrency: string
  reportingRate: number
}

export function BudgetVarianceWidget({ months, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('Budgets')

  if (months.every(m => m.rows.length === 0)) return null

  // Find all category names across all months
  const categoryNames = Array.from(
    new Set(months.flatMap(m => m.rows.map(r => r.category.name)))
  )

  // Max value for scale
  const maxVal = Math.max(
    ...months.flatMap(m => m.rows.flatMap(r => [r.budgetEur, r.actualEur])),
    1
  )

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">{t('budgetVsActual')}</h3>
      <div className="space-y-4">
        {categoryNames.map(name => (
          <div key={name} className="space-y-1">
            <p className="text-xs font-medium text-text-secondary">{name}</p>
            <div className="flex gap-6">
              {months.map(month => {
                const row = month.rows.find(r => r.category.name === name)
                const budgetPct = row ? (row.budgetEur / maxVal) * 100 : 0
                const actualPct = row ? (row.actualEur / maxVal) * 100 : 0
                return (
                  <div key={month.label} className="flex-1 space-y-1">
                    <p className="text-xs text-text-tertiary">{month.label}</p>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <div className="h-3 rounded-sm bg-accent-light" style={{ width: `${budgetPct}%`, minWidth: row?.hasBudget ? '2px' : '0' }} />
                        {row?.hasBudget && <span className="text-xs text-text-tertiary">{formatCurrency(row.budgetEur * reportingRate, reportingCurrency)}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-3 rounded-sm ${row && row.actualEur > row.budgetEur && row.hasBudget ? 'bg-status-danger' : 'bg-accent'}`}
                          style={{ width: `${actualPct}%`, minWidth: row?.actualEur ? '2px' : '0' }}
                        />
                        {row?.actualEur ? <span className="text-xs text-text-tertiary">{formatCurrency(row.actualEur * reportingRate, reportingCurrency)}</span> : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-sm bg-accent-light" /> {t('budgeted')}</div>
        <div className="flex items-center gap-1"><div className="h-2 w-4 rounded-sm bg-accent" /> {t('actual')}</div>
      </div>
    </div>
  )
}
