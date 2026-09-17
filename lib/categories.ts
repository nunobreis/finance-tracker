import type { CategoryKind, Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

// Re-export pure utilities so server code can import from one place
export { MONZO_CATEGORY_MAP, getCategoryId } from '@/lib/categories-utils'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']

const SYSTEM_CATEGORIES: Array<{ name: string; kind: CategoryKind }> = [
  { name: 'Housing',        kind: 'expense'  },
  { name: 'Food & Grocery', kind: 'expense'  },
  { name: 'Eating Out',     kind: 'expense'  },
  { name: 'Transport',      kind: 'expense'  },
  { name: 'Entertainment',  kind: 'expense'  },
  { name: 'Health',         kind: 'expense'  },
  { name: 'Personal Care',  kind: 'expense'  },
  { name: 'Utilities',      kind: 'expense'  },
  { name: 'Subscriptions',  kind: 'expense'  },
  { name: 'Shopping',       kind: 'expense'  },
  { name: 'Travel',         kind: 'expense'  },
  { name: 'Other',          kind: 'expense'  },
  { name: 'Income',         kind: 'income'   },
  { name: 'Transfer',       kind: 'transfer' },
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
    ...c,
    user_id: userId,
    is_system: true,
    parent_category_id: null,
  }))
  await supabase.from('categories').insert(rows)
}
