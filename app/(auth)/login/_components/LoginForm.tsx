'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Sparkles, Lock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { signInWithPassword, signInWithMagicLink } from '../actions'

type AuthState = { error?: string; success?: string }

const initialState: AuthState = {}

export function LoginForm() {
  const t = useTranslations('Auth')
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [passwordState, passwordAction] = useActionState<AuthState, FormData>(
    signInWithPassword,
    initialState
  )
  const [magicState, magicAction] = useActionState<AuthState, FormData>(
    signInWithMagicLink,
    initialState
  )

  const state = mode === 'password' ? passwordState : magicState
  const action = mode === 'password' ? passwordAction : magicAction

  return (
    <div className="flex w-full max-w-[390px] flex-1 flex-col justify-between lg:flex-initial lg:gap-6">
      {/* Top Brand Bar */}
      <div className="flex h-12 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-[30px] w-[30px] shrink-0 overflow-hidden rounded-lg">
            <Image
              src="/logo.png"
              alt="Norte"
              width={30}
              height={30}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-h2 font-bold text-white">Norte</span>
        </div>

        <span className="inline-flex h-7 items-center rounded-full border border-glass-25 bg-glass-12 px-3 text-label font-semibold text-white">
          {t('privateBadge')}
        </span>
      </div>

      {/* Hero Brand Mark */}
      <div className="flex flex-col items-center gap-2 py-5 text-center">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
          <Image
            src="/logo.png"
            alt="Norte"
            width={64}
            height={64}
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="text-display-sm font-extrabold tracking-[0.06em] text-white">
          NORTE
        </h1>
        <p className="text-body-sm font-medium text-glass-80">
          {t('heroSubtitle')}
        </p>
      </div>

      {/* Auth Card */}
      <div className="flex flex-col gap-3.5 rounded-[24px] bg-surface p-6 shadow-xl">
        <div className="flex flex-col gap-1">
          <h2 className="text-h1-sm font-extrabold text-ink">
            {t('welcomeBack')}
          </h2>
          <p className="text-caption text-text-secondary">
            {t('cardSubtitle')}
          </p>
        </div>

        {state.error && (
          <div className="rounded-xl bg-negative-tint px-4 py-3 text-caption font-medium text-negative">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="rounded-xl bg-positive-tint px-4 py-3 text-caption font-medium text-positive">
            {state.success}
          </div>
        )}

        <form action={action} className="flex flex-col gap-3.5">
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            label={t('emailAddress')}
            placeholder={t('emailPlaceholder')}
          />

          {mode === 'password' && (
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              label={t('password')}
              placeholder="••••••••••••"
            />
          )}

          <div className="pt-1">
            <Button type="submit" variant="primary" size="lg" fullWidth>
              {mode === 'password' ? t('signInToNorte') : t('sendMagicLink')}
            </Button>
          </div>
        </form>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-separator" />
          <span className="text-label font-medium text-text-muted">•</span>
          <div className="h-px flex-1 bg-separator" />
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
          className="inline-flex w-full items-center justify-center gap-1.5 text-caption font-semibold text-teal hover:underline cursor-pointer"
        >
          <Sparkles size={14} />
          <span>{mode === 'password' ? t('switchToMagic') : t('switchToPassword')}</span>
        </button>
      </div>

      {/* Bottom Security Note */}
      <div className="flex items-center justify-center gap-1.5 pt-3 text-center">
        <Lock size={12} className="shrink-0 text-glass-70" />
        <span className="text-label font-medium text-glass-70">
          {t('securityNote')}
        </span>
      </div>
    </div>
  )
}
