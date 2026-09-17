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

type Props = { snapshots: NetWorthSnapshot[] }

function formatShortEur(value: number) {
  if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(1)}k`
  return `€${value.toFixed(0)}`
}

function formatMonthLabel(dateStr: string) {
  const [year, month] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function NetWorthChart({ snapshots }: Props) {
  if (snapshots.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border-col bg-card-bg text-sm text-text-tertiary">
        No data yet — check back after your first snapshot
      </div>
    )
  }

  const data = snapshots.map(s => ({
    date: s.snapshot_date,
    label: formatMonthLabel(s.snapshot_date),
    total: Number(s.total_eur),
  }))

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">Net Worth Over Time</h3>
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
            tickFormatter={formatShortEur}
            tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value) => {
              const num = typeof value === 'number' ? value : Number(value)
              return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(num)
            }}
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
            name="Net Worth"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#netWorthGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
