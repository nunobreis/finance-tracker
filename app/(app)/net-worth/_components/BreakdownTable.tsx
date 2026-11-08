import { formatMoney } from '@/lib/utils'
import type { NetWorthBreakdown } from '@/lib/net-worth'
import { Landmark, TrendingUp } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

type Props = {
  breakdown: NetWorthBreakdown
  total_eur: number
  reportingCurrency: string
  reportingRate: number
}

export async function BreakdownTable({ breakdown, total_eur, reportingCurrency, reportingRate }: Props) {
  const t = await getTranslations('NetWorth')
  const locale = await getLocale()

  const cashEur = breakdown.accounts.reduce((sum, a) => sum + a.balance_eur, 0)
  const holdingsEur = breakdown.holdings.reduce((sum, h) => sum + h.value_eur, 0)
  const positiveTotal = Math.max(total_eur, 0)
  const cashPct = positiveTotal > 0 ? Math.min(100, Math.max(0, (cashEur / positiveTotal) * 100)) : 0
  const holdingsPct =
    positiveTotal > 0 ? Math.min(100, Math.max(0, (holdingsEur / positiveTotal) * 100)) : 0

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body font-bold text-ink lg:text-h2">
          {t('todaysBreakdown')}
        </h3>
      </div>

      {/* Allocation summary cards (Mobile & Desktop) */}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-4">
        <div className="flex flex-col gap-3 rounded-[16px] bg-canvas p-4 lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-5 lg:shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-tint text-teal">
                <Landmark size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-body-sm font-bold text-ink">
                  {t('cashAndBankAccounts')}
                </p>
                <p className="truncate text-caption text-text-secondary">
                  {t('cashSubtitle', { pct: cashPct.toFixed(1) })}
                </p>
              </div>
            </div>
            <p className="shrink-0 text-body-sm font-bold tabular-nums text-ink">
              {formatMoney(cashEur * reportingRate, reportingCurrency, locale)}
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-separator">
            <div
              className="h-full rounded-full bg-teal transition-all"
              style={{ width: `${cashPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[16px] bg-canvas p-4 lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-5 lg:shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-tint text-info">
                <TrendingUp size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-body-sm font-bold text-ink">
                  {t('investmentsAndHoldings')}
                </p>
                <p className="truncate text-caption text-text-secondary">
                  {t('investmentsSubtitle', { pct: holdingsPct.toFixed(1) })}
                </p>
              </div>
            </div>
            <p className="shrink-0 text-body-sm font-bold tabular-nums text-ink">
              {formatMoney(holdingsEur * reportingRate, reportingCurrency, locale)}
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-separator">
            <div
              className="h-full rounded-full bg-info transition-all"
              style={{ width: `${holdingsPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Detailed breakdown table on desktop */}
      <div className="hidden overflow-hidden rounded-[20px] border border-separator/80 bg-surface shadow-xs lg:block">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-separator bg-canvas/60 text-label font-semibold uppercase tracking-wide text-text-secondary">
              <th className="px-6 py-3.5 text-left">{t('name')}</th>
              <th className="px-6 py-3.5 text-right">{t('nativeBalance')}</th>
              <th className="px-6 py-3.5 text-right">{t('currencyEquivalent', { currency: reportingCurrency })}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-separator">
            {breakdown.accounts.length > 0 && (
              <tr className="bg-canvas/40">
                <td colSpan={3} className="px-6 py-2 text-label font-semibold uppercase tracking-wide text-text-secondary">
                  {t('accountsSection')}
                </td>
              </tr>
            )}
            {breakdown.accounts.map((a) => (
              <tr key={a.id} className="hover:bg-row-hover transition-colors">
                <td className="px-6 py-3.5 font-semibold text-ink">{a.name}</td>
                <td className="px-6 py-3.5 text-right tabular-nums text-text-secondary">
                  {formatMoney(a.balance_native, a.currency, locale)}
                </td>
                <td className="px-6 py-3.5 text-right font-bold tabular-nums text-ink">
                  {formatMoney(a.balance_eur * reportingRate, reportingCurrency, locale)}
                </td>
              </tr>
            ))}
            {breakdown.holdings.length > 0 && (
              <tr className="bg-canvas/40">
                <td colSpan={3} className="px-6 py-2 text-label font-semibold uppercase tracking-wide text-text-secondary">
                  {t('holdingsSection')}
                </td>
              </tr>
            )}
            {breakdown.holdings.map((h) => (
              <tr key={h.id} className="hover:bg-row-hover transition-colors">
                <td className="px-6 py-3.5 font-semibold text-ink">{h.symbol}</td>
                <td className="px-6 py-3.5 text-right tabular-nums text-text-secondary">
                  {formatMoney(h.value_native, h.currency, locale)}
                </td>
                <td className="px-6 py-3.5 text-right font-bold tabular-nums text-ink">
                  {formatMoney(h.value_eur * reportingRate, reportingCurrency, locale)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-separator bg-canvas/60">
              <td className="px-6 py-4 font-bold text-ink" colSpan={2}>{t('total')}</td>
              <td className="px-6 py-4 text-right text-h2 font-extrabold tabular-nums text-ink">
                {formatMoney(total_eur * reportingRate, reportingCurrency, locale)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
