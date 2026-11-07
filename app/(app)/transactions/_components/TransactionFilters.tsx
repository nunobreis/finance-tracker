'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition, useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import type { Account, Category } from '@/types/database'

type Props = {
  accounts: Account[]
  categories: Category[]
  currentAccount: string
  currentCategory: string
  currentFrom: string
  currentTo: string
  currentQ: string
  uncategorisedCount: number
}

function chipClass(active: boolean) {
  return active
    ? 'inline-flex h-8 shrink-0 items-center rounded-full bg-teal px-3 text-caption font-semibold text-white transition-colors'
    : 'inline-flex h-8 shrink-0 items-center rounded-full border border-separator bg-canvas px-3 text-caption font-semibold text-ink hover:bg-surface transition-colors'
}

export function TransactionFilters({
  accounts,
  categories,
  currentAccount,
  currentCategory,
  currentFrom,
  currentTo,
  currentQ,
  uncategorisedCount,
}: Props) {
  const t = useTranslations('Transactions')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentQ)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep search input in sync if URL changes externally
  useEffect(() => { setSearchValue(currentQ) }, [currentQ])

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [searchParams, pathname, router])

  const updateSearch = useCallback((q: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (q) params.set('q', q)
    else params.delete('q')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [searchParams, pathname, router])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearchValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateSearch(val), 300)
  }

  const setMonth = useCallback((offset: number) => {
    const from = new Date(currentFrom + 'T00:00:00')
    from.setMonth(from.getMonth() + offset)
    const year = from.getFullYear()
    const month = String(from.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(year, from.getMonth() + 1, 0).getDate()
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', `${year}-${month}-01`)
    params.set('to',   `${year}-${month}-${String(lastDay).padStart(2, '0')}`)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [currentFrom, searchParams, pathname, router])

  const monthLabel = new Date(currentFrom + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const isAll = !currentAccount && !currentCategory

  // Non-transfer categories for the category select
  const selectableCategories = categories.filter(c => c.kind !== 'transfer')

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      <div className="flex items-center gap-2 rounded-full border border-transparent bg-canvas px-4 h-10 lg:border-separator lg:bg-surface">
        <Search size={16} className="shrink-0 text-text-secondary" aria-hidden />
        <input
          type="search"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder={t('filters.search')}
          className="flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-text-secondary"
        />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
        {/* All chip */}
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('account')
            params.delete('category')
            startTransition(() => router.push(`${pathname}?${params.toString()}`))
          }}
          className={chipClass(isAll)}
        >
          {t('filters.allAccounts').replace(' accounts', '')} All
        </button>

        {/* Per-account chips */}
        {accounts.map(a => (
          <button
            key={a.id}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              if (currentAccount === a.id) { params.delete('account') }
              else { params.set('account', a.id) }
              params.delete('category')
              startTransition(() => router.push(`${pathname}?${params.toString()}`))
            }}
            className={chipClass(currentAccount === a.id)}
          >
            {a.name}
          </button>
        ))}

        {/* Uncategorised chip */}
        <button
          onClick={() => update('category', currentCategory === 'uncategorised' ? '' : 'uncategorised')}
          className={chipClass(currentCategory === 'uncategorised')}
        >
          {t('filters.uncategorised', { count: uncategorisedCount })}
        </button>

        {/* Category select pill */}
        <select
          value={currentCategory !== 'uncategorised' ? currentCategory : ''}
          onChange={e => update('category', e.target.value)}
          className="inline-flex h-8 shrink-0 items-center rounded-full border border-separator bg-canvas px-3 text-caption font-semibold text-ink outline-none hover:bg-surface appearance-none pr-6 cursor-pointer"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23888\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
        >
          <option value="">{t('filters.allCategories')}</option>
          {selectableCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Mobile month switcher (lg:hidden) */}
        <span className="inline-flex shrink-0 items-center rounded-full border border-separator bg-canvas h-8 text-caption font-semibold text-ink overflow-hidden lg:hidden">
          <button
            onClick={() => setMonth(-1)}
            className="flex h-full items-center px-2.5 hover:bg-surface"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="px-1 text-ink whitespace-nowrap">{monthLabel}</span>
          <button
            onClick={() => setMonth(1)}
            className="flex h-full items-center px-2.5 hover:bg-surface"
            aria-label="Next month"
          >
            →
          </button>
        </span>
      </div>
    </div>
  )
}
