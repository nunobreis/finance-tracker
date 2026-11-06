import { describe, it, expect } from 'vitest'
import { cn, formatEur, formatDate, formatMoney } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts — last wins', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, 'bar')).toBe('foo bar')
  })

  it('preserves custom typography tokens alongside colour utilities', () => {
    expect(cn('text-body-sm', 'text-glass-60')).toBe('text-body-sm text-glass-60')
  })
})

describe('formatEur', () => {
  it('formats positive amount', () => {
    expect(formatEur(1234.56)).toBe('€1,234.56')
  })

  it('formats zero', () => {
    expect(formatEur(0)).toBe('€0.00')
  })

  it('formats negative amount', () => {
    expect(formatEur(-42.5)).toBe('-€42.50')
  })
})

describe('formatMoney', () => {
  it('formats positive and negative EUR in EN and PT-PT with true minus and no space', () => {
    expect(formatMoney(6539.64, 'EUR', 'en')).toBe('€6,539.64')
    expect(formatMoney(6539.64, 'EUR', 'pt-PT').replace(/\s/g, ' ')).toBe('6539,64 €')
    expect(formatMoney(-10, 'EUR', 'en')).toBe('−€10.00')
    expect(formatMoney(-10, 'EUR', 'pt-PT').replace(/\s/g, ' ')).toBe('−10,00 €')
    expect(formatMoney(10, 'EUR', 'en', { signDisplay: 'always' })).toBe('+€10.00')
  })
})

describe('formatDate', () => {
  it('formats a date string (legacy 1-arg)', () => {
    expect(formatDate('2026-09-16')).toBe('16 Sep 2026')
  })

  it('formats a Date object (legacy 1-arg)', () => {
    expect(formatDate(new Date('2026-01-01'))).toBe('01 Jan 2026')
  })

  it('formats locale-aware short dates for EN and PT-PT', () => {
    expect(formatDate('2026-10-31', 'en')).toBe('31 Oct')
    expect(formatDate('2026-10-31', 'pt-PT')).toBe('31 out.')
  })
})
