import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { SettingsForm } from './_components/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('Settings')

  const metadata = user?.user_metadata ?? {}
  const reportingCurrency = (metadata.reporting_currency as string) ?? 'EUR'
  const locale = (metadata.locale as string) ?? 'en'

  return (
    <div className="flex flex-col">
      <PageHeader title={t('title')} />
      <div className="flex max-w-lg flex-col gap-6 p-6">
        <SettingsForm reportingCurrency={reportingCurrency} locale={locale} />
      </div>
    </div>
  )
}
