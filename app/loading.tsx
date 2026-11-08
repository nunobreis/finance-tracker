import { NorteSplash } from '@/components/brand/NorteSplash'

/**
 * Root-level loading screen shown by Next.js while the app shell suspends.
 * Reuses the same gradient + wordmark as the Login page.
 */
export default function RootLoading() {
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-linear-to-b from-ink via-teal via-60% to-teal-dark px-6 py-10">
      <NorteSplash />
    </main>
  )
}
