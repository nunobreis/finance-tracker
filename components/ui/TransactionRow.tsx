import { type ReactNode } from 'react'
import {
  type LucideIcon,
  ShoppingCart,
  Utensils,
  TrendingUp,
  Tv,
  TrainFront,
  Home,
  Zap,
  HeartPulse,
  ArrowLeftRight,
  Receipt,
  ShoppingBag,
  Clapperboard,
  Sparkles,
  Plane,
  Briefcase,
  Building2,
  Percent,
  CircleHelp,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CategoryKind } from '@/types/database'

export type IconTone = 'emerald' | 'amber' | 'blue' | 'purple' | 'teal' | 'rose' | 'slate'

type Props = {
  title: string
  subtitle: string
  amount: string
  secondaryAmount?: string
  isPositive?: boolean
  isTransfer?: boolean
  categoryName?: string | null
  categoryKind?: CategoryKind | null
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
  rose: 'bg-negative-tint text-negative',
  slate: 'bg-canvas text-text-secondary',
}

const SYSTEM_CATEGORY_VISUALS: Record<string, { icon: LucideIcon; tone: IconTone }> = {
  'Housing':            { icon: Home,          tone: 'teal' },
  'Food & Grocery':     { icon: ShoppingCart,  tone: 'emerald' },
  'Eating Out':         { icon: Utensils,      tone: 'amber' },
  'Transport':          { icon: TrainFront,    tone: 'blue' },
  'Entertainment':      { icon: Clapperboard,  tone: 'purple' },
  'Health':             { icon: HeartPulse,    tone: 'rose' },
  'Personal Care':      { icon: Sparkles,      tone: 'purple' },
  'Utilities':          { icon: Zap,           tone: 'amber' },
  'Subscriptions':      { icon: Tv,            tone: 'purple' },
  'Shopping':           { icon: ShoppingBag,   tone: 'blue' },
  'Travel':             { icon: Plane,         tone: 'teal' },
  'Other':              { icon: Receipt,       tone: 'slate' },
  'Income':             { icon: Briefcase,     tone: 'emerald' },
  'Rental income (UK)': { icon: Building2,     tone: 'teal' },
  'Interest':           { icon: Percent,       tone: 'blue' },
  'Dividends':          { icon: TrendingUp,    tone: 'emerald' },
  'Transfer':           { icon: ArrowLeftRight, tone: 'slate' },
}

export function resolveCategoryVisual(
  categoryName?: string | null,
  categoryKind?: CategoryKind | null,
  isTransfer?: boolean,
  isPositive?: boolean
): { icon: LucideIcon; tone: IconTone } {
  if (isTransfer || categoryKind === 'transfer' || categoryName === 'Transfer') {
    return { icon: ArrowLeftRight, tone: 'slate' }
  }
  if (!categoryName) {
    return { icon: CircleHelp, tone: 'slate' }
  }
  const exact = SYSTEM_CATEGORY_VISUALS[categoryName]
  if (exact) {
    return exact
  }
  if (categoryKind === 'income' || isPositive) {
    return { icon: TrendingUp, tone: 'emerald' }
  }
  return { icon: Tag, tone: 'teal' }
}

export function TransactionRow({
  title,
  subtitle,
  amount,
  secondaryAmount,
  isPositive = false,
  isTransfer = false,
  categoryName,
  categoryKind,
  icon,
  iconTone,
  trailingAction,
}: Props) {
  const resolved = resolveCategoryVisual(categoryName, categoryKind, isTransfer, isPositive)
  const Icon = icon ?? resolved.icon
  const tone = iconTone ?? resolved.tone

  return (
    <div className="flex w-full items-center gap-3 py-3">
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
