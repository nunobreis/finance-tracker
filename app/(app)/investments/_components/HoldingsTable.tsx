'use client'

import { StatusBadge } from '@/components/ui/StatusBadge'
import { AddHoldingDrawer } from './AddHoldingDrawer'
import { DeleteHoldingButton } from './DeleteHoldingButton'
import { useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/utils'
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

function formatNativeCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

export function HoldingsTable({ rows, accounts, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('Investments')
  const tCommon = useTranslations('Common')

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        {t('noHoldings')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-col bg-card-bg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 text-left">{t('symbol')}</th>
            <th className="px-4 py-3 text-left">{t('name')}</th>
            <th className="px-4 py-3 text-left">{t('type')}</th>
            <th className="px-4 py-3 text-left">{t('account')}</th>
            <th className="px-4 py-3 text-right">{t('quantity')}</th>
            <th className="px-4 py-3 text-right">{t('avgCost')}</th>
            <th className="px-4 py-3 text-right">{t('currentPrice')}</th>
            <th className="px-4 py-3 text-right">{t('value')}</th>
            <th className="px-4 py-3 text-right">{t('pnl')}</th>
            <th className="px-4 py-3 text-right">{t('pnlPct')}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {rows.map(({ holding, computed, latestPrice, isStale }) => {
            const pnlColor = computed.cost_eur > 0
              ? (computed.pnl_eur >= 0 ? 'text-status-good' : 'text-status-danger')
              : 'text-text-tertiary'
            const account = accounts.find(a => a.id === holding.account_id)

            return (
              <tr key={holding.id} className="hover:bg-content-bg">
                <td className="px-4 py-3 font-semibold text-text-primary">{holding.symbol}</td>
                <td className="px-4 py-3 text-text-secondary">{holding.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={t(`assetTypes.${holding.asset_type as AssetType}`)} color="neutral" />
                </td>
                <td className="px-4 py-3 text-text-secondary">{account?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right text-text-primary">{Number(holding.quantity).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {holding.avg_cost_basis != null
                    ? formatNativeCurrency(Number(holding.avg_cost_basis), holding.currency)
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right text-text-primary">
                  <span>
                    {latestPrice != null
                      ? formatNativeCurrency(latestPrice, holding.currency)
                      : '—'}
                  </span>
                  {isStale && <StatusBadge label={tCommon('stale')} color="warn" />}
                </td>
                <td className="px-4 py-3 text-right font-medium text-text-primary">
                  {formatCurrency(computed.value_eur * reportingRate, reportingCurrency)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${pnlColor}`}>
                  {computed.cost_eur > 0
                    ? `${computed.pnl_eur >= 0 ? '+' : ''}${formatCurrency(computed.pnl_eur * reportingRate, reportingCurrency)}`
                    : '—'}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${pnlColor}`}>
                  {computed.cost_eur > 0
                    ? `${computed.pnl_pct >= 0 ? '+' : ''}${computed.pnl_pct.toFixed(2)}%`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <AddHoldingDrawer accounts={accounts} prefill={holding} trigger="icon" />
                    <DeleteHoldingButton holdingId={holding.id} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
