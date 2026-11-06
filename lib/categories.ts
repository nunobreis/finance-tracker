import type { CategoryKind, IrsDeduction, IncomeType, Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

// Re-export pure utilities so server code can import from one place
export { MONZO_CATEGORY_MAP, getCategoryId } from '@/lib/categories-utils'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']

const SYSTEM_CATEGORIES: Array<{
  name: string
  kind: CategoryKind
  irs_deduction?: IrsDeduction
  income_type?: IncomeType
}> = [
  { name: 'Housing',            kind: 'expense', irs_deduction: 'housing_rent' },
  { name: 'Food & Grocery',     kind: 'expense' },
  { name: 'Eating Out',         kind: 'expense', irs_deduction: 'iva_sector.restaurants' },
  { name: 'Transport',          kind: 'expense' },
  { name: 'Entertainment',      kind: 'expense' },
  { name: 'Health',             kind: 'expense', irs_deduction: 'health' },
  { name: 'Personal Care',      kind: 'expense' },
  { name: 'Utilities',          kind: 'expense' },
  { name: 'Subscriptions',      kind: 'expense' },
  { name: 'Shopping',           kind: 'expense' },
  { name: 'Travel',             kind: 'expense' },
  { name: 'Other',              kind: 'expense' },
  { name: 'Income',             kind: 'income',  income_type: 'employment_pt' },
  { name: 'Rental income (UK)', kind: 'income',  income_type: 'rental_foreign' },
  { name: 'Interest',           kind: 'income',  income_type: 'interest_foreign' },
  { name: 'Dividends',          kind: 'income',  income_type: 'dividends_foreign' },
  { name: 'Transfer',           kind: 'transfer' },
]

export async function seedCategoriesIfEmpty(userId: string): Promise<void> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_system', true)

  if (count && count > 0) return

  const rows: CategoryInsert[] = SYSTEM_CATEGORIES.map(c => ({
    user_id: userId,
    name: c.name,
    kind: c.kind,
    is_system: true,
    parent_category_id: null,
    irs_deduction: c.irs_deduction ?? null,
    income_type: c.income_type ?? null,
  }))
  await supabase.from('categories').insert(rows)
}
