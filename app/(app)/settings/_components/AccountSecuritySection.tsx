'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ChangePasswordForm } from '@/app/(app)/account/_components/ChangePasswordForm'
import { signOut } from '@/app/(auth)/login/actions'

export function AccountSecuritySection() {
  const t = useTranslations('Account')

  return (
    <div className="flex flex-col gap-4">
      {/* Change Password card */}
      <ChangePasswordForm />

      {/* Sign Out card */}
      <div className="rounded-[20px] border border-separator/80 bg-canvas lg:bg-surface p-6 shadow-xs">
        <h2 className="mb-4 text-body font-bold text-ink lg:text-h2">{t('session')}</h2>
        <form action={signOut}>
          <Button type="submit" variant="danger" size="md">
            {t('signOut')}
          </Button>
        </form>
      </div>
    </div>
  )
}
