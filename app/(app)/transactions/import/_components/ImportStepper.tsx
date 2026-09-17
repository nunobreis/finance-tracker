'use client'

import { useState } from 'react'
import { parseRevolut } from '@/lib/csv/parsers/revolut'
import { parseMonzo } from '@/lib/csv/parsers/monzo'
import { UploadStep } from './UploadStep'
import { MapStep } from './MapStep'
import { PreviewStep } from './PreviewStep'
import { ConfirmStep } from './ConfirmStep'
import { useTranslations } from 'next-intl'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { Account, Category } from '@/types/database'

type Format = 'revolut' | 'monzo'

type StepData = {
  accountId: string
  format: Format
  records: Record<string, string>[]
  rows: NormalisedRow[]
  checked: boolean[]
}

type Props = { accounts: Account[]; categories: Category[] }

export function ImportStepper({ accounts, categories }: Props) {
  const t = useTranslations('Transactions')
  const STEPS = [t('import.upload'), t('import.map'), t('import.review'), t('import.confirm')]
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<StepData>>({})

  function handleUploadNext(uploaded: { accountId: string; format: Format; records: Record<string, string>[] }) {
    const rows = uploaded.format === 'revolut'
      ? parseRevolut(uploaded.records)
      : parseMonzo(uploaded.records)
    setData({ ...uploaded, rows, checked: rows.map(() => true) })
    setStep(1)
  }

  function handlePreviewNext(finalChecked: boolean[]) {
    setData(prev => ({ ...prev, checked: finalChecked }))
    setStep(3)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i === step ? 'bg-accent text-white' : i < step ? 'bg-status-good text-white' : 'bg-content-bg text-text-tertiary'}`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'font-medium text-text-primary' : 'text-text-tertiary'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="flex-1 border-t border-border-col" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border-col bg-card-bg p-6">
        {step === 0 && <UploadStep accounts={accounts} onNext={handleUploadNext} />}
        {step === 1 && data.rows && (
          <MapStep format={data.format!} rows={data.rows} onBack={() => setStep(0)} onNext={() => setStep(2)} />
        )}
        {step === 2 && data.rows && (
          <PreviewStep
            rows={data.rows}
            accountId={data.accountId!}
            categories={categories}
            onBack={() => setStep(1)}
            onNext={handlePreviewNext}
          />
        )}
        {step === 3 && data.rows && data.checked && (
          <ConfirmStep
            rows={data.rows}
            checked={data.checked}
            accountId={data.accountId!}
            accounts={accounts}
            categories={categories}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  )
}
