import { createClient } from '@/lib/supabase/server'
import { computeNetWorth } from '@/lib/net-worth'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { PageHeader } from '@/components/layout/PageHeader'
import { NetWorthSummary } from './_components/NetWorthSummary'
import { NetWorthChart } from './_components/NetWorthChart'
import { BreakdownTable } from './_components/BreakdownTable'
import { SnapshotHistory } from './_components/SnapshotHistory'
import { getTranslations } from 'next-intl/server'

export default async function NetWorthPage() {
  const supabase = await createClient()
  const t = await getTranslations('NetWorth')
  const reportingCurrency = await getReportingCurrency()
  const reportingRate = await getReportingRate(reportingCurrency)

  // computeNetWorth upserts today's snapshot first — fetch snapshots after so today's point appears in the chart
  const netWorth = await computeNetWorth(supabase)
  const { data: snapshotData } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: true })

  const snapshots = snapshotData ?? []

  return (
    <div className="flex flex-col">
      <PageHeader title={t('title')} />
      <div className="flex flex-col gap-6 p-6">
        <NetWorthSummary current={netWorth.total_eur} snapshots={snapshots} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <NetWorthChart snapshots={snapshots} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <BreakdownTable breakdown={netWorth.breakdown} total_eur={netWorth.total_eur} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <SnapshotHistory snapshots={snapshots} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
      </div>
    </div>
  )
}
