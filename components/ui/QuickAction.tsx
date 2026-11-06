import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  icon: LucideIcon
  label: string
  variant?: 'primary' | 'glass'
  href?: string
  onClick?: () => void
}

export function QuickAction({
  icon: Icon,
  label,
  variant = 'glass',
  href,
  onClick,
}: Props) {
  const circleClass = cn(
    'flex h-14 w-14 items-center justify-center rounded-full transition-transform group-active:scale-95',
    variant === 'primary'
      ? 'bg-surface text-teal shadow-sm'
      : 'bg-glass-12 text-white border border-glass-20 hover:bg-glass-20'
  )

  const content = (
    <>
      <div className={circleClass}>
        <Icon size={22} />
      </div>
      <span className="text-label font-medium text-white text-center leading-tight whitespace-nowrap">
        {label}
      </span>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="group flex min-w-16 flex-col items-center justify-center gap-2 cursor-pointer"
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-16 flex-col items-center justify-center gap-2 cursor-pointer"
    >
      {content}
    </button>
  )
}
