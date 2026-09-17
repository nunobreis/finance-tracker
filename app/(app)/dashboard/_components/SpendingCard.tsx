import { formatEur } from '@/lib/utils'

type Props = { spent: number; budgeted: number }

export function SpendingCard({ spent, budgeted }: Props) {
  const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0
  const overBudget = budgeted > 0 && spent > budgeted

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border-col bg-card-bg p-5">
      <span className="text-sm font-medium text-text-secondary">Spending this month</span>
      <div>
        <span className="text-2xl font-semibold text-text-primary">{formatEur(spent)}</span>
        <span className="ml-2 text-sm text-text-tertiary">/ {formatEur(budgeted)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-content-bg">
        <div
          className={`h-full rounded-full transition-all ${overBudget ? 'bg-status-danger' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-text-tertiary">{pct.toFixed(0)}% of budget used</p>
    </div>
  )
}
