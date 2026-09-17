'use client'

import { RefreshCw } from 'lucide-react'
import { refreshPrices } from '../actions'
import { useState } from 'react'

export function RefreshPricesButton() {
  const [loading, setLoading] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    await refreshPrices()
    setLoading(false)
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-border-col px-3 py-2 text-sm text-text-secondary hover:bg-content-bg disabled:opacity-50"
    >
      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Refreshing…' : 'Refresh prices'}
    </button>
  )
}
