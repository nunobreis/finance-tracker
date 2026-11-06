'use client'

import { useRef } from 'react'
import { Plus, Upload, ArrowLeftRight, Receipt } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { QuickAction } from '@/components/ui/QuickAction'
import { AddTransactionDrawer } from '@/app/(app)/transactions/_components/AddTransactionDrawer'
import { AddBillDrawer } from '@/app/(app)/recurring-bills/_components/AddBillDrawer'
import type { Account, Category } from '@/types/database'

type Props = {
  accounts: Account[]
  categories: Category[]
}

export function DashboardQuickActions({ accounts, categories }: Props) {
  const t = useTranslations('Dashboard')
  const txWrapperRef = useRef<HTMLDivElement>(null)
  const billWrapperRef = useRef<HTMLDivElement>(null)

  function openTransactionDrawer(wantTransfer: boolean) {
    const triggerBtn = txWrapperRef.current?.querySelector('button')
    triggerBtn?.click()
    requestAnimationFrame(() => {
      const checkbox = document.getElementById('is_transfer') as HTMLInputElement | null
      if (checkbox && checkbox.checked !== wantTransfer) {
        checkbox.click()
      }
    })
  }

  function openBillDrawer() {
    const triggerBtn = billWrapperRef.current?.querySelector('button')
    triggerBtn?.click()
  }

  return (
    <>
      <div className="flex w-full items-center justify-around lg:w-auto lg:justify-end lg:gap-6">
        <QuickAction
          icon={Plus}
          label={t('quickAdd')}
          variant="primary"
          onClick={() => openTransactionDrawer(false)}
        />
        <QuickAction
          icon={Upload}
          label={t('quickImport')}
          variant="glass"
          href="/transactions/import"
        />
        <QuickAction
          icon={ArrowLeftRight}
          label={t('quickTransfer')}
          variant="glass"
          onClick={() => openTransactionDrawer(true)}
        />
        <QuickAction
          icon={Receipt}
          label={t('quickAddBill')}
          variant="glass"
          onClick={openBillDrawer}
        />
      </div>

      <div ref={txWrapperRef} className="hidden" aria-hidden="true">
        <AddTransactionDrawer accounts={accounts} categories={categories} />
      </div>
      <div ref={billWrapperRef} className="hidden" aria-hidden="true">
        <AddBillDrawer accounts={accounts} categories={categories} />
      </div>
    </>
  )
}
