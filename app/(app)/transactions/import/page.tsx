import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { ImportStepper } from './_components/ImportStepper'
import { getTranslations } from 'next-intl/server'

export default async function ImportPage() {
  const supabase = await createClient()
  const t = await getTranslations('Transactions')

  const [accountsResult, categoriesResult] = await Promise.all([
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('*').order('name'),
  ])

  return (
    <div className="flex flex-col">
      <PageHeader title={t('import.title')} />
      <ImportStepper
        accounts={accountsResult.data ?? []}
        categories={categoriesResult.data ?? []}
      />
    </div>
  )
}
