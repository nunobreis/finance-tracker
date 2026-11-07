import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { ScreenHero } from '@/components/layout/ScreenHero'
import { AccountSecuritySection } from '../settings/_components/AccountSecuritySection'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('Account')
  const tSettings = await getTranslations('Settings')

  return (
    <ScreenHero
      title={t('title')}
      eyebrow={tSettings('heroEyebrow')}
      metric={user?.email ?? '—'}
      subtitle={tSettings('heroSubtitle')}
    >
      <div className="flex flex-col gap-4">
        <AccountSecuritySection />
      </div>
    </ScreenHero>
  )
}
