'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SplashScreen } from './SplashScreen'

/**
 * Has the app shell finished its first client render in this page load?
 * Module-level on purpose: it resets on a full reload / cold start, and stays
 * true across client-side navigations.
 */
let booted = false

/** Mount once in the app shell. Marks the cold start as finished after hydration. */
export function BootMarker() {
  useEffect(() => {
    booted = true
  }, [])
  return null
}

/**
 * Route loading UI.
 * - Cold start (first load, reload, opening the app from the home screen): the full
 *   brand splash over the whole screen, so you never see a blank light page while
 *   the first page's data loads.
 * - Later in-app navigation: the small spinner, so switching tabs stays light.
 *
 * On a cold start this fallback is server-rendered and then hydrated; `booted` is
 * still false at that point (BootMarker's effect hasn't run), so the client's first
 * render matches the server's. On later navigations the fallback mounts fresh on the
 * client with `booted` already true.
 */
export function PageLoading() {
  const [coldStart] = useState(() => !booted)
  const t = useTranslations('Common')
  return coldStart ? <SplashScreen overlay label={t('loading')} /> : <LoadingSpinner />
}
