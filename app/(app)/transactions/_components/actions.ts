'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { NormalisedRow } from '@/lib/csv/normalize'
import { normalise, matchTarget, applyRules } from '@/lib/category-rules'

export type SetCategoryResult = {
  matchText: string
  matchKey: string
  matchCount: number
  existingRule: boolean
}

export async function createTransaction(
  _: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const txType = formData.get('tx_type') as string | null
  const isTransfer = formData.get('is_transfer') === 'on' || txType === 'transfer'
  const amount = parseFloat(formData.get('amount') as string)
  const accountId = formData.get('account_id') as string
  const linkedAccountId = formData.get('linked_account_id') as string | null

  if (!Number.isFinite(amount) || amount === 0) {
    return { error: 'Amount must be a non-zero number' }
  }

  if (!isTransfer) {
    if (txType === 'expense' && !(amount < 0)) {
      return { error: 'Expense amount must be negative' }
    }
    if (txType === 'income' && !(amount > 0)) {
      return { error: 'Income amount must be positive' }
    }
  }

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
    const { error: linkError } = await supabase
      .from('transactions')
      .update({ transfer_pair_id: credit.id })
      .eq('id', debit.id)
      .eq('user_id', user.id)
    if (linkError) {
      return { error: linkError.message }
    }
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
  revalidatePath('/dashboard')
  return { success: true }
}

export async function importBatch(
  accountId: string,
  rows: NormalisedRow[],
  categoryIdMap: Record<string, string>,
  filename: string | null = null
): Promise<{ success: boolean; batchId?: string; autoCategorisedCount?: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .insert({ user_id: user.id, account_id: accountId, filename, row_count: rows.length, status: 'pending' })
    .select('id')
    .single()

  if (batchError || !batch) {
    return { success: false, error: batchError?.message ?? 'Failed to create batch' }
  }

  const { data: rules } = await supabase
    .from('category_rules')
    .select('match_key, match_type, category_id, created_at')
    .eq('user_id', user.id)

  let autoCategorisedCount = 0
  const transactions = rows.map(row => {
    const csvMappedCategory = row.raw_category ? (categoryIdMap[row.raw_category] ?? null) : null
    const ruleMatchedCategory = applyRules({ merchant: row.merchant, description: row.description }, rules ?? [])
    if (ruleMatchedCategory) autoCategorisedCount++
    const categoryId = csvMappedCategory ?? ruleMatchedCategory ?? null
    return {
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
      category_id: categoryId,
      import_batch_id: batch.id,
      source: 'csv_import' as const,
    }
  })

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
  return { success: true, batchId: batch.id, autoCategorisedCount }
}

