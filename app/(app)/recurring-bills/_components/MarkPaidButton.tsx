'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { markBillPaid } from './actions'

type Props = { billId: string }

export function MarkPaidButton({ billId }: Props) {
  const t = useTranslations('RecurringBills')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await markBillPaid(billId)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-separator bg-surface px-3 text-caption font-semibold text-teal transition-colors hover:bg-teal-tint/30 disabled:opacity-50 cursor-pointer"
      >
        <CheckCircle size={13} />
        <span>{loading ? t('saving') : t('markPaid')}</span>
      </button>
      {error && <span className="text-label text-negative">{error}</span>}
    </div>
  )
}
