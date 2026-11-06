'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { updateCategoryTaxFields } from '../actions'
import type { Category } from '@/types/database'
import { IRS_DEDUCTION_VALUES, INCOME_TYPE_VALUES } from '@/types/database'

type Props = { categories: Category[] }

const selectClass =
  'rounded-lg border border-border-col bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

export function CategoriesSection({ categories }: Props) {
  const t = useTranslations('Categories')
  const [state, formAction, isPending] = useActionState(updateCategoryTaxFields, {})

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('title')}</h2>
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isPending ? t('saving') : t('save')}
          </button>
          {!isPending && state?.error && (
            <span role="alert" className="rounded-lg bg-danger-bg px-3 py-1.5 text-sm text-status-danger">
              {state.error}
            </span>
          )}
          {!isPending && state?.success && (
            <span role="status" className="rounded-lg bg-good-bg px-3 py-1.5 text-sm text-status-good">
              {state.success === 'unchanged' ? t('noChanges') : t('saved')}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
