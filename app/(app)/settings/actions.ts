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

  const { data: categories, error: loadError } = await supabase
    .from('categories')
    .select('id, kind, irs_deduction, income_type')
    .eq('user_id', user.id)
  if (loadError) return { error: loadError.message }

  const changes: Array<{ id: string; irs_deduction: IrsDeduction | null; income_type: IncomeType | null }> = []
  for (const cat of categories ?? []) {
    const rawIrs = (formData.get(`irs_deduction_${cat.id}`) as string | null) || null
    const rawIncome = (formData.get(`income_type_${cat.id}`) as string | null) || null
    if (rawIrs && !VALID_IRS_DEDUCTIONS.has(rawIrs))
      return { error: `Invalid IRS deduction value: ${rawIrs}` }
    if (rawIncome && !VALID_INCOME_TYPES.has(rawIncome))
      return { error: `Invalid income type value: ${rawIncome}` }
    // Only the field rendered for this category's kind is submitted; keep the other as-is
    const irs = cat.kind === 'expense' ? rawIrs : cat.irs_deduction
    const income = cat.kind === 'income' ? rawIncome : cat.income_type
    if (irs !== cat.irs_deduction || income !== cat.income_type) {
      changes.push({ id: cat.id, irs_deduction: irs as IrsDeduction | null, income_type: income as IncomeType | null })
    }
  }

  if (changes.length === 0) return { success: 'unchanged' }

  const results = await Promise.all(
    changes.map(c =>
      supabase
        .from('categories')
        .update({ irs_deduction: c.irs_deduction, income_type: c.income_type })
        .eq('id', c.id)
        .eq('user_id', user.id)
    )
  )
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

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
