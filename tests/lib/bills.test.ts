import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getBillStatus, advanceDueDate, toMonthlyEur, toAnnualEur } from '@/lib/bills'

describe('getBillStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-17'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns overdue when next_due_on is in the past', () => {
    expect(getBillStatus('2026-09-10', 3)).toBe('overdue')
  })
  it('returns overdue when next_due_on is yesterday', () => {
    expect(getBillStatus('2026-09-16', 3)).toBe('overdue')
  })
  it('returns due_soon when within reminder window', () => {
    expect(getBillStatus('2026-09-19', 3)).toBe('due_soon')
  })
  it('returns due_soon on exactly the reminder boundary', () => {
    expect(getBillStatus('2026-09-20', 3)).toBe('due_soon')
  })
  it('returns active when beyond reminder window', () => {
    expect(getBillStatus('2026-09-25', 3)).toBe('active')
  })
  it('returns due_soon when due today', () => {
    expect(getBillStatus('2026-09-17', 3)).toBe('due_soon')
  })
})

describe('advanceDueDate', () => {
  it('advances weekly by 7 days', () => {
    expect(advanceDueDate('2026-09-17', 'weekly')).toBe('2026-09-24')
  })
  it('advances monthly by 1 month', () => {
    expect(advanceDueDate('2026-09-17', 'monthly')).toBe('2026-10-17')
  })
  it('advances quarterly by 3 months', () => {
    expect(advanceDueDate('2026-09-17', 'quarterly')).toBe('2026-12-17')
  })
  it('advances yearly by 12 months', () => {
    expect(advanceDueDate('2026-09-17', 'yearly')).toBe('2027-09-17')
  })
  it('handles month-end correctly for monthly', () => {
    expect(advanceDueDate('2026-01-31', 'monthly')).toBe('2026-03-03')
  })
})

describe('toMonthlyEur', () => {
  it('monthly EUR bill returns amount unchanged', () => {
    expect(toMonthlyEur(100, 'EUR', 'monthly', 1.18)).toBeCloseTo(100)
  })
  it('monthly GBP bill converts to EUR', () => {
    expect(toMonthlyEur(100, 'GBP', 'monthly', 1.18)).toBeCloseTo(118)
  })
  it('yearly bill divided by 12', () => {
    expect(toMonthlyEur(120, 'EUR', 'yearly', 1.18)).toBeCloseTo(10)
  })
  it('quarterly bill divided by 3', () => {
    expect(toMonthlyEur(30, 'EUR', 'quarterly', 1.18)).toBeCloseTo(10)
  })
  it('weekly bill multiplied by 52/12', () => {
    expect(toMonthlyEur(10, 'EUR', 'weekly', 1.18)).toBeCloseTo(10 * 52 / 12)
  })
})

describe('toAnnualEur', () => {
  it('annual is monthly * 12', () => {
    expect(toAnnualEur(100, 'EUR', 'monthly', 1.18)).toBeCloseTo(1200)
  })
  it('yearly GBP bill converts and annualises', () => {
    expect(toAnnualEur(120, 'GBP', 'yearly', 1.18)).toBeCloseTo(120 * 1.18)
  })
})
