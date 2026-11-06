'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export function WealthNav() {
  const pathname = usePathname()
  const t = useTranslations('Nav')

  const items = [
    { href: '/investments', label: t('investments') },
    { href: '/net-worth', label: t('netWorth') },
  ]

  return (
    <div className="inline-flex rounded-full border border-glass-20 bg-glass-12 p-1 lg:hidden">
      {items.map(item => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-full px-3 py-1 text-caption transition-colors',
              active
                ? 'bg-surface font-semibold text-ink shadow-xs'
                : 'font-medium text-glass-80 hover:text-white'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
