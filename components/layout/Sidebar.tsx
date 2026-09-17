'use client'

import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  RefreshCw,
  Wallet,
  Settings,
  User,
  TrendingUp,
  BarChart2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { NavItem } from './NavItem'

export function Sidebar() {
  const t = useTranslations('Nav')

  const NAV_ITEMS = [
    { href: '/dashboard',       label: t('dashboard'),       icon: LayoutDashboard },
    { href: '/investments',     label: t('investments'),     icon: TrendingUp },
    { href: '/net-worth',       label: t('netWorth'),        icon: BarChart2 },
    { href: '/transactions',    label: t('transactions'),    icon: ArrowLeftRight },
    { href: '/budgets',         label: t('budgets'),         icon: PieChart },
    { href: '/recurring-bills', label: t('recurringBills'),  icon: RefreshCw },
    { href: '/accounts',        label: t('accounts'),        icon: Wallet },
  ]

  const BOTTOM_ITEMS = [
    { href: '/settings', label: t('settings'), icon: Settings },
    { href: '/account',  label: t('myAccount'), icon: User },
  ]

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar-bg">
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="text-xs font-bold text-white">FT</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavItem {...item} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom cluster */}
      <div className="border-t border-nav-active-bg px-3 py-3">
        <ul className="space-y-1">
          {BOTTOM_ITEMS.map((item) => (
            <li key={item.href}>
              <NavItem {...item} />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
