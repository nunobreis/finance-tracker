'use client'

import { useTranslations, useLocale } from 'next-intl'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { resolveCategoryVisual, type IconTone } from '@/components/ui/TransactionRow'
import { formatMoney, cn } from '@/lib/utils'
import { AddBudgetDrawer } from './AddBudgetDrawer'
import type { BudgetRow } from '@/lib/budgets'
import type { Category } from '@/types/database'

type Props = {
  rows: BudgetRow[]
  categories: Category[]
  currentMonth: string
  reportingCurrency: string
  reportingRate: number
}

const toneClasses: Record<IconTone, string> = {
  emerald: 'bg-positive-tint text-positive',
  amber: 'bg-warning-tint text-warning-deep',
  blue: 'bg-info-tint text-info',
  purple: 'bg-purple-tint text-purple',
  teal: 'bg-teal-tint text-teal',
  rose: 'bg-negative-tint text-negative',
  slate: 'bg-surface text-text-secondary',
}

export function BudgetTable({
  rows,
  categories,
  currentMonth,
  reportingCurrency,
  reportingRate,
}: Props) {
  const t = useTranslations('Budgets')
  const locale = useLocale()

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-separator bg-surface text-body-sm text-text-muted">
        {t('noBudgets')}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Category Progress Cards (< lg) */}
      <div className="flex flex-col gap-3 lg:hidden">
        {rows.map(row => {
          const rawPct =
            row.hasBudget && row.budgetEur > 0
              ? (row.actualEur / row.budgetEur) * 100
              : 0
          const barPct = Math.min(rawPct, 100)
          const isOver = row.hasBudget && row.actualEur > row.budgetEur
          const diff = Math.abs(row.budgetEur - row.actualEur) * reportingRate
          const { icon: Icon, tone } = resolveCategoryVisual(
            row.category.name,
            row.category.kind
          )

          const subtitle = !row.hasBudget
            ? t('noBudgetSet')
            : isOver
              ? t('overBudgetByAmount', {
                  amount: formatMoney(diff, reportingCurrency, locale),
                })
              : t('leftAmount', {
                  amount: formatMoney(diff, reportingCurrency, locale),
                })

          const badgeLabel = !row.hasBudget
            ? t('noBudgetSet')
            : isOver
              ? t('pctOver', { pct: rawPct.toFixed(0) })
              : t('pctUsed', { pct: rawPct.toFixed(0) })

          const badgeColor: 'good' | 'danger' | 'neutral' | 'accent' = !row.hasBudget
            ? 'neutral'
            : isOver
              ? 'danger'
              : rawPct <= 50
                ? 'good'
                : 'accent'

          const barColor = isOver
            ? 'bg-negative'
            : rawPct <= 50
              ? 'bg-positive'
              : 'bg-teal'

          return (
            <div
              key={row.category.id}
              className="flex flex-col gap-2.5 rounded-[16px] bg-canvas p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      toneClasses[tone]
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-body font-bold text-ink">
                      {row.category.name}
                    </span>
                    <span
                      className={cn(
                        'truncate text-caption',
                        isOver ? 'font-medium text-negative' : 'text-text-secondary'
                      )}
                    >
                      {subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-body-sm font-bold text-ink tabular-nums">
                      {formatMoney(row.actualEur * reportingRate, reportingCurrency, locale)}
                      {row.hasBudget && (
                        <span className="font-normal text-text-secondary">
                          {' '}
                          / {formatMoney(row.budgetEur * reportingRate, reportingCurrency, locale)}
                        </span>
                      )}
                    </span>
                    <StatusBadge label={badgeLabel} color={badgeColor} />
                  </div>
                  <AddBudgetDrawer
                    categories={categories}
                    currentMonth={currentMonth}
                    prefillCategoryId={row.category.id}
                    prefillAmount={row.hasBudget ? row.budgetEur : undefined}
                    trigger="icon"
                  />
                </div>
              </div>

              {row.hasBudget && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-separator">
                  <div
                    className={cn('h-full rounded-full transition-all', barColor)}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop Table (>= lg) */}
      <div className="hidden lg:block overflow-hidden rounded-[20px] border border-separator/80 bg-surface shadow-xs">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-separator bg-canvas text-label font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-5 py-3.5 text-left">{t('category')}</th>
              <th className="px-5 py-3.5 text-right">{t('budgeted')}</th>
              <th className="px-5 py-3.5 text-right">{t('actual')}</th>
              <th className="w-44 px-5 py-3.5 text-left">{t('progress')}</th>
              <th className="px-5 py-3.5 text-right">{t('variance')}</th>
              <th className="px-5 py-3.5 text-left">{t('statusLabel')}</th>
              <th className="px-5 py-3.5 text-right">{t('editBudget')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator-subtle">
            {rows.map(row => {
              const rawPct =
                row.hasBudget && row.budgetEur > 0
                  ? (row.actualEur / row.budgetEur) * 100
                  : 0
              const barPct = Math.min(rawPct, 100)
              const isOver = row.hasBudget && row.actualEur > row.budgetEur
              const variance = Math.abs(row.varianceEur) * reportingRate
              const { icon: Icon, tone } = resolveCategoryVisual(
                row.category.name,
                row.category.kind
              )

              let statusLabel: string
              let statusColor: 'good' | 'danger' | 'neutral'
              if (!row.hasBudget) {
                statusLabel = t('noBudgetSet')
                statusColor = 'neutral'
              } else if (isOver) {
                statusLabel = t('overBudget')
                statusColor = 'danger'
              } else {
                statusLabel = t('onTrack')
                statusColor = 'good'
              }

              const barColor = isOver
                ? 'bg-negative'
                : rawPct <= 50
                  ? 'bg-positive'
                  : 'bg-teal'

              return (
                <tr key={row.category.id} className="transition-colors hover:bg-row-hover">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          toneClasses[tone]
                        )}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="font-semibold text-ink">{row.category.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-text-secondary tabular-nums">
                    {row.hasBudget
                      ? formatMoney(row.budgetEur * reportingRate, reportingCurrency, locale)
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ink tabular-nums">
                    {formatMoney(row.actualEur * reportingRate, reportingCurrency, locale)}
                  </td>
                  <td className="px-5 py-3.5">
                    {row.hasBudget && (
                      <div className="h-2 w-full overflow-hidden rounded-full bg-separator">
                        <div
                          className={cn('h-full rounded-full transition-all', barColor)}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td
                    className={cn(
                      'px-5 py-3.5 text-right text-caption font-semibold tabular-nums',
                      !row.hasBudget
                        ? 'text-text-muted'
                        : isOver
                          ? 'text-negative'
                          : 'text-positive'
                    )}
                  >
                    {row.hasBudget
                      ? formatMoney(
                          isOver ? -variance : variance,
                          reportingCurrency,
                          locale,
                          { signDisplay: isOver ? 'auto' : 'always' }
                        )
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={statusLabel} color={statusColor} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <AddBudgetDrawer
                      categories={categories}
                      currentMonth={currentMonth}
                      prefillCategoryId={row.category.id}
                      prefillAmount={row.hasBudget ? row.budgetEur : undefined}
                      trigger="icon"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
