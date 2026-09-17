import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Account } from '@/types/database'

type Props = {
  account: Account
  balance: number
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking:    'Checking',
  savings:     'Savings',
  credit_card: 'Credit card',
  cash:        'Cash',
  investment:  'Investment',
}

function formatBalance(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function AccountCard({ account, balance }: Props) {
  const initial = (account.institution ?? account.name).charAt(0).toUpperCase()

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-col bg-card-bg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="font-medium text-text-primary">{account.name}</p>
            {account.institution && (
              <p className="text-xs text-text-tertiary">{account.institution}</p>
            )}
          </div>
        </div>
        <span className="rounded-full bg-content-bg px-2.5 py-0.5 text-xs text-text-secondary">
          {ACCOUNT_TYPE_LABELS[account.account_type]}
        </span>
      </div>

      <div>
        <p className="text-xs text-text-secondary">Balance</p>
        <p className="text-2xl font-semibold text-text-primary">
          {formatBalance(balance, account.currency)}
        </p>
      </div>

      <Link
        href={`/transactions/import?account=${account.id}`}
        className="flex items-center gap-1 text-xs text-accent hover:underline"
      >
        Import CSV <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}
