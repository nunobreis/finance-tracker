import { describe, it, expect } from 'vitest'
import { aggregateNetWorth } from '@/lib/net-worth'

const EUR = (c: string) => c === 'EUR' ? 1 : 1.18

describe('aggregateNetWorth', () => {
  it('sums a single EUR account', () => {
    const result = aggregateNetWorth(
      [{ id: '1', name: 'Revolut EUR', currency: 'EUR', balance: 1000 }],
      [],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1000)
    expect(result.breakdown.accounts[0].balance_eur).toBeCloseTo(1000)
    expect(result.breakdown.accounts[0].balance_native).toBeCloseTo(1000)
  })

  it('converts a GBP account balance to EUR', () => {
    const result = aggregateNetWorth(
      [{ id: '1', name: 'Monzo', currency: 'GBP', balance: 1000 }],
      [],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1180)
    expect(result.breakdown.accounts[0].balance_eur).toBeCloseTo(1180)
    expect(result.breakdown.accounts[0].balance_native).toBeCloseTo(1000)
  })

  it('includes holding values in EUR total', () => {
    const result = aggregateNetWorth(
      [],
      [{ id: '1', symbol: 'VWCE.DE', currency: 'EUR', latestPrice: 100, quantity: 10 }],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1000)
    expect(result.breakdown.holdings[0].value_eur).toBeCloseTo(1000)
    expect(result.breakdown.holdings[0].value_native).toBeCloseTo(1000)
  })

  it('converts a GBP holding to EUR', () => {
    const result = aggregateNetWorth(
      [],
      [{ id: '1', symbol: 'SMT.L', currency: 'GBP', latestPrice: 10, quantity: 100 }],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1180)
  })

  it('sums accounts and holdings together', () => {
    const result = aggregateNetWorth(
      [{ id: '1', name: 'Cash', currency: 'EUR', balance: 500 }],
      [{ id: '2', symbol: 'AAPL', currency: 'EUR', latestPrice: 100, quantity: 5 }],
      EUR
    )
    expect(result.total_eur).toBeCloseTo(1000)
  })

  it('returns zero total with no data', () => {
    const result = aggregateNetWorth([], [], EUR)
    expect(result.total_eur).toBe(0)
    expect(result.breakdown.accounts).toHaveLength(0)
    expect(result.breakdown.holdings).toHaveLength(0)
  })
})
