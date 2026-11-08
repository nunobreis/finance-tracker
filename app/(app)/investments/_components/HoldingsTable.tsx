'use client'

import { useTranslations, useLocale } from 'next-intl'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatMoney, cn } from '@/lib/utils'
import { AddHoldingDrawer } from './AddHoldingDrawer'
import { DeleteHoldingButton } from './DeleteHoldingButton'
import type { Holding, Account, AssetType } from '@/types/database'
import type { HoldingComputed } from '@/lib/holdings'

type HoldingRow = {
  holding: Holding
  computed: HoldingComputed
  latestPrice: number | null
  isStale: boolean
}

type Props = {
  rows: HoldingRow[]
  accounts: Account[]
  reportingCurrency: string
  reportingRate: number
}

export function HoldingsTable({
  rows,
  accounts,
  reportingCurrency,
  reportingRate,
}: Props) {
  const t = useTranslations('Investments')
  const tCommon = useTranslations('Common')
  const locale = useLocale()

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-separator bg-surface px-4 text-center text-body-sm text-text-muted">
        {t('noHoldings')}
      </div>
    )
  }

  const totalPortfolioEur = rows.reduce((s, r) => s + r.computed.value_eur, 0)

  return (
    <>
      {/* Mobile Card List (< lg) */}
      <div className="flex flex-col gap-3 lg:hidden">
        {rows.map(({ holding, computed, latestPrice, isStale }) => {
          const isPositive = computed.pnl_eur >= 0
          const pctSign = computed.pnl_pct >= 0 ? '+' : '−'
          const weightPct =
            totalPortfolioEur > 0
              ? Math.min((computed.value_eur / totalPortfolioEur) * 100, 100)
              : 0

          const badgeTint =
            holding.asset_type === 'crypto'
              ? 'bg-warning-tint text-warning-deep'
              : holding.asset_type === 'stock'
                ? 'bg-info-tint text-info'
                : 'bg-teal-tint text-teal'

          return (
            <div
              key={holding.id}
              className="flex flex-col gap-2.5 rounded-[16px] bg-canvas p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-label font-extrabold tracking-tight',
                      badgeTint
                    )}
                  >
                    {holding.symbol.slice(0, 4).toUpperCase()}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-body font-bold text-ink">
                        {holding.symbol}
                      </span>
                      <StatusBadge
                        label={t(`assetTypes.${holding.asset_type as AssetType}`)}
                        color="neutral"
                      />
                      {isStale && (
                        <StatusBadge label={tCommon('stale')} color="warn" />
                      )}
                    </div>
                    <span className="truncate text-caption text-text-secondary">
                      {holding.name ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-body font-bold text-ink tabular-nums">
                    {formatMoney(
                      computed.value_eur * reportingRate,
                      reportingCurrency,
                      locale
                    )}
                  </span>
                  {computed.cost_eur > 0 && (
                    <StatusBadge
                      label={`${pctSign}${Math.abs(computed.pnl_pct).toFixed(2)}%`}
                      color={isPositive ? 'good' : 'danger'}
                    />
                  )}
                </div>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-separator">
                <div
                  className="h-full rounded-full bg-teal transition-all"
                  style={{ width: `${weightPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-caption text-text-secondary">
                <span className="tabular-nums">
                  {t('sharesCount', {
                    qty: Number(holding.quantity).toLocaleString(),
                  })}
                  {latestPrice != null
                    ? ` · ${t('lastPriceLabel', {
                        price: formatMoney(latestPrice, holding.currency, locale),
                      })}`
                    : ''}
                </span>
                <div className="flex items-center gap-1">
                  <AddHoldingDrawer
                    accounts={accounts}
                    prefill={holding}
                    trigger="icon"
                  />
                  <DeleteHoldingButton holdingId={holding.id} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table (>= lg) */}
      <div className="hidden lg:block overflow-x-auto rounded-[20px] border border-separator/80 bg-surface shadow-xs">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-separator bg-canvas text-label font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-5 py-3.5 text-left">{t('symbol')}</th>
              <th className="px-5 py-3.5 text-left">{t('name')}</th>
              <th className="px-5 py-3.5 text-left">{t('type')}</th>
              <th className="px-5 py-3.5 text-left">{t('account')}</th>
              <th className="px-5 py-3.5 text-right">{t('quantity')}</th>
              <th className="px-5 py-3.5 text-right">{t('avgCost')}</th>
              <th className="px-5 py-3.5 text-right">{t('currentPrice')}</th>
              <th className="px-5 py-3.5 text-right">{t('value')}</th>
              <th className="px-5 py-3.5 text-right">{t('pnl')}</th>
              <th className="px-5 py-3.5 text-right">{t('pnlPct')}</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-separator-subtle">
            {rows.map(({ holding, computed, latestPrice, isStale }) => {
              const isPositive = computed.pnl_eur >= 0
              const pnlColor =
                computed.cost_eur > 0
                  ? isPositive
                    ? 'text-positive'
                    : 'text-negative'
                  : 'text-text-muted'
              const pctSign = computed.pnl_pct >= 0 ? '+' : '−'
              const account = accounts.find(a => a.id === holding.account_id)

              return (
                <tr key={holding.id} className="transition-colors hover:bg-row-hover">
                  <td className="px-5 py-3.5 font-bold text-ink">{holding.symbol}</td>
                  <td className="px-5 py-3.5 text-text-secondary">
                    {holding.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      label={t(`assetTypes.${holding.asset_type as AssetType}`)}
                      color="neutral"
                    />
                  </td>
                  <td className="px-5 py-3.5 text-text-secondary">
                    {account?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-ink tabular-nums">
                    {Number(holding.quantity).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right text-text-secondary tabular-nums">
                    {holding.avg_cost_basis != null
                      ? formatMoney(
                          Number(holding.avg_cost_basis),
                          holding.currency,
                          locale
                        )
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-ink tabular-nums">
                    <div className="inline-flex items-center gap-1.5">
                      <span>
                        {latestPrice != null
                          ? formatMoney(latestPrice, holding.currency, locale)
                          : '—'}
                      </span>
                      {isStale && (
                        <StatusBadge label={tCommon('stale')} color="warn" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ink tabular-nums">
                    {formatMoney(
                      computed.value_eur * reportingRate,
                      reportingCurrency,
                      locale
                    )}
                  </td>
                  <td
                    className={cn(
                      'px-5 py-3.5 text-right font-semibold tabular-nums',
                      pnlColor
                    )}
                  >
                    {computed.cost_eur > 0
                      ? formatMoney(
                          computed.pnl_eur * reportingRate,
                          reportingCurrency,
                          locale,
                          { signDisplay: isPositive ? 'always' : 'auto' }
                        )
                      : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-5 py-3.5 text-right font-semibold tabular-nums',
                      pnlColor
                    )}
                  >
                    {computed.cost_eur > 0
                      ? `${pctSign}${Math.abs(computed.pnl_pct).toFixed(2)}%`
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <AddHoldingDrawer
                        accounts={accounts}
                        prefill={holding}
                        trigger="icon"
                      />
                      <DeleteHoldingButton holdingId={holding.id} />
                    </div>
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
