'use client'

import {
  LayoutDashboard, ArrowLeftRight, PieChart, RefreshCw,
  Wallet, Settings, User, TrendingUp, BarChart2, X,
} from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { NavItem } from './NavItem'
import { useMobileNav } from './MobileNavContext'
import { cn } from '@/lib/utils'

function SidebarContent({ onNavClick }: { onNavClick: () => void }) {
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
    <>
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-8 w-8 overflow-hidden rounded-lg shrink-0">
          <Image src="/logo.png" alt="Norte" width={32} height={32} className="h-full w-full object-cover" />
        </div>
        <span className="text-sm font-bold text-white tracking-wide">Norte</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <NavItem {...item} onClick={onNavClick} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-nav-active-bg px-3 py-3">
        <ul className="space-y-1">
          {BOTTOM_ITEMS.map(item => (
            <li key={item.href}>
              <NavItem {...item} onClick={onNavClick} />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export function Sidebar() {
  const { isOpen, close } = useMobileNav()

  return (
    <>
      {/* Desktop: always visible, in flex flow */}
      <aside className="hidden lg:flex h-screen w-60 shrink-0 flex-col bg-sidebar-bg">
        <SidebarContent onNavClick={() => {}} />
      </aside>

      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Mobile slide-in panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-sidebar-bg shadow-xl transition-transform duration-200 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={close}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-nav-icon-col hover:bg-nav-active-bg"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        <SidebarContent onNavClick={close} />
      </aside>
    </>
  )
}
