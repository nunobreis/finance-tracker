import { createClient } from '@/lib/supabase/server'
import { ImportStepper } from './_components/ImportStepper'

export default async function ImportPage() {
  const supabase = await createClient()

  const [accountsResult, categoriesResult, rulesResult, batchesResult] = await Promise.all([
    supabase.from('accounts').select('*').eq('is_active', true).order('created_at'),
    supabase.from('categories').select('*').order('name'),
    supabase
      .from('category_rules')
      .select('id, user_id, match_text, match_key, match_type, category_id, created_at'),
    supabase
      .from('import_batches')
      .select('id, filename, row_count, status, imported_at, account_id, accounts(name)')
      .eq('status', 'completed')
      .order('imported_at', { ascending: false })
      .limit(5),
  ])

  return (
    <ImportStepper
      accounts={accountsResult.data ?? []}
      categories={categoriesResult.data ?? []}
      rules={rulesResult.data ?? []}
      recentBatches={(batchesResult.data ?? []) as RecentBatch[]}
    />
  )
}

type RecentBatch = {
  id: string
  filename: string | null
  row_count: number | null
  status: string
  imported_at: string
  account_id: string
  accounts: { name: string } | null
}
