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
import { NavItem } from './NavItem'

const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/investments',     label: 'Investments',     icon: TrendingUp },
  { href: '/net-worth',       label: 'Net Worth',       icon: BarChart2 },
  { href: '/transactions',    label: 'Transactions',    icon: ArrowLeftRight },
  { href: '/budgets',         label: 'Budgets',         icon: PieChart },
  { href: '/recurring-bills', label: 'Recurring Bills', icon: RefreshCw },
  { href: '/accounts',        label: 'Accounts',        icon: Wallet },
] as const

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/account',  label: 'My Account', icon: User },
] as const

export function Sidebar() {
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
