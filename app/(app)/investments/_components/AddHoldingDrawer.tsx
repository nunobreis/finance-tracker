'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { upsertHolding } from '../actions'
import type { Account, Holding } from '@/types/database'

type Props = {
  accounts: Account[]
  prefill?: Holding
  trigger?: 'button' | 'icon'
}

const initialState: { error?: string } = {}

const ASSET_TYPES = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'fund', label: 'Fund' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' },
]

export function AddHoldingDrawer({ accounts, prefill, trigger = 'button' }: Props) {
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
          Add holding
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded p-1 text-text-tertiary hover:text-accent"
          aria-label="Edit holding"
        >
          <Pencil size={14} />
        </button>
      )}

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={prefill ? 'Edit holding' : 'Add holding'}>
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          {prefill && <input type="hidden" name="id" value={prefill.id} />}

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Symbol <span className="text-status-danger">*</span></label>
            <input name="symbol" required defaultValue={prefill?.symbol} placeholder="e.g. VWCE.DE, BTC-USD" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Name</label>
            <input name="name" defaultValue={prefill?.name ?? ''} placeholder="e.g. Vanguard FTSE All-World" className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Asset type <span className="text-status-danger">*</span></label>
            <select name="asset_type" defaultValue={prefill?.asset_type ?? 'etf'} className={inputClass}>
              {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Account <span className="text-status-danger">*</span></label>
            <select name="account_id" defaultValue={prefill?.account_id ?? ''} required className={inputClass}>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-text-primary">Quantity <span className="text-status-danger">*</span></label>
              <input name="quantity" type="number" step="any" min="0" required defaultValue={prefill?.quantity} className={inputClass} />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-text-primary">Currency</label>
              <input name="currency" defaultValue={prefill?.currency ?? 'EUR'} placeholder="EUR" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Avg cost basis</label>
            <input name="avg_cost_basis" type="number" step="any" min="0" defaultValue={prefill?.avg_cost_basis ?? ''} placeholder="Per unit" className={inputClass} />
          </div>

          <button type="submit" className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            {prefill ? 'Save changes' : 'Add holding'}
          </button>
        </form>
      </Drawer>
    </>
  )
}
