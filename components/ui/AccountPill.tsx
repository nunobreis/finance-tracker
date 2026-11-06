import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type Props = {
  label: string
  href?: string
}

export function AccountPill({ label, href = '/accounts' }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-glass-12 hover:bg-glass-20 border border-glass-20 py-2 pl-4 pr-3.5 text-caption font-medium text-white transition-colors"
    >
      <span>{label}</span>
      <ChevronRight size={16} />
    </Link>
  )
}
