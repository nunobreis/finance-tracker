import Image from 'next/image'
import Link from 'next/link'
import { ChevronsUpDown, Nfc } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  /** e.g. "Total net worth" */
  label: string
  /** Pre-formatted amount, e.g. "€ 24,350.00" */
  value: string
  /** Secondary line under the amount, e.g. GBP exposure */
  meta?: string
  /** e.g. "2 accounts" */
  accountsLabel: string
  accountsHref?: string
  /** Accessible name for the accounts switcher link */
  accountsAriaLabel?: string
  className?: string
}

/**
 * The "wallet" hero from new_design.pen (component `Wallet`, 342×252):
 * a dark wallet with a Norte-branded card tucked in, and a glass pocket
 * in front holding the net worth figure plus an accounts switcher.
 *
 * Geometry is expressed as percentages of the 342×252 frame so the wallet
 * scales down on narrow phones; text uses container-query units for the same
 * reason. The card itself is decorative (aria-hidden); the pocket carries the
 * readable content.
 */
export function WalletCard({
  label,
  value,
  meta,
  accountsLabel,
  accountsHref = '/accounts',
  accountsAriaLabel,
  className,
}: Props) {
  // The one deliberate exception to the named type scale: the amount scales with the
  // wallet's width (container-query units) so it fits on narrow phones, and long
  // amounts (≥ €1M) step down so they never overflow the pocket.
  const valueSize = value.length > 13 ? 'text-[min(24px,7cqw)]' : 'text-[min(30px,8.8cqw)]'

  return (
    <div className={cn('@container relative aspect-[342/252] w-full max-w-[342px] shrink-0', className)}>
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
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-[22px_8px_8px_26px] border border-white/18 bg-linear-to-b from-[#1C2A42E6] to-[#0D1525F2] px-[min(18px,5.3cqw)] py-3.5 backdrop-blur-xl">
          <span className="text-caption font-medium text-glass-70">{label}</span>
          <span
            className={cn(
              valueSize,
              'leading-tight font-extrabold tracking-[-0.5px] whitespace-nowrap text-white tabular-nums',
            )}
          >
            {value}
          </span>
          {meta && (
            <span className="truncate text-label font-medium text-glass-60 tabular-nums">{meta}</span>
          )}
        </div>

        <Link
          href={accountsHref}
          aria-label={accountsAriaLabel}
          className="flex w-[19.3%] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[8px_22px_26px_8px] border border-white/18 bg-linear-to-b from-[#1C2A42E6] to-[#0D1525F2] text-white backdrop-blur-xl transition-colors hover:from-[#243552E6] hover:to-[#121D33F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          <ChevronsUpDown size={20} aria-hidden="true" />
          <span className="text-center text-label leading-tight whitespace-nowrap font-semibold text-glass-70">
            {accountsLabel}
          </span>
        </Link>
      </div>
    </div>
  )
}
