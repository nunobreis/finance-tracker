'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronsUpDown, Nfc, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type WalletAccountOption = {
  id: string
  /** Account name, e.g. "Revolut" */
  name: string
  /** Pre-formatted balance in the account's own currency, e.g. "£788.51" */
  value: string
  /** Optional secondary line, e.g. the reporting-currency equivalent */
  meta?: string
}

type Props = {
  /** Pocket label for the all-accounts view, e.g. "Total net worth" */
  label: string
  /** Pre-formatted total, e.g. "€ 24,350.00" */
  value: string
  /** Secondary line for the all-accounts view, e.g. GBP exposure */
  meta?: string
  /** Switcher caption, e.g. "2 accounts" */
  accountsLabel: string
  accounts: WalletAccountOption[]
  /** Menu item for the total, e.g. "All accounts" */
  allAccountsLabel: string
  /** Menu link to the accounts page, e.g. "Manage accounts" */
  manageAccountsLabel: string
  manageAccountsHref?: string
  /** Accessible name for the switcher button, e.g. "Switch account" */
  switcherAriaLabel: string
  className?: string
}

/**
 * The "wallet" hero from new_design.pen (component `Wallet`, 342×252):
 * a dark wallet with a Norte-branded card tucked in, and a glass pocket in
 * front holding the balance plus an account switcher.
 *
 * The switcher swaps the pocket between the total net worth and a single
 * account's balance; the selection is local to the card.
 *
 * Geometry is expressed as percentages of the 342×252 frame so the wallet
 * scales down on narrow phones; the amount uses container-query units for the
 * same reason. The card itself is decorative (aria-hidden).
 */
export function WalletCard({
  label,
  value,
  meta,
  accountsLabel,
  accounts,
  allAccountsLabel,
  manageAccountsLabel,
  manageAccountsHref = '/accounts',
  switcherAriaLabel,
  className,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const selected = accounts.find(a => a.id === selectedId) ?? null
  const shown = selected
    ? { label: selected.name, value: selected.value, meta: selected.meta }
    : { label, value, meta }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (id: string | null) => {
    setSelectedId(id)
    setOpen(false)
    buttonRef.current?.focus()
  }

  // The one deliberate exception to the named type scale: the amount scales with the
  // wallet's width (container-query units) so it fits on narrow phones, and long
  // amounts (≥ €1M) step down so they never overflow the pocket.
  const valueSize = shown.value.length > 13 ? 'text-[min(24px,7cqw)]' : 'text-[min(30px,8.8cqw)]'

  const options: Array<{ id: string | null; name: string; value: string }> = [
    { id: null, name: allAccountsLabel, value },
    ...accounts.map(a => ({ id: a.id, name: a.name, value: a.value })),
  ]

  return (
    <div ref={rootRef} className={cn('@container relative aspect-[342/252] w-full max-w-[342px] shrink-0', className)}>
      {/* Wallet back + stitching */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[26px] border border-white/12 bg-linear-to-b from-ink-slate to-ink-deep shadow-[0_14px_30px_rgba(10,15,28,0.35)]"
      />
      <div aria-hidden="true" className="absolute inset-2 rounded-[20px] border border-white/8" />

      {/* Norte card */}
      <div
        aria-hidden="true"
        className="absolute top-[6.35%] left-[5.85%] h-[75.4%] w-[88.3%] overflow-hidden rounded-2xl border border-white/30 bg-[linear-gradient(225deg,#3FD0E8_0%,var(--color-teal)_45%,var(--color-teal-dark)_100%)]"
      >
        <div className="absolute top-[-42%] left-[46.4%] aspect-square w-[92.7%] rounded-full border-[1.5px] border-white/18" />
        <div className="absolute top-[-10.5%] left-[66.2%] aspect-square w-[53%] rounded-full border-[1.5px] border-white/14" />

        <div className="absolute top-[7.4%] left-[5.3%] flex items-center gap-[7px]">
          <Image src="/logo-negative.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
          <span className="text-body leading-none font-extrabold tracking-[-0.2px] text-white">Norte</span>
        </div>

        <Nfc size={22} className="absolute top-[7.9%] right-[5.9%] text-white/80" />

        <div className="absolute top-[30.5%] left-[6%] h-7 w-[38px] rounded-[7px] border border-white/35 bg-[linear-gradient(225deg,rgba(255,255,255,0.45),rgba(255,255,255,0.2))]" />
      </div>

      {/* Pocket */}
      <div className="absolute inset-x-0 bottom-0 flex h-[43.65%] gap-[3px]">
        <div
          aria-live="polite"
          className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-[22px_8px_8px_26px] border border-white/18 bg-linear-to-b from-[#1C2A42E6] to-[#0D1525F2] px-[min(18px,5.3cqw)] py-3.5 backdrop-blur-xl"
        >
          <span className="truncate text-caption font-medium text-glass-70">{shown.label}</span>
          <span
            className={cn(
              valueSize,
              'leading-tight font-extrabold tracking-[-0.5px] whitespace-nowrap text-white tabular-nums',
            )}
          >
            {shown.value}
          </span>
          {shown.meta && (
            <span className="truncate text-label font-medium text-glass-60 tabular-nums">{shown.meta}</span>
          )}
        </div>

        <button
          ref={buttonRef}
          type="button"
          aria-label={switcherAriaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen(o => !o)}
          className={cn(
            'flex w-[23.5%] shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[8px_22px_26px_8px] border border-white/18 bg-linear-to-b from-[#1C2A42E6] to-[#0D1525F2] text-white backdrop-blur-xl transition-colors hover:from-[#243552E6] hover:to-[#121D33F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
            open && 'from-[#243552E6] to-[#121D33F2]',
          )}
        >
          <ChevronsUpDown size={20} aria-hidden="true" />
          <span className="px-1.5 text-center text-label leading-tight whitespace-nowrap text-glass-70">
            {accountsLabel}
          </span>
        </button>
      </div>

      {/* Account menu */}
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={switcherAriaLabel}
          className="absolute top-full right-0 z-30 mt-2 w-[min(260px,100%)] overflow-hidden rounded-2xl border border-white/12 bg-ink-slate/95 p-1.5 text-white shadow-[0_14px_30px_rgba(10,15,28,0.45)] backdrop-blur-xl"
        >
          {options.map(o => {
            const active = o.id === selectedId
            return (
              <button
                key={o.id ?? 'all'}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(o.id)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-glass-10 focus-visible:bg-glass-10 focus-visible:outline-none"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-sm font-semibold">{o.name}</span>
                  <span className="truncate text-caption text-glass-60 tabular-nums">{o.value}</span>
                </span>
                <Check size={16} aria-hidden="true" className={cn('shrink-0 text-teal', !active && 'invisible')} />
              </button>
            )
          })}
          <div className="my-1 h-px bg-glass-10" aria-hidden="true" />
          <Link
            href={manageAccountsHref}
            role="menuitem"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-medium text-glass-80 transition-colors hover:bg-glass-10 focus-visible:bg-glass-10 focus-visible:outline-none"
          >
            <Settings2 size={16} aria-hidden="true" />
            {manageAccountsLabel}
          </Link>
        </div>
      )}
    </div>
  )
}
