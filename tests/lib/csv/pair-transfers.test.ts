import { describe, it, expect } from 'vitest'
import { findTransferPairs } from '@/lib/csv/pair-transfers'

const row = (id: string, occurred_on: string, amount: number) => ({ id, occurred_on, amount })

describe('findTransferPairs', () => {
  it('returns empty for empty input', () => {
    expect(findTransferPairs([])).toEqual([])
  })

  it('returns empty for a single transfer row', () => {
    expect(findTransferPairs([row('a', '2026-11-01', -100)])).toEqual([])
  })

  it('pairs one positive and one negative on the same date', () => {
    const pairs = findTransferPairs([
      row('pos', '2026-11-01', 85),
      row('neg', '2026-11-01', -100),
    ])
    expect(pairs).toEqual([['pos', 'neg']])
  })

  it('does not pair rows on different dates', () => {
    const pairs = findTransferPairs([
      row('pos', '2026-11-01', 85),
      row('neg', '2026-11-02', -100),
    ])
    expect(pairs).toEqual([])
  })

  it('does not pair when two positives and one negative (ambiguous)', () => {
    const pairs = findTransferPairs([
      row('p1', '2026-11-01', 85),
      row('p2', '2026-11-01', 42),
      row('neg', '2026-11-01', -100),
    ])
    expect(pairs).toEqual([])
  })

  it('does not pair when two negatives and one positive (ambiguous)', () => {
    const pairs = findTransferPairs([
      row('pos', '2026-11-01', 85),
      row('n1', '2026-11-01', -50),
      row('n2', '2026-11-01', -50),
    ])
    expect(pairs).toEqual([])
  })

  it('pairs independently across different dates', () => {
    const pairs = findTransferPairs([
      row('pos1', '2026-11-01', 85),
      row('neg1', '2026-11-01', -100),
      row('pos2', '2026-11-03', 42),
      row('neg2', '2026-11-03', -50),
    ])
    expect(pairs).toHaveLength(2)
    expect(pairs).toContainEqual(['pos1', 'neg1'])
    expect(pairs).toContainEqual(['pos2', 'neg2'])
  })
})
