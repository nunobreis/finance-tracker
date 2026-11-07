'use client'

import { useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { detectFormat } from '@/lib/csv/detect'
import { Upload, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { deleteImportBatch } from '@/app/(app)/transactions/_components/actions'
import { formatDate } from '@/lib/utils'
import type { Account } from '@/types/database'

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

type Props = {
  accounts: Account[]
  recentBatches: RecentBatch[]
  onNext: (data: { accountId: string; format: Format; records: Record<string, string>[]; fileName: string }) => void
}

export function UploadStep({ accounts, recentBatches, onNext }: Props) {
  const t = useTranslations('Transactions')
  const searchParams = useSearchParams()
  const router = useRouter()
  const preselected = searchParams.get('account')
  const defaultAccount = accounts.find(a => a.id === preselected)?.id ?? accounts[0]?.id ?? ''
  const [accountId, setAccountId] = useState(defaultAccount)
  const [format, setFormat] = useState<Format | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [records, setRecords] = useState<Record<string, string>[]>([])
  const [confirmingUndoBatchId, setConfirmingUndoBatchId] = useState<string | null>(null)
  const [undoStatus, setUndoStatus] = useState<{ batchId: string; message: string; isError: boolean } | null>(null)
  const [undoingBatchId, setUndoingBatchId] = useState<string | null>(null)
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

  async function handleUndoBatch(batchId: string) {
    setUndoingBatchId(batchId)
    setUndoStatus(null)
    const result = await deleteImportBatch(batchId)
    setUndoingBatchId(null)
    setConfirmingUndoBatchId(null)
    if (result.error) {
      setUndoStatus({ batchId, message: result.error, isError: true })
    } else {
      setUndoStatus({ batchId, message: t('import.undoBatchSuccess'), isError: false })
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Target Account */}
      <Select
        label={t('import.targetAccount')}
        value={accountId}
        onChange={e => setAccountId(e.target.value)}
      >
        {accounts.map(a => (
          <option key={a.id} value={a.id}>
            {a.name} · {a.currency}
          </option>
        ))}
      </Select>

      {/* Dropzone */}
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed border-separator bg-canvas p-10 text-center hover:border-teal cursor-pointer transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
      >
        <Upload size={24} className="text-text-secondary" />
        <p className="text-body-sm text-text-secondary">{t('import.dropzone')}</p>
        <p className="text-caption text-text-muted">Revolut or Monzo export · max 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
      </div>

      {/* File detected status */}
      {fileName && format && (
        <div className="flex items-center gap-2 rounded-xl bg-positive-tint px-4 py-3 text-body-sm text-positive">
          <CheckCircle size={16} />
          <span>
            <strong>{fileName}</strong> — {format === 'revolut' ? 'Revolut' : 'Monzo'}{' '}
            format detected · {records.length} rows
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-negative-tint px-4 py-3 text-body-sm text-negative">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {/* Recent Import Batches */}
      {recentBatches.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-caption font-semibold text-text-secondary uppercase tracking-wide">
            {t('import.recentBatches')}
          </p>
          <div className="flex flex-col gap-2">
            {recentBatches.map(batch => {
              const isConfirming = confirmingUndoBatchId === batch.id
              const isUndoing = undoingBatchId === batch.id
              const statusMsg = undoStatus?.batchId === batch.id ? undoStatus : null

              return (
                <div
                  key={batch.id}
                  className="flex items-center justify-between gap-3 rounded-[12px] bg-canvas px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-body-sm font-semibold text-ink truncate">
                      {batch.filename ?? 'CSV Import'} · {batch.row_count ?? 0} rows
                    </span>
                    <span className="text-caption text-text-secondary">
                      {batch.accounts?.name ?? ''} · {formatDate(batch.imported_at)}
                    </span>
                    {statusMsg && (
                      <span className={`text-caption ${statusMsg.isError ? 'text-negative' : 'text-positive'}`}>
                        {statusMsg.message}
                      </span>
                    )}
                  </div>

                  {isConfirming ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-caption text-text-secondary">
                        {t('import.undoBatchConfirm', { count: batch.row_count ?? 0 })}
                      </span>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={isUndoing}
                        onClick={() => handleUndoBatch(batch.id)}
                      >
                        {isUndoing ? '…' : t('import.undoBatch')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmingUndoBatchId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmingUndoBatchId(batch.id)}
                    >
                      <Trash2 size={14} />
                      {t('import.undoBatch')}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!format || !accountId}
        onClick={() => format && fileName && onNext({ accountId, format, records, fileName })}
      >
        Continue to column mapping
      </Button>
    </div>
  )
}
