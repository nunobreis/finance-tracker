import { type LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  accent?: boolean
}

export function SummaryCard({ label, value, subtitle, icon: Icon, accent = false }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-[20px] border border-separator/80 bg-surface p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-body-sm font-medium text-text-secondary">{label}</span>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${accent ? 'bg-teal-tint' : 'bg-canvas'}`}>
            <Icon size={16} className={accent ? 'text-teal' : 'text-text-secondary'} />
          </div>
        )}
      </div>
      <div>
        <span className="text-h1-sm font-bold text-ink tabular-nums">{value}</span>
        {subtitle && <p className="mt-1 text-caption text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  )
}
