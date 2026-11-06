'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  House,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  Ellipsis,
  Wallet,
  RefreshCw,
  Upload,
  Settings,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { signOut } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'

const MORE_PATHS = ['/accounts', '/recurring-bills', '/transactions/import', '/settings', '/account']

export function TabBar() {
  const pathname = usePathname()
  const t = useTranslations('Nav')
  const tCommon = useTranslations('Common')
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const isHome = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isTransactions =
    pathname === '/transactions' ||
    (pathname.startsWith('/transactions/') && !pathname.startsWith('/transactions/import'))
  const isBudgets = pathname === '/budgets' || pathname.startsWith('/budgets/')
  const isWealth =
    pathname === '/investments' ||
    pathname.startsWith('/investments/') ||
    pathname === '/net-worth' ||
    pathname.startsWith('/net-worth/')
  const isMoreRoute = MORE_PATHS.some(
    p => pathname === p || pathname.startsWith(`${p}/`)
  )
  const isMoreActive = isMoreOpen || isMoreRoute

  const tabs = [
    {
      key: 'home',
      href: '/dashboard',
      label: t('home'),
      icon: House,
      active: isHome && !isMoreOpen,
    },
    {
      key: 'transactions',
      href: '/transactions',
      label: t('transactions'),
      icon: ArrowLeftRight,
      active: isTransactions && !isMoreOpen,
    },
    {
      key: 'budgets',
      href: '/budgets',
      label: t('budgets'),
      icon: PieChart,
      active: isBudgets && !isMoreOpen,
    },
    {
      key: 'wealth',
      href: '/investments',
      label: t('wealth'),
      icon: TrendingUp,
      active: isWealth && !isMoreOpen,
    },
  ]

  const moreLinks = [
    {
      href: '/accounts',
      label: t('accounts'),
      icon: Wallet,
      tintClass: 'bg-teal-tint text-teal',
    },
    {
      href: '/recurring-bills',
      label: t('recurringBills'),
      icon: RefreshCw,
      tintClass: 'bg-warning-tint text-warning-deep',
    },
    {
      href: '/transactions/import',
      label: t('importCsv'),
      icon: Upload,
      tintClass: 'bg-info-tint text-info',
    },
    {
      href: '/settings',
      label: t('settings'),
      icon: Settings,
      tintClass: 'bg-purple-tint text-purple',
    },
    {
      href: '/account',
      label: t('myAccount'),
      icon: User,
      tintClass: 'bg-positive-tint text-positive',
    },
  ]

  return (
    <>
      <nav
        aria-label="Primary Bottom Navigation"
        style={{
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          boxShadow:
            'inset 0 1px 1px var(--color-glass-40), inset 0 -1px 2px var(--color-glass-10), 0 10px 28px rgba(13, 21, 37, 0.28)',
        }}
        className="fixed inset-x-2.5 z-30 mx-auto flex h-16 max-w-[370px] items-center justify-between gap-0.5 rounded-[32px] border border-glass-25 bg-linear-to-b from-ink-slate/85 to-ink/90 p-1 backdrop-blur-[28px] lg:hidden"
      >
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.key}
              href={tab.href}
              onClick={() => setIsMoreOpen(false)}
              style={
                tab.active
                  ? { boxShadow: 'inset 0 1px 1px var(--color-glass-30)' }
                  : undefined
              }
              className={cn(
                'flex h-full flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-[28px] px-0.5 py-1 transition-colors',
                tab.active
                  ? 'border border-glass-25 bg-linear-to-b from-glass-20 to-glass-10 text-white font-semibold'
                  : 'border border-transparent text-glass-60 hover:text-white font-medium'
              )}
            >
              <Icon size={19} />
              <span className="text-label whitespace-nowrap leading-none">
                {tab.label}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setIsMoreOpen(prev => !prev)}
          style={
            isMoreActive
              ? { boxShadow: 'inset 0 1px 1px var(--color-glass-30)' }
              : undefined
          }
          className={cn(
            'flex h-full flex-1 min-w-0 flex-col items-center justify-center gap-1 rounded-[28px] px-0.5 py-1 transition-colors cursor-pointer',
            isMoreActive
              ? 'border border-glass-25 bg-linear-to-b from-glass-20 to-glass-10 text-white font-semibold'
              : 'border border-transparent text-glass-60 hover:text-white font-medium'
          )}
        >
          <Ellipsis size={19} />
          <span className="text-label whitespace-nowrap leading-none">
            {t('more')}
          </span>
        </button>
      </nav>

      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title={t('more')}
        cancelLabel={tCommon('cancel')}
      >
        <div className="flex flex-col gap-1">
          {moreLinks.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMoreOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-2xl px-3 py-2.5 transition-colors',
                  active ? 'bg-canvas' : 'hover:bg-canvas'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      item.tintClass
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-body font-semibold text-ink">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-text-muted" />
              </Link>
            )
          })}

          <div className="my-2 h-px w-full bg-separator-subtle" />

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-negative transition-colors hover:bg-negative-tint/50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-negative-tint text-negative">
                  <LogOut size={18} />
                </div>
                <span className="text-body font-semibold text-negative">{t('signOut')}</span>
              </div>
            </button>
          </form>
        </div>
      </BottomSheet>
    </>
  )
}
