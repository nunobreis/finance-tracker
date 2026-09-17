'use client'

import { useState, useActionState } from 'react'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { upsertBudget } from './actions'
import { useTranslations } from 'next-intl'
import type { Category } from '@/types/database'

type Props = {
  categories: Category[]
  currentMonth: string  // 'YYYY-MM'
  prefillCategoryId?: string
  prefillAmount?: number
  trigger?: 'button' | 'icon'
}

const initialState: { error?: string } = {}

export function AddBudgetDrawer({
  categories,
  currentMonth,
  prefillCategoryId,
  prefillAmount,
  trigger = 'button',
}: Props) {
  const t = useTranslations('Budgets')
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(upsertBudget, initialState)

  const expenseCategories = categories.filter(c => c.kind === 'expense')
  const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

  return (
    <>
      {trigger === 'button' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} />
          {t('addBudget')}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded p-1 text-text-tertiary hover:text-accent"
          aria-label={t('editBudget')}
        >
          <Plus size={14} />
        </button>
      )}

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('addBudget')}>
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
            {state.error}
          </div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t('category')} <span className="text-status-danger">*</span>
            </label>
            <select
              name="category_id"
              required
              defaultValue={prefillCategoryId ?? ''}
              className={inputClass}
            >
              <option value="">Select category</option>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t('amount')} <span className="text-status-danger">*</span>
            </label>
            <input
              name="amount_eur"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={prefillAmount}
              placeholder="e.g. 500"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t('period')} <span className="text-status-danger">*</span>
            </label>
            <input
              name="period_month"
              type="month"
              required
              defaultValue={currentMonth}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t('addBudget')}
          </button>
        </form>
      </Drawer>
    </>
  )
}
