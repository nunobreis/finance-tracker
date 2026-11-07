import type { ComponentProps } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { ScreenHero } from '@/components/layout/ScreenHero'
import { SettingsForm } from './_components/SettingsForm'
import { CategoriesSection } from './_components/CategoriesSection'
import { RulesSection } from './_components/RulesSection'
import { AccountSecuritySection } from './_components/AccountSecuritySection'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('Settings')

  const metadata = user?.user_metadata ?? {}
  const reportingCurrency = (metadata.reporting_currency as string) ?? 'EUR'
  const locale = (metadata.locale as string) ?? 'en'

  const [{ data: categories }, { data: rules }] = await Promise.all([
    supabase.from('categories').select('*').order('kind').order('name'),
    supabase
      .from('category_rules')
      .select('id, match_text, match_type, category_id, created_at, categories(name)')
      .order('created_at', { ascending: false }),
  ])

  return (
    <ScreenHero
      title={t('title')}
      eyebrow={t('heroEyebrow')}
      metric={user?.email ?? '—'}
      subtitle={t('heroSubtitle')}
    >
      <div className="flex flex-col gap-6">
        <SettingsForm reportingCurrency={reportingCurrency} locale={locale} />
        <RulesSection
          rules={(rules ?? []) as ComponentProps<typeof RulesSection>['rules']}
          categories={(categories ?? []).filter(c => c.kind !== 'transfer')}
        />
        <CategoriesSection categories={categories ?? []} />
        <AccountSecuritySection />
      </div>
    </ScreenHero>
  )
}
