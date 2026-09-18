import { createClient } from '@/lib/supabase/server'
import { computeNetWorth } from '@/lib/net-worth'
import { getReportingCurrency, getReportingRate } from '@/lib/reporting-currency'
import { PageHeader } from '@/components/layout/PageHeader'
import { NetWorthSummary } from './_components/NetWorthSummary'
import { NetWorthChart } from './_components/NetWorthChart'
import { BreakdownTable } from './_components/BreakdownTable'
import { SnapshotHistory } from './_components/SnapshotHistory'
import { AsOfPicker } from '@/components/ui/AsOfPicker'
import { getTranslations } from 'next-intl/server'

type SearchParams = Promise<{ asOf?: string }>

export default async function NetWorthPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const asOf = params.asOf ?? today

  const supabase = await createClient()
  const t = await getTranslations('NetWorth')
  const reportingCurrency = await getReportingCurrency()
  const reportingRate = await getReportingRate(reportingCurrency)

  // computeNetWorth with optional asOf date — only upserts snapshot when viewing today
  const netWorth = await computeNetWorth(supabase, asOf === today ? undefined : asOf)

  const { data: snapshotData } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: true })

  const snapshots = snapshotData ?? []

  return (
    <div className="flex flex-col">
      <PageHeader title={t('title')} />
      <div className="flex flex-col gap-6 p-6">
        <AsOfPicker asOf={asOf} />
        <NetWorthSummary current={netWorth.total_eur} snapshots={snapshots} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <NetWorthChart snapshots={snapshots} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <BreakdownTable breakdown={netWorth.breakdown} total_eur={netWorth.total_eur} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
        <SnapshotHistory snapshots={snapshots} reportingCurrency={reportingCurrency} reportingRate={reportingRate} />
      </div>
    </div>
  )
}
