'use client'

import { Trash2 } from 'lucide-react'
import { deleteHolding } from '../actions'
import { useTranslations } from 'next-intl'

type Props = { holdingId: string }

export function DeleteHoldingButton({ holdingId }: Props) {
  const t = useTranslations('Investments')

  async function handleDelete() {
    if (!confirm(t('deleteConfirm'))) return
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
