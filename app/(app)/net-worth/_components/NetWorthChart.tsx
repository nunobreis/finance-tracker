'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { NetWorthSnapshot } from '@/types/database'
import { formatCurrency, formatShortCurrency } from '@/lib/utils'
import { useTranslations } from 'next-intl'

type Props = {
  snapshots: NetWorthSnapshot[]
  reportingCurrency: string
  reportingRate: number
}

function formatMonthLabel(dateStr: string) {
  const [year, month] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function NetWorthChart({ snapshots, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('NetWorth')

  if (snapshots.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        {t('noDataYet')}
      </div>
    )
  }

  const data = snapshots.map(s => ({
    date: s.snapshot_date,
    label: formatMonthLabel(s.snapshot_date),
    total: Number(s.total_eur) * reportingRate,
  }))

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">{t('netWorthLabel')}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-col)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value: number) => formatShortCurrency(value, reportingCurrency)}
            tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value: unknown) =>
              formatCurrency(typeof value === 'number' ? value : Number(value), reportingCurrency)
            }
            labelFormatter={(_label, payload) => {
              const raw = (payload?.[0]?.payload as { date?: string } | undefined)?.date
              return raw
                ? new Date(raw + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : String(_label ?? '')
            }}
            contentStyle={{
              backgroundColor: 'var(--color-card-bg)',
              border: '1px solid var(--color-border-col)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name={t('netWorthLabel')}
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#netWorthGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
