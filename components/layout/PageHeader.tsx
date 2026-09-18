'use client'

import { type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { useMobileNav } from './MobileNavContext'

type Props = {
  title: string
  actions?: ReactNode
}

export function PageHeader({ title, actions }: Props) {
  const { open } = useMobileNav()

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-col bg-card-bg px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={open}
          className="rounded-lg p-1.5 text-text-tertiary hover:bg-content-bg hover:text-text-primary lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      </div>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </header>
  )
}
