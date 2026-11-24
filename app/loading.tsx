import { getTranslations } from 'next-intl/server'
import { SplashScreen } from '@/components/brand/SplashScreen'

/** Root-level loading screen shown while the app shell (auth check) suspends. */
export default async function RootLoading() {
  const t = await getTranslations('Common')
  return <SplashScreen label={t('loading')} />
}
