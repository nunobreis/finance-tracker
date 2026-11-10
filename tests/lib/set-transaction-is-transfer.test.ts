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

import { setTransactionIsTransfer } from '@/app/(app)/transactions/_components/actions'

/** Build a select chain: .select() → .eq('id') → .eq('user_id') → .single() */
function makeSelectChain(resolvedData: unknown) {
  const chain: Record<string, unknown> = {}
  chain.eq = vi.fn().mockReturnValue(chain)   // both .eq calls return the chain
  chain.single = vi.fn().mockResolvedValue({ data: resolvedData })
  return chain
}

/** Build an update chain: .update() → .eq('id') → .eq('user_id') (awaited directly) */
function makeUpdateChain(result: { error: { message: string } | null }) {
  const chain: Record<string, unknown> = {}
  chain.eq = vi.fn((col: string) => {
    if (col === 'id') return chain               // first .eq — stay chainable
    return Promise.resolve(result)               // second .eq — resolve
  })
  return chain
}

describe('setTransactionIsTransfer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns error when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await setTransactionIsTransfer('tx-1', true)
    expect(result.error).toBeDefined()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('marks a row as transfer — clears category_id and transfer_pair_id', async () => {
    const selectChain = makeSelectChain({ transfer_pair_id: null })
    const updateChain = makeUpdateChain({ error: null })
    const updateFn = vi.fn().mockReturnValue(updateChain)

    mockFrom
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue(selectChain) })
      .mockReturnValueOnce({ update: updateFn })

    const result = await setTransactionIsTransfer('tx-1', true)

    expect(result.error).toBeUndefined()
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ is_transfer: true, transfer_pair_id: null })
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/transactions')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/budgets')
  })

  it('un-marks a row with no pair — does not touch a partner', async () => {
    const selectChain = makeSelectChain({ transfer_pair_id: null })
    const updateChain = makeUpdateChain({ error: null })

    mockFrom
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue(selectChain) })
      .mockReturnValueOnce({ update: vi.fn().mockReturnValue(updateChain) })

    const result = await setTransactionIsTransfer('tx-1', false)

    expect(result.error).toBeUndefined()
    // select + update self only — no third from() call for a partner
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })

  it('un-marking a paired row clears the partner is_transfer and transfer_pair_id', async () => {
    const selectChain = makeSelectChain({ transfer_pair_id: 'partner-id' })
    const updateSelf = makeUpdateChain({ error: null })
    const updatePartner = makeUpdateChain({ error: null })
    const updatePartnerFn = vi.fn().mockReturnValue(updatePartner)

    mockFrom
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue(selectChain) })
      .mockReturnValueOnce({ update: vi.fn().mockReturnValue(updateSelf) })
      .mockReturnValueOnce({ update: updatePartnerFn })

    const result = await setTransactionIsTransfer('tx-1', false)

    expect(result.error).toBeUndefined()
    expect(updatePartnerFn).toHaveBeenCalledWith(
      expect.objectContaining({ is_transfer: false, transfer_pair_id: null })
    )
    // Partner update scoped to partner id and owner
    expect(updatePartner.eq).toHaveBeenCalledWith('id', 'partner-id')
    expect(updatePartner.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('returns error when the update fails and does not revalidate', async () => {
    const selectChain = makeSelectChain({ transfer_pair_id: null })
    const updateChain = makeUpdateChain({ error: { message: 'DB error' } })

    mockFrom
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue(selectChain) })
      .mockReturnValueOnce({ update: vi.fn().mockReturnValue(updateChain) })

    const result = await setTransactionIsTransfer('tx-1', false)

    expect(result.error).toBe('DB error')
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
