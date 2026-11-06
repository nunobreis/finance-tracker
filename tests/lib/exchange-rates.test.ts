import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ─────────────────────────────────────────────────────────────
const { mockUpsert, getMockCachedRate, setMockCachedRate } = vi.hoisted(() => {
  let cachedRate: string | null = null
  return {
    mockUpsert: vi.fn().mockResolvedValue({ error: null }),
    getMockCachedRate: () => cachedRate,
    setMockCachedRate: (v: string | null) => { cachedRate = v },
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        const r = getMockCachedRate()
        return Promise.resolve(
          r !== null
            ? { data: { rate: r }, error: null }
            : { data: null, error: { code: 'PGRST116' } }
        )
      }),
      upsert: mockUpsert,
    }),
  }),
}))

import { getRateOn, fillCalendarDays } from '@/lib/exchange-rates'

describe('getRateOn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setMockCachedRate(null)
  })

  it('returns 1 for same currency without hitting DB', async () => {
    expect(await getRateOn('EUR', 'EUR', '2026-01-15')).toBe(1)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('returns cached rate on DB hit', async () => {
    setMockCachedRate('1.1850')
    expect(await getRateOn('GBP', 'EUR', '2026-01-15')).toBeCloseTo(1.185)
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('fetches from Frankfurter on cache miss and stores with matching source_date', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ date: '2026-01-15', rates: { EUR: 1.185 } }),
    } as Response)
    const rate = await getRateOn('GBP', 'EUR', '2026-01-15')
    expect(rate).toBeCloseTo(1.185)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rate_date: '2026-01-15',
        source_date: '2026-01-15',
        rate: 1.185,
        base_currency: 'GBP',
        quote_currency: 'EUR',
      }),
      expect.any(Object)
    )
  })

  it('stores under requested date with ECB date as source_date for weekends', async () => {
    // Frankfurter returns Friday 2026-01-16 when asked for Sunday 2026-01-18
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ date: '2026-01-16', rates: { EUR: 1.183 } }),
    } as Response)
    await getRateOn('GBP', 'EUR', '2026-01-18')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rate_date: '2026-01-18',   // requested date
        source_date: '2026-01-16', // ECB business day
      }),
      expect.any(Object)
    )
  })

  it('returns null when Frankfurter returns non-ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 } as Response)
    expect(await getRateOn('GBP', 'EUR', '2026-01-15')).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
    expect(await getRateOn('GBP', 'EUR', '2026-01-15')).toBeNull()
  })
})

describe('fillCalendarDays', () => {
  it('range starting on Saturday uses prior Friday ECB rate', () => {
    // ECB has Friday data (provided by the 7-day lookback in ensureRatesForRange)
    const rows = fillCalendarDays(
      { '2026-01-16': 1.183 },   // Friday
      '2026-01-17',               // Saturday (from)
      '2026-01-18'                // Sunday (to)
    )
    expect(rows).toEqual([
      { rate_date: '2026-01-17', source_date: '2026-01-16', rate: 1.183 },
      { rate_date: '2026-01-18', source_date: '2026-01-16', rate: 1.183 },
    ])
  })

  it('holiday mid-range uses previous business day rate', () => {
    // 2026-04-14 (Tuesday) missing from ECB — public holiday
    const rows = fillCalendarDays(
      { '2026-04-13': 1.180, '2026-04-15': 1.185 },
      '2026-04-13',
      '2026-04-15'
    )
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual({ rate_date: '2026-04-13', source_date: '2026-04-13', rate: 1.180 })
    expect(rows[1]).toEqual({ rate_date: '2026-04-14', source_date: '2026-04-13', rate: 1.180 })
    expect(rows[2]).toEqual({ rate_date: '2026-04-15', source_date: '2026-04-15', rate: 1.185 })
  })

  it('skips dates in existingDates', () => {
    const rows = fillCalendarDays(
      { '2026-01-14': 1.180, '2026-01-15': 1.183 },
      '2026-01-14',
      '2026-01-15',
      new Set(['2026-01-14'])
    )
    expect(rows).toEqual([
      { rate_date: '2026-01-15', source_date: '2026-01-15', rate: 1.183 },
    ])
  })

  it('excludes days before the first available ECB date', () => {
    const rows = fillCalendarDays(
      { '2026-01-15': 1.183 },
      '2026-01-14',   // no ECB rate available for this day
      '2026-01-15'
    )
    expect(rows).toEqual([
      { rate_date: '2026-01-15', source_date: '2026-01-15', rate: 1.183 },
    ])
  })

  it('returns empty array when ecbRates is empty', () => {
    expect(fillCalendarDays({}, '2026-01-14', '2026-01-16')).toEqual([])
  })
})
