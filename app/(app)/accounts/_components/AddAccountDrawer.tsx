'use client'

import { useState, useActionState } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { createAccount } from './actions'
import { Plus } from 'lucide-react'

const initialState: { error?: string } = {}

export function AddAccountDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction] = useActionState(createAccount, initialState)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={16} />
        Add account
      </button>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add account">
        {state?.error && (
          <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
            {state.error}
          </div>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Account name <span className="text-status-danger">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Revolut"
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Institution</label>
            <input
              name="institution"
              placeholder="e.g. Revolut Bank"
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Account type <span className="text-status-danger">*</span>
            </label>
            <select
              name="account_type"
              required
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit_card">Credit card</option>
              <option value="cash">Cash</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">
              Currency <span className="text-status-danger">*</span>
            </label>
            <select
              name="currency"
              required
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create account
          </button>
        </form>
      </Drawer>
    </>
  )
}
