'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { setTransactionCategory } from './actions'
import type { SetCategoryResult } from './actions'
import type { Category } from '@/types/database'
import { matchTarget as computeMatchTarget } from '@/lib/category-rules'

type Props = {
  txId: string
  merchant: string | null
  description: string | null
  categoryId: string | null
  categoryName: string | null
  categories: Pick<Category, 'id' | 'name'>[]
  onOptimisticUpdate: (txId: string, categoryId: string | null) => void
  onSaved: (newCategoryId: string | null, result: SetCategoryResult) => void
  onEditStart: () => void
}

const selectClass =
  'rounded border border-border-col bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60'

export function CategoryCell({
  txId,
  merchant,
  description,
  categoryId,
  categoryName,
  categories,
  onOptimisticUpdate,
  onSaved,
  onEditStart,
}: Props) {
  const t = useTranslations('Transactions')
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (!editing) {
    return (
      <button
        onClick={() => { onEditStart(); setEditing(true); setLocalError(null) }}
        className="text-left"
      >
        {categoryName ? (
          <StatusBadge label={categoryName} color="accent" />
        ) : (
          <span className="text-sm text-text-tertiary">—</span>
        )}
      </button>
    )
  }

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value || null
    const originalId = categoryId
    const matchText = computeMatchTarget({ merchant, description }) ?? ''

    setLocalError(null)
    setPending(true)
    onOptimisticUpdate(txId, newId)

    const result = await setTransactionCategory(txId, newId, matchText)

    setPending(false)

    if (result.error || !result.data) {
      onOptimisticUpdate(txId, originalId)
      setLocalError(result.error ?? 'Error')
      return
    }

    setEditing(false)
    onSaved(newId, result.data)
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        autoFocus
        defaultValue={categoryId ?? ''}
        onChange={handleChange}
        disabled={pending}
        className={selectClass}
      >
        <option value="">{t('form.noCategory')}</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      {localError && (
        <span className="text-xs text-status-danger">{localError}</span>
      )}
    </div>
  )
}
