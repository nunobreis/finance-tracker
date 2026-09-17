import { StatusBadge } from '@/components/ui/StatusBadge'
import { AddHoldingDrawer } from './AddHoldingDrawer'
import { DeleteHoldingButton } from './DeleteHoldingButton'
import type { Holding, Account } from '@/types/database'
import type { HoldingComputed } from '@/lib/holdings'

type HoldingRow = {
  holding: Holding
  computed: HoldingComputed
  latestPrice: number | null
  isStale: boolean
}

type Props = {
  rows: HoldingRow[]
  accounts: Account[]
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

export function HoldingsTable({ rows, accounts }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No holdings yet. Click &quot;Add holding&quot; to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-col bg-card-bg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 text-left">Symbol</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Avg cost</th>
            <th className="px-4 py-3 text-right">Price</th>
            <th className="px-4 py-3 text-right">Value (EUR)</th>
            <th className="px-4 py-3 text-right">P&amp;L (EUR)</th>
            <th className="px-4 py-3 text-right">P&amp;L %</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {rows.map(({ holding, computed, latestPrice, isStale }) => {
            const pnlPositive = computed.pnl_eur >= 0
            const pnlColor = computed.cost_eur > 0
              ? (pnlPositive ? 'text-status-good' : 'text-status-danger')
              : 'text-text-tertiary'
            const account = accounts.find(a => a.id === holding.account_id)

            return (
              <tr key={holding.id} className="hover:bg-content-bg">
                <td className="px-4 py-3 font-semibold text-text-primary">{holding.symbol}</td>
                <td className="px-4 py-3 text-text-secondary">{holding.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={holding.asset_type} color="neutral" />
                </td>
                <td className="px-4 py-3 text-right text-text-primary">{Number(holding.quantity).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {holding.avg_cost_basis != null
                    ? formatCurrency(Number(holding.avg_cost_basis), holding.currency)
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right text-text-primary">
                  <span>
                    {latestPrice != null
                      ? formatCurrency(latestPrice, holding.currency)
                      : '—'}
                  </span>
                  {isStale && <StatusBadge label="stale" color="warn" />}
                </td>
                <td className="px-4 py-3 text-right font-medium text-text-primary">
                  {new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(computed.value_eur)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${pnlColor}`}>
                  {computed.cost_eur > 0
                    ? `${computed.pnl_eur >= 0 ? '+' : ''}${new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(computed.pnl_eur)}`
                    : '—'}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${pnlColor}`}>
                  {computed.cost_eur > 0
                    ? `${computed.pnl_pct >= 0 ? '+' : ''}${computed.pnl_pct.toFixed(2)}%`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <AddHoldingDrawer accounts={accounts} prefill={holding} trigger="icon" />
                    <DeleteHoldingButton holdingId={holding.id} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
