import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatMoney } from '@/lib/utils'
import type { NetWorthSnapshot } from '@/types/database'
import { Calendar } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

type Props = {
  snapshots: NetWorthSnapshot[]
  reportingCurrency: string
  reportingRate: number
}

export async function SnapshotHistory({ snapshots, reportingCurrency, reportingRate }: Props) {
  const t = await getTranslations('NetWorth')
  const locale = await getLocale()
  const sorted = [...snapshots].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date))

  return (
    <div className="flex flex-col gap-2.5 lg:gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body font-bold text-ink lg:text-h2">
          {t('snapshotHistory', { count: sorted.length })}
        </h3>
      </div>

      <div className="flex flex-col gap-2 lg:rounded-[20px] lg:border lg:border-separator/80 lg:bg-surface lg:p-4 lg:shadow-xs">
        {sorted.map((s, idx) => {
          const isLatest = idx === 0
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-[16px] bg-canvas px-4 py-3 lg:rounded-[14px] lg:bg-transparent lg:px-3 lg:py-2.5 lg:hover:bg-row-hover"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={
                    isLatest
                      ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-tint text-teal'
                      : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary lg:bg-canvas'
                  }
                >
                  <Calendar size={16} strokeWidth={2} />
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-body-sm font-semibold text-ink">
                    {t('snapshotItemTitle', {
                      date: formatDate(s.snapshot_date, locale, { includeYear: true }),
                    })}
                  </span>
                  {isLatest && (
                    <StatusBadge label={t('latestBadge')} color="good" />
                  )}
                </div>
              </div>
              <span className="shrink-0 text-body-sm font-bold tabular-nums text-ink">
                {formatMoney(Number(s.total_eur) * reportingRate, reportingCurrency, locale)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
