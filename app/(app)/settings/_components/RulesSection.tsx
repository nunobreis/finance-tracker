'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { addRule, deleteRule, updateRuleCategory } from '../actions'
import type { Category } from '@/types/database'

type RuleRow = {
  id: string
  match_text: string
  match_type: 'equals' | 'contains'
  category_id: string
  created_at: string
  categories: { name: string } | null
}

type Props = {
  rules: RuleRow[]
  categories: Pick<Category, 'id' | 'name'>[]
}

const selectClass =
  'rounded-lg border border-border-col bg-white px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent'

export function RulesSection({ rules: initialRules, categories }: Props) {
  const t = useTranslations('CategoryRules')
  const [rules, setRules] = useState(initialRules)
  const [addStatus, setAddStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [addPending, startAddTransition] = useTransition()
  const [addMatchText, setAddMatchText] = useState('')
  const [addMatchType, setAddMatchType] = useState<'equals' | 'contains'>('equals')
  const [addCategoryId, setAddCategoryId] = useState('')

  useEffect(() => { setRules(initialRules) }, [initialRules])

  async function handleDelete(ruleId: string) {
    const deleted = rules.find(r => r.id === ruleId)
    if (!deleted) return
    setRules(prev => prev.filter(r => r.id !== ruleId))
    const result = await deleteRule(ruleId)
    if (result.error) {
      setRules(prev =>
        [...prev, deleted].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      )
    }
  }

  async function handleUpdateCategory(ruleId: string, newCategoryId: string) {
    const originalRule = rules.find(r => r.id === ruleId)
    if (!originalRule) return
    const newCategoryName = categories.find(c => c.id === newCategoryId)?.name ?? ''
    setRules(prev =>
      prev.map(r =>
        r.id === ruleId ? { ...r, category_id: newCategoryId, categories: { name: newCategoryName } } : r
      )
    )
    const result = await updateRuleCategory(ruleId, newCategoryId)
    if (result.error) {
      setRules(prev =>
        prev.map(r => (r.id === ruleId ? originalRule : r))
      )
    }
  }

  function handleAdd() {
    if (!addMatchText.trim() || !addCategoryId) return
    startAddTransition(async () => {
      const result = await addRule(addMatchText.trim(), addMatchType, addCategoryId)
      if (result.error) {
        setAddStatus({ type: 'error', text: result.error })
      } else {
        setAddMatchText('')
        setAddStatus({ type: 'success', text: t('saved') })
      }
    })
  }

  return (
    <div className="rounded-xl border border-border-col bg-card-bg p-5">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">{t('title')}</h2>

      {rules.length === 0 ? (
        <p className="mb-4 text-sm text-text-tertiary">{t('noRules')}</p>
      ) : (
        <>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-col text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="pb-2 pr-4 text-left">{t('matchText')}</th>
                  <th className="pb-2 pr-4 text-left">{t('matchType')}</th>
                  <th className="pb-2 pr-4 text-left">{t('category')}</th>
                  <th className="pb-2 pr-4 text-left">{t('createdAt')}</th>
                  <th className="pb-2 text-left" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-col">
                {rules.map(rule => (
                  <tr key={rule.id}>
                    <td className="py-2 pr-4 text-text-primary">{rule.match_text}</td>
                    <td className="py-2 pr-4 text-text-secondary">
                      {t(`matchTypes.${rule.match_type}`)}
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        value={rule.category_id}
                        onChange={e => handleUpdateCategory(rule.id, e.target.value)}
                        className={selectClass}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4 text-text-secondary whitespace-nowrap">
                      {new Date(rule.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-xs text-status-danger hover:underline"
                      >
                        {t('deleteRule')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mb-4 text-xs text-text-tertiary">{t('deleteHint')}</p>
        </>
      )}

      <div className="border-t border-border-col pt-4">
        <p className="mb-3 text-xs font-medium text-text-secondary uppercase tracking-wide">{t('addRule')}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={addMatchText}
              onChange={e => setAddMatchText(e.target.value)}
              placeholder={t('matchTextPlaceholder')}
              className="rounded-lg border border-border-col bg-white px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <select
            value={addMatchType}
            onChange={e => setAddMatchType(e.target.value as 'equals' | 'contains')}
            className={selectClass}
          >
            <option value="equals">{t('matchTypes.equals')}</option>
            <option value="contains">{t('matchTypes.contains')}</option>
          </select>
          <select
            value={addCategoryId}
            onChange={e => setAddCategoryId(e.target.value)}
            className={selectClass}
          >
            <option value="">— {t('category')} —</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={addPending || !addMatchText.trim() || !addCategoryId}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t('addRule')}
          </button>
        </div>
        {addStatus && (
          <div
            role={addStatus.type === 'error' ? 'alert' : 'status'}
            className={`mt-2 rounded-lg px-3 py-1.5 text-sm ${
              addStatus.type === 'success'
                ? 'bg-good-bg text-status-good'
                : 'bg-danger-bg text-status-danger'
            }`}
          >
            {addStatus.text}
          </div>
        )}
      </div>
    </div>
  )
}
