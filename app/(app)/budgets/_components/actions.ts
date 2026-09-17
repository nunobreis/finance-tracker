'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function upsertBudget(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const categoryId = formData.get('category_id') as string
  const amountEur = parseFloat(formData.get('amount_eur') as string)
  const periodMonth = `${formData.get('period_month') as string}-01`

  if (!categoryId || isNaN(amountEur) || amountEur <= 0) {
    return { error: 'Category and a positive amount are required' }
  }

  const { error } = await supabase.from('budgets').upsert(
    { user_id: user.id, category_id: categoryId, period_month: periodMonth, amount_eur: amountEur, rollover: false },
    { onConflict: 'user_id,category_id,period_month' }
  )

  if (error) return { error: error.message }
  revalidatePath('/budgets')
  return {}
}
