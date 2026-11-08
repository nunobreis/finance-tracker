'use client'

import { useTranslations, useLocale } from 'next-intl'
import { formatMoney, cn } from '@/lib/utils'
import { getCategoryDisplayName } from '@/lib/categories-utils'
import type { BudgetRow } from '@/lib/budgets'

type MonthData = {
  label: string
  rows: BudgetRow[]
}

type Props = {
  months: MonthData[]
  reportingCurrency: string
  reportingRate: number
}

export function BudgetVarianceWidget({
  months,
  reportingCurrency,
  reportingRate,
}: Props) {
  const t = useTranslations('Budgets')
  const tCat = useTranslations('Categories')
  const locale = useLocale()

  if (months.every(m => m.rows.length === 0)) return null

  const categoryNames = Array.from(
    new Set(months.flatMap(m => m.rows.map(r => r.category.name)))
  )

  const maxVal = Math.max(
    ...months.flatMap(m => m.rows.flatMap(r => [r.budgetEur, r.actualEur])),
    1
  )

  return (
    <div className="rounded-[16px] bg-canvas p-4 lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-6 lg:shadow-xs">
      <h3 className="mb-4 text-body font-bold text-ink">{t('budgetVsActual')}</h3>
      <div className="space-y-4">
        {categoryNames.map(name => (
          <div key={name} className="space-y-1.5">
            <p className="text-caption font-semibold text-ink">{getCategoryDisplayName({ name }, tCat)}</p>
            <div className="grid grid-cols-3 gap-4">
              {months.map(month => {
                const row = month.rows.find(r => r.category.name === name)
                const budgetPct = row ? (row.budgetEur / maxVal) * 100 : 0
                const actualPct = row ? (row.actualEur / maxVal) * 100 : 0
                const isOver =
                  row && row.actualEur > row.budgetEur && row.hasBudget
                return (
                  <div key={month.label} className="space-y-1">
                    <p className="text-label font-medium text-text-muted">
                      {month.label}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2.5 rounded-xs bg-teal-tint"
                          style={{
                            width: `${budgetPct}%`,
                            minWidth: row?.hasBudget ? '4px' : '0',
                          }}
                        />
                        {row?.hasBudget && (
                          <span className="text-label text-text-secondary tabular-nums">
                            {formatMoney(
                              row.budgetEur * reportingRate,
                              reportingCurrency,
                              locale
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            'h-2.5 rounded-xs',
                            isOver ? 'bg-negative' : 'bg-teal'
                          )}
                          style={{
                            width: `${actualPct}%`,
                            minWidth: row?.actualEur ? '4px' : '0',
                          }}
                        />
                        {row?.actualEur ? (
                          <span className="text-label text-text-secondary tabular-nums">
                            {formatMoney(
                              row.actualEur * reportingRate,
                              reportingCurrency,
                              locale
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-caption text-text-secondary">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-4 rounded-xs bg-teal-tint" /> {t('budgeted')}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-4 rounded-xs bg-teal" /> {t('actual')}
        </div>
      </div>
    </div>
  )
}
