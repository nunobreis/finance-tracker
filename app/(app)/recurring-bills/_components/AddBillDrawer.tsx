'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Drawer } from '@/components/ui/Drawer'
import { upsertBill } from './actions'
import type { Account, Category, RecurringBill } from '@/types/database'

type Props = {
  accounts: Account[]
  categories: Category[]
  prefill?: RecurringBill
  trigger?: 'button' | 'icon'
}

const initialState: { error?: string } = {}

export function AddBillDrawer({ accounts, categories, prefill, trigger = 'button' }: Props) {
  const t = useTranslations('RecurringBills')
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(upsertBill, initialState)

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
          {t('addBill')}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded p-1 text-text-tertiary hover:text-accent"
          aria-label={t('editBill')}
        >
          <Pencil size={14} />
        </button>
      )}

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={prefill ? t('editBill') : t('addBill')}>
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          {prefill && <input type="hidden" name="id" value={prefill.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('name')} <span className="text-status-danger">*</span></label>
            <input name="name" required defaultValue={prefill?.name} placeholder={t('billNamePlaceholder')} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('category')}</label>
            <select name="category_id" defaultValue={prefill?.category_id ?? ''} className={inputClass}>
              <option value="">{t('none')}</option>
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('account')}</label>
            <select name="account_id" defaultValue={prefill?.account_id ?? ''} className={inputClass}>
              <option value="">{t('none')}</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">{t('amount')} <span className="text-status-danger">*</span></label>
              <input name="amount" type="number" step="0.01" min="0.01" required defaultValue={prefill?.amount} className={inputClass} />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-text-primary">{t('currency')}</label>
              <select name="currency" defaultValue={prefill?.currency ?? 'GBP'} className={inputClass}>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('frequency')} <span className="text-status-danger">*</span></label>
            <select name="frequency" required defaultValue={prefill?.frequency ?? 'monthly'} className={inputClass}>
              <option value="weekly">{t('frequencies.weekly')}</option>
              <option value="monthly">{t('frequencies.monthly')}</option>
              <option value="quarterly">{t('frequencies.quarterly')}</option>
              <option value="yearly">{t('frequencies.yearly')}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('nextDue')} <span className="text-status-danger">*</span></label>
            <input name="next_due_on" type="date" required defaultValue={prefill?.next_due_on} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('reminderDays')}</label>
            <input name="reminder_days_before" type="number" min="0" defaultValue={prefill?.reminder_days_before ?? 3} className={inputClass} />
          </div>

          <button type="submit" className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90">
            {prefill ? t('editBill') : t('addBill')}
          </button>
        </form>
      </Drawer>
    </>
  )
}
