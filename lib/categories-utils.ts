import type { Category } from '@/types/database'

/**
 * Set of system category names as stored in the DB (from SYSTEM_CATEGORIES seed).
 * Used by getCategoryDisplayName to decide whether to look up an i18n key.
 */
const SYSTEM_CATEGORY_NAMES = new Set([
  'Housing',
  'Food & Grocery',
  'Eating Out',
  'Transport',
  'Entertainment',
  'Health',
  'Personal Care',
  'Utilities',
  'Subscriptions',
  'Shopping',
  'Travel',
  'Other',
  'Income',
  'Rental income (UK)',
  'Interest',
  'Dividends',
  'Transfer',
])

/**
 * Returns the translated display name for a category.
 *
 * - System categories (name in SYSTEM_CATEGORY_NAMES, or is_system === true): look up
 *   `Categories.systemNames.<name>`. If the key resolves to itself (i.e. next-intl
 *   found no translation), fall back to the stored name.
 * - User-created categories: return `category.name` verbatim.
 * - null / undefined: return ''.
 *
 * @param category  The category object (needs at least `name`; `is_system` optional).
 * @param t         The `useTranslations('Categories')` (or `getTranslations('Categories')`) function.
 */
export function getCategoryDisplayName(
  category: { name: string; is_system?: boolean | null } | null | undefined,
  t: (key: string) => string
): string {
  if (!category) return ''
  const isSystem =
    category.is_system === true || SYSTEM_CATEGORY_NAMES.has(category.name)
  if (!isSystem) return category.name
  const key = `systemNames.${category.name}`
  const translated = t(key)
  // next-intl returns the key verbatim when not found — detect and fall back
  if (translated === key) return category.name
  return translated
}

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
