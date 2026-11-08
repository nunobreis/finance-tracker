'use client'

import { type ReactNode } from 'react'

type Props = {
  title: string
  actions?: ReactNode
}

export function PageHeader({ title, actions }: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-separator bg-surface px-4 lg:h-auto lg:border-b-0 lg:bg-transparent lg:px-9 lg:pt-7 lg:pb-0">
      <h1 className="text-h2 lg:text-h1 font-bold text-ink">{title}</h1>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </header>
  )
}
