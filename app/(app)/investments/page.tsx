import { createClient } from '@/lib/supabase/server'
import { refreshPricesIfStale } from '@/lib/prices'
import { computeHoldingValue } from '@/lib/holdings'
import { getRate } from '@/lib/exchange-rates'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { ScreenHero } from '@/components/layout/ScreenHero'
import { WealthNav } from '@/components/layout/WealthNav'
import { InvestmentsSummary } from './_components/InvestmentsSummary'
import { HoldingsTable } from './_components/HoldingsTable'
import { AddHoldingDrawer } from './_components/AddHoldingDrawer'
import { RefreshPricesButton } from './_components/RefreshPricesButton'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatMoney, formatDate } from '@/lib/utils'

export default async function InvestmentsPage() {
  const supabase = await createClient()
  const t = await getTranslations('Investments')
  const locale = await getLocale()
  const reportingCurrency = await getReportingCurrency()
  const reportingRate = await getReportingRate(reportingCurrency)

  const { data: holdings } = await supabase.from('holdings').select('*')
  const holdingList = holdings ?? []

  // Auto-refresh stale prices on page load
  await refreshPricesIfStale(supabase, holdingList)

  // Fetch latest price for each holding
  const today = new Date().toISOString().split('T')[0]
  const priceRows = await Promise.all(
    holdingList.map(async h => {
      const { data } = await supabase
        .from('holding_price_history')
        .select('price, price_date')
        .eq('holding_id', h.id)
        .order('price_date', { ascending: false })
        .limit(1)
        .single()
      return { holdingId: h.id, priceRow: data }
    })
  )
  const priceMap = Object.fromEntries(
    priceRows.map(({ holdingId, priceRow }) => [holdingId, priceRow])
  )

  // Get EUR rates for all unique currencies
  const currencies = new Set(holdingList.map(h => h.currency))
  const rateMap: Record<string, number> = { EUR: 1 }
  for (const currency of currencies) {
    if (currency !== 'EUR') {
      rateMap[currency] = await getRate(currency, 'EUR')
    }
  }

  const tableRows = holdingList.map(holding => {
    const priceData = priceMap[holding.id]
    const latestPrice = priceData ? Number(priceData.price) : null
    const isStale = !priceData || priceData.price_date < today
    const eurRate = rateMap[holding.currency] ?? 1
    const computed = computeHoldingValue(
      Number(holding.quantity),
      latestPrice ?? 0,
      holding.avg_cost_basis != null ? Number(holding.avg_cost_basis) : null,
      eurRate
    )
    return { holding, computed, latestPrice, isStale }
  })

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
  const accountList = accounts ?? []

  const lastRefreshedDate = priceRows
    .map(p => p.priceRow?.price_date)
    .filter(Boolean)
    .sort()
    .at(-1)

  const totalValueEur = tableRows.reduce((s, r) => s + r.computed.value_eur, 0)
  const totalCostEur = tableRows.reduce((s, r) => s + r.computed.cost_eur, 0)
  const totalPnlEur = tableRows.reduce((s, r) => s + r.computed.pnl_eur, 0)
  const totalPnlPct = totalCostEur > 0 ? (totalPnlEur / totalCostEur) * 100 : 0
  const pctSign = totalPnlPct >= 0 ? '+' : '−'

  const priceStatusText = lastRefreshedDate
    ? t('pricesAsOf', { date: formatDate(lastRefreshedDate, locale) })
    : t('noPricesYet')

  return (
    <ScreenHero
      title={t('title')}
      subNav={<WealthNav />}
      eyebrow={t('portfolioValueIn', { currency: reportingCurrency })}
      metric={formatMoney(
        totalValueEur * reportingRate,
        reportingCurrency,
        locale
      )}
      subtitle={`${t('totalReturnSubtitle', {
        pnl: formatMoney(
          totalPnlEur * reportingRate,
          reportingCurrency,
          locale,
          { signDisplay: totalPnlEur > 0 ? 'always' : 'auto' }
        ),
        pct: `${pctSign}${Math.abs(totalPnlPct).toFixed(1)}`,
      })} · ${priceStatusText}`}
      mobileActions={<RefreshPricesButton variant="glass" />}
      desktopActions={
        <>
          <RefreshPricesButton />
          <AddHoldingDrawer accounts={accountList} />
        </>
      }
    >
      <div className="hidden lg:block">
        <InvestmentsSummary
          rows={tableRows.map(r => r.computed)}
          reportingCurrency={reportingCurrency}
          reportingRate={reportingRate}
        />
      </div>

      <div className="flex items-center justify-between gap-2 lg:hidden">
        <h2 className="text-body font-bold text-ink">
          {t('title')} ({tableRows.length})
        </h2>
        <AddHoldingDrawer accounts={accountList} />
      </div>

      <HoldingsTable
        rows={tableRows}
        accounts={accountList}
        reportingCurrency={reportingCurrency}
        reportingRate={reportingRate}
      />
    </ScreenHero>
  )
}
