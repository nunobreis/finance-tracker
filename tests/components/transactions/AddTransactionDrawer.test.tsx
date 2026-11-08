import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { AddTransactionDrawer } from '@/app/(app)/transactions/_components/AddTransactionDrawer'
import type { Account, Category } from '@/types/database'

// Enable React 19 act environment
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// Mock next-intl: return the last segment of the key verbatim
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key.split('.').pop() ?? key,
}))

// Mock server actions
const mockCreateTransaction = vi.fn()
vi.mock('@/app/(app)/transactions/_components/actions', () => ({
  createTransaction: (...args: unknown[]) => mockCreateTransaction(...args),
}))

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
  {
    id: 'acc-2',
    user_id: 'u1',
    name: 'Monzo GBP',
    institution: null,
    account_type: 'checking',
    currency: 'GBP',
    country: 'GB',
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
  {
    id: 'cat-salary',
    user_id: 'u1',
    name: 'Salary',
    parent_category_id: null,
    kind: 'income',
    is_system: true,
    irs_deduction: null,
  },
]

// ---- test harness ----

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.clearAllMocks()
  // Default: createTransaction resolves to empty (pending — not yet called)
  mockCreateTransaction.mockResolvedValue({})
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
})

// ---- tests ----

describe('AddTransactionDrawer — uncontrolled mode', () => {
  it('renders a trigger button by default', () => {
    act(() => {
      root.render(
        <AddTransactionDrawer accounts={accounts} categories={categories} />
      )
    })
    const btn = container.querySelector('button')
    expect(btn).not.toBeNull()
  })

  it('opens the drawer when the trigger button is clicked', () => {
    act(() => {
      root.render(
        <AddTransactionDrawer accounts={accounts} categories={categories} />
      )
    })
    // Drawer should be closed initially
    expect(document.querySelector('[role="dialog"]')).toBeNull()

    act(() => {
      const btn = container.querySelector('button') as HTMLButtonElement
      btn.click()
    })
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('hides the trigger button when hideTrigger={true}', () => {
    act(() => {
      root.render(
        <AddTransactionDrawer
          accounts={accounts}
          categories={categories}
          hideTrigger
        />
      )
    })
    // No trigger button rendered
    expect(container.querySelector('button')).toBeNull()
  })
})

describe('AddTransactionDrawer — controlled mode', () => {
  it('respects isOpen={true} and renders dialog without clicking anything', () => {
    act(() => {
      root.render(
        <AddTransactionDrawer
          accounts={accounts}
          categories={categories}
          isOpen={true}
          onOpenChange={() => {}}
          hideTrigger
        />
      )
    })
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('respects isOpen={false} and does not render dialog', () => {
    act(() => {
      root.render(
        <AddTransactionDrawer
          accounts={accounts}
          categories={categories}
          isOpen={false}
          onOpenChange={() => {}}
          hideTrigger
        />
      )
    })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('calls onOpenChange(false) when the backdrop is clicked', () => {
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
    const backdrop = document.querySelector('[data-testid="bottom-sheet-backdrop"]') as HTMLElement
    expect(backdrop).not.toBeNull()
    act(() => {
      backdrop.click()
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('AddTransactionDrawer — segmented type tabs', () => {
  it('defaults to Expense tab (shows expense categories, no destination account)', () => {
    act(() => {
      root.render(
        <AddTransactionDrawer
          accounts={accounts}
          categories={categories}
          isOpen={true}
          onOpenChange={() => {}}
          hideTrigger
        />
      )
    })
    const dialog = document.querySelector('[role="dialog"]')!
    // The expense category (Food) should appear in the select
    expect(dialog.textContent).toContain('Food')
    // The income category (Salary) should NOT appear
    expect(dialog.textContent).not.toContain('Salary')
    // No destination account selector
    const selects = dialog.querySelectorAll('select[name="linked_account_id"]')
    expect(selects).toHaveLength(0)
  })

  it('switches to Income tab and shows income categories', () => {
    act(() => {
      root.render(
        <AddTransactionDrawer
          accounts={accounts}
          categories={categories}
          isOpen={true}
          onOpenChange={() => {}}
          hideTrigger
        />
      )
    })
    const dialog = document.querySelector('[role="dialog"]')!
    // Find the Income tab button and click it
    const buttons = Array.from(dialog.querySelectorAll('button'))
    const incomeBtn = buttons.find(b => b.textContent?.includes('txTypeIncome'))
    expect(incomeBtn).toBeDefined()
    act(() => {
      incomeBtn!.click()
    })
    // Now income category (Salary) should be visible
    expect(dialog.textContent).toContain('Salary')
    // Expense category (Food) should NOT appear
    expect(dialog.textContent).not.toContain('Food')
  })

  it('switches to Transfer tab and shows destination account selector, hides category', () => {
    act(() => {
      root.render(
        <AddTransactionDrawer
          accounts={accounts}
          categories={categories}
          isOpen={true}
          onOpenChange={() => {}}
          hideTrigger
        />
      )
    })
    const dialog = document.querySelector('[role="dialog"]')!
    const buttons = Array.from(dialog.querySelectorAll('button'))
    const transferBtn = buttons.find(b => b.textContent?.includes('txTypeTransfer'))
    expect(transferBtn).toBeDefined()
    act(() => {
      transferBtn!.click()
    })
    // Destination account selector should appear
    const destSelect = dialog.querySelector('select[name="linked_account_id"]')
    expect(destSelect).not.toBeNull()
    // Category select should be absent
    const catSelect = dialog.querySelector('select[name="category_id"]')
    expect(catSelect).toBeNull()
  })

  it('opens with Transfer tab pre-selected when defaultTransfer={true}', () => {
    act(() => {
      root.render(
        <AddTransactionDrawer
          accounts={accounts}
          categories={categories}
          isOpen={true}
          onOpenChange={() => {}}
          defaultTransfer={true}
          hideTrigger
        />
      )
    })
    const dialog = document.querySelector('[role="dialog"]')!
    // Destination account selector should appear immediately
    const destSelect = dialog.querySelector('select[name="linked_account_id"]')
    expect(destSelect).not.toBeNull()
    // Category select should be absent
    const catSelect = dialog.querySelector('select[name="category_id"]')
    expect(catSelect).toBeNull()
  })
})

