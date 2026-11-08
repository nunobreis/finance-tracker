'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  href: string
  label: string
  icon: LucideIcon
  onClick?: () => void
}

export function NavItem({ href, label, icon: Icon, onClick }: Props) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      onClick={onClick}
      style={
        isActive
          ? { boxShadow: 'inset 0 1px 1px var(--color-glass-30)' }
          : undefined
      }
      className={cn(
        'group flex items-center gap-2.5 rounded-full px-3 text-body-sm transition-colors',
        isActive
          ? 'h-[44px] border border-glass-25 bg-linear-to-b from-glass-20 to-glass-10 font-semibold text-white'
          : 'h-[42px] border border-transparent font-medium text-glass-60 hover:bg-glass-08 hover:text-white'
      )}
    >
      <Icon size={18} className={cn('shrink-0 transition-colors', isActive ? 'text-white' : 'text-glass-60 group-hover:text-white')} />
      <span className="truncate">{label}</span>
    </Link>
  )
}
