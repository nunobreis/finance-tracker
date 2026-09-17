import { formatCurrency } from '@/lib/utils'
import type { NetWorthBreakdown } from '@/lib/net-worth'
import { getTranslations } from 'next-intl/server'

type Props = {
  breakdown: NetWorthBreakdown
  total_eur: number
  reportingCurrency: string
  reportingRate: number
}

export async function BreakdownTable({ breakdown, total_eur, reportingCurrency, reportingRate }: Props) {
  const t = await getTranslations('NetWorth')

  return (
    <div className="rounded-xl border border-border-col bg-card-bg overflow-hidden">
      <div className="border-b border-border-col px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">{t('todaysBreakdown')}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-5 py-3 text-left">{t('name')}</th>
            <th className="px-5 py-3 text-right">{t('nativeBalance')}</th>
            <th className="px-5 py-3 text-right">{t('currencyEquivalent', { currency: reportingCurrency })}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {breakdown.accounts.length > 0 && (
            <tr className="bg-content-bg">
              <td colSpan={3} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">{t('accountsSection')}</td>
            </tr>
          )}
          {breakdown.accounts.map(a => (
            <tr key={a.id}>
              <td className="px-5 py-3 text-text-primary">{a.name}</td>
              <td className="px-5 py-3 text-right text-text-secondary">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: a.currency }).format(a.balance_native)}
              </td>
              <td className="px-5 py-3 text-right font-medium text-text-primary">{formatCurrency(a.balance_eur * reportingRate, reportingCurrency)}</td>
            </tr>
          ))}
          {breakdown.holdings.length > 0 && (
            <tr className="bg-content-bg">
              <td colSpan={3} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">{t('holdingsSection')}</td>
            </tr>
          )}
          {breakdown.holdings.map(h => (
            <tr key={h.id}>
              <td className="px-5 py-3 text-text-primary">{h.symbol}</td>
              <td className="px-5 py-3 text-right text-text-secondary">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: h.currency }).format(h.value_native)}
              </td>
              <td className="px-5 py-3 text-right font-medium text-text-primary">{formatCurrency(h.value_eur * reportingRate, reportingCurrency)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-border-col bg-content-bg">
            <td className="px-5 py-3 font-semibold text-text-primary" colSpan={2}>{t('total')}</td>
            <td className="px-5 py-3 text-right text-xl font-bold text-text-primary">{formatCurrency(total_eur * reportingRate, reportingCurrency)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
