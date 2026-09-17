'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
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
          Add bill
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded p-1 text-text-tertiary hover:text-accent"
          aria-label="Edit bill"
        >
          <Pencil size={14} />
        </button>
      )}

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={prefill ? 'Edit bill' : 'Add recurring bill'}>
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          {prefill && <input type="hidden" name="id" value={prefill.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Name <span className="text-status-danger">*</span></label>
            <input name="name" required defaultValue={prefill?.name} placeholder="e.g. Netflix" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Category</label>
            <select name="category_id" defaultValue={prefill?.category_id ?? ''} className={inputClass}>
              <option value="">None</option>
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Account</label>
            <select name="account_id" defaultValue={prefill?.account_id ?? ''} className={inputClass}>
              <option value="">None</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">Amount <span className="text-status-danger">*</span></label>
              <input name="amount" type="number" step="0.01" min="0.01" required defaultValue={prefill?.amount} className={inputClass} />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-text-primary">Currency</label>
              <select name="currency" defaultValue={prefill?.currency ?? 'GBP'} className={inputClass}>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Frequency <span className="text-status-danger">*</span></label>
            <select name="frequency" required defaultValue={prefill?.frequency ?? 'monthly'} className={inputClass}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Next due <span className="text-status-danger">*</span></label>
            <input name="next_due_on" type="date" required defaultValue={prefill?.next_due_on} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Reminder (days before)</label>
            <input name="reminder_days_before" type="number" min="0" defaultValue={prefill?.reminder_days_before ?? 3} className={inputClass} />
          </div>

          <button type="submit" className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90">
            {prefill ? 'Save changes' : 'Add bill'}
          </button>
        </form>
      </Drawer>
    </>
  )
}
