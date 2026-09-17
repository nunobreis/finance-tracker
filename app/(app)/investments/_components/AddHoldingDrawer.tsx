'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { upsertHolding } from '../actions'
import { useTranslations } from 'next-intl'
import type { Account, Holding } from '@/types/database'

type Props = {
  accounts: Account[]
  prefill?: Holding
  trigger?: 'button' | 'icon'
}

const initialState: { error?: string } = {}

const ASSET_TYPE_VALUES = ['stock', 'etf', 'fund', 'crypto', 'other'] as const

export function AddHoldingDrawer({ accounts, prefill, trigger = 'button' }: Props) {
  const t = useTranslations('Investments')
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(upsertHolding, initialState)

  const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

  return (
    <>
      {trigger === 'button' ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus size={16} />
          {t('addHolding')}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded p-1 text-text-tertiary hover:text-accent"
          aria-label={t('editHolding')}
        >
          <Pencil size={14} />
        </button>
      )}

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={prefill ? t('editHolding') : t('addHolding')}>
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          {prefill && <input type="hidden" name="id" value={prefill.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('symbol')} <span className="text-status-danger">*</span></label>
            <input name="symbol" required defaultValue={prefill?.symbol} placeholder={t('symbolPlaceholder')} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('name')}</label>
            <input name="name" defaultValue={prefill?.name ?? ''} placeholder={t('namePlaceholder')} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('type')} <span className="text-status-danger">*</span></label>
            <select name="asset_type" defaultValue={prefill?.asset_type ?? 'etf'} className={inputClass}>
              {ASSET_TYPE_VALUES.map(v => (
                <option key={v} value={v}>{t(`assetTypes.${v}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('account')} <span className="text-status-danger">*</span></label>
            <select name="account_id" defaultValue={prefill?.account_id ?? ''} required className={inputClass}>
              <option value=""></option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">{t('quantity')} <span className="text-status-danger">*</span></label>
              <input name="quantity" type="number" step="any" min="0" required defaultValue={prefill?.quantity} className={inputClass} />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-text-primary">{t('currency')}</label>
              <input name="currency" defaultValue={prefill?.currency ?? 'EUR'} placeholder="EUR" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">{t('avgCost')}</label>
            <input name="avg_cost_basis" type="number" step="any" min="0" defaultValue={prefill?.avg_cost_basis ?? ''} placeholder={t('avgCostPlaceholder')} className={inputClass} />
          </div>

          <button type="submit" className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            {prefill ? t('editHolding') : t('addHolding')}
          </button>
        </form>
      </Drawer>
    </>
  )
}
