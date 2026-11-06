import { type ReactNode } from 'react'
import {
  type LucideIcon,
  ShoppingCart,
  Coffee,
  TrendingUp,
  Tv,
  TrainFront,
  Home,
  Zap,
  HeartPulse,
  GraduationCap,
  ArrowLeftRight,
  Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type IconTone = 'emerald' | 'amber' | 'blue' | 'purple' | 'teal' | 'slate'

type Props = {
  title: string
  subtitle: string
  amount: string
  secondaryAmount?: string
  isPositive?: boolean
  isTransfer?: boolean
  categoryName?: string | null
  icon?: LucideIcon
  iconTone?: IconTone
  trailingAction?: ReactNode
}

const toneClasses: Record<IconTone, string> = {
  emerald: 'bg-positive-tint text-positive',
  amber: 'bg-warning-tint text-warning-deep',
  blue: 'bg-info-tint text-info',
  purple: 'bg-purple-tint text-purple',
  teal: 'bg-teal-tint text-teal',
  slate: 'bg-canvas text-text-secondary',
}

export function resolveCategoryVisual(
  categoryName?: string | null,
  isPositive?: boolean,
  isTransfer?: boolean
): { icon: LucideIcon; tone: IconTone } {
  if (isTransfer) return { icon: ArrowLeftRight, tone: 'slate' }
  if (isPositive) return { icon: TrendingUp, tone: 'blue' }

  const key = (categoryName ?? '').toLowerCase()
  if (key.includes('grocer') || key.includes('supermer') || key.includes('mercear')) {
    return { icon: ShoppingCart, tone: 'emerald' }
  }
  if (key.includes('eat') || key.includes('restaur') || key.includes('coffee') || key.includes('dining')) {
    return { icon: Coffee, tone: 'amber' }
  }
  if (key.includes('subscr') || key.includes('stream') || key.includes('entertain') || key.includes('cultur')) {
    return { icon: Tv, tone: 'purple' }
  }
  if (key.includes('transp') || key.includes('travel') || key.includes('fuel') || key.includes('vehic')) {
    return { icon: TrainFront, tone: 'blue' }
  }
  if (key.includes('hous') || key.includes('rent') || key.includes('habit') || key.includes('renda')) {
    return { icon: Home, tone: 'teal' }
  }
  if (key.includes('util') || key.includes('electr') || key.includes('water') || key.includes('internet')) {
    return { icon: Zap, tone: 'amber' }
  }
  if (key.includes('health') || key.includes('saúde') || key.includes('gym') || key.includes('ginás')) {
    return { icon: HeartPulse, tone: 'emerald' }
  }
  if (key.includes('educ')) {
    return { icon: GraduationCap, tone: 'purple' }
  }
  return { icon: Receipt, tone: 'teal' }
}

export function TransactionRow({
  title,
  subtitle,
  amount,
  secondaryAmount,
  isPositive = false,
  isTransfer = false,
  categoryName,
  icon,
  iconTone,
  trailingAction,
}: Props) {
  const resolved = resolveCategoryVisual(categoryName, isPositive, isTransfer)
  const Icon = icon ?? resolved.icon
  const tone = iconTone ?? resolved.tone

  return (
    <div className="flex w-full items-center gap-3">
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          toneClasses[tone]
        )}
      >
        <Icon size={18} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-semibold text-ink">{title}</span>
        <span className="truncate text-caption text-text-secondary">{subtitle}</span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className={cn(
            'text-body font-semibold tabular-nums',
            isPositive
              ? 'text-positive'
              : isTransfer
                ? 'text-text-secondary'
                : 'text-ink'
          )}
        >
          {amount}
        </span>
        {secondaryAmount && (
          <span className="text-caption text-text-secondary tabular-nums">
            {secondaryAmount}
          </span>
        )}
        {trailingAction}
      </div>
    </div>
  )
}
