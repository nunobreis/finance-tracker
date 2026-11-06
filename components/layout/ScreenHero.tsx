import { type ReactNode } from 'react'
import Image from 'next/image'

type Props = {
  title: string
  eyebrow?: ReactNode
  metric?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  mobileActions?: ReactNode
  desktopActions?: ReactNode
  subNav?: ReactNode
  children: ReactNode
}

export function ScreenHero({
  title,
  eyebrow,
  metric,
  subtitle,
  actions,
  mobileActions,
  desktopActions,
  subNav,
  children,
}: Props) {
  const mActions = mobileActions ?? actions
  const dActions = desktopActions ?? actions

  return (
    <div className="flex min-h-full flex-col lg:gap-6 lg:px-9 lg:py-7">
      {/* Mobile Norte Gradient Hero (< lg) */}
      <div className="bg-linear-to-b from-ink via-teal via-70% to-teal-dark px-5 pt-4 pb-11 text-white lg:hidden">
        <div className="flex h-11 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-[26px] w-[26px] shrink-0 overflow-hidden rounded-md">
              <Image
                src="/logo.png"
                alt="Norte"
                width={26}
                height={26}
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-h2 font-bold text-white">{title}</h1>
          </div>
          {mActions && <div className="flex items-center gap-2">{mActions}</div>}
        </div>

        {subNav && <div className="mt-2">{subNav}</div>}

        {(eyebrow || metric || subtitle) && (
          <div className="mt-1.5 flex flex-col gap-1">
            {eyebrow && <div className="text-caption text-glass-70">{eyebrow}</div>}
            {metric && (
              <div className="text-display-sm font-extrabold text-white tabular-nums">
                {metric}
              </div>
            )}
            {subtitle && <div className="text-caption text-glass-80">{subtitle}</div>}
          </div>
        )}
      </div>

      {/* Desktop Utility Header (>= lg) */}
      <header className="hidden lg:flex min-h-[44px] items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-h1 font-bold text-ink">{title}</h1>
          {subtitle && <div className="text-caption text-text-secondary">{subtitle}</div>}
        </div>
        {dActions && <div className="flex items-center gap-3">{dActions}</div>}
      </header>

      {/* Overlapping White Sheet (< lg) / Main Canvas Content (>= lg) */}
      <div className="-mt-6 flex flex-1 flex-col gap-3 rounded-t-[24px] bg-surface px-5 pt-5 pb-28 lg:mt-0 lg:gap-6 lg:rounded-none lg:bg-transparent lg:p-0">
        {children}
      </div>
    </div>
  )
}
