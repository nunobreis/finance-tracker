import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatMoney } from '@/lib/utils'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import type { NetWorthSnapshot } from '@/types/database'
import { getLocale, getTranslations } from 'next-intl/server'

type Props = {
  current: number
  snapshots: NetWorthSnapshot[]
  reportingCurrency: string
  reportingRate: number
}

function formatChange(
  current: number,
  previous: NetWorthSnapshot | undefined,
  reportingRate: number,
  reportingCurrency: string,
  locale: string
) {
  if (!previous) return null
  const change = current - Number(previous.total_eur)
  const pct = Number(previous.total_eur) > 0 ? (change / Number(previous.total_eur)) * 100 : 0
  const moneyStr = formatMoney(change * reportingRate, reportingCurrency, locale, {
    signDisplay: 'always',
  })
  const pctSign = pct >= 0 ? '+' : '−'
  return `${moneyStr} (${pctSign}${Math.abs(pct).toFixed(2)}%)`
}

export async function NetWorthSummary({ current, snapshots, reportingCurrency, reportingRate }: Props) {
  const t = await getTranslations('NetWorth')
  const locale = await getLocale()

  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const startOfYear = `${today.getFullYear()}-01-01`

  const snapshot30d = [...snapshots].reverse().find(s => s.snapshot_date <= thirtyDaysAgo)
  const snapshotYTD = snapshots.find(s => s.snapshot_date >= startOfYear)

  const change30d = formatChange(current, snapshot30d, reportingRate, reportingCurrency, locale)
  const changeYTD = formatChange(current, snapshotYTD, reportingRate, reportingCurrency, locale)

  return (
    <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
      <SummaryCard
        label={t('currentNetWorth')}
        value={formatMoney(current * reportingRate, reportingCurrency, locale)}
        icon={TrendingUp}
        accent
      />
      <SummaryCard
        label={t('change30d')}
        value={change30d ?? '—'}
        icon={Calendar}
      />
      <SummaryCard
        label={t('changeYTD')}
        value={changeYTD ?? '—'}
        icon={TrendingDown}
      />
    </div>
  )
}
