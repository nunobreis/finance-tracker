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
        'inline-flex h-[38px] items-center gap-2 rounded-full px-3.5 text-caption font-semibold transition-colors cursor-pointer',
        variant === 'glass'
          ? 'bg-glass-15 text-white border border-glass-30 hover:bg-glass-20'
          : 'bg-surface text-ink border border-separator hover:border-teal'
      )}
    >
      <Calendar
        size={15}
        className={variant === 'glass' ? 'text-white' : 'text-text-secondary'}
      />
      <span className={variant === 'glass' ? 'text-glass-80' : 'text-text-secondary'}>
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
