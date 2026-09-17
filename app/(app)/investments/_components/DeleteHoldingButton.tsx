'use client'

import { Trash2 } from 'lucide-react'
import { deleteHolding } from '../actions'

type Props = { holdingId: string }

export function DeleteHoldingButton({ holdingId }: Props) {
  async function handleDelete() {
    if (!confirm('Delete this holding and all its price history?')) return
    await deleteHolding(holdingId)
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded p-1 text-text-tertiary hover:text-status-danger"
      aria-label="Delete holding"
    >
      <Trash2 size={14} />
    </button>
  )
}
