import { describe, it, expect } from 'vitest'
import { getCategoryDisplayName } from '@/lib/categories-utils'

/** Minimal stub that mimics next-intl's t() for Categories namespace. */
function makeTCat(translations: Record<string, string>) {
  return (key: string): string => {
    // next-intl returns the full key when not found
    return translations[key] ?? key
  }
}

const ptTranslations: Record<string, string> = {
  'systemNames.Housing':            'Casa',
  'systemNames.Food & Grocery':     'Mercearia',
  'systemNames.Eating Out':         'Comer fora',
  'systemNames.Transport':          'Transporte',
  'systemNames.Entertainment':      'Lazer',
  'systemNames.Health':             'Saúde',
  'systemNames.Personal Care':      'Cuidado pessoal',
  'systemNames.Utilities':          'Despesas correntes',
  'systemNames.Subscriptions':      'Subscrições',
  'systemNames.Shopping':           'Compras',
  'systemNames.Travel':             'Viagens',
  'systemNames.Other':              'Outro',
  'systemNames.Income':             'Rendimento',
  'systemNames.Rental income (UK)': 'Rendimento de arrendamento (RU)',
  'systemNames.Interest':           'Juros',
  'systemNames.Dividends':          'Dividendos',
  'systemNames.Transfer':           'Transferência',
}

const enTranslations: Record<string, string> = {
  'systemNames.Housing':            'Housing',
  'systemNames.Food & Grocery':     'Food & Grocery',
  'systemNames.Eating Out':         'Eating Out',
  'systemNames.Transport':          'Transport',
  'systemNames.Entertainment':      'Entertainment',
  'systemNames.Health':             'Health',
  'systemNames.Personal Care':      'Personal Care',
  'systemNames.Utilities':          'Utilities',
  'systemNames.Subscriptions':      'Subscriptions',
  'systemNames.Shopping':           'Shopping',
  'systemNames.Travel':             'Travel',
  'systemNames.Other':              'Other',
  'systemNames.Income':             'Income',
  'systemNames.Rental income (UK)': 'Rental income (UK)',
  'systemNames.Interest':           'Interest',
  'systemNames.Dividends':          'Dividends',
  'systemNames.Transfer':           'Transfer',
}

describe('getCategoryDisplayName', () => {
  describe('null / undefined input', () => {
    it('returns empty string for null', () => {
      expect(getCategoryDisplayName(null, makeTCat(ptTranslations))).toBe('')
    })
    it('returns empty string for undefined', () => {
      expect(getCategoryDisplayName(undefined, makeTCat(ptTranslations))).toBe('')
    })
  })

  describe('system categories — PT-PT translations', () => {
    const tPt = makeTCat(ptTranslations)

    it('translates Housing → Casa', () => {
      expect(getCategoryDisplayName({ name: 'Housing', is_system: true }, tPt)).toBe('Casa')
    })
    it('translates Eating Out → Comer fora', () => {
      expect(getCategoryDisplayName({ name: 'Eating Out', is_system: true }, tPt)).toBe('Comer fora')
    })
    it('translates Travel → Viagens', () => {
      expect(getCategoryDisplayName({ name: 'Travel', is_system: true }, tPt)).toBe('Viagens')
    })
    it('translates Food & Grocery → Mercearia', () => {
      expect(getCategoryDisplayName({ name: 'Food & Grocery', is_system: true }, tPt)).toBe('Mercearia')
    })
    it('translates Rental income (UK) → Rendimento de arrendamento (RU)', () => {
      expect(getCategoryDisplayName({ name: 'Rental income (UK)', is_system: true }, tPt)).toBe(
        'Rendimento de arrendamento (RU)'
      )
    })
    it('translates Transfer → Transferência', () => {
      expect(getCategoryDisplayName({ name: 'Transfer', is_system: true }, tPt)).toBe('Transferência')
    })
  })

  describe('system categories — EN (identity)', () => {
    const tEn = makeTCat(enTranslations)

    it('returns English name verbatim for Housing', () => {
      expect(getCategoryDisplayName({ name: 'Housing', is_system: true }, tEn)).toBe('Housing')
    })
    it('returns English name verbatim for Subscriptions', () => {
      expect(getCategoryDisplayName({ name: 'Subscriptions', is_system: true }, tEn)).toBe('Subscriptions')
    })
  })

  describe('system categories identified by name (no is_system flag)', () => {
    const tPt = makeTCat(ptTranslations)

    it('translates when is_system is absent but name is in known set', () => {
      expect(getCategoryDisplayName({ name: 'Health' }, tPt)).toBe('Saúde')
    })
    it('translates when is_system is null', () => {
      expect(getCategoryDisplayName({ name: 'Shopping', is_system: null }, tPt)).toBe('Compras')
    })
  })

  describe('user-created categories', () => {
    const tPt = makeTCat(ptTranslations)
    // t() returns the key verbatim for unknown keys — simulating a name not in translations
    const tNoMatch = makeTCat({})

    it('returns stored name for a user-created category not in system set', () => {
      expect(getCategoryDisplayName({ name: 'My Custom Category', is_system: false }, tNoMatch)).toBe(
        'My Custom Category'
      )
    })
    it('returns stored name even when is_system is false and name matches nothing', () => {
      expect(getCategoryDisplayName({ name: 'Groceries UK', is_system: false }, tNoMatch)).toBe('Groceries UK')
    })
    it('falls back to stored name if translation returns the key verbatim (no match)', () => {
      // A user-created category whose name happens to look like a system key but isn't in SYSTEM_CATEGORY_NAMES
      expect(getCategoryDisplayName({ name: 'Groceries', is_system: false }, tPt)).toBe('Groceries')
    })
  })

  describe('all 17 system names have PT-PT translations', () => {
    const tPt = makeTCat(ptTranslations)
    const systemNames = [
      'Housing', 'Food & Grocery', 'Eating Out', 'Transport', 'Entertainment',
      'Health', 'Personal Care', 'Utilities', 'Subscriptions', 'Shopping',
      'Travel', 'Other', 'Income', 'Rental income (UK)', 'Interest', 'Dividends', 'Transfer',
    ]
    systemNames.forEach(name => {
      it(`${name} has a non-empty PT translation`, () => {
        const result = getCategoryDisplayName({ name, is_system: true }, tPt)
        expect(result).toBeTruthy()
        // Should not equal the key (which would indicate missing translation)
        expect(result).not.toBe(`systemNames.${name}`)
      })
    })
  })
})
