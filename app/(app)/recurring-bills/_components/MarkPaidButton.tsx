'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { markBillPaid } from './actions'

type Props = { billId: string }

export function MarkPaidButton({ billId }: Props) {
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
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-border-col px-2.5 py-1 text-xs font-medium text-text-secondary hover:border-status-good hover:text-status-good disabled:opacity-50"
      >
        <CheckCircle size={12} />
        {loading ? 'Saving…' : 'Mark paid'}
      </button>
      {error && <span className="text-xs text-status-danger">{error}</span>}
    </div>
  )
}
