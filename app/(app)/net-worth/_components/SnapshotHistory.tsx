import { formatEur } from '@/lib/utils'
import type { NetWorthSnapshot } from '@/types/database'

type Props = { snapshots: NetWorthSnapshot[] }

export function SnapshotHistory({ snapshots }: Props) {
  const sorted = [...snapshots].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date))

  return (
    <details className="rounded-xl border border-border-col bg-card-bg overflow-hidden">
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-text-primary select-none hover:bg-content-bg">
        Snapshot history ({sorted.length})
      </summary>
      <table className="w-full text-sm border-t border-border-col">
        <thead>
          <tr className="bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-5 py-3 text-left">Date</th>
            <th className="px-5 py-3 text-right">Net Worth (EUR)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {sorted.map(s => (
            <tr key={s.id}>
              <td className="px-5 py-3 text-text-secondary">{s.snapshot_date}</td>
              <td className="px-5 py-3 text-right font-medium text-text-primary">{formatEur(Number(s.total_eur))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
