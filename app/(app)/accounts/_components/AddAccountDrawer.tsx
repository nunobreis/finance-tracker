'use client'

import { useState, useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Drawer } from '@/components/ui/Drawer'
import { createAccount } from './actions'
import { Plus } from 'lucide-react'

const initialState: { error?: string } = {}

export function AddAccountDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(createAccount, initialState)
  const t = useTranslations('Accounts')

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={16} />
        {t('addAccount')}
      </button>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('addAccount')}>
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
            {state.error}
          </div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t('name')} <span className="text-status-danger">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Revolut"
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('institution')}</label>
            <input
              name="institution"
              placeholder="e.g. Revolut Bank"
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t('type')} <span className="text-status-danger">*</span>
            </label>
            <select
              name="account_type"
              required
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="checking">{t('types.checking')}</option>
              <option value="savings">{t('types.savings')}</option>
              <option value="credit_card">{t('types.credit_card')}</option>
              <option value="cash">{t('types.cash')}</option>
              <option value="investment">{t('types.investment')}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              {t('currency')} <span className="text-status-danger">*</span>
            </label>
            <select
              name="currency"
              required
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t('addAccount')}
          </button>
        </form>
      </Drawer>
    </>
  )
}
