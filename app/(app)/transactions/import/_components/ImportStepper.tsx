'use client'

import { useState } from 'react'
import { parseRevolut } from '@/lib/csv/parsers/revolut'
import { parseMonzo } from '@/lib/csv/parsers/monzo'
import { UploadStep } from './UploadStep'
import { MapStep } from './MapStep'
import { PreviewStep } from './PreviewStep'
import { ConfirmStep } from './ConfirmStep'
import { ScreenHero } from '@/components/layout/ScreenHero'
import { useTranslations } from 'next-intl'
import type { NormalisedRow } from '@/lib/csv/normalize'
import type { Account, Category, CategoryRule } from '@/types/database'

type Format = 'revolut' | 'monzo'

type RecentBatch = {
  id: string
  filename: string | null
  row_count: number | null
  status: string
  imported_at: string
  account_id: string
  accounts: { name: string } | null
}

type StepData = {
  accountId: string
  format: Format
  fileName: string
  records: Record<string, string>[]
  rows: NormalisedRow[]
  checked: boolean[]
  autoRuleCount: number
}

type Props = {
  accounts: Account[]
  categories: Category[]
  rules: CategoryRule[]
  recentBatches: RecentBatch[]
}

const STEP_COUNT = 4

export function ImportStepper({ accounts, categories, rules, recentBatches }: Props) {
  const t = useTranslations('Transactions')
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<StepData>>({})

  const stepLabels = [
    t('import.stepUpload'),
    t('import.stepMap'),
    t('import.stepPreview'),
    t('import.stepConfirm'),
  ]

  const stepHeadlines = [
    t('import.stepLabelUpload'),
    t('import.stepLabelMap'),
    t('import.stepLabelPreview'),
    t('import.stepLabelComplete'),
  ]

  const stepSubtitles = [
    t('import.stepSubtitleUpload'),
    t('import.stepSubtitleMap'),
    t('import.stepSubtitlePreview'),
    t('import.stepSubtitleComplete'),
  ]

  // For the complete state (step === 4) reuse the last headline
  const currentStep = Math.min(step, STEP_COUNT - 1)
  const heroTitle = stepHeadlines[currentStep]
  const heroEyebrow = `Step ${currentStep + 1} of ${STEP_COUNT} · ${stepLabels[currentStep]}`
  const heroSubtitle = stepSubtitles[currentStep]

  function handleUploadNext(uploaded: { accountId: string; format: Format; records: Record<string, string>[]; fileName: string }) {
    const rows = uploaded.format === 'revolut'
      ? parseRevolut(uploaded.records)
      : parseMonzo(uploaded.records)
    setData({ ...uploaded, rows, checked: rows.map(() => true) })
    setStep(1)
  }

  function handlePreviewNext(finalChecked: boolean[], autoCount: number) {
    setData(prev => ({ ...prev, checked: finalChecked, autoRuleCount: autoCount }))
    setStep(3)
  }

  return (
    <ScreenHero title={heroTitle} eyebrow={heroEyebrow} subtitle={heroSubtitle}>
      {/* Desktop progress bar */}
      <div className="hidden lg:flex items-center gap-1 mb-2">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              aria-current={i === currentStep ? 'step' : undefined}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-label font-semibold ${
              i < currentStep
                ? 'bg-teal text-white'
                : i === currentStep
                  ? 'bg-teal text-white ring-4 ring-teal/20'
                  : 'bg-canvas text-text-secondary'
            }`}>
              {i + 1}
            </div>
            <span className={`text-caption ${i === currentStep ? 'font-semibold text-ink' : 'text-text-secondary'}`}>
              {label}
            </span>
            {i < stepLabels.length - 1 && (
              <div className={`flex-1 h-px ${i < currentStep ? 'bg-teal' : 'bg-separator'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step card */}
      <div className="rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-6 lg:shadow-xs">
        {step === 0 && (
          <UploadStep
            accounts={accounts}
            recentBatches={recentBatches}
            onNext={handleUploadNext}
          />
        )}
        {step === 1 && data.rows && (
          <MapStep
            format={data.format!}
            rows={data.rows}
            records={data.records!}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && data.rows && (
          <PreviewStep
            rows={data.rows}
            accountId={data.accountId!}
            categories={categories}
            rules={rules}
            onBack={() => setStep(1)}
            onNext={handlePreviewNext}
          />
        )}
        {step === 3 && data.rows && data.checked && (
          <ConfirmStep
            rows={data.rows}
            checked={data.checked}
            accountId={data.accountId!}
            fileName={data.fileName ?? null}
            accounts={accounts}
            categories={categories}
            autoRuleCount={data.autoRuleCount ?? 0}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </ScreenHero>
  )
}
