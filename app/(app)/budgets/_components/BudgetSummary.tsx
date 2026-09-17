import { Target, TrendingDown, PiggyBank } from 'lucide-react'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur } from '@/lib/utils'
import type { BudgetRow } from '@/lib/budgets'

type Props = { rows: BudgetRow[] }

export function BudgetSummary({ rows }: Props) {
  const totalBudgeted = rows.filter(r => r.hasBudget).reduce((s, r) => s + r.budgetEur, 0)
  const totalSpent = rows.reduce((s, r) => s + r.actualEur, 0)
  const remaining = totalBudgeted - totalSpent

  return (
    <div className="flex gap-4">
      <SummaryCard label="Total budgeted" value={formatEur(totalBudgeted)} icon={Target} accent />
      <SummaryCard label="Total spent"    value={formatEur(totalSpent)}    icon={TrendingDown} />
      <SummaryCard label="Remaining"      value={formatEur(remaining)}     icon={PiggyBank} />
    </div>
  )
}
