import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRevalidatePath = vi.fn()
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

import {
  createTransaction,
  importBatch,
  deleteImportBatch,
} from '@/app/(app)/transactions/_components/actions'

describe('createTransaction server-side sign validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  function buildFormData(fields: Record<string, string>) {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.set(k, v)
    return fd
  }

  it('rejects positive or zero amount when tx_type is expense', async () => {
    const resPos = await createTransaction(
      {},
      buildFormData({
        tx_type: 'expense',
        account_id: 'acc-1',
        occurred_on: '2026-11-06',
        amount: '25.50',
        currency: 'EUR',
      })
    )
    expect(resPos.error).toMatch(/negative/i)
    expect(mockFrom).not.toHaveBeenCalled()

    const resZero = await createTransaction(
      {},
      buildFormData({
        tx_type: 'expense',
        account_id: 'acc-1',
        occurred_on: '2026-11-06',
        amount: '0',
        currency: 'EUR',
      })
    )
    expect(resZero.error).toBeDefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('accepts negative amount when tx_type is expense', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock })

    const res = await createTransaction(
      {},
      buildFormData({
        tx_type: 'expense',
        account_id: 'acc-1',
        occurred_on: '2026-11-06',
        amount: '-25.50',
        currency: 'EUR',
        merchant: 'Lidl',
      })
    )
    expect(res.error).toBeUndefined()
    expect(res.success).toBe(true)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        account_id: 'acc-1',
        amount: -25.5,
        is_transfer: false,
      })
    )
  })

  it('rejects negative or zero amount when tx_type is income', async () => {
    const resNeg = await createTransaction(
      {},
      buildFormData({
        tx_type: 'income',
        account_id: 'acc-1',
        occurred_on: '2026-11-06',
        amount: '-100',
        currency: 'EUR',
      })
    )
    expect(resNeg.error).toMatch(/positive/i)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('accepts positive amount when tx_type is income', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock })

    const res = await createTransaction(
      {},
      buildFormData({
        tx_type: 'income',
        account_id: 'acc-1',
        occurred_on: '2026-11-06',
        amount: '2400.00',
        currency: 'EUR',
        merchant: 'Deloitte',
      })
    )
    expect(res.error).toBeUndefined()
    expect(res.success).toBe(true)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        account_id: 'acc-1',
        amount: 2400,
        is_transfer: false,
      })
    )
  })

  it('creates linked debit and credit rows for transfers', async () => {
    const insertSingleMock = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 'tx-debit' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'tx-credit' }, error: null })

    // .eq is chained twice: .eq('id', debit.id).eq('user_id', user.id)
    // The final .eq must return the resolved promise; intermediate .eq returns the same chainable object.
    const updateChain: Record<string, unknown> = {}
    const updateEqMock = vi.fn((col: string) => {
      if (col === 'id') return updateChain  // first .eq — return chainable
      return Promise.resolve({ error: null }) // second .eq — resolve
    })
    updateChain.eq = updateEqMock

    mockFrom.mockReturnValue({
      insert: vi.fn(() => ({
        select: () => ({ single: insertSingleMock }),
      })),
      update: vi.fn(() => updateChain),
    })

    const res = await createTransaction(
      {},
      buildFormData({
        tx_type: 'transfer',
        is_transfer: 'on',
        account_id: 'acc-1',
        linked_account_id: 'acc-2',
        occurred_on: '2026-11-06',
        amount: '500',
        currency: 'EUR',
      })
    )
    expect(res.error).toBeUndefined()
    expect(res.success).toBe(true)
    expect(insertSingleMock).toHaveBeenCalledTimes(2)
    expect(updateEqMock).toHaveBeenCalledWith('id', 'tx-debit')
  })
})

