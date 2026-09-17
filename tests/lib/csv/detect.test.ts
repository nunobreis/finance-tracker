import { describe, it, expect } from 'vitest'
import { detectFormat } from '@/lib/csv/detect'

describe('detectFormat', () => {
  it('detects Revolut from headers', () => {
    expect(detectFormat(['Type', 'Started Date', 'Completed Date', 'Amount', 'Currency'])).toBe('revolut')
  })
  it('detects Monzo from headers', () => {
    expect(detectFormat(['Transaction ID', 'Date', 'Money Out', 'Money In', 'Amount'])).toBe('monzo')
  })
  it('returns null for unrecognised headers', () => {
    expect(detectFormat(['Date', 'Amount', 'Description'])).toBeNull()
  })
  it('is case-sensitive — real CSV headers have fixed casing', () => {
    expect(detectFormat(['transaction id', 'money out'])).toBeNull()
  })
})
