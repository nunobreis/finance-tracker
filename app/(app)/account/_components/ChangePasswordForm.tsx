'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { changePassword } from '../actions'

const initialState: { error?: string; success?: string } = {}

export function ChangePasswordForm() {
  const t = useTranslations('Account')
  const [state, formAction, isPending] = useActionState(changePassword, initialState)

  return (
    <div className="rounded-[20px] border border-separator/80 bg-surface p-6 shadow-xs">
      <h2 className="mb-5 text-body font-bold text-ink lg:text-h2">{t('changePassword')}</h2>

      {state?.error && (
        <div className="mb-4 rounded-xl bg-negative/10 px-4 py-3 text-body-sm text-negative" role="alert">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-xl bg-positive/10 px-4 py-3 text-body-sm text-positive" role="status">
          {t('passwordUpdated')}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label={t('newPassword')}
          name="password"
          type="password"
          required
          minLength={6}
          placeholder={t('newPasswordPlaceholder')}
        />
        <Input
          label={t('confirmPassword')}
          name="confirm"
          type="password"
          required
          minLength={6}
          placeholder={t('confirmPasswordPlaceholder')}
        />
        <div className="pt-1">
          <Button type="submit" size="md" disabled={isPending} aria-busy={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t('updatePassword')}
          </Button>
        </div>
      </form>
    </div>
  )
}
