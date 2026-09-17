'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { signInWithPassword, signInWithMagicLink } from '../actions'

type AuthState = { error?: string; success?: string }

const initialState: AuthState = {}

export function LoginForm() {
  const t = useTranslations('Auth')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [passwordState, passwordAction] = useActionState<AuthState, FormData>(signInWithPassword, initialState)
  const [magicState, magicAction] = useActionState<AuthState, FormData>(signInWithMagicLink, initialState)

  const state = mode === 'password' ? passwordState : magicState
  const action = mode === 'password' ? passwordAction : magicAction

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-8 shadow-sm">
      <div className="mb-8">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
          <span className="text-sm font-bold text-white">FT</span>
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">{t('appName')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('tagline')}</p>
      </div>

      {state.error && (
        <div className="mb-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-status-danger">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-4 rounded-lg bg-good-bg px-4 py-3 text-sm text-status-good">
          {state.success}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">
            {t('email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder={t('emailPlaceholder')}
          />
        </div>

        {mode === 'password' && (
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-primary">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border-col bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white transition-opacity hover:bg-opacity-90"
        >
          {mode === 'password' ? t('signIn') : t('sendMagicLink')}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
        className="mt-4 w-full text-center text-sm text-text-secondary hover:text-text-primary"
      >
        {mode === 'password' ? t('switchToMagic') : t('switchToPassword')}
      </button>
    </div>
  )
}
