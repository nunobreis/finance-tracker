import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  title?: ReactNode
  trailing?: ReactNode
  variant?: 'surface' | 'muted'
  className?: string
  children: ReactNode
}

export function Card({
  title,
  trailing,
  variant = 'surface',
  className,
  children,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        variant === 'surface'
          ? 'rounded-[20px] bg-surface border border-separator/80 p-5 shadow-xs'
          : 'rounded-[16px] bg-canvas p-4',
        className
      )}
    >
      {(title || trailing) && (
        <div className="flex items-center justify-between gap-2">
          {title && (
            <div className="text-body-sm font-medium text-text-secondary">{title}</div>
          )}
          {trailing && (
            <div className="text-caption font-medium text-text-muted">{trailing}</div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
