import { describe, it, expect } from 'vitest'
import { getDeductibleSpend } from '@/lib/tax/deductions'

type Tx = { amount: number; currency: string; category_id: string | null; is_transfer: boolean; irs_deduction_override?: string | null }
type Cat = { id: string; irs_deduction?: string | null }

const cat = (id: string, irs: string | null = null): Cat => ({ id, irs_deduction: irs })
const tx = (amount: number, categoryId: string | null, override?: string | null, currency = 'EUR'): Tx => ({
  amount, currency, category_id: categoryId, is_transfer: false, irs_deduction_override: override ?? null,
})

describe('getDeductibleSpend', () => {
  it('returns empty object when no transactions', () => {
    expect(getDeductibleSpend([], [])).toEqual({})
  })

  it('sums expenses by category irs_deduction', () => {
    expect(
      getDeductibleSpend([tx(-50, 'c1'), tx(-30, 'c1')], [cat('c1', 'health')])
    ).toEqual({ health: 80 })
  })

  it('override takes precedence over category mapping', () => {
    expect(
      getDeductibleSpend([tx(-40, 'c1', 'education')], [cat('c1', 'health')])
    ).toEqual({ education: 40 })
  })

  it('excludes transactions with null deduction type (no override, no category mapping)', () => {
    expect(getDeductibleSpend([tx(-40, 'c1')], [cat('c1', null)])).toEqual({})
  })

  it('excludes transactions where deduction type is "none"', () => {
    expect(getDeductibleSpend([tx(-40, 'c1')], [cat('c1', 'none')])).toEqual({})
  })

  it('excludes transfer transactions', () => {
    expect(
      getDeductibleSpend(
        [{ amount: -100, currency: 'EUR', category_id: 'c1', is_transfer: true, irs_deduction_override: null }],
        [cat('c1', 'health')]
      )
    ).toEqual({})
  })

  it('excludes income transactions (positive amount)', () => {
    expect(getDeductibleSpend([tx(500, 'c1')], [cat('c1', 'health')])).toEqual({})
  })

  it('groups multiple deduction types correctly', () => {
    expect(
      getDeductibleSpend(
        [tx(-50, 'c1'), tx(-30, 'c2'), tx(-20, 'c1')],
        [cat('c1', 'health'), cat('c2', 'iva_sector.restaurants')]
      )
    ).toEqual({ health: 70, 'iva_sector.restaurants': 30 })
  })

  it('skips transaction with no matching category', () => {
    expect(getDeductibleSpend([tx(-40, 'unknown')], [])).toEqual({})
  })

  it('excludes GBP expenses even in a deductible category', () => {
    expect(
      getDeductibleSpend([tx(-40, 'c1', null, 'GBP')], [cat('c1', 'health')])
    ).toEqual({})
  })
})
