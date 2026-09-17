'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { detectFormat } from '@/lib/csv/detect'
import { Upload, CheckCircle, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Account } from '@/types/database'

type Format = 'revolut' | 'monzo'

type Props = {
  accounts: Account[]
  onNext: (data: { accountId: string; format: Format; records: Record<string, string>[] }) => void
}

export function UploadStep({ accounts, onNext }: Props) {
  const t = useTranslations('Transactions')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [format, setFormat] = useState<Format | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [records, setRecords] = useState<Record<string, string>[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    setFormat(null)
    setFileName(file.name)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        const headers = result.meta.fields ?? []
        const detected = detectFormat(headers)
        if (!detected) {
          setError(t('import.unrecognisedFormat'))
          return
        }
        setFormat(detected)
        setRecords(result.data)
      },
      error(err) {
        setError(t('import.parseFailed', { message: err.message }))
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-text-primary">{t('account')} *</label>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </select>
      </div>

      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-col p-10 text-center hover:border-accent hover:bg-accent-light/20 cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        <Upload size={24} className="text-text-tertiary" />
        <p className="text-sm text-text-secondary">{t('import.dropzone')}</p>
        <p className="text-xs text-text-tertiary">Revolut or Monzo export · max 10 MB</p>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {fileName && format && (
        <div className="flex items-center gap-2 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">
          <CheckCircle size={16} />
          <span><strong>{fileName}</strong> — {format === 'revolut' ? 'Revolut' : 'Monzo'} format detected · {records.length} rows</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
          <XCircle size={16} />
          {error}
        </div>
      )}

      <button
        disabled={!format || !accountId}
        onClick={() => format && onNext({ accountId, format, records })}
        className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t('import.next')}
      </button>
    </div>
  )
}
