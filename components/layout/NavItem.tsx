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
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
        isActive
          ? 'border-l-2 border-accent bg-nav-active-bg text-white'
          : 'border-l-2 border-transparent text-nav-icon-col hover:bg-nav-active-bg hover:text-white'
      )}
    >
      <Icon size={18} className={isActive ? 'text-accent' : 'text-nav-icon-col'} />
      <span>{label}</span>
    </Link>
  )
}
