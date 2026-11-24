import { cn } from '@/lib/utils'
import { NorteSplash } from './NorteSplash'

type Props = {
  /** Screen-reader text, e.g. "Loading…" */
  label: string
  /** Cover the whole viewport (app shell and tab bar included) instead of flowing in the page. */
  overlay?: boolean
}

/** Full-screen brand splash: the Norte gradient, logo + wordmark, and a quiet spinner. */
export function SplashScreen({ label, overlay = false }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-linear-to-b from-ink via-teal via-60% to-teal-dark px-6 py-10',
        overlay && 'fixed inset-0 z-[100]',
      )}
    >
      <NorteSplash />
      <div
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-[3px] border-glass-20 border-t-white motion-reduce:animate-none"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
