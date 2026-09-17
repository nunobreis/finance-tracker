'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { saveSettings } from '../actions'

const initialState: { error?: string; success?: string } = {}

const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

type Props = {
  reportingCurrency: string
  locale: string
}

export function SettingsForm({ reportingCurrency, locale }: Props) {
  const t = useTranslations('Settings')
  const tCommon = useTranslations('Common')
  const [state, formAction] = useActionState(saveSettings, initialState)

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('preferences')}</h2>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">{t('saved')}</div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">{t('reportingCurrency')}</label>
          <select name="reporting_currency" defaultValue={reportingCurrency} className={inputClass}>
            <option value="EUR">{t('currencies.EUR')}</option>
            <option value="GBP">{t('currencies.GBP')}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">{t('language')}</label>
          <select name="locale" defaultValue={locale} className={inputClass}>
            <option value="en">{t('languages.en')}</option>
            <option value="pt-PT">{t('languages.pt-PT')}</option>
          </select>
        </div>
        <button type="submit" className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          {tCommon('save')}
        </button>
      </form>
    </div>
  )
}
