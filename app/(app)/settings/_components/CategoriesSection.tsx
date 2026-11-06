'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { updateCategoryTaxFields } from '../actions'
import type { Category } from '@/types/database'
import { IRS_DEDUCTION_VALUES, INCOME_TYPE_VALUES } from '@/types/database'

type Props = { categories: Category[] }

const selectClass =
  'rounded-lg border border-border-col bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

export function CategoriesSection({ categories }: Props) {
  const t = useTranslations('Categories')
  const [state, formAction] = useActionState(updateCategoryTaxFields, {})

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('title')}</h2>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">
          {t('saved')}
        </div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-col text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="pb-2 pr-4 text-left">{t('name')}</th>
                <th className="pb-2 pr-4 text-left">{t('irsDeduction')}</th>
                <th className="pb-2 text-left">{t('incomeType')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-col">
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td className="py-2 pr-4 text-text-primary">{cat.name}</td>
                  <td className="py-2 pr-4">
                    {cat.kind === 'expense' ? (
                      <select
                        name={`irs_deduction_${cat.id}`}
                        defaultValue={cat.irs_deduction ?? ''}
                        className={selectClass}
                      >
                        <option value="">{t('noMapping')}</option>
                        {IRS_DEDUCTION_VALUES.map(v => (
                          <option key={v} value={v}>{t(`irsDeductionOptions.${v}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </td>
                  <td className="py-2">
                    {cat.kind === 'income' ? (
                      <select
                        name={`income_type_${cat.id}`}
                        defaultValue={cat.income_type ?? ''}
                        className={selectClass}
                      >
                        <option value="">{t('noMapping')}</option>
                        {INCOME_TYPE_VALUES.map(v => (
                          <option key={v} value={v}>{t(`incomeTypeOptions.${v}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="submit"
          className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {t('save')}
        </button>
      </form>
    </div>
  )
}
