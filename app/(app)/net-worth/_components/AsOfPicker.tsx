'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

type Props = { asOf: string }

export function AsOfPicker({ asOf }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) params.set('asOf', e.target.value)
    else params.delete('asOf')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-text-secondary">As of</label>
      <input
        type="date"
        value={asOf}
        onChange={handleChange}
        className="rounded-lg border border-border-col bg-card-bg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </div>
  )
}
