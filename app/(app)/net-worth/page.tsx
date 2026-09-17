import { createClient } from '@/lib/supabase/server'
import { computeNetWorth } from '@/lib/net-worth'
import { PageHeader } from '@/components/layout/PageHeader'
import { NetWorthSummary } from './_components/NetWorthSummary'
import { NetWorthChart } from './_components/NetWorthChart'
import { BreakdownTable } from './_components/BreakdownTable'
import { SnapshotHistory } from './_components/SnapshotHistory'

export default async function NetWorthPage() {
  const supabase = await createClient()

  // computeNetWorth upserts today's snapshot first — fetch snapshots after so today's point appears in the chart
  const netWorth = await computeNetWorth(supabase)
  const { data: snapshotData } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: true })

  const snapshots = snapshotData ?? []

  return (
    <div className="flex flex-col">
      <PageHeader title="Net Worth" />
      <div className="flex flex-col gap-6 p-6">
        <NetWorthSummary current={netWorth.total_eur} snapshots={snapshots} />
        <NetWorthChart snapshots={snapshots} />
        <BreakdownTable breakdown={netWorth.breakdown} total_eur={netWorth.total_eur} />
        <SnapshotHistory snapshots={snapshots} />
      </div>
    </div>
  )
}
