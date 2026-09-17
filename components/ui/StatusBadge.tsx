type Color = 'good' | 'warn' | 'danger' | 'neutral' | 'accent'

type Props = {
  label: string
  color?: Color
}

const colorMap: Record<Color, string> = {
  good:    'bg-good-bg text-status-good',
  warn:    'bg-warn-bg text-status-warn',
  danger:  'bg-danger-bg text-status-danger',
  neutral: 'bg-content-bg text-text-secondary',
  accent:  'bg-accent-light text-accent',
}

export function StatusBadge({ label, color = 'neutral' }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color]}`}>
      {label}
    </span>
  )
}
