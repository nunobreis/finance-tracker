'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { saveSettings } from '../actions'

const initialState: { error?: string; success?: string } = {}

type Props = {
  reportingCurrency: string
  locale: string
}

export function SettingsForm({ reportingCurrency, locale }: Props) {
  const t = useTranslations('Settings')
  const [state, formAction, isPending] = useActionState(saveSettings, initialState)

  return (
    <div className="rounded-[20px] border border-separator/80 bg-surface p-6 shadow-xs">
      <h2 className="mb-5 text-body font-bold text-ink lg:text-h2">{t('preferences')}</h2>

      {state?.error && (
        <div className="mb-4 rounded-xl bg-negative/10 px-4 py-3 text-body-sm text-negative" role="alert">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-xl bg-positive/10 px-4 py-3 text-body-sm text-positive" role="status">
          {t('saved')}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <Select
          label={t('reportingCurrency')}
          name="reporting_currency"
          defaultValue={reportingCurrency}
        >
          <option value="EUR">{t('currencies.EUR')}</option>
          <option value="GBP">{t('currencies.GBP')}</option>
        </Select>

        <Select
          label={t('language')}
          name="locale"
          defaultValue={locale}
        >
          <option value="en">{t('languages.en')}</option>
          <option value="pt-PT">{t('languages.pt-PT')}</option>
        </Select>

        <div className="pt-1">
          <Button type="submit" size="md" disabled={isPending} aria-busy={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t('save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
