/**
 * Isolated test for the auto-close-on-success effect.
 *
 * Lives in a separate file so the vi.mock('react') partial override doesn't
 * bleed into the main AddTransactionDrawer test suite.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import React from 'react'
import type { Account, Category } from '@/types/database'

// Enable React 19 act environment
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// Partial mock of react: override useActionState, keep everything else real.
// vi.mock is hoisted, so this runs before any imports below.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useActionState: vi.fn().mockReturnValue([{}, vi.fn(), false]),
  }
})

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key.split('.').pop() ?? key,
}))

// Mock server actions
vi.mock('@/app/(app)/transactions/_components/actions', () => ({
  createTransaction: vi.fn(),
}))

// Import AFTER vi.mock declarations so the hoisted mocks apply
import * as ReactMock from 'react'
import { AddTransactionDrawer } from '@/app/(app)/transactions/_components/AddTransactionDrawer'

// ---- fixtures ----

const accounts: Account[] = [
  {
    id: 'acc-1',
    user_id: 'u1',
    name: 'Revolut EUR',
    institution: null,
    account_type: 'checking',
    currency: 'EUR',
    country: 'PT',
    opening_balance: 0,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
]

const categories: Category[] = [
  {
    id: 'cat-food',
    user_id: 'u1',
    name: 'Food',
    parent_category_id: null,
    kind: 'expense',
    is_system: true,
    irs_deduction: null,
  },
]

// ---- test harness ----

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  document.body.style.overflow = ''
  vi.clearAllMocks()
})

// ---- tests ----

describe('AddTransactionDrawer — auto-close on success', () => {
  it('calls onOpenChange(false) when state.success becomes true', () => {
    // Override the mocked useActionState to return success state
    ;(ReactMock.useActionState as ReturnType<typeof vi.fn>).mockReturnValue([
      { success: true },
      vi.fn(),
      false,
    ])

    const onOpenChange = vi.fn()
    act(() => {
      root.render(
        <AddTransactionDrawer
          accounts={accounts}
          categories={categories}
          isOpen={true}
          onOpenChange={onOpenChange}
          hideTrigger
        />
      )
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not call onOpenChange when state has no success flag', () => {
    ;(ReactMock.useActionState as ReturnType<typeof vi.fn>).mockReturnValue([
      {},
      vi.fn(),
      false,
    ])

    const onOpenChange = vi.fn()
    act(() => {
      root.render(
        <AddTransactionDrawer
          accounts={accounts}
          categories={categories}
          isOpen={true}
          onOpenChange={onOpenChange}
          hideTrigger
        />
      )
    })
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
