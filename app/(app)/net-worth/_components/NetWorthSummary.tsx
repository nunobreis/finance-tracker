import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import type { NetWorthSnapshot } from '@/types/database'

type Props = {
  current: number
  snapshots: NetWorthSnapshot[]
}

function formatChange(current: number, previous: NetWorthSnapshot | undefined) {
  if (!previous) return null
  const change = current - Number(previous.total_eur)
  const pct = Number(previous.total_eur) > 0 ? (change / Number(previous.total_eur)) * 100 : 0
  const sign = change >= 0 ? '+' : ''
  return `${sign}${formatEur(change)} (${sign}${pct.toFixed(2)}%)`
}

export function NetWorthSummary({ current, snapshots }: Props) {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const startOfYear = `${today.getFullYear()}-01-01`

  const snapshot30d = [...snapshots].reverse().find(s => s.snapshot_date <= thirtyDaysAgo)
  const snapshotYTD = snapshots.find(s => s.snapshot_date >= startOfYear)

  const change30d = formatChange(current, snapshot30d)
  const changeYTD = formatChange(current, snapshotYTD)

  return (
    <div className="flex gap-4">
      <SummaryCard
        label="Current net worth"
        value={formatEur(current)}
        icon={TrendingUp}
        accent
      />
      <SummaryCard
        label="Change (30 days)"
        value={change30d ?? '—'}
        icon={Calendar}
      />
      <SummaryCard
        label="Change (this year)"
        value={changeYTD ?? '—'}
        icon={TrendingDown}
      />
    </div>
  )
}
