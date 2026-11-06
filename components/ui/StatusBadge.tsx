type Color = 'good' | 'warn' | 'danger' | 'neutral' | 'accent' | 'info'

type Props = {
  label: string
  color?: Color
}

const colorMap: Record<Color, string> = {
  good:    'bg-positive-tint text-positive',
  warn:    'bg-warning-tint text-warning-deep',
  danger:  'bg-negative-tint text-negative',
  neutral: 'bg-canvas text-text-secondary',
  accent:  'bg-teal-tint text-teal',
  info:    'bg-info-tint text-info',
}

export function StatusBadge({ label, color = 'neutral' }: Props) {
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-label font-semibold ${colorMap[color]}`}>
      {label}
    </span>
  )
}
