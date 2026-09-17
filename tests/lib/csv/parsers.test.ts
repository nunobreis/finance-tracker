import { describe, it, expect } from 'vitest'
import { parseRevolut } from '@/lib/csv/parsers/revolut'
import { parseMonzo } from '@/lib/csv/parsers/monzo'

describe('parseRevolut', () => {
  const completedRow = {
    Type: 'CARD_PAYMENT',
    'Started Date': '2026-09-01 10:00:00',
    'Completed Date': '2026-09-01 10:05:00',
    Description: 'Tesco',
    Amount: '-25.50',
    Fee: '0.00',
    Currency: 'GBP',
    State: 'COMPLETED',
    Balance: '974.50',
  }

  it('parses a completed card payment', () => {
    const [result] = parseRevolut([completedRow])
    expect(result.occurred_on).toBe('2026-09-01')
    expect(result.amount).toBe(-25.5)
    expect(result.currency).toBe('GBP')
    expect(result.merchant).toBe('Tesco')
    expect(result.description).toBe('Tesco')
    expect(result.is_transfer).toBe(false)
    expect(result.external_id).toBeNull()
    expect(result.raw_category).toBeNull()
  })

  it('skips PENDING transactions', () => {
    const pending = { ...completedRow, State: 'PENDING' }
    expect(parseRevolut([pending])).toHaveLength(0)
  })

  it('skips FAILED transactions', () => {
    const failed = { ...completedRow, State: 'FAILED' }
    expect(parseRevolut([failed])).toHaveLength(0)
  })

  it('marks TRANSFER type as is_transfer', () => {
    const transfer = { ...completedRow, Type: 'TRANSFER' }
    const [result] = parseRevolut([transfer])
    expect(result.is_transfer).toBe(true)
  })

  it('handles date with only date part (no time)', () => {
    const row = { ...completedRow, 'Completed Date': '2026-09-15' }
    const [result] = parseRevolut([row])
    expect(result.occurred_on).toBe('2026-09-15')
  })
})

describe('parseMonzo', () => {
  const monzoRow = {
    'Transaction ID': 'tx_abc123def456',
    Date: '2026-09-01',
    Time: '10:30:00',
    Type: 'card_payment',
    Name: 'Waitrose',
    Emoji: '🛒',
    Category: 'groceries',
    Amount: '-18.40',
    Currency: 'GBP',
    'Local amount': '-18.40',
    'Local currency': 'GBP',
    'Notes and #tags': '',
    Address: '',
    Receipt: '',
    Description: 'Waitrose 123',
    'Category split': '',
    'Money Out': '18.40',
    'Money In': '',
  }

  it('parses a Monzo card payment', () => {
    const [result] = parseMonzo([monzoRow])
    expect(result.occurred_on).toBe('2026-09-01')
    expect(result.amount).toBe(-18.4)
    expect(result.currency).toBe('GBP')
    expect(result.merchant).toBe('Waitrose')
    expect(result.external_id).toBe('tx_abc123def456')
    expect(result.raw_category).toBe('groceries')
    expect(result.is_transfer).toBe(false)
  })

  it('marks pot_transfer as is_transfer', () => {
    const transfer = { ...monzoRow, Type: 'pot_transfer' }
    const [result] = parseMonzo([transfer])
    expect(result.is_transfer).toBe(true)
  })

  it('uses Description as fallback if Name is empty', () => {
    const row = { ...monzoRow, Name: '' }
    const [result] = parseMonzo([row])
    expect(result.merchant).toBe('Waitrose 123')
  })
})
