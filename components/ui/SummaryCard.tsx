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
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-border-col bg-card-bg p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent ? 'bg-accent-light' : 'bg-content-bg'}`}>
            <Icon size={16} className={accent ? 'text-accent' : 'text-text-tertiary'} />
          </div>
        )}
      </div>
      <div>
        <span className="text-2xl font-semibold text-text-primary">{value}</span>
        {subtitle && <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>}
      </div>
    </div>
  )
}
