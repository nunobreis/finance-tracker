'use client'

import { useActionState } from 'react'
import { saveSettings } from '../actions'

const initialState: { error?: string; success?: string } = {}

const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

type Props = {
  reportingCurrency: string
  locale: string
}

export function SettingsForm({ reportingCurrency, locale }: Props) {
  const [state, formAction] = useActionState(saveSettings, initialState)

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">Preferences</h2>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">{state.success}</div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Reporting currency</label>
          <select name="reporting_currency" defaultValue={reportingCurrency} className={inputClass}>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
          </select>
          <p className="mt-1 text-xs text-text-tertiary">Full support wired up in Sub-project 5.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Language</label>
          <select name="locale" defaultValue={locale} className={inputClass}>
            <option value="en">English</option>
            <option value="pt-PT">Português (Portugal)</option>
          </select>
          <p className="mt-1 text-xs text-text-tertiary">Full translation available in Sub-project 5.</p>
        </div>
        <button type="submit" className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Save settings
        </button>
      </form>
    </div>
  )
}
