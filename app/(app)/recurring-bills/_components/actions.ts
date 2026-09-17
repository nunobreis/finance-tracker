'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { advanceDueDate } from '@/lib/bills'
import type { RecurringFrequency } from '@/types/database'

export async function upsertBill(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string | null
  const payload = {
    user_id: user.id,
    name: (formData.get('name') as string).trim(),
    category_id: (formData.get('category_id') as string) || null,
    account_id: (formData.get('account_id') as string) || null,
    amount: parseFloat(formData.get('amount') as string),
    currency: formData.get('currency') as string,
    frequency: formData.get('frequency') as RecurringFrequency,
    next_due_on: formData.get('next_due_on') as string,
    reminder_days_before: parseInt(formData.get('reminder_days_before') as string, 10) || 3,
    is_active: true,
  }

  const { error } = id
    ? await supabase.from('recurring_bills').update(payload).eq('id', id)
    : await supabase.from('recurring_bills').insert(payload)

  if (error) return { error: error.message }
  revalidatePath('/recurring-bills')
  return {}
}

export async function markBillPaid(billId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: bill, error: fetchError } = await supabase
    .from('recurring_bills')
    .select('next_due_on, frequency')
    .eq('id', billId)
    .single()

  if (fetchError || !bill) return { error: fetchError?.message ?? 'Bill not found' }

  const newDueDate = advanceDueDate(bill.next_due_on, bill.frequency as RecurringFrequency)

  const { error } = await supabase
    .from('recurring_bills')
    .update({ next_due_on: newDueDate })
    .eq('id', billId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/recurring-bills')
  return {}
}
