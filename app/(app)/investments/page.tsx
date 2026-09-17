import { createClient } from '@/lib/supabase/server'
import { refreshPricesIfStale } from '@/lib/prices'
import { computeHoldingValue } from '@/lib/holdings'
import { getRate } from '@/lib/exchange-rates'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { PageHeader } from '@/components/layout/PageHeader'
import { InvestmentsSummary } from './_components/InvestmentsSummary'
import { HoldingsTable } from './_components/HoldingsTable'
import { AddHoldingDrawer } from './_components/AddHoldingDrawer'
import { RefreshPricesButton } from './_components/RefreshPricesButton'
import { getTranslations } from 'next-intl/server'

export default async function InvestmentsPage() {
  const supabase = await createClient()
  const t = await getTranslations('Investments')
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

  const { data: accounts } = await supabase.from('accounts').select('*').eq('is_active', true)
  const accountList = accounts ?? []

  const lastRefreshedDate = priceRows
    .map(p => p.priceRow?.price_date)
    .filter(Boolean)
    .sort()
    .at(-1)

  return (
    <div className="flex flex-col">
      <PageHeader title={t('title')} actions={<AddHoldingDrawer accounts={accountList} />} />
      <div className="flex flex-col gap-6 p-6">
        <InvestmentsSummary rows={tableRows.map(r => r.computed)} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            {lastRefreshedDate ? t('pricesAsOf', { date: lastRefreshedDate }) : t('noPricesYet')}
          </p>
          <RefreshPricesButton />
        </div>
        <HoldingsTable rows={tableRows} accounts={accountList} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
      </div>
    </div>
  )
}
