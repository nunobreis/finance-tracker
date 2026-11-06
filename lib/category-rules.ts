export function normalise(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function matchTarget(tx: { merchant: string | null; description: string | null }): string | null {
  const target = tx.merchant?.trim() || tx.description
  return target || null
}

type Rule = {
  match_key: string
  match_type: 'equals' | 'contains'
  category_id: string
  created_at: string
}

export function findMatchingRule<T extends Rule>(
  tx: { merchant: string | null; description: string | null },
  rules: T[]
): T | null {
  const target = matchTarget(tx)
  if (!target) return null
  const normTarget = normalise(target)
  if (!normTarget) return null

  const matches = rules.filter(rule => {
    if (rule.match_type === 'equals') return normTarget === rule.match_key
    return normTarget.includes(rule.match_key)
  })

  if (matches.length === 0) return null

  matches.sort((a, b) => {
    if (a.match_type !== b.match_type) return a.match_type === 'equals' ? -1 : 1
    if (b.match_key.length !== a.match_key.length) return b.match_key.length - a.match_key.length
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return matches[0]
}

export function applyRules(
  tx: { merchant: string | null; description: string | null },
  rules: Rule[]
): string | null {
  return findMatchingRule(tx, rules)?.category_id ?? null
}

export function sanitiseSearchQuery(raw: string): string {
  return raw.replace(/[,()%_\\]/g, '').trim()
}

export function buildSearchOrFilter(raw: string): string | null {
  const clean = sanitiseSearchQuery(raw)
  if (!clean) return null
  return `description.ilike.%${clean}%,merchant.ilike.%${clean}%`
}
