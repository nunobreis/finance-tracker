'use client'

import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  title: string
  cancelLabel?: string
  children: ReactNode
}

/** Clamp a number to [min, max]. */
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

/** Returns true when prefers-reduced-motion is active (gracefully no-ops in jsdom). */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function BottomSheet({ isOpen, onClose, title, cancelLabel = 'Cancel', children }: Props) {
  const titleId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Ref-based drag state — avoids re-renders on every pointer move.
  const dragRef = useRef<{
    active: boolean
    startY: number
    currentY: number
    // Last few samples for velocity computation: [{ y, t }, ...]
    samples: Array<{ y: number; t: number }>
    // Whether this gesture started on a grip zone (handle or header)
    fromGrip: boolean
  } | null>(null)

  // We only need a React state for the "is-dragging" CSS cursor toggle.
  const [isDragging, setIsDragging] = useState(false)

  // ---------------------------------------------------------------------------
  // Keyboard / body-scroll lock (unchanged from original)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)

    const focusable = sheetRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, a[href], button:not([data-close-sheet])'
    )
    if (focusable) focusable.focus()
    else sheetRef.current?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  // ---------------------------------------------------------------------------
  // Drag helpers
  // ---------------------------------------------------------------------------
  function applyTranslate(y: number) {
    if (!sheetRef.current) return
    sheetRef.current.style.transform = `translateY(${y}px)`
  }

  function clearTranslate() {
    if (!sheetRef.current) return
    sheetRef.current.style.transform = ''
  }

  function springBack() {
    if (!sheetRef.current) return
    const reduced = prefersReducedMotion()
    if (reduced) {
      clearTranslate()
      return
    }
    // Let the CSS class handle the transition; just clear the inline style.
    sheetRef.current.style.transition = 'transform 180ms ease-out'
    sheetRef.current.style.transform = 'translateY(0px)'
    const el = sheetRef.current
    const cleanup = () => {
      el.style.transition = ''
      el.style.transform = ''
      el.removeEventListener('transitionend', cleanup)
    }
    sheetRef.current.addEventListener('transitionend', cleanup)
  }

  function snapClose() {
    // Snap close immediately without animation for reduced-motion or velocity-close.
    clearTranslate()
    onClose()
  }

  function animatedClose() {
    if (!sheetRef.current) return
    const reduced = prefersReducedMotion()
    if (reduced) {
      snapClose()
      return
    }
    // Visual slide-out (progressive enhancement). onClose() is called
    // immediately so the parent can unmount as soon as the gesture is confirmed;
    // the brief animation plays out but the parent state change wins.
    const height = sheetRef.current.getBoundingClientRect().height || 600
    sheetRef.current.style.transition = 'transform 220ms ease-in'
    sheetRef.current.style.transform = `translateY(${height}px)`
    onClose()
  }

  // ---------------------------------------------------------------------------
  // Pointer event handlers — attached to the sheet element so they capture
  // both grip-zone (handle + header) and body-scroll-gated gestures.
  // ---------------------------------------------------------------------------
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Only primary button / touch.
    if (e.pointerType === 'mouse' && e.button !== 0) return

    const target = e.target as HTMLElement
    // Determine if the down started on a grip zone.
    const handle = sheetRef.current?.querySelector<HTMLElement>('[data-testid="bottomsheet-handle"]')
    const header = sheetRef.current?.querySelector<HTMLElement>('[data-testid="bottomsheet-header"]')
    const fromGrip =
      (handle?.contains(target) ?? false) ||
      (header?.contains(target) ?? false)

    // For body gestures we gate on scrollTop === 0 (checked on first move).
    dragRef.current = {
      active: false, // becomes true once we confirm downward movement
      startY: e.clientY,
      currentY: e.clientY,
      samples: [{ y: e.clientY, t: e.timeStamp }],
      fromGrip,
    }

    // Capture pointer so we keep receiving events even if pointer leaves element.
    // Guard: jsdom does not implement setPointerCapture.
    const el = e.currentTarget as HTMLElement
    if (typeof el.setPointerCapture === 'function') {
      el.setPointerCapture(e.pointerId)
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return

    const deltaY = e.clientY - drag.startY

    // If the gesture hasn't activated yet, check whether we should start dragging.
    if (!drag.active) {
      if (deltaY <= 0) {
        // Moving up — never start a drag.
        dragRef.current = null
        return
      }
      // Moving downward — gate on grip or body-at-top.
      if (!drag.fromGrip) {
        const scrollTop = bodyRef.current?.scrollTop ?? 0
        if (scrollTop > 0) {
          // Body has scrolled — let it scroll, don't drag.
          dragRef.current = null
          return
        }
      }
      // Activate drag.
      drag.active = true
      setIsDragging(true)
    }

    drag.currentY = e.clientY
    drag.samples.push({ y: e.clientY, t: e.timeStamp })
    // Keep only the last 3 samples for velocity.
    if (drag.samples.length > 3) drag.samples.shift()

    const y = clamp(deltaY, 0, 99999)
    applyTranslate(y)
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    dragRef.current = null
    setIsDragging(false)

    if (!drag?.active) return

    const deltaY = e.clientY - drag.startY
    const height = sheetRef.current?.getBoundingClientRect().height || 600

    // Velocity: use first and last of the last samples (px/ms).
    // Require at least 16 ms of history to avoid spurious readings from
    // near-simultaneous events (e.g. synthetic events in tests).
    let velocity = 0
    if (drag.samples.length >= 2) {
      const first = drag.samples[0]
      const last = drag.samples[drag.samples.length - 1]
      const dt = last.t - first.t
      if (dt >= 16) {
        velocity = (last.y - first.y) / dt
      }
    }

    const pastThreshold = deltaY > height * 0.3
    const fastFlick = velocity > 0.6

    if (pastThreshold || fastFlick) {
      animatedClose()
    } else {
      springBack()
    }
  }

  function onPointerCancel() {
    dragRef.current = null
    setIsDragging(false)
    springBack()
  }

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
        data-dragging={isDragging || undefined}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] w-full flex-col rounded-t-[28px] border-t border-separator bg-surface px-5 pt-3 pb-7 shadow-2xl outline-none lg:inset-auto lg:left-1/2 lg:top-1/2 lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[24px] lg:border lg:p-6 data-[dragging]:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* Drag handle — grip zone */}
        <div
          data-testid="bottomsheet-handle"
          className="mb-3 flex touch-none select-none justify-center lg:hidden"
          aria-hidden="true"
        >
          <div className="h-[5px] w-10 cursor-grab rounded-full bg-sheet-handle" />
        </div>

        {/* Header row — also a grip zone */}
        <div
          data-testid="bottomsheet-header"
          className="mb-4 flex touch-none select-none items-center justify-between gap-3"
        >
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

        {/* Scrollable body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
