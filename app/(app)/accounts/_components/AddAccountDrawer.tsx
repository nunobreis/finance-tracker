'use client'

import { useState, useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createAccount } from './actions'

const initialState: { error?: string } = {}

export function AddAccountDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(createAccount, initialState)
  const t = useTranslations('Accounts')

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-teal px-3.5 text-caption font-semibold text-white transition-colors hover:bg-teal-deep cursor-pointer"
      >
        <Plus size={14} />
        <span>{t('addAccount')}</span>
      </button>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('addAccount')}>
        {state?.error && (
          <div className="mb-4 rounded-xl bg-negative-tint px-4 py-3 text-caption font-medium text-negative">
            {state.error}
          </div>
        )}
        <form action={formAction} className="flex flex-col gap-3.5">
          <Input
            name="name"
            required
            label={`${t('accountNameLabel')} *`}
            placeholder="e.g. Revolut EUR"
          />

          <Input
            name="institution"
            label={t('institution')}
            placeholder="e.g. Revolut Bank"
          />

          <Select
            name="account_type"
            required
            label={`${t('accountTypeLabel')} *`}
            defaultValue="checking"
          >
            <option value="checking">{t('types.checking')}</option>
            <option value="savings">{t('types.savings')}</option>
            <option value="credit_card">{t('types.credit_card')}</option>
            <option value="cash">{t('types.cash')}</option>
            <option value="investment">{t('types.investment')}</option>
          </Select>

          <Select
            name="currency"
            required
            label={`${t('nativeCurrencyLabel')} *`}
            defaultValue="EUR"
          >
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </Select>

          <Select
            name="country"
            required
            label={`${t('countrySourceLabel')} *`}
            defaultValue="PT"
          >
            <option value="PT">{t('countries.PT')}</option>
            <option value="GB">{t('countries.GB')}</option>
          </Select>

          <div className="flex flex-col gap-1">
            <Input
              name="opening_balance"
              type="number"
              step="0.01"
              defaultValue="0"
              placeholder="0.00"
              label={t('startingBalanceLabel')}
            />
            <p className="px-1 text-label text-text-muted">
              {t('startingBalanceHint')}
            </p>
          </div>

          <div className="pt-1">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              {t('createAccount')}
            </Button>
          </div>
        </form>
      </Drawer>
    </>
  )
}
