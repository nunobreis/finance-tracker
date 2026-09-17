'use client'

import { useActionState } from 'react'
import { changePassword } from '../actions'

const initialState: { error?: string; success?: string } = {}

const inputClass = 'w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, initialState)

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">Change password</h2>
      {state?.error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">{state.error}</div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">{state.success}</div>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">New password</label>
          <input name="password" type="password" required minLength={6} placeholder="Min. 6 characters" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Confirm password</label>
          <input name="confirm" type="password" required minLength={6} placeholder="Repeat new password" className={inputClass} />
        </div>
        <button type="submit" className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Update password
        </button>
      </form>
    </div>
  )
}
