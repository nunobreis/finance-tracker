'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function saveSettings(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const reporting_currency = formData.get('reporting_currency') as string
  const locale = formData.get('locale') as string

  const { error } = await supabase.auth.updateUser({
    data: { reporting_currency, locale },
  })
  if (error) return { error: error.message }

  const cookieStore = await cookies()
  const maxAge = 60 * 60 * 24 * 365
  cookieStore.set('locale', locale, { path: '/', maxAge })
  cookieStore.set('reporting_currency', reporting_currency, { path: '/', maxAge })

  revalidatePath('/settings')
  return { success: 'Settings saved' }
}
