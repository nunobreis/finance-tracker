import { Wallet, Hash, Calendar } from 'lucide-react'
import { SummaryCard } from '@/components/ui/SummaryCard'
import { formatEur, formatDate } from '@/lib/utils'
import type { Account } from '@/types/database'

type Props = {
  accounts: Account[]
  balances: Record<string, number>  // account.id → balance in native currency
  gbpToEur: number
}

export function AccountsSummary({ accounts, balances, gbpToEur }: Props) {
  const netWorthEur = accounts.reduce((sum, a) => {
    const balance = balances[a.id] ?? 0
    const rate = a.currency === 'EUR' ? 1 : gbpToEur
    return sum + balance * rate
  }, 0)

  return (
    <div className="flex gap-4">
      <SummaryCard
        label="Net Worth"
        value={formatEur(netWorthEur)}
        icon={Wallet}
        accent
      />
      <SummaryCard
        label="Accounts"
        value={String(accounts.length)}
        icon={Hash}
      />
      <SummaryCard
        label="Today"
        value={formatDate(new Date())}
        icon={Calendar}
      />
    </div>
  )
}
