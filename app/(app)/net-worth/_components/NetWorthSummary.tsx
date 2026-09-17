import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import type { NetWorthSnapshot } from '@/types/database'
import { getTranslations } from 'next-intl/server'

type Props = {
  current: number
  snapshots: NetWorthSnapshot[]
  reportingCurrency: string
  reportingRate: number
}

function formatChange(current: number, previous: NetWorthSnapshot | undefined, reportingRate: number, reportingCurrency: string) {
  if (!previous) return null
  const change = current - Number(previous.total_eur)
  const pct = Number(previous.total_eur) > 0 ? (change / Number(previous.total_eur)) * 100 : 0
  const sign = change >= 0 ? '+' : ''
  return `${sign}${formatCurrency(change * reportingRate, reportingCurrency)} (${sign}${pct.toFixed(2)}%)`
}

export async function NetWorthSummary({ current, snapshots, reportingCurrency, reportingRate }: Props) {
  const t = await getTranslations('NetWorth')

  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const startOfYear = `${today.getFullYear()}-01-01`

  const snapshot30d = [...snapshots].reverse().find(s => s.snapshot_date <= thirtyDaysAgo)
  const snapshotYTD = snapshots.find(s => s.snapshot_date >= startOfYear)

  const change30d = formatChange(current, snapshot30d, reportingRate, reportingCurrency)
  const changeYTD = formatChange(current, snapshotYTD, reportingRate, reportingCurrency)

  return (
    <div className="flex gap-4">
      <SummaryCard
        label={t('currentNetWorth')}
        value={formatCurrency(current * reportingRate, reportingCurrency)}
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
