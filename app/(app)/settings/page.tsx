import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { SettingsForm } from './_components/SettingsForm'
import { CategoriesSection } from './_components/CategoriesSection'
import { RulesSection } from './_components/RulesSection'

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
    <div className="flex flex-col">
      <PageHeader title={t('title')} />
      <div className="flex max-w-2xl flex-col gap-6 p-6">
        <SettingsForm reportingCurrency={reportingCurrency} locale={locale} />
        <CategoriesSection categories={categories ?? []} />
        <RulesSection
          rules={(rules ?? []) as React.ComponentProps<typeof RulesSection>['rules']}
          categories={(categories ?? []).filter(c => c.kind !== 'transfer')}
        />
      </div>
    </div>
  )
}
