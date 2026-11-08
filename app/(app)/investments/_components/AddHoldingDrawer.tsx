'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { upsertHolding } from '../actions'
import type { Account, Holding } from '@/types/database'

type Props = {
  accounts: Account[]
  prefill?: Holding
  trigger?: 'button' | 'icon'
}

const initialState: { error?: string } = {}

const ASSET_TYPE_VALUES = ['stock', 'etf', 'fund', 'crypto', 'other'] as const

export function AddHoldingDrawer({
  accounts,
  prefill,
  trigger = 'button',
}: Props) {
  const t = useTranslations('Investments')
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(upsertHolding, initialState)

  return (
    <>
      {trigger === 'button' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-teal px-3.5 text-caption font-semibold text-white transition-colors hover:bg-teal-deep cursor-pointer"
        >
          <Plus size={14} />
          <span>{t('addHolding')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-teal cursor-pointer"
          aria-label={t('editHolding')}
        >
          <Pencil size={14} />
        </button>
      )}

      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={prefill ? t('editHolding') : t('addInvestmentHolding')}
      >
        {state?.error && (
          <div className="mb-4 rounded-xl bg-negative-tint px-4 py-3 text-caption font-medium text-negative">
            {state.error}
          </div>
        )}
        <form action={formAction} className="flex flex-col gap-3.5">
          {prefill && <input type="hidden" name="id" value={prefill.id} />}

          <Input
            name="symbol"
            required
            defaultValue={prefill?.symbol}
            placeholder={t('symbolPlaceholder')}
            label={`${t('tickerSymbolLabel')} *`}
          />

          <Input
            name="name"
            defaultValue={prefill?.name ?? ''}
            placeholder={t('namePlaceholder')}
            label={t('name')}
          />

          <Select
            name="asset_type"
            defaultValue={prefill?.asset_type ?? 'etf'}
            label={`${t('assetTypeLabel')} *`}
          >
            {ASSET_TYPE_VALUES.map(v => (
              <option key={v} value={v}>
                {t(`assetTypes.${v}`)}
              </option>
            ))}
          </Select>

          <Select
            name="account_id"
            defaultValue={prefill?.account_id ?? ''}
            required
            label={`${t('account')} *`}
          >
            <option value=""></option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8">
              <Input
                name="quantity"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={prefill?.quantity}
                placeholder="0"
                label={`${t('quantitySharesLabel')} *`}
              />
            </div>
            <div className="col-span-4">
              <Select
                name="currency"
                defaultValue={prefill?.currency ?? 'EUR'}
                label={t('currency')}
              >
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
              </Select>
            </div>
          </div>

          <Input
            name="avg_cost_basis"
            type="number"
            step="any"
            min="0"
            defaultValue={prefill?.avg_cost_basis ?? ''}
            placeholder={t('avgCostPlaceholder')}
            label={t('avgCost')}
          />

          <div className="pt-1">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              {prefill ? t('saveChanges') : t('saveHolding')}
            </Button>
          </div>
        </form>
      </Drawer>
    </>
  )
}