describe('importBatch filename and metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('stores filename on import_batches and returns batchId + autoCategorisedCount', async () => {
    const batchInsertMock = vi.fn(() => ({
      select: () => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'batch-104' }, error: null }),
      }),
    }))
    const batchUpdateMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    }))
    const txInsertMock = vi.fn().mockResolvedValue({ error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return { insert: batchInsertMock, update: batchUpdateMock }
      }
      if (table === 'category_rules') {
        return {
          select: () => ({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  match_key: 'lidl',
                  match_type: 'contains',
                  category_id: 'cat-groceries',
                  created_at: '2026-01-01T00:00:00Z',
                },
              ],
            }),
          }),
        }
      }
      if (table === 'transactions') {
        return { insert: txInsertMock }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const rows = [
      {
        occurred_on: '2026-11-06',
        amount: -34.5,
        currency: 'EUR',
        description: 'Lidl Supermercados',
        merchant: 'Lidl Supermercados',
        external_id: 'ext-1',
        is_transfer: false,
        raw_category: null,
      },
      {
        occurred_on: '2026-11-05',
        amount: -10,
        currency: 'EUR',
        description: 'Random Cafe',
        merchant: 'Random Cafe',
        external_id: 'ext-2',
        is_transfer: false,
        raw_category: null,
      },
    ]

    const result = await importBatch('acc-1', rows, {}, 'Revolut_Nov2026.csv')
    expect(result).toEqual({
      success: true,
      batchId: 'batch-104',
      autoCategorisedCount: 1,
    })
    expect(batchInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        account_id: 'acc-1',
        filename: 'Revolut_Nov2026.csv',
        row_count: 2,
      })
    )
  })

  it('when both csvMappedCategory and ruleMatchedCategory resolve, counter does NOT increment (CSV wins, rule does not get credit)', async () => {
    // Row X: raw_category 'Groceries' maps via categoryIdMap AND merchant 'Lidl' matches the rule → CSV wins, counter stays at 0 for this row
    // Row Y: raw_category: null AND merchant 'Lidl' → only rule matches → counter increments
    // Row Z: no match → no increment
    // Expected: autoCategorisedCount === 1
    const batchInsertMock = vi.fn(() => ({
      select: () => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'batch-both' }, error: null }),
      }),
    }))
    const batchUpdateMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    }))
    const txInsertMock = vi.fn().mockResolvedValue({ error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return { insert: batchInsertMock, update: batchUpdateMock }
      }
      if (table === 'category_rules') {
        return {
          select: () => ({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  match_key: 'lidl',
                  match_type: 'contains',
                  category_id: 'cat-groceries',
                  created_at: '2026-01-01T00:00:00Z',
                },
              ],
            }),
          }),
        }
      }
      if (table === 'transactions') {
        return { insert: txInsertMock }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const rows = [
      {
        // Row X: both CSV mapping and rule match — CSV wins, counter does NOT increment
        occurred_on: '2026-11-07',
        amount: -20,
        currency: 'EUR',
        description: 'Lidl Supermercados',
        merchant: 'Lidl Supermercados',
        external_id: 'ext-x',
        is_transfer: false,
        raw_category: 'Groceries',
      },
      {
        // Row Y: only rule match (no CSV mapping) — counter increments
        occurred_on: '2026-11-07',
        amount: -34.5,
        currency: 'EUR',
        description: 'Lidl Supermercados',
        merchant: 'Lidl Supermercados',
        external_id: 'ext-y',
        is_transfer: false,
        raw_category: null,
      },
      {
        // Row Z: no match at all — no increment
        occurred_on: '2026-11-07',
        amount: -8,
        currency: 'EUR',
        description: 'Random Cafe',
        merchant: 'Random Cafe',
        external_id: 'ext-z',
        is_transfer: false,
        raw_category: null,
      },
    ]

    const result = await importBatch(
      'acc-1',
      rows,
      { Groceries: 'cat-groceries' },
      'test-both.csv'
    )
    expect(result).toEqual({
      success: true,
      batchId: 'batch-both',
      autoCategorisedCount: 1, // only Row Y; Row X has CSV mapping so rule doesn't get credit
    })
    // Also verify that Row X's category_id was set to the CSV-mapped value (cat-groceries)
    expect(txInsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ external_id: 'ext-x', category_id: 'cat-groceries' }),
        expect.objectContaining({ external_id: 'ext-y', category_id: 'cat-groceries' }),
        expect.objectContaining({ external_id: 'ext-z', category_id: null }),
      ])
    )
  })

  it('counts autoCategorisedCount by rule matches only, not raw_category CSV mappings', async () => {
    // row A: raw_category 'Groceries' maps via categoryIdMap → CSV mapping, no rule match
    // row B: merchant 'Lidl' matches rule contains:'lidl' → rule match
    // row C: no raw_category, no rule match → uncategorised
    // Expected: autoCategorisedCount === 1 (only row B)
    const batchInsertMock = vi.fn(() => ({
      select: () => ({
        single: vi.fn().mockResolvedValue({ data: { id: 'batch-200' }, error: null }),
      }),
    }))
    const batchUpdateMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    }))
    const txInsertMock = vi.fn().mockResolvedValue({ error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return { insert: batchInsertMock, update: batchUpdateMock }
      }
      if (table === 'category_rules') {
        return {
          select: () => ({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  match_key: 'lidl',
                  match_type: 'contains',
                  category_id: 'cat-groceries',
                  created_at: '2026-01-01T00:00:00Z',
                },
              ],
            }),
          }),
        }
      }
      if (table === 'transactions') {
        return { insert: txInsertMock }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const rows = [
      {
        // row A: CSV-mapped via categoryIdMap, no rule match
        occurred_on: '2026-11-07',
        amount: -20,
        currency: 'EUR',
        description: 'Supermarket purchase',
        merchant: 'Supermarket purchase',
        external_id: 'ext-a',
        is_transfer: false,
        raw_category: 'Groceries',
      },
      {
        // row B: rule match (merchant contains 'lidl')
        occurred_on: '2026-11-07',
        amount: -34.5,
        currency: 'EUR',
        description: 'Lidl Supermercados',
        merchant: 'Lidl Supermercados',
        external_id: 'ext-b',
        is_transfer: false,
        raw_category: null,
      },
      {
        // row C: uncategorised
        occurred_on: '2026-11-07',
        amount: -8,
        currency: 'EUR',
        description: 'Random Cafe',
        merchant: 'Random Cafe',
        external_id: 'ext-c',
        is_transfer: false,
        raw_category: null,
      },
    ]

    const result = await importBatch(
      'acc-1',
      rows,
      { Groceries: 'cat-groceries' },
      'test.csv'
    )
    expect(result).toEqual({
      success: true,
      batchId: 'batch-200',
      autoCategorisedCount: 1, // only row B (rule match); row A is CSV-mapped, not counted
    })
  })
})

