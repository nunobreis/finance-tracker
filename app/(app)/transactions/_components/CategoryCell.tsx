'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
        className={
          categoryName
            ? 'inline-flex items-center gap-1 rounded-full bg-separator-subtle px-3 py-1 text-caption font-semibold text-ink hover:bg-teal-tint hover:text-teal transition-colors'
            : 'inline-flex items-center gap-1 rounded-full bg-warning-tint/60 px-3 py-1 text-caption font-semibold text-warning-deep hover:bg-warning-tint transition-colors'
        }
      >
        {categoryName ?? t('form.noCategory')}
        <span aria-hidden className="text-[10px] opacity-60">▾</span>
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
        className="rounded-full border border-teal bg-surface px-3 py-1 text-caption font-semibold text-ink outline-none disabled:opacity-60"
      >
        <option value="">{t('form.noCategory')}</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      {localError && (
        <span className="text-caption text-negative">{localError}</span>
      )}
    </div>
  )
}
