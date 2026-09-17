import { describe, it, expect } from 'vitest'
import { getCategoryId, MONZO_CATEGORY_MAP } from '@/lib/categories'
import type { Category } from '@/types/database'

const mockCategories: Category[] = [
  { id: 'cat-food', user_id: 'u1', name: 'Food & Grocery', kind: 'expense', parent_category_id: null, is_system: true },
  { id: 'cat-transport', user_id: 'u1', name: 'Transport', kind: 'expense', parent_category_id: null, is_system: true },
  { id: 'cat-eating-out', user_id: 'u1', name: 'Eating Out', kind: 'expense', parent_category_id: null, is_system: true },
]

describe('getCategoryId', () => {
  it('maps groceries → Food & Grocery', () => {
    expect(getCategoryId('groceries', mockCategories)).toBe('cat-food')
  })
  it('maps transport → Transport', () => {
    expect(getCategoryId('transport', mockCategories)).toBe('cat-transport')
  })
  it('maps eating_out → Eating Out', () => {
    expect(getCategoryId('eating_out', mockCategories)).toBe('cat-eating-out')
  })
  it('returns null for unknown Monzo category', () => {
    expect(getCategoryId('unknown_xyz', mockCategories)).toBeNull()
  })
  it('returns null when mapped name not in category list', () => {
    // holidays → Travel, but Travel not in mockCategories
    expect(getCategoryId('holidays', mockCategories)).toBeNull()
  })
})

describe('MONZO_CATEGORY_MAP', () => {
  it('has all required mappings', () => {
    expect(MONZO_CATEGORY_MAP['groceries']).toBe('Food & Grocery')
    expect(MONZO_CATEGORY_MAP['eating_out']).toBe('Eating Out')
    expect(MONZO_CATEGORY_MAP['transport']).toBe('Transport')
    expect(MONZO_CATEGORY_MAP['entertainment']).toBe('Entertainment')
    expect(MONZO_CATEGORY_MAP['bills']).toBe('Utilities')
  })
})
