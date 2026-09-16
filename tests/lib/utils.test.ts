import { describe, it, expect } from 'vitest'
import { cn, formatEur, formatDate } from '@/lib/utils'

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

describe('formatDate', () => {
  it('formats a date string', () => {
    expect(formatDate('2026-09-16')).toBe('16 Sep 2026')
  })

  it('formats a Date object', () => {
    expect(formatDate(new Date('2026-01-01'))).toBe('01 Jan 2026')
  })
})
