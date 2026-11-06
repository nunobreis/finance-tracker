'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { IrsDeduction, IncomeType } from '@/types/database'
import { IRS_DEDUCTION_VALUES, INCOME_TYPE_VALUES } from '@/types/database'

const VALID_IRS_DEDUCTIONS = new Set<string>(IRS_DEDUCTION_VALUES)
const VALID_INCOME_TYPES = new Set<string>(INCOME_TYPE_VALUES)

export async function updateCategoryTaxFields(
  _: unknown,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)

  for (const cat of categories ?? []) {
    const rawIrs = formData.get(`irs_deduction_${cat.id}`) as string | null
    const rawIncome = formData.get(`income_type_${cat.id}`) as string | null
    if (rawIrs && !VALID_IRS_DEDUCTIONS.has(rawIrs))
      return { error: `Invalid IRS deduction value: ${rawIrs}` }
    if (rawIncome && !VALID_INCOME_TYPES.has(rawIncome))
      return { error: `Invalid income type value: ${rawIncome}` }
  }

  for (const cat of categories ?? []) {
    const rawIrs = formData.get(`irs_deduction_${cat.id}`) as string | null
    const rawIncome = formData.get(`income_type_${cat.id}`) as string | null
    const { error } = await supabase
      .from('categories')
      .update({
        irs_deduction: (rawIrs || null) as IrsDeduction | null,
        income_type: (rawIncome || null) as IncomeType | null,
      })
      .eq('id', cat.id)
      .eq('user_id', user.id)
    if (error) return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: 'saved' }
}

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
