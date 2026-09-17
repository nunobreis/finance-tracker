import type { Category, CategoryKind, Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']

export const MONZO_CATEGORY_MAP: Record<string, string> = {
  groceries:     'Food & Grocery',
  eating_out:    'Eating Out',
  transport:     'Transport',
  entertainment: 'Entertainment',
  health:        'Health',
  personal_care: 'Personal Care',
  bills:         'Utilities',
  shopping:      'Shopping',
  holidays:      'Travel',
  general:       'Other',
}

export function getCategoryId(
  rawCategory: string,
  categories: Category[]
): string | null {
  const mappedName = MONZO_CATEGORY_MAP[rawCategory]
  if (!mappedName) return null
  return categories.find(c => c.name === mappedName)?.id ?? null
}

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
