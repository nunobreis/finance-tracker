'use client'

import { useState } from 'react'
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
import { cn, formatDate, formatMoney, formatShortCurrency } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'

type Props = {
  snapshots: NetWorthSnapshot[]
  reportingCurrency: string
  reportingRate: number
}

const RANGES = ['1M', '3M', '6M', '1Y', 'ALL'] as const
type RangeKey = (typeof RANGES)[number]

const RANGE_DAYS: Record<Exclude<RangeKey, 'ALL'>, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
}

export function NetWorthChart({ snapshots, reportingCurrency, reportingRate }: Props) {
  const t = useTranslations('NetWorth')
  const locale = useLocale()
  const [range, setRange] = useState<RangeKey>('6M')

  if (snapshots.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[16px] bg-canvas p-4 text-body-sm text-text-secondary lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-6 lg:shadow-xs">
        {t('noDataYet')}
      </div>
    )
  }

  const latestDateStr = snapshots[snapshots.length - 1]?.snapshot_date
  const referenceTime = latestDateStr
    ? new Date(`${latestDateStr}T00:00:00`).getTime()
    : Date.now()

  const filteredSnapshots =
    range === 'ALL'
      ? snapshots
      : snapshots.filter((s) => {
          const days = RANGE_DAYS[range]
          const cutoff = referenceTime - days * 24 * 60 * 60 * 1000
          return new Date(`${s.snapshot_date}T00:00:00`).getTime() >= cutoff
        })

  const activeSnapshots = filteredSnapshots.length > 0 ? filteredSnapshots : snapshots

  const data = activeSnapshots.map((s) => ({
    date: s.snapshot_date,
    label: formatDate(s.snapshot_date, locale),
    total: Number(s.total_eur) * reportingRate,
  }))

  return (
    <div className="rounded-[16px] bg-canvas p-4 lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-6 lg:shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-body-sm font-bold text-ink lg:text-h2">
          {t('netWorthLabel')}
        </h3>
        <div className="inline-flex items-center gap-0.5 rounded-full bg-surface p-1 lg:bg-canvas">
          {RANGES.map((key) => {
            const active = range === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-label font-semibold transition-colors cursor-pointer',
                  active
                    ? 'bg-teal text-white shadow-xs'
                    : 'text-text-secondary hover:text-ink'
                )}
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-teal)" stopOpacity={0.28} />
              <stop offset="95%" stopColor="var(--color-teal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-separator)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value: number) => formatShortCurrency(value, reportingCurrency, locale)}
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip
            formatter={(value: unknown) =>
              formatMoney(typeof value === 'number' ? value : Number(value), reportingCurrency, locale)
            }
            labelFormatter={(_label, payload) => {
              const raw = (payload?.[0]?.payload as { date?: string } | undefined)?.date
              return raw ? formatDate(raw, locale, { includeYear: true }) : String(_label ?? '')
            }}
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-separator)',
              borderRadius: '12px',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name={t('netWorthLabel')}
            stroke="var(--color-teal)"
            strokeWidth={2.5}
            fill="url(#netWorthGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
