'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { refreshPrices } from '../actions'
import { cn } from '@/lib/utils'

type Props = {
  variant?: 'default' | 'glass'
}

export function RefreshPricesButton({ variant = 'default' }: Props) {
  const t = useTranslations('Investments')
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    await refreshPrices()
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={loading}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full text-caption font-semibold transition-colors disabled:opacity-50 cursor-pointer',
        variant === 'glass'
          ? 'h-8 border border-glass-25 bg-glass-12 px-3 text-white hover:bg-glass-20'
          : 'h-[38px] border border-separator bg-surface px-3.5 text-ink hover:bg-canvas'
      )}
    >
      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
      <span>
        {loading
          ? t('refreshing')
          : variant === 'glass'
            ? t('refreshShort')
            : t('refreshPrices')}
      </span>
    </button>
  )
}
