import { describe, it, expect } from 'vitest'
import { computeSpent, computeIncome } from '@/lib/summary'

const tx = (amount: number, opts: {
  currency?: string
  category_id?: string | null
  is_transfer?: boolean
} = {}) => ({
  amount,
  currency: opts.currency ?? 'EUR',
  category_id: opts.category_id ?? null,
  is_transfer: opts.is_transfer ?? false,
})

describe('computeSpent', () => {
  it('sums absolute value of negative amounts', () => {
    const rows = [tx(-100), tx(-50)]
    expect(computeSpent(rows, new Set())).toBe(150)
  })

  it('ignores positive amounts (income)', () => {
    const rows = [tx(-100), tx(200)]
    expect(computeSpent(rows, new Set())).toBe(100)
  })

  it('ignores transfers', () => {
    const rows = [tx(-100), tx(-50, { is_transfer: true })]
    expect(computeSpent(rows, new Set())).toBe(100)
  })

  it('ignores transactions whose category is excluded', () => {
    const rows = [tx(-100, { category_id: 'cat-mortgage' }), tx(-50)]
    expect(computeSpent(rows, new Set(['cat-mortgage']))).toBe(50)
  })

  it('includes uncategorised transactions even when excluded set is non-empty', () => {
    const rows = [tx(-100, { category_id: null }), tx(-50, { category_id: 'cat-mortgage' })]
    expect(computeSpent(rows, new Set(['cat-mortgage']))).toBe(100)
  })

  it('applies toEur conversion', () => {
    const rows = [tx(-100, { currency: 'GBP' }), tx(-50, { currency: 'EUR' })]
    const toEur = (amount: number, currency: string) =>
      currency === 'GBP' ? amount * 1.2 : amount
    expect(computeSpent(rows, new Set(), toEur)).toBeCloseTo(170)
  })
})

describe('computeIncome', () => {
  it('sums positive amounts', () => {
    const rows = [tx(1000), tx(500)]
    expect(computeIncome(rows, new Set())).toBe(1500)
  })

  it('ignores negative amounts (expenses)', () => {
    const rows = [tx(1000), tx(-200)]
    expect(computeIncome(rows, new Set())).toBe(1000)
  })

  it('ignores transfers', () => {
    const rows = [tx(1000), tx(500, { is_transfer: true })]
    expect(computeIncome(rows, new Set())).toBe(1000)
  })

  it('ignores transactions whose category is excluded', () => {
    const rows = [tx(1000, { category_id: 'cat-excluded' }), tx(500)]
    expect(computeIncome(rows, new Set(['cat-excluded']))).toBe(500)
  })

  it('applies toEur conversion', () => {
    const rows = [tx(1000, { currency: 'GBP' }), tx(500, { currency: 'EUR' })]
    const toEur = (amount: number, currency: string) =>
      currency === 'GBP' ? amount * 1.2 : amount
    expect(computeIncome(rows, new Set(), toEur)).toBeCloseTo(1700)
  })
})
