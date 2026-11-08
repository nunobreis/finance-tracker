'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { updateCategoryTaxFields } from '../actions'
import type { Category } from '@/types/database'
import { IRS_DEDUCTION_VALUES, INCOME_TYPE_VALUES } from '@/types/database'

type Props = { categories: Category[] }

export function CategoriesSection({ categories }: Props) {
  const t = useTranslations('Categories')
  const [state, formAction, isPending] = useActionState(updateCategoryTaxFields, {})

  const expenseCategories = categories.filter(c => c.kind === 'expense')
  const incomeCategories = categories.filter(c => c.kind === 'income')

  return (
    <div className="rounded-[20px] border border-separator/80 bg-canvas lg:bg-surface p-6 shadow-xs">
      <h2 className="mb-5 text-body font-bold text-ink lg:text-h2">{t('title')}</h2>

      <form action={formAction} className="flex flex-col gap-6">
        {/* Mobile: cards (< lg) */}
        <div className="flex flex-col gap-3 lg:hidden">
          {expenseCategories.map(cat => (
            <div key={cat.id} className="rounded-xl bg-canvas px-4 py-3">
              <p className="mb-2 text-body-sm font-semibold text-ink">{cat.name}</p>
              <Select
                label={t('irsDeduction')}
                name={`irs_deduction_${cat.id}`}
                defaultValue={cat.irs_deduction ?? ''}
              >
                <option value="">{t('noMapping')}</option>
                {IRS_DEDUCTION_VALUES.map(v => (
                  <option key={v} value={v}>{t(`irsDeductionOptions.${v}`)}</option>
                ))}
              </Select>
            </div>
          ))}
          {incomeCategories.map(cat => (
            <div key={cat.id} className="rounded-xl bg-canvas px-4 py-3">
              <p className="mb-2 text-body-sm font-semibold text-ink">{cat.name}</p>
              <Select
                label={t('incomeType')}
                name={`income_type_${cat.id}`}
                defaultValue={cat.income_type ?? ''}
              >
                <option value="">{t('noMapping')}</option>
                {INCOME_TYPE_VALUES.map(v => (
                  <option key={v} value={v}>{t(`incomeTypeOptions.${v}`)}</option>
                ))}
              </Select>
            </div>
          ))}
        </div>

        {/* Desktop: table (>= lg) */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-separator text-label font-semibold uppercase tracking-wide text-text-secondary">
                <th className="pb-3 pr-4 text-left">{t('name')}</th>
                <th className="pb-3 pr-4 text-left">{t('irsDeduction')}</th>
                <th className="pb-3 text-left">{t('incomeType')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/50">
              {categories.map(cat => (
                <tr key={cat.id} className="transition-colors hover:bg-row-hover">
                  <td className="py-3 pr-4 font-medium text-ink">{cat.name}</td>
                  <td className="py-3 pr-4">
                    {cat.kind === 'expense' ? (
                      <select
                        name={`irs_deduction_${cat.id}`}
                        defaultValue={cat.irs_deduction ?? ''}
                        aria-label={t('irsDeduction')}
                        className="rounded-lg border border-separator bg-canvas px-2.5 py-1.5 text-body-sm text-ink outline-none focus:border-teal"
                      >
                        <option value="">{t('noMapping')}</option>
                        {IRS_DEDUCTION_VALUES.map(v => (
                          <option key={v} value={v}>{t(`irsDeductionOptions.${v}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    {cat.kind === 'income' ? (
                      <select
                        name={`income_type_${cat.id}`}
                        defaultValue={cat.income_type ?? ''}
                        aria-label={t('incomeType')}
                        className="rounded-lg border border-separator bg-canvas px-2.5 py-1.5 text-body-sm text-ink outline-none focus:border-teal"
                      >
                        <option value="">{t('noMapping')}</option>
                        {INCOME_TYPE_VALUES.map(v => (
                          <option key={v} value={v}>{t(`incomeTypeOptions.${v}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="md"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isPending ? t('saving') : t('save')}
          </Button>
          {!isPending && state?.error && (
            <span role="alert" className="rounded-xl bg-negative/10 px-3 py-2 text-body-sm text-negative">
              {state.error}
            </span>
          )}
          {!isPending && state?.success && (
            <span role="status" className="rounded-xl bg-positive/10 px-3 py-2 text-body-sm text-positive">
              {state.success === 'unchanged' ? t('noChanges') : t('saved')}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
