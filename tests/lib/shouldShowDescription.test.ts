import { describe, it, expect } from 'vitest'
import { shouldShowDescription } from '@/lib/utils'

describe('shouldShowDescription', () => {
  it('returns false when description equals merchant (same case)', () => {
    expect(shouldShowDescription('Lidl', 'Lidl')).toBe(false)
  })

  it('returns true when description differs from merchant', () => {
    expect(shouldShowDescription('Lidl Supermarket', 'Lidl')).toBe(true)
  })

  it('returns false when description is null', () => {
    expect(shouldShowDescription(null, 'Lidl')).toBe(false)
  })

  it('returns false when description is undefined', () => {
    expect(shouldShowDescription(undefined, 'Lidl')).toBe(false)
  })

  it('returns false when description is empty string', () => {
    expect(shouldShowDescription('', 'Lidl')).toBe(false)
  })

  it('returns true when description is set and merchant is null', () => {
    expect(shouldShowDescription('Some description', null)).toBe(true)
  })

  it('returns true when description is set and merchant is undefined', () => {
    expect(shouldShowDescription('Some description', undefined)).toBe(true)
  })

  it('returns false with case difference (description lowercase, merchant mixed)', () => {
    expect(shouldShowDescription('lidl supermarket', 'Lidl Supermarket')).toBe(false)
  })

  it('returns false with leading/trailing whitespace difference', () => {
    expect(shouldShowDescription('Lidl Supermarket ', 'lidl supermarket')).toBe(false)
  })
})
