import { describe, it, expect } from 'vitest'
import { computeHoldingValue } from '@/lib/holdings'

describe('computeHoldingValue', () => {
  it('computes value, cost, P&L and percentage in EUR', () => {
    const result = computeHoldingValue(10, 100, 80, 1)
    expect(result.value_eur).toBeCloseTo(1000)
    expect(result.cost_eur).toBeCloseTo(800)
    expect(result.pnl_eur).toBeCloseTo(200)
    expect(result.pnl_pct).toBeCloseTo(25)
  })

  it('applies eurRate to convert non-EUR holding', () => {
    const result = computeHoldingValue(10, 100, 80, 1.18)
    expect(result.value_eur).toBeCloseTo(1180)
    expect(result.cost_eur).toBeCloseTo(944)
    expect(result.pnl_eur).toBeCloseTo(236)
  })

  it('returns zero P&L when avgCostBasis is null', () => {
    const result = computeHoldingValue(10, 100, null, 1)
    expect(result.pnl_eur).toBe(0)
    expect(result.pnl_pct).toBe(0)
    expect(result.cost_eur).toBe(0)
  })

  it('handles zero quantity', () => {
    const result = computeHoldingValue(0, 100, 80, 1)
    expect(result.value_eur).toBe(0)
    expect(result.pnl_eur).toBe(0)
  })

  it('returns negative P&L when price is below cost', () => {
    const result = computeHoldingValue(10, 60, 80, 1)
    expect(result.pnl_eur).toBeCloseTo(-200)
    expect(result.pnl_pct).toBeCloseTo(-25)
  })
})
