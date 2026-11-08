'use client'

import { useState } from 'react'
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
  const [txDrawerOpen, setTxDrawerOpen] = useState(false)
  const [defaultTransfer, setDefaultTransfer] = useState(false)
  const [billDrawerOpen, setBillDrawerOpen] = useState(false)

  function openTransaction(wantTransfer: boolean) {
    setDefaultTransfer(wantTransfer)
    setTxDrawerOpen(true)
  }

  return (
    <>
      <div className="flex w-full items-center justify-around lg:w-auto lg:justify-end lg:gap-6">
        <QuickAction
          icon={Plus}
          label={t('quickAdd')}
          variant="primary"
          onClick={() => openTransaction(false)}
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
          onClick={() => openTransaction(true)}
        />
        <QuickAction
          icon={Receipt}
          label={t('quickAddBill')}
          variant="glass"
          onClick={() => setBillDrawerOpen(true)}
        />
      </div>

      <AddTransactionDrawer
        accounts={accounts}
        categories={categories}
        isOpen={txDrawerOpen}
        onOpenChange={setTxDrawerOpen}
        defaultTransfer={defaultTransfer}
        hideTrigger
      />
      <AddBillDrawer
        accounts={accounts}
        categories={categories}
        isOpen={billDrawerOpen}
        onOpenChange={setBillDrawerOpen}
        hideTrigger
      />
    </>
  )
}
