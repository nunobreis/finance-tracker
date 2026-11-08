import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'glass' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 rounded-full text-caption',
  md: 'h-11 px-5 rounded-full text-body-sm',
  lg: 'h-[52px] px-6 rounded-full text-body font-bold',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-teal text-white hover:bg-teal-deep',
  secondary: 'bg-teal-tint text-teal hover:opacity-90',
  ghost: 'bg-transparent text-teal hover:bg-teal/10',
  dark: 'bg-ink text-white hover:bg-ink-slate',
  glass: 'bg-glass-15 text-white border border-glass-30 hover:bg-glass-20',
  danger: 'bg-negative-tint text-negative hover:bg-negative/20',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors cursor-pointer disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
