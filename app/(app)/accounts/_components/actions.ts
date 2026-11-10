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
    country: (formData.get('country') as string) || 'PT',
    opening_balance: parseFloat((formData.get('opening_balance') as string) || '0'),
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/accounts')
  return {}
}

export type AccountDeletionImpact = {
  transactionCount: number
  importBatchCount: number
  recurringBillCount: number
  holdingsCount: number
}

export async function getAccountDeletionImpact(
  accountId: string
): Promise<{ data: AccountDeletionImpact | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const [txRes, batchRes, billRes, holdingRes] = await Promise.all([
    supabase.from('transactions').select('id', { count: 'exact', head: true })
      .eq('account_id', accountId).eq('user_id', user.id),
    supabase.from('import_batches').select('id', { count: 'exact', head: true })
      .eq('account_id', accountId).eq('user_id', user.id),
    supabase.from('recurring_bills').select('id', { count: 'exact', head: true })
      .eq('account_id', accountId).eq('user_id', user.id),
    supabase.from('holdings').select('id', { count: 'exact', head: true })
      .eq('account_id', accountId).eq('user_id', user.id),
  ])

  return {
    data: {
      transactionCount: txRes.count ?? 0,
      importBatchCount: batchRes.count ?? 0,
      recurringBillCount: billRes.count ?? 0,
      holdingsCount: holdingRes.count ?? 0,
    },
  }
}

export async function deleteAccount(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Block if the account has holdings
  const { count: holdingsCount } = await supabase
    .from('holdings')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', id)
    .eq('user_id', user.id)
  if ((holdingsCount ?? 0) > 0) {
    return { error: 'Move or delete its holdings first.' }
  }

  // Collect all transaction IDs for this account
  const { data: txRows, error: txSelectErr } = await supabase
    .from('transactions')
    .select('id')
    .eq('account_id', id)
    .eq('user_id', user.id)
  if (txSelectErr) return { error: txSelectErr.message }

  const txIds = (txRows ?? []).map(r => r.id)

  if (txIds.length > 0) {
    // Clear transfer_pair_id on external transactions pointing into this account
    const CHUNK = 100
    for (let i = 0; i < txIds.length; i += CHUNK) {
      const chunk = txIds.slice(i, i + CHUNK)
      const { error: extErr } = await supabase
        .from('transactions')
        .update({ transfer_pair_id: null })
        .eq('user_id', user.id)
        .in('transfer_pair_id', chunk)
      if (extErr) return { error: extErr.message }
    }

    // Clear transfer_pair_id on the account's own rows
    const { error: intErr } = await supabase
      .from('transactions')
      .update({ transfer_pair_id: null })
      .eq('account_id', id)
      .eq('user_id', user.id)
    if (intErr) return { error: intErr.message }

    // Delete the account's transactions
    const { error: txDelErr } = await supabase
      .from('transactions')
      .delete()
      .eq('account_id', id)
      .eq('user_id', user.id)
    if (txDelErr) return { error: txDelErr.message }
  }

  // Delete import batches for the account
  const { error: batchDelErr } = await supabase
    .from('import_batches')
    .delete()
    .eq('account_id', id)
    .eq('user_id', user.id)
  if (batchDelErr) return { error: batchDelErr.message }

  // Delete recurring bills linked to the account
  const { error: billDelErr } = await supabase
    .from('recurring_bills')
    .delete()
    .eq('account_id', id)
    .eq('user_id', user.id)
  if (billDelErr) return { error: billDelErr.message }

  // Hard-delete the account row
  const { error: accDelErr } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (accDelErr) return { error: accDelErr.message }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/budgets')
  return {}
}
