'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { formatMoney, cn } from '@/lib/utils'

type Props = {
  spent: number
  budgeted: number
  reportingCurrency: string
  periodLabel?: string
}

export function SpendingCard({ spent, budgeted, reportingCurrency, periodLabel }: Props) {
  const t = useTranslations('Dashboard')
  const locale = useLocale()
  const hasBudget = budgeted > 0
  const pct = hasBudget ? Math.min((spent / budgeted) * 100, 100) : 0
  const overBudget = hasBudget && spent > budgeted
  const diff = Math.abs(budgeted - spent)

  return (
    <div className="flex flex-col gap-2.5 rounded-[16px] bg-canvas p-4 lg:gap-3.5 lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-6 lg:shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-caption font-semibold text-text-secondary lg:text-body lg:font-bold lg:text-ink">
          {t('spendingThisMonth')}
        </span>
        {periodLabel && (
          <span className="text-caption font-medium text-text-muted lg:font-semibold lg:text-text-secondary">
            {periodLabel}
          </span>
        )}
      </div>

      {!hasBudget ? (
        <div className="flex items-center justify-between py-2">
          <span className="text-body-sm font-medium text-text-secondary">
            {t('noBudgetSet')}
          </span>
          <Link
            href="/budgets"
            className="text-body-sm font-semibold text-teal hover:underline"
          >
            {t('setBudget')}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between lg:justify-start lg:gap-2">
            <span className="text-h1-sm font-extrabold text-ink tabular-nums lg:text-h1">
              {formatMoney(spent, reportingCurrency, locale)}
            </span>
            <span className="text-caption font-medium text-text-secondary tabular-nums">
              {t('ofBudget', { amount: formatMoney(budgeted, reportingCurrency, locale) })}
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-separator">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                overBudget ? 'bg-negative' : 'bg-teal'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-caption font-medium text-text-secondary">
              {t('ofMonthlyBudgetUsed', { pct: pct.toFixed(0) })}
            </p>
            <span
              className={cn(
                'hidden text-caption font-semibold tabular-nums lg:inline',
                overBudget ? 'text-negative' : 'text-positive'
              )}
            >
              {overBudget
                ? t('overBudgetBy', { amount: formatMoney(diff, reportingCurrency, locale) })
                : t('remainingBudget', { amount: formatMoney(diff, reportingCurrency, locale) })}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
