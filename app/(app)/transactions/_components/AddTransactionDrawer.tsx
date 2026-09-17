'use client'

import { useState, useActionState } from 'react'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { createTransaction } from './actions'
import { useTranslations } from 'next-intl'
import type { Account, Category } from '@/types/database'

type Props = { accounts: Account[]; categories: Category[] }

const initialState: { error?: string } = {}
const today = () => new Date().toISOString().split('T')[0]

export function AddTransactionDrawer({ accounts, categories }: Props) {
  const t = useTranslations('Transactions')
  const [isOpen, setIsOpen] = useState(false)
  const [isTransfer, setIsTransfer] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? '')
  const [state, formAction] = useActionState(createTransaction, initialState)

  const selectedCurrency = accounts.find(a => a.id === selectedAccount)?.currency ?? 'GBP'
  const expenseCategories = categories.filter(c => c.kind === 'expense')

  const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={16} />
        {t('addTransaction')}
      </button>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('addTransaction')}>
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Date *</label>
            <input name="occurred_on" type="date" required defaultValue={today()} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Account *</label>
            <select name="account_id" required value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className={inputClass}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">Amount *</label>
              <input name="amount" type="number" step="0.01" required placeholder="-25.50" className={inputClass} />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-text-primary">Currency</label>
              <input name="currency" value={selectedCurrency} readOnly className={`${inputClass} bg-content-bg`} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Merchant</label>
            <input name="merchant" type="text" placeholder="e.g. Tesco" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Description</label>
            <input name="description" type="text" placeholder="Optional note" className={inputClass} />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_transfer"
              name="is_transfer"
              type="checkbox"
              checked={isTransfer}
              onChange={e => setIsTransfer(e.target.checked)}
              className="h-4 w-4 rounded border-border-col text-accent"
            />
            <label htmlFor="is_transfer" className="text-sm text-text-primary">This is a transfer between my accounts</label>
          </div>

          {!isTransfer && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Category</label>
              <select name="category_id" className={inputClass}>
                <option value="">No category</option>
                {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {isTransfer && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Destination account *</label>
              <select name="linked_account_id" required className={inputClass}>
                <option value="">Select account</option>
                {accounts.filter(a => a.id !== selectedAccount).map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90">
            Save transaction
          </button>
        </form>
      </Drawer>
    </>
  )
}
