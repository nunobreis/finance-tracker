'use client'

import {
  House,
  ArrowLeftRight,
  PieChart,
  RefreshCw,
  Wallet,
  Settings,
  User,
  TrendingUp,
  BarChart2,
  LogOut,
} from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { NavItem } from './NavItem'
import { signOut } from '@/app/(auth)/login/actions'

export function Sidebar() {
  const t = useTranslations('Nav')

  const NAV_ITEMS = [
    { href: '/dashboard',       label: t('dashboard'),       icon: House },
    { href: '/transactions',    label: t('transactions'),    icon: ArrowLeftRight },
    { href: '/budgets',         label: t('budgets'),         icon: PieChart },
    { href: '/recurring-bills', label: t('recurringBills'),  icon: RefreshCw },
    { href: '/accounts',        label: t('accounts'),        icon: Wallet },
    { href: '/investments',     label: t('investments'),     icon: TrendingUp },
    { href: '/net-worth',       label: t('netWorth'),        icon: BarChart2 },
  ]

  const BOTTOM_ITEMS = [
    { href: '/settings', label: t('settings'),  icon: Settings },
    { href: '/account',  label: t('myAccount'), icon: User },
  ]

  return (
    <aside className="hidden lg:flex h-dvh sticky top-0 w-[260px] shrink-0 flex-col justify-between border-r border-glass-08 bg-linear-to-b from-ink-slate to-ink px-4 pt-7 pb-6">
      <div className="flex flex-col gap-7">
        <div className="flex items-center gap-2.5 px-3">
          <div className="h-[30px] w-[30px] shrink-0 overflow-hidden rounded-lg">
            <Image
              src="/logo.png"
              alt="Norte"
              width={30}
              height={30}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-h2 font-bold text-white">Norte</span>
        </div>

        <nav aria-label="Sidebar Primary Navigation">
          <ul className="flex flex-col gap-1.5">
            {NAV_ITEMS.map(item => (
              <li key={item.href}>
                <NavItem {...item} />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        <div className="h-px w-full bg-glass-08" />
        <ul className="flex flex-col gap-1.5">
          {BOTTOM_ITEMS.map(item => (
            <li key={item.href}>
              <NavItem {...item} />
            </li>
          ))}
          <li>
            <form action={signOut}>
              <button
                type="submit"
                className="group flex h-[42px] w-full items-center gap-2.5 rounded-full border border-transparent px-3 text-body-sm font-medium text-glass-60 transition-colors hover:bg-glass-08 hover:text-white cursor-pointer"
              >
                <LogOut size={18} className="shrink-0 text-glass-60 transition-colors group-hover:text-white" />
                <span className="truncate">{t('signOut')}</span>
              </button>
            </form>
          </li>
        </ul>
      </div>
    </aside>
  )
}
