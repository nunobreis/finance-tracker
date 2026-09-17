'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { NormalisedRow } from '@/lib/csv/normalize'

export async function createTransaction(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const isTransfer = formData.get('is_transfer') === 'on'
  const amount = parseFloat(formData.get('amount') as string)
  const accountId = formData.get('account_id') as string
  const linkedAccountId = formData.get('linked_account_id') as string | null

  if (isTransfer && linkedAccountId) {
    // Insert two linked rows atomically
    const { data: debit, error: debitErr } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: accountId,
        occurred_on: formData.get('occurred_on') as string,
        amount: -Math.abs(amount),
        currency: formData.get('currency') as string,
        description: (formData.get('description') as string)?.trim() || null,
        merchant: (formData.get('merchant') as string)?.trim() || null,
        category_id: null,
        is_transfer: true,
        transfer_pair_id: null,
        import_batch_id: null,
        external_id: null,
        source: 'manual',
      })
      .select('id')
      .single()

    if (debitErr || !debit) return { error: debitErr?.message ?? 'Failed to create transfer' }

    const { data: credit, error: creditErr } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: linkedAccountId,
        occurred_on: formData.get('occurred_on') as string,
        amount: Math.abs(amount),
        currency: formData.get('currency') as string,
        description: (formData.get('description') as string)?.trim() || null,
        merchant: (formData.get('merchant') as string)?.trim() || null,
        category_id: null,
        is_transfer: true,
        transfer_pair_id: debit.id,
        import_batch_id: null,
        external_id: null,
        source: 'manual',
      })
      .select('id')
      .single()

    if (creditErr || !credit) return { error: creditErr?.message ?? 'Failed to create transfer credit' }

    // Link debit to credit
    await supabase
      .from('transactions')
      .update({ transfer_pair_id: credit.id })
      .eq('id', debit.id)
  } else {
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: accountId,
      occurred_on: formData.get('occurred_on') as string,
      amount,
      currency: formData.get('currency') as string,
      description: (formData.get('description') as string)?.trim() || null,
      merchant: (formData.get('merchant') as string)?.trim() || null,
      category_id: (formData.get('category_id') as string) || null,
      is_transfer: false,
      transfer_pair_id: null,
      import_batch_id: null,
      external_id: null,
      source: 'manual',
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  return {}
}

export async function importBatch(
  accountId: string,
  rows: NormalisedRow[],
  categoryIdMap: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .insert({ user_id: user.id, account_id: accountId, filename: null, row_count: rows.length, status: 'pending' })
    .select('id')
    .single()

  if (batchError || !batch) {
    return { success: false, error: batchError?.message ?? 'Failed to create batch' }
  }

  const transactions = rows.map(row => ({
    user_id: user.id,
    account_id: accountId,
    occurred_on: row.occurred_on,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    merchant: row.merchant,
    external_id: row.external_id,
    is_transfer: row.is_transfer,
    transfer_pair_id: null,
    category_id: row.raw_category ? (categoryIdMap[row.raw_category] ?? null) : null,
    import_batch_id: batch.id,
    source: 'csv_import' as const,
  }))

  const { error: txError } = await supabase.from('transactions').insert(transactions)

  if (txError) {
    await supabase.from('import_batches').update({ status: 'failed' }).eq('id', batch.id)
    return { success: false, error: txError.message }
  }

  await supabase
    .from('import_batches')
    .update({ status: 'completed', row_count: rows.length })
    .eq('id', batch.id)

  revalidatePath('/transactions')
  revalidatePath('/accounts')
  return { success: true }
}
