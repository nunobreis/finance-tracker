import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChangePasswordForm } from './_components/ChangePasswordForm'
import { signOut } from '@/app/(auth)/login/actions'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('Account')

  return (
    <div className="flex flex-col">
      <PageHeader title={t('title')} />
      <div className="flex max-w-lg flex-col gap-6 p-6">
        <div className="rounded-xl border border-border-col bg-card-bg p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('accountSection')}</h2>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-text-tertiary">{t('email')}</p>
            <p className="text-sm font-medium text-text-primary">{user?.email ?? '—'}</p>
          </div>
        </div>

        <ChangePasswordForm />

        <div className="rounded-xl border border-border-col bg-card-bg p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('session')}</h2>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-status-danger px-4 py-2 text-sm font-medium text-status-danger hover:bg-danger-bg"
            >
              {t('signOut')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
