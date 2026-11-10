import { describe, it, expect } from 'vitest'
import {
  normalise,
  matchTarget,
  applyRules,
  findMatchingRule,
  sanitiseSearchQuery,
  buildSearchOrFilter,
} from '@/lib/category-rules'

function makeRule(overrides?: Partial<{
  match_key: string
  match_type: 'equals' | 'contains'
  category_id: string
  created_at: string
}>) {
  return {
    match_key: 'uber',
    match_type: 'equals' as const,
    category_id: 'cat-1',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('normalise', () => {
  it('strips accents', () => expect(normalise('Lusíadas')).toBe('lusiadas'))
  it('lowercases', () => expect(normalise('UBER')).toBe('uber'))
  it('trims whitespace', () => expect(normalise('  hello  ')).toBe('hello'))
})

describe('applyRules', () => {
  it('returns null when rules are empty', () => {
    expect(applyRules({ merchant: 'Uber', description: null }, [])).toBeNull()
  })
  it('returns null when both merchant and description are null', () => {
    expect(applyRules({ merchant: null, description: null }, [makeRule()])).toBeNull()
  })
  it('equals match returns correct category_id', () => {
    expect(
      applyRules({ merchant: 'Uber', description: null }, [
        makeRule({ match_key: 'uber', match_type: 'equals', category_id: 'cat-transport' }),
      ])
    ).toBe('cat-transport')
  })
  it('contains match — "uber" rule matches "Uber Eats"', () => {
    expect(
      applyRules({ merchant: 'Uber Eats', description: null }, [
        makeRule({ match_key: 'uber', match_type: 'contains', category_id: 'cat-food' }),
      ])
    ).toBe('cat-food')
  })
  it('equals beats contains when both match', () => {
    expect(
      applyRules({ merchant: 'Uber Eats', description: null }, [
        makeRule({ match_key: 'uber eats', match_type: 'contains', category_id: 'cat-food' }),
        makeRule({ match_key: 'uber eats', match_type: 'equals', category_id: 'cat-transport' }),
      ])
    ).toBe('cat-transport')
  })
  it('longer match_key wins among contains matches', () => {
    expect(
      applyRules({ merchant: 'Uber Eats', description: null }, [
        makeRule({ match_key: 'uber', match_type: 'contains', category_id: 'cat-transport' }),
        makeRule({ match_key: 'uber eats', match_type: 'contains', category_id: 'cat-food' }),
      ])
    ).toBe('cat-food')
  })
  it('newer created_at wins when match_key length is equal', () => {
    expect(
      applyRules({ merchant: 'Uber', description: null }, [
        makeRule({ match_key: 'uber', match_type: 'contains', category_id: 'cat-old', created_at: '2026-01-01T00:00:00Z' }),
        makeRule({ match_key: 'uber', match_type: 'contains', category_id: 'cat-new', created_at: '2026-06-01T00:00:00Z' }),
      ])
    ).toBe('cat-new')
  })
  it('uses merchant over description when both present', () => {
    expect(
      applyRules({ merchant: 'Merchant Co', description: 'Desc Co' }, [
        makeRule({ match_key: 'merchant co', match_type: 'equals', category_id: 'cat-merchant' }),
        makeRule({ match_key: 'desc co', match_type: 'equals', category_id: 'cat-desc' }),
      ])
    ).toBe('cat-merchant')
  })
  it('falls back to description when merchant is null', () => {
    expect(
      applyRules({ merchant: null, description: 'Desc Co' }, [
        makeRule({ match_key: 'desc co', match_type: 'equals', category_id: 'cat-desc' }),
      ])
    ).toBe('cat-desc')
  })
  it('is accent-insensitive', () => {
    expect(
      applyRules({ merchant: 'Café Central', description: null }, [
        makeRule({ match_key: 'cafe', match_type: 'contains', category_id: 'cat-cafe' }),
      ])
    ).toBe('cat-cafe')
  })
  it('empty-string merchant falls back to description', () => {
    expect(
      applyRules({ merchant: '', description: 'Desc Co' }, [
        makeRule({ match_key: 'desc co', match_type: 'equals', category_id: 'cat-desc' }),
      ])
    ).toBe('cat-desc')
  })
})

describe('findMatchingRule', () => {
  it('returns the full winning rule object when matched', () => {
    const rule = {
      ...makeRule({ match_key: 'lidl', match_type: 'contains', category_id: 'cat-groceries' }),
      match_text: 'Lidl',
    }
    const matched = findMatchingRule(
      { merchant: 'Lidl Supermercados', description: null },
      [rule]
    )
    expect(matched).toEqual(rule)
  })

  it('returns null when no rule matches', () => {
    expect(
      findMatchingRule(
        { merchant: 'Unknown Shop', description: null },
        [makeRule({ match_key: 'lidl', match_type: 'equals' })]
      )
    ).toBeNull()
  })

  it('matches a Monzo Halifax row on merchant, not on the account-reference description', () => {
    // Monzo exports Halifax mortgage payments with merchant='Halifax' and
    // description='1056324050010000'. The rule is keyed on the normalised
    // merchant ('halifax'), so matchTarget() picks merchant first and fires.
    const rule = makeRule({ match_key: 'halifax', match_type: 'equals', category_id: 'cat-mortgage' })
    const matched = findMatchingRule(
      { merchant: 'Halifax', description: '1056324050010000' },
      [rule]
    )
    expect(matched).not.toBeNull()
    expect(matched!.category_id).toBe('cat-mortgage')
  })

  it('does NOT match when only the account-reference description is present', () => {
    // Guard: without a merchant, matchTarget() falls back to description.
    // '1056324050010000' !== 'halifax', so the rule must not fire.
    const rule = makeRule({ match_key: 'halifax', match_type: 'equals', category_id: 'cat-mortgage' })
    expect(
      findMatchingRule({ merchant: null, description: '1056324050010000' }, [rule])
    ).toBeNull()
  })
})

describe('sanitiseSearchQuery and buildSearchOrFilter', () => {
  it('strips commas, parens, percent, underscore, and backslash from search input', () => {
    expect(sanitiseSearchQuery('a,b')).toBe('ab')
    expect(sanitiseSearchQuery('50%')).toBe('50')
    expect(sanitiseSearchQuery('foo(bar)_baz\\qux')).toBe('foobarbazqux')
  })

  it('builds a safe PostgREST .or() filter for "a,b" and "50%"', () => {
    expect(buildSearchOrFilter('a,b')).toBe('description.ilike.%ab%,merchant.ilike.%ab%')
    expect(buildSearchOrFilter('50%')).toBe('description.ilike.%50%,merchant.ilike.%50%')
  })

  it('returns null when query is empty after sanitisation', () => {
    expect(buildSearchOrFilter(' ,()%_\\ ')).toBeNull()
  })
})

void matchTarget
