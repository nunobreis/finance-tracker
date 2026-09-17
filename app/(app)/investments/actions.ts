'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { refreshPricesIfStale } from '@/lib/prices'
import type { AssetType } from '@/types/database'

export async function refreshPrices(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: holdings } = await supabase.from('holdings').select('id, symbol')
  await refreshPricesIfStale(supabase, holdings ?? [], true)
  revalidatePath('/investments')
  return {}
}

export async function upsertHolding(
  _: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id = formData.get('id') as string | null
  const payload = {
    user_id: user.id,
    account_id: formData.get('account_id') as string,
    symbol: (formData.get('symbol') as string).trim().toUpperCase(),
    name: (formData.get('name') as string).trim() || null,
    asset_type: formData.get('asset_type') as AssetType,
    quantity: parseFloat(formData.get('quantity') as string),
    avg_cost_basis: formData.get('avg_cost_basis')
      ? parseFloat(formData.get('avg_cost_basis') as string)
      : null,
    currency: (formData.get('currency') as string).trim().toUpperCase(),
  }

  const { error } = id
    ? await supabase.from('holdings').update(payload).eq('id', id).eq('user_id', user.id)
    : await supabase.from('holdings').insert(payload)

  if (error) return { error: error.message }
  revalidatePath('/investments')
  return {}
}

export async function deleteHolding(holdingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('holding_price_history').delete().eq('holding_id', holdingId).eq('user_id', user.id)
  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', holdingId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/investments')
  return {}
}
