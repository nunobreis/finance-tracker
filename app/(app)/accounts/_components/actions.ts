'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AccountType } from '@/types/database'

export async function createAccount(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: (formData.get('name') as string).trim(),
    institution: (formData.get('institution') as string)?.trim() || null,
    account_type: formData.get('account_type') as AccountType,
    currency: formData.get('currency') as string,
    opening_balance: parseFloat((formData.get('opening_balance') as string) || '0'),
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/accounts')
  return {}
}
