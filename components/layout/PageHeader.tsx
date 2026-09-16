import { type ReactNode } from 'react'

type Props = {
  title: string
  actions?: ReactNode
}

export function PageHeader({ title, actions }: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-col bg-card-bg px-6">
      <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </header>
  )
}
