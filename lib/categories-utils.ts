import type { Category } from '@/types/database'

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