describe('deleteImportBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('happy path: verifies batch owner, clears transfer_pair_id, deletes transactions then batch', async () => {
    const callOrder: string[] = []

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: vi.fn(async () => {
                  callOrder.push('check_batch_owner')
                  return { data: { id: 'batch-1' }, error: null }
                }),
              }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: vi.fn(async () => {
                callOrder.push('delete_batch')
                return { error: null }
              }),
            }),
          }),
        }
      }
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              eq: vi.fn(async () => {
                callOrder.push('select_batch_tx_ids')
                return { data: [{ id: 'tx-1' }, { id: 'tx-2' }], error: null }
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              in: vi.fn(async () => {
                callOrder.push('clear_external_transfer_pairs')
                return { error: null }
              }),
              eq: vi.fn(async () => {
                callOrder.push('clear_internal_transfer_pairs')
                return { error: null }
              }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: vi.fn(async () => {
                callOrder.push('delete_batch_transactions')
                return { error: null }
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const res = await deleteImportBatch('batch-1')
    expect(res).toEqual({ deletedCount: 2 })
    expect(callOrder).toEqual([
      'check_batch_owner',
      'select_batch_tx_ids',
      'clear_external_transfer_pairs',
      'clear_internal_transfer_pairs',
      'delete_batch_transactions',
      'delete_batch',
    ])
  })

  it("another user's batch: stops immediately when batch ownership check returns null", async () => {
    const txTouch = vi.fn()
    const batchDelete = vi.fn()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          delete: batchDelete,
        }
      }
      if (table === 'transactions') {
        return { select: txTouch, update: txTouch, delete: txTouch }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const res = await deleteImportBatch('other-users-batch')
    expect(res.deletedCount).toBe(0)
    expect(res.error).toMatch(/not found/i)
    expect(txTouch).not.toHaveBeenCalled()
    expect(batchDelete).not.toHaveBeenCalled()
  })

  it('cross-batch transfer pair: clears transfer_pair_id pointing to batch transactions before deleting', async () => {
    const clearedIds: string[][] = []

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'batch-xfer' }, error: null }),
              }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              eq: vi.fn().mockResolvedValue({ data: [{ id: 'tx-in-batch' }], error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              in: vi.fn(async (_col: string, ids: string[]) => {
                clearedIds.push(ids)
                return { error: null }
              }),
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const res = await deleteImportBatch('batch-xfer')
    expect(res).toEqual({ deletedCount: 1 })
    expect(clearedIds).toEqual([['tx-in-batch']])
  })

  it('250-row batch chunks the external clear into 3 calls (100 + 100 + 50)', async () => {
    const inCallArgs: [string, string[]][] = []
    const allIds = Array.from({ length: 250 }, (_, i) => ({ id: `tx-${i}` }))

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'batch-big' }, error: null }),
              }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              eq: vi.fn().mockResolvedValue({ data: allIds, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              in: vi.fn(async (_col: string, ids: string[]) => {
                inCallArgs.push([_col, ids])
                return { error: null }
              }),
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const res = await deleteImportBatch('batch-big')
    expect(res).toEqual({ deletedCount: 250 })

    // Should have called .in() exactly 3 times
    expect(inCallArgs).toHaveLength(3)

    // Check chunk sizes
    expect(inCallArgs[0][1]).toHaveLength(100)
    expect(inCallArgs[1][1]).toHaveLength(100)
    expect(inCallArgs[2][1]).toHaveLength(50)

    // All chunks together should cover all 250 ids
    const allChunkedIds = inCallArgs.flatMap(([, ids]) => ids)
    const expectedIds = allIds.map(r => r.id)
    expect(allChunkedIds).toEqual(expectedIds)
  })

  it('external clear error short-circuits: returns error and does not proceed to internal clear or deletes', async () => {
    const internalClearMock = vi.fn()
    const txDeleteMock = vi.fn()
    const batchDeleteMock = vi.fn()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'batch-err-ext' }, error: null }),
              }),
            }),
          }),
          delete: batchDeleteMock,
        }
      }
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              eq: vi.fn().mockResolvedValue({ data: [{ id: 'tx-1' }], error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              in: vi.fn().mockResolvedValue({ error: { message: 'External clear failed' } }),
              eq: internalClearMock,
            }),
          }),
          delete: txDeleteMock,
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const res = await deleteImportBatch('batch-err-ext')
    expect(res).toEqual({ deletedCount: 0, error: 'External clear failed' })
    expect(internalClearMock).not.toHaveBeenCalled()
    expect(txDeleteMock).not.toHaveBeenCalled()
    expect(batchDeleteMock).not.toHaveBeenCalled()
  })

  it('internal clear error short-circuits: returns error and does not proceed to deletes', async () => {
    const txDeleteMock = vi.fn()
    const batchDeleteMock = vi.fn()

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'batch-err-int' }, error: null }),
              }),
            }),
          }),
          delete: batchDeleteMock,
        }
      }
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              eq: vi.fn().mockResolvedValue({ data: [{ id: 'tx-1' }], error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              in: vi.fn().mockResolvedValue({ error: null }),
              eq: vi.fn().mockResolvedValue({ error: { message: 'Internal clear failed' } }),
            }),
          }),
          delete: txDeleteMock,
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const res = await deleteImportBatch('batch-err-int')
    expect(res).toEqual({ deletedCount: 0, error: 'Internal clear failed' })
    expect(txDeleteMock).not.toHaveBeenCalled()
    expect(batchDeleteMock).not.toHaveBeenCalled()
  })

  it('retry after partial failure: when transactions were already deleted, second call still deletes the batch row', async () => {
    let attempt = 0

    mockFrom.mockImplementation((table: string) => {
      if (table === 'import_batches') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'batch-retry' }, error: null }),
              }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: vi.fn(async () => {
                attempt += 1
                if (attempt === 1) {
                  return { error: { message: 'Temporary network error deleting batch' } }
                }
                return { error: null }
              }),
            }),
          }),
        }
      }
      if (table === 'transactions') {
        return {
          select: () => ({
            eq: () => ({
              eq: vi.fn(async () => {
                // On attempt 1, 1 row exists; on attempt 2 (retry), 0 rows remain
                return {
                  data: attempt === 0 ? [{ id: 'tx-1' }] : [],
                  error: null,
                }
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              in: vi.fn().mockResolvedValue({ error: null }),
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const firstTry = await deleteImportBatch('batch-retry')
    expect(firstTry.error).toMatch(/Temporary network error/)

    const secondTry = await deleteImportBatch('batch-retry')
    expect(secondTry).toEqual({ deletedCount: 0 })
  })
})

describe('createTransaction tx_type validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  function buildFormData(fields: Record<string, string>) {
    const fd = new FormData()
    for (const [k, v] of Object.entries(fields)) fd.set(k, v)
    return fd
  }

  it('rejects when tx_type is missing', async () => {
    const res = await createTransaction(
      {},
      buildFormData({
        account_id: 'acc-1',
        occurred_on: '2026-11-07',
        amount: '-25.00',
        currency: 'EUR',
      })
    )
    expect(res.error).toMatch(/type.*required/i)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('rejects when tx_type is an unknown value', async () => {
    const res = await createTransaction(
      {},
      buildFormData({
        tx_type: 'something_else',
        account_id: 'acc-1',
        occurred_on: '2026-11-07',
        amount: '-25.00',
        currency: 'EUR',
      })
    )
    expect(res.error).toMatch(/type.*required/i)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
