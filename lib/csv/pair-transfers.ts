type TransferRow = { id: string; occurred_on: string; amount: number }

/**
 * Given a list of is_transfer rows from the same import batch, returns pairs
 * [positiveId, negativeId] that can be linked via transfer_pair_id.
 *
 * Pairs only when there is exactly one positive and one negative leg on the
 * same date — the unambiguous case covering Revolut EXCHANGE rows.
 * Days with multiple transfer legs are left unpaired to avoid mismatches.
 */
export function findTransferPairs(transfers: TransferRow[]): Array<[string, string]> {
  const byDate: Record<string, TransferRow[]> = {}
  for (const tx of transfers) {
    byDate[tx.occurred_on] ??= []
    byDate[tx.occurred_on].push(tx)
  }

  const pairs: Array<[string, string]> = []
  for (const group of Object.values(byDate)) {
    const positives = group.filter(tx => tx.amount > 0)
    const negatives = group.filter(tx => tx.amount < 0)
    if (positives.length === 1 && negatives.length === 1) {
      pairs.push([positives[0].id, negatives[0].id])
    }
  }
  return pairs
}
