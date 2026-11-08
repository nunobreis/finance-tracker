'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { upsertBudget } from './actions'
import { getCategoryDisplayName } from '@/lib/categories-utils'
import type { Category } from '@/types/database'

type Props = {
  categories: Category[]
  currentMonth: string // 'YYYY-MM'
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
  const tCat = useTranslations('Categories')
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(upsertBudget, initialState)

  const expenseCategories = categories.filter(c => c.kind === 'expense')

  return (
    <>
      {trigger === 'button' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-teal px-3.5 text-caption font-semibold text-white transition-colors hover:bg-teal-deep cursor-pointer"
        >
          <Plus size={14} />
          <span>{t('addBudget')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-teal cursor-pointer"
          aria-label={t('editBudget')}
        >
          <Pencil size={14} />
        </button>
      )}

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={prefillAmount !== undefined ? t('editBudget') : t('setCategoryBudget')}
      >
        {state?.error && (
          <div className="mb-4 rounded-xl bg-negative-tint px-4 py-3 text-caption font-medium text-negative">
            {state.error}
          </div>
        )}
        <form action={formAction} className="flex flex-col gap-3.5">
          <Select
            name="category_id"
            required
            defaultValue={prefillCategoryId ?? ''}
            label={`${t('category')} *`}
          >
            <option value="">{t('selectCategory')}</option>
            {expenseCategories.map(c => (
              <option key={c.id} value={c.id}>
                {getCategoryDisplayName(c, tCat)}
              </option>
            ))}
          </Select>

          <Input
            name="amount_eur"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={prefillAmount}
            placeholder="500.00"
            label={`${t('monthlyBudgetLimit')} *`}
          />

          <Input
            name="period_month"
            type="month"
            required
            defaultValue={currentMonth}
            label={`${t('budgetPeriod')} *`}
          />

          <div className="pt-1">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              {t('saveBudget')}
            </Button>
          </div>
        </form>
      </Drawer>
    </>
  )
}
