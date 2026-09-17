'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import type { Account, Category } from '@/types/database'

type Props = {
  accounts: Account[]
  categories: Category[]
  currentAccount: string
  currentCategory: string
  currentFrom: string
  currentTo: string
}

export function TransactionFilters({ accounts, categories, currentAccount, currentCategory, currentFrom, currentTo }: Props) {
  const t = useTranslations('Transactions')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [searchParams, pathname, router])

  const setMonth = useCallback((offset: number) => {
    const from = new Date(currentFrom)
    from.setMonth(from.getMonth() + offset)
    const year = from.getFullYear()
    const month = String(from.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(year, from.getMonth() + 1, 0).getDate()
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', `${year}-${month}-01`)
    params.set('to', `${year}-${month}-${String(lastDay).padStart(2, '0')}`)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [currentFrom, searchParams, pathname, router])

  const monthLabel = new Date(currentFrom).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const selectClass = 'rounded-lg border border-border-col bg-card-bg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <button onClick={() => setMonth(-1)} className="rounded-lg border border-border-col px-2 py-1.5 text-sm text-text-secondary hover:bg-content-bg">←</button>
        <span className="min-w-[140px] text-center text-sm font-medium text-text-primary">{monthLabel}</span>
        <button onClick={() => setMonth(1)} className="rounded-lg border border-border-col px-2 py-1.5 text-sm text-text-secondary hover:bg-content-bg">→</button>
      </div>
      <select value={currentAccount} onChange={e => update('account', e.target.value)} className={selectClass}>
        <option value="">{t('filters.allAccounts')}</option>
        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <select value={currentCategory} onChange={e => update('category', e.target.value)} className={selectClass}>
        <option value="">{t('filters.allCategories')}</option>
        {categories.filter(c => c.kind !== 'transfer').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  )
}
