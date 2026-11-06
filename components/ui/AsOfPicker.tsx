'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type Props = {
  asOf: string
  variant?: 'default' | 'glass'
}

export function AsOfPicker({ asOf, variant = 'default' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const t = useTranslations('Common')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) params.set('asOf', e.target.value)
    else params.delete('asOf')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <label
      className={cn(
        'inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3 text-caption font-semibold whitespace-nowrap transition-colors cursor-pointer lg:h-[38px] lg:gap-2 lg:px-3.5',
        variant === 'glass'
          ? 'bg-glass-15 text-white border border-glass-30 hover:bg-glass-20'
          : 'bg-surface text-ink border border-separator hover:border-teal'
      )}
    >
      <Calendar
        size={14}
        className={cn('shrink-0', variant === 'glass' ? 'text-white' : 'text-text-secondary')}
      />
      <span
        className={cn(
          'hidden lg:inline',
          variant === 'glass' ? 'text-glass-80' : 'text-text-secondary'
        )}
      >
        {t('asOfLabel')}:
      </span>
      <input
        type="date"
        value={asOf}
        onChange={handleChange}
        aria-label={t('asOfLabel')}
        className="bg-transparent text-caption font-semibold outline-none cursor-pointer"
      />
    </label>
  )
}