export async function deleteImportBatch(
  batchId: string
): Promise<{ deletedCount: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { deletedCount: 0, error: 'Not authenticated' }

  // Verify batch belongs to this user
  const { data: batchRow, error: batchCheckError } = await supabase
    .from('import_batches')
    .select('id')
    .eq('id', batchId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (batchCheckError || !batchRow) {
    return { deletedCount: 0, error: 'Batch not found' }
  }

  // Fetch transaction IDs in the batch
  const { data: txRows, error: txSelectError } = await supabase
    .from('transactions')
    .select('id')
    .eq('import_batch_id', batchId)
    .eq('user_id', user.id)

  if (txSelectError) {
    return { deletedCount: 0, error: txSelectError.message }
  }

  const txIds = (txRows ?? []).map((r: { id: string }) => r.id)

  if (txIds.length > 0) {
    // Clear any transfer_pair_id pointing to rows in the batch (external)
    await supabase
      .from('transactions')
      .update({ transfer_pair_id: null })
      .eq('user_id', user.id)
      .in('transfer_pair_id', txIds)

    // Clear any transfer_pair_id on rows inside the batch itself (internal)
    await supabase
      .from('transactions')
      .update({ transfer_pair_id: null })
      .eq('user_id', user.id)
      .eq('import_batch_id', batchId)
  }

  // Delete the batch's transactions first
  const { error: txDeleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('import_batch_id', batchId)
    .eq('user_id', user.id)

  if (txDeleteError) {
    return { deletedCount: 0, error: txDeleteError.message }
  }

  // Delete the import_batches row second
  const { error: batchDeleteError } = await supabase
    .from('import_batches')
    .delete()
    .eq('id', batchId)
    .eq('user_id', user.id)

  if (batchDeleteError) {
    return { deletedCount: 0, error: batchDeleteError.message }
  }

  revalidatePath('/transactions')
  revalidatePath('/transactions/import')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/budgets')
  revalidatePath('/net-worth')

  return { deletedCount: txIds.length }
}

export async function setTransactionCategory(
  txId: string,
  categoryId: string | null,
  matchText: string,
): Promise<{ data: SetCategoryResult | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .eq('id', txId)
    .eq('user_id', user.id)
  if (error) return { data: null, error: error.message }

  if (!matchText) return { data: { matchText: '', matchKey: '', matchCount: 0, existingRule: false } }

  const matchKey = normalise(matchText)

  const [{ data: uncategorised }, { data: existing }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, merchant, description')
      .is('category_id', null)
      .eq('is_transfer', false)
      .neq('id', txId)
      .eq('user_id', user.id),
    supabase
      .from('category_rules')
      .select('id')
      .eq('user_id', user.id)
      .eq('match_type', 'equals')
      .eq('match_key', matchKey)
      .maybeSingle(),
  ])

  const matchCount = (uncategorised ?? []).filter(tx => {
    const target = matchTarget(tx)
    return target ? normalise(target) === matchKey : false
  }).length

  return { data: { matchText, matchKey, matchCount, existingRule: !!existing } }
}

export async function createCategoryRule(
  matchText: string,
  matchKey: string,
  matchType: 'equals' | 'contains',
  categoryId: string,
): Promise<{ wasUpdate: boolean; backfillCount: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { wasUpdate: false, backfillCount: 0, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('category_rules')
    .select('id')
    .eq('user_id', user.id)
    .eq('match_type', matchType)
    .eq('match_key', matchKey)
    .maybeSingle()
  const wasUpdate = !!existing

  const { error: upsertError } = await supabase
    .from('category_rules')
    .upsert(
      { user_id: user.id, match_text: matchText, match_key: matchKey, match_type: matchType, category_id: categoryId },
      { onConflict: 'user_id,match_type,match_key' }
    )
  if (upsertError) return { wasUpdate, backfillCount: 0, error: upsertError.message }

  const { data: uncategorised } = await supabase
    .from('transactions')
    .select('id, merchant, description')
    .is('category_id', null)
    .eq('is_transfer', false)
    .eq('user_id', user.id)

  const ids = (uncategorised ?? [])
    .filter(tx => {
      const target = matchTarget(tx)
      return target ? normalise(target) === matchKey : false
    })
    .map(tx => tx.id)

  if (ids.length === 0) {
    revalidatePath('/transactions')
    return { wasUpdate, backfillCount: 0 }
  }

  const BATCH = 100
  let backfillCount = 0
  for (let i = 0; i < ids.length; i += BATCH) {
    const { error } = await supabase
      .from('transactions')
      .update({ category_id: categoryId })
      .in('id', ids.slice(i, i + BATCH))
      .eq('user_id', user.id)
    if (!error) backfillCount += Math.min(BATCH, ids.length - i)
  }

  revalidatePath('/transactions')
  return { wasUpdate, backfillCount }
}

export async function rerunRules(): Promise<{ count: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { count: 0, error: 'Not authenticated' }

  const [{ data: rules }, { data: uncategorised }] = await Promise.all([
    supabase
      .from('category_rules')
      .select('match_key, match_type, category_id, created_at')
      .eq('user_id', user.id),
    supabase
      .from('transactions')
      .select('id, merchant, description')
      .is('category_id', null)
      .eq('is_transfer', false)
      .eq('user_id', user.id),
  ])

  if (!rules?.length || !uncategorised?.length) return { count: 0 }

  const byCategory = new Map<string, string[]>()
  for (const tx of uncategorised) {
    const catId = applyRules(tx, rules)
    if (catId) {
      const existing = byCategory.get(catId) ?? []
      existing.push(tx.id)
      byCategory.set(catId, existing)
    }
  }

  if (byCategory.size === 0) return { count: 0 }

  const BATCH = 100
  let total = 0
  for (const [catId, ids] of byCategory) {
    for (let i = 0; i < ids.length; i += BATCH) {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: catId })
        .in('id', ids.slice(i, i + BATCH))
        .eq('user_id', user.id)
      if (!error) total += Math.min(BATCH, ids.length - i)
    }
  }

  revalidatePath('/transactions')
  return { count: total }
}
