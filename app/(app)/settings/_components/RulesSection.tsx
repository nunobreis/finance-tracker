'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { addRule, deleteRule, updateRuleCategory } from '../actions'
import { rerunRules } from '@/app/(app)/transactions/_components/actions'
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

export function RulesSection({ rules: initialRules, categories }: Props) {
  const t = useTranslations('CategoryRules')

  const [rules, setRules] = useState(initialRules)
  const [addMatchText, setAddMatchText] = useState('')
  const [addMatchType, setAddMatchType] = useState<'equals' | 'contains'>('equals')
  const [addCategoryId, setAddCategoryId] = useState('')
  const [addStatus, setAddStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [addPending, startAddTransition] = useTransition()
  const [rerunPending, startRerunTransition] = useTransition()
  const [rerunStatus, setRerunStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      setRules(prev => prev.map(r => (r.id === ruleId ? originalRule : r)))
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

  function handleRerun() {
    setRerunStatus(null)
    startRerunTransition(async () => {
      const result = await rerunRules()
      if (result.error) {
        setRerunStatus({ type: 'error', text: result.error })
      } else if (result.count === 0) {
        setRerunStatus({ type: 'success', text: t('bulkNone') })
      } else {
        setRerunStatus({ type: 'success', text: t('bulkResult', { count: result.count }) })
      }
    })
  }

  return (
    <div className="rounded-[20px] border border-separator/80 bg-surface p-6 shadow-xs">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-body font-bold text-ink lg:text-h2">{t('title')}</h2>
          {rules.length > 0 && (
            <span className="rounded-full bg-teal-tint px-2.5 py-0.5 text-label font-semibold text-teal">
              {t('rulesCount', { count: rules.length })}
            </span>
          )}
        </div>
        {rules.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            disabled={rerunPending}
            onClick={handleRerun}
          >
            {rerunPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {t('bulkAction')}
          </Button>
        )}
      </div>

      {rerunStatus && (
        <div
          role={rerunStatus.type === 'error' ? 'alert' : 'status'}
          className={`mb-4 rounded-xl px-3 py-2 text-body-sm ${
            rerunStatus.type === 'success'
              ? 'bg-positive/10 text-positive'
              : 'bg-negative/10 text-negative'
          }`}
        >
          {rerunStatus.text}
        </div>
      )}

      {/* Mobile rule cards (< lg) */}
      {rules.length === 0 ? (
        <p className="mb-5 text-body-sm text-text-secondary lg:hidden">{t('noRules')}</p>
      ) : (
        <div className="flex flex-col gap-3 lg:hidden">
          {rules.map(rule => (
            <div key={rule.id} className="rounded-xl bg-canvas px-4 py-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-body-sm font-semibold text-ink">
                    &ldquo;{rule.match_text}&rdquo;
                  </span>
                  <span className="rounded-full bg-teal-tint px-2 py-0.5 text-label font-medium text-teal">
                    {t(`matchTypes.${rule.match_type}`)}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(rule.id)}
                  aria-label={t('deleteRule')}
                  className="shrink-0 rounded-lg p-1 text-text-secondary hover:bg-negative/10 hover:text-negative transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <select
                value={rule.category_id}
                onChange={e => handleUpdateCategory(rule.id, e.target.value)}
                className="w-full rounded-lg border border-separator bg-surface px-3 py-1.5 text-body-sm text-ink outline-none focus:border-teal"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Desktop table (>= lg) */}
      <div className="hidden lg:block">
        {rules.length === 0 ? (
          <p className="mb-5 text-body-sm text-text-secondary">{t('noRules')}</p>
        ) : (
          <div className="mb-5 overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-separator text-label font-semibold uppercase tracking-wide text-text-secondary">
                  <th className="pb-3 pr-4 text-left">{t('matchText')}</th>
                  <th className="pb-3 pr-4 text-left">{t('matchType')}</th>
                  <th className="pb-3 pr-4 text-left">{t('category')}</th>
                  <th className="pb-3 pr-4 text-left">{t('createdAt')}</th>
                  <th className="pb-3 text-left" />
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/50">
                {rules.map(rule => (
                  <tr key={rule.id}>
                    <td className="py-3 pr-4 font-medium text-ink">{rule.match_text}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-teal-tint px-2.5 py-0.5 text-label font-medium text-teal">
                        {t(`matchTypes.${rule.match_type}`)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={rule.category_id}
                        onChange={e => handleUpdateCategory(rule.id, e.target.value)}
                        className="rounded-lg border border-separator bg-canvas px-2.5 py-1.5 text-body-sm text-ink outline-none focus:border-teal"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-text-secondary">
                      {new Date(rule.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        aria-label={t('deleteRule')}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-negative/10 hover:text-negative transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inline Add Rule form (desktop) */}
        <div className="border-t border-separator/60 pt-5">
          <p className="mb-3 text-label font-semibold uppercase tracking-wide text-text-secondary">
            {t('addRule')}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label={t('matchText')}
              value={addMatchText}
              onChange={e => setAddMatchText(e.target.value)}
              placeholder={t('matchTextPlaceholder')}
              containerClassName="min-w-[180px]"
            />
            <Select
              label={t('matchType')}
              value={addMatchType}
              onChange={e => setAddMatchType(e.target.value as 'equals' | 'contains')}
              containerClassName="min-w-[130px]"
            >
              <option value="equals">{t('matchTypes.equals')}</option>
              <option value="contains">{t('matchTypes.contains')}</option>
            </Select>
            <Select
              label={t('category')}
              value={addCategoryId}
              onChange={e => setAddCategoryId(e.target.value)}
              containerClassName="min-w-[160px]"
            >
              <option value="">—</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
            <Button
              onClick={handleAdd}
              disabled={addPending || !addMatchText.trim() || !addCategoryId}
              size="md"
            >
              {addPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t('addRule')}
            </Button>
          </div>
          {addStatus && (
            <div
              role={addStatus.type === 'error' ? 'alert' : 'status'}
              className={`mt-3 rounded-xl px-3 py-2 text-body-sm ${
                addStatus.type === 'success'
                  ? 'bg-positive/10 text-positive'
                  : 'bg-negative/10 text-negative'
              }`}
            >
              {addStatus.text}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Add Rule (< lg) */}
      <div className="mt-5 border-t border-separator/60 pt-5 lg:hidden">
        <p className="mb-3 text-label font-semibold uppercase tracking-wide text-text-secondary">
          {t('addRule')}
        </p>
        <div className="flex flex-col gap-3">
          <Input
            label={t('matchText')}
            value={addMatchText}
            onChange={e => setAddMatchText(e.target.value)}
            placeholder={t('matchTextPlaceholder')}
          />
          <div className="flex gap-3">
            <Select
              label={t('matchType')}
              value={addMatchType}
              onChange={e => setAddMatchType(e.target.value as 'equals' | 'contains')}
              containerClassName="flex-1"
            >
              <option value="equals">{t('matchTypes.equals')}</option>
              <option value="contains">{t('matchTypes.contains')}</option>
            </Select>
            <Select
              label={t('category')}
              value={addCategoryId}
              onChange={e => setAddCategoryId(e.target.value)}
              containerClassName="flex-1"
            >
              <option value="">—</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
          </div>
          <Button
            onClick={handleAdd}
            disabled={addPending || !addMatchText.trim() || !addCategoryId}
            fullWidth
          >
            {addPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t('addRule')}
          </Button>
          {addStatus && (
            <div
              role={addStatus.type === 'error' ? 'alert' : 'status'}
              className={`rounded-xl px-3 py-2 text-body-sm ${
                addStatus.type === 'success'
                  ? 'bg-positive/10 text-positive'
                  : 'bg-negative/10 text-negative'
              }`}
            >
              {addStatus.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
