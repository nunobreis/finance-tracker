'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { upsertBill } from './actions'
import type { Account, Category, RecurringBill } from '@/types/database'

type Props = {
  accounts: Account[]
  categories: Category[]
  prefill?: RecurringBill
  trigger?: 'button' | 'icon'
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

const initialState: { error?: string } = {}

export function AddBillDrawer({
  accounts,
  categories,
  prefill,
  trigger = 'button',
  isOpen: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: Props) {
  const t = useTranslations('RecurringBills')
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = isControlled ? controlledOpen : internalOpen
  const [state, formAction] = useActionState(upsertBill, initialState)

  function handleOpen() {
    if (isControlled) {
      onOpenChange?.(true)
    } else {
      setInternalOpen(true)
    }
  }

  function handleClose() {
    if (isControlled) {
      onOpenChange?.(false)
    } else {
      setInternalOpen(false)
    }
  }

  const expenseCategories = categories.filter(c => c.kind === 'expense')

  return (
    <>
      {!hideTrigger && (trigger === 'button' ? (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-teal px-3.5 text-caption font-semibold text-white transition-colors hover:bg-teal-deep cursor-pointer"
        >
          <Plus size={14} />
          <span>{t('addBill')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-teal cursor-pointer"
          aria-label={t('editBill')}
        >
          <Pencil size={14} />
        </button>
      ))}

      <Drawer
        isOpen={isOpen}
        onClose={handleClose}
        title={prefill ? t('editBill') : t('addRecurringBill')}
      >
        {state?.error && (
          <div className="mb-4 rounded-xl bg-negative-tint px-4 py-3 text-caption font-medium text-negative">
            {state.error}
          </div>
        )}
        <form action={formAction} className="flex flex-col gap-3.5">
          {prefill && <input type="hidden" name="id" value={prefill.id} />}

          <Input
            name="name"
            required
            defaultValue={prefill?.name}
            placeholder={t('billNamePlaceholder')}
            label={`${t('billSubscriptionName')} *`}
          />

          <Select
            name="category_id"
            defaultValue={prefill?.category_id ?? ''}
            label={t('category')}
          >
            <option value="">{t('none')}</option>
            {expenseCategories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            name="account_id"
            defaultValue={prefill?.account_id ?? ''}
            label={t('account')}
          >
            <option value="">{t('none')}</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8">
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={prefill?.amount}
                placeholder="0.00"
                label={`${t('amount')} *`}
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
              </Select>
            </div>
          </div>

          <Select
            name="frequency"
            required
            defaultValue={prefill?.frequency ?? 'monthly'}
            label={`${t('billingFrequency')} *`}
          >
            <option value="weekly">{t('frequencies.weekly')}</option>
            <option value="monthly">{t('frequencies.monthly')}</option>
            <option value="quarterly">{t('frequencies.quarterly')}</option>
            <option value="yearly">{t('frequencies.yearly')}</option>
          </Select>

          <Input
            name="next_due_on"
            type="date"
            required
            defaultValue={prefill?.next_due_on}
            label={`${t('nextDueDate')} *`}
          />

          <Input
            name="reminder_days_before"
            type="number"
            min="0"
            defaultValue={prefill?.reminder_days_before ?? 3}
            label={t('reminderDays')}
          />

          <div className="pt-1">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              {prefill ? t('editBill') : t('addBill')}
            </Button>
          </div>
        </form>
      </Drawer>
    </>
  )
}
