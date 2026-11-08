'use client'

import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { deleteHolding } from '../actions'

type Props = { holdingId: string }

export function DeleteHoldingButton({ holdingId }: Props) {
  const t = useTranslations('Investments')

  async function handleDelete() {
    if (!confirm(t('deleteConfirm'))) return
    await deleteHolding(holdingId)
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-negative-tint hover:text-negative cursor-pointer"
      aria-label={t('deleteHolding')}
    >
      <Trash2 size={14} />
    </button>
  )
}
