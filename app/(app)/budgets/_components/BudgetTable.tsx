import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatEur } from '@/lib/utils'
import { AddBudgetDrawer } from './AddBudgetDrawer'
import type { BudgetRow } from '@/lib/budgets'
import type { Category } from '@/types/database'

type Props = {
  rows: BudgetRow[]
  categories: Category[]
  currentMonth: string
}

export function BudgetTable({ rows, categories, currentMonth }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No budgets set for this month. Click &ldquo;Set budget&rdquo; to get started.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-col bg-card-bg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-col bg-content-bg text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-right">Budgeted</th>
            <th className="px-4 py-3 text-right">Spent</th>
            <th className="px-4 py-3 text-left w-40">Progress</th>
            <th className="px-4 py-3 text-right">Over / Under</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Edit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-col">
          {rows.map(row => {
            const pct = row.hasBudget && row.budgetEur > 0
              ? Math.min(row.actualEur / row.budgetEur, 1)
              : 0
            const isOver = row.hasBudget && row.actualEur > row.budgetEur
            const variance = Math.abs(row.varianceEur)

            let statusLabel: string
            let statusColor: 'good' | 'danger' | 'neutral'
            if (!row.hasBudget) { statusLabel = 'No budget'; statusColor = 'neutral' }
            else if (isOver)    { statusLabel = 'Over budget'; statusColor = 'danger' }
            else                { statusLabel = 'On track'; statusColor = 'good' }

            return (
              <tr key={row.category.id} className="hover:bg-content-bg">
                <td className="px-4 py-3 font-medium text-text-primary">{row.category.name}</td>
                <td className="px-4 py-3 text-right text-text-secondary tabular-nums">
                  {row.hasBudget ? formatEur(row.budgetEur) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-text-primary tabular-nums">
                  {formatEur(row.actualEur)}
                </td>
                <td className="px-4 py-3">
                  {row.hasBudget && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-content-bg">
                      <div
                        className={`h-full rounded-full ${isOver ? 'bg-status-danger' : 'bg-accent'}`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  )}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums text-xs font-medium ${isOver ? 'text-status-danger' : 'text-status-good'}`}>
                  {row.hasBudget ? `${isOver ? '+' : '-'}${formatEur(variance)}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={statusLabel} color={statusColor} />
                </td>
                <td className="px-4 py-3">
                  <AddBudgetDrawer
                    categories={categories}
                    currentMonth={currentMonth}
                    prefillCategoryId={row.category.id}
                    prefillAmount={row.hasBudget ? row.budgetEur : undefined}
                    trigger="icon"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
