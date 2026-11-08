'use client'

import { useState, useEffect, useActionState } from 'react'
import { Plus } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createTransaction } from './actions'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { Account, Category } from '@/types/database'
import { getCategoryDisplayName } from '@/lib/categories-utils'

type TxType = 'expense' | 'income' | 'transfer'

type Props = {
  accounts: Account[]
  categories: Category[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  defaultTransfer?: boolean
  hideTrigger?: boolean
  triggerVariant?: 'primary' | 'glass'
}

const initialState: { error?: string; success?: boolean } = {}
const today = () => new Date().toISOString().split('T')[0]

/** IRS deduction label map — factual name only, no percentages */
const IRS_LABEL: Record<string, string> = {
  health: 'IRS: Health',
  education: 'IRS: Education',
  housing_rent: 'IRS: Housing (rent)',
  housing_interest: 'IRS: Housing (interest)',
  general_family: 'IRS: General / Family',
  'iva_sector.restaurants': 'IRS: Restaurants',
  'iva_sector.accommodation': 'IRS: Accommodation',
  'iva_sector.vehicles': 'IRS: Vehicles',
  'iva_sector.hairdressers': 'IRS: Hairdressers',
  'iva_sector.gym': 'IRS: Gym',
  'iva_sector.veterinary': 'IRS: Veterinary',
  'iva_sector.public_transport': 'IRS: Public transport',
  'iva_sector.books': 'IRS: Books',
  'iva_sector.culture': 'IRS: Culture',
  'iva_sector.press': 'IRS: Press',
  none: '',
}

function categoryLabel(c: Category, displayName: string): string {
  if (!c.irs_deduction || c.irs_deduction === 'none') return displayName
  const irs = IRS_LABEL[c.irs_deduction] ?? ''
  return irs ? `${displayName} · ${irs}` : displayName
}

export function AddTransactionDrawer({
  accounts,
  categories,
  isOpen: controlledOpen,
  onOpenChange,
  defaultTransfer = false,
  hideTrigger = false,
  triggerVariant = 'primary',
}: Props) {
  const t = useTranslations('Transactions')
  const tCat = useTranslations('Categories')
  const isControlled = controlledOpen !== undefined

  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? controlledOpen : internalOpen

  const [txType, setTxType] = useState<TxType>(defaultTransfer ? 'transfer' : 'expense')
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? '')
  const [rawAmount, setRawAmount] = useState('')

  const [state, formAction] = useActionState(createTransaction, initialState)

  // Sync txType when open state or defaultTransfer changes
  useEffect(() => {
    if (open) {
      setTxType(defaultTransfer ? 'transfer' : 'expense')
    }
  }, [open, defaultTransfer])

  // Close automatically on success
  useEffect(() => {
    if (state?.success) {
      if (isControlled) {
        onOpenChange?.(false)
      } else {
        setInternalOpen(false)
      }
      setRawAmount('')
    }
  }, [state?.success, isControlled, onOpenChange])

  function handleClose() {
    if (isControlled) {
      onOpenChange?.(false)
    } else {
      setInternalOpen(false)
    }
  }

  function handleOpen() {
    if (isControlled) {
      onOpenChange?.(true)
    } else {
      setInternalOpen(true)
    }
  }

  const selectedCurrency = accounts.find(a => a.id === selectedAccount)?.currency ?? 'EUR'
  const expenseCategories = categories.filter(c => c.kind === 'expense')
  const incomeCategories = categories.filter(c => c.kind === 'income')

  // The amount the form sends: pre-signed based on txType
  const amountNum = parseFloat(rawAmount)
  const signedAmount = !Number.isFinite(amountNum)
    ? ''
    : txType === 'expense'
    ? (-Math.abs(amountNum)).toString()
    : Math.abs(amountNum).toString()

  const TAB_TYPES: TxType[] = ['expense', 'income', 'transfer']
  const TAB_LABELS: Record<TxType, string> = {
    expense: t('form.txTypeExpense'),
    income: t('form.txTypeIncome'),
    transfer: t('form.txTypeTransfer'),
  }

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-caption font-semibold transition-colors cursor-pointer',
            triggerVariant === 'primary'
              ? 'bg-teal text-white hover:bg-teal-deep'
              : 'bg-glass-15 text-white border border-glass-30 hover:bg-glass-20'
          )}
        >
          <Plus size={14} />
          <span>{t('addTransaction')}</span>
        </button>
      )}

      <Drawer isOpen={open} onClose={handleClose} title={t('addTransaction')}>
        {state?.error && (
          <div className="mb-4 rounded-xl bg-negative-tint px-4 py-3 text-caption font-medium text-negative">
            {state.error}
          </div>
        )}

        {/* Segmented type control */}
        <div
          role="radiogroup"
          aria-label={t('form.txTypeLabel')}
          className="mb-5 flex items-center gap-1 rounded-full bg-canvas p-1"
        >
          {TAB_TYPES.map(type => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={txType === type}
              tabIndex={txType === type ? 0 : -1}
              onClick={() => setTxType(type)}
              className={cn(
                'flex-1 rounded-full py-1.5 text-caption font-semibold transition-colors',
                txType === type
                  ? 'bg-ink text-white'
                  : 'text-text-secondary hover:text-ink'
              )}
            >
              {TAB_LABELS[type]}
            </button>
          ))}
        </div>

        <form action={formAction} className="flex flex-col gap-3.5">
          {/* Hidden fields for server action */}
          <input type="hidden" name="tx_type" value={txType} />
          {txType === 'transfer' && (
            <input type="hidden" name="is_transfer" value="on" />
          )}

          <Input
            name="occurred_on"
            type="date"
            required
            defaultValue={today()}
            label={`${t('date')} *`}
          />

          <Select
            name="account_id"
            required
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
            label={`${t('account')} *`}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </option>
            ))}
          </Select>

          {/* Amount row with currency badge */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8">
              <Input
                name="_amount_display"
                type="number"
                step="0.01"
                min="0.01"
                required
                autoComplete="off"
                value={rawAmount}
                onChange={e => setRawAmount(e.target.value)}
                placeholder={t('form.amountPlaceholder')}
                label={`${t('amount')} *`}
              />
            </div>
            <div className="col-span-4">
              <Input
                name="currency"
                value={selectedCurrency}
                readOnly
                label={t('currency')}
                containerClassName="opacity-70"
              />
            </div>
          </div>

          {/* Hidden signed amount — the server action reads this */}
          <input type="hidden" name="amount" value={signedAmount} />

          <Input
            name="merchant"
            type="text"
            placeholder={t('form.merchantPlaceholder')}
            label={t('merchant')}
          />
          <Input
            name="description"
            type="text"
            placeholder={t('form.descriptionPlaceholder')}
            label={t('description')}
          />

          {/* Category (expense / income) or Destination account (transfer) */}
          {txType === 'expense' && (
            <Select name="category_id" label={t('category')}>
              <option value="">{t('form.noCategory')}</option>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>
                  {categoryLabel(c, getCategoryDisplayName(c, tCat))}
                </option>
              ))}
            </Select>
          )}

          {txType === 'income' && (
            <Select name="category_id" label={t('category')}>
              <option value="">{t('form.noCategory')}</option>
              {incomeCategories.map(c => (
                <option key={c.id} value={c.id}>
                  {categoryLabel(c, getCategoryDisplayName(c, tCat))}
                </option>
              ))}
            </Select>
          )}

          {txType === 'transfer' && (
            <Select
              name="linked_account_id"
              required
              label={`${t('form.destinationAccount')} *`}
            >
              <option value="">{t('form.destinationAccountPlaceholder')}</option>
              {accounts
                .filter(a => a.id !== selectedAccount)
                .map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
            </Select>
          )}

          <div className="pt-1">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              {t('form.save')}
            </Button>
          </div>
        </form>
      </Drawer>
    </>
  )
}
