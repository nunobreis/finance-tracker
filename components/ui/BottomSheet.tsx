'use client'

import { type ReactNode, useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  cancelLabel?: string
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, cancelLabel = 'Cancel', children }: Props) {
  const titleId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)

    const focusable = sheetRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, button:not([data-close-sheet])'
    )
    if (focusable) focusable.focus()
    else sheetRef.current?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        data-testid="bottom-sheet-backdrop"
        className="fixed inset-0 z-40 bg-ink/55 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] w-full flex-col rounded-t-[28px] border-t border-separator bg-surface px-5 pt-3 pb-7 shadow-2xl outline-none lg:inset-auto lg:left-1/2 lg:top-1/2 lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[24px] lg:border lg:p-6"
      >
        <div className="mb-3 flex justify-center lg:hidden" aria-hidden="true">
          <div className="h-[5px] w-10 rounded-full bg-sheet-handle" />
        </div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-h1-sm font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            data-close-sheet="true"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-body-sm font-semibold text-text-secondary hover:bg-canvas hover:text-ink"
            aria-label={cancelLabel}
          >
            <span className="lg:hidden">{cancelLabel}</span>
            <X size={18} className="hidden lg:block" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
