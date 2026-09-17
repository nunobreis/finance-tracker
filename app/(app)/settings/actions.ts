'use server'

import { revalidatePath } from 'next/cache'
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
  revalidatePath('/settings')
  return { success: 'Settings saved' }
}
