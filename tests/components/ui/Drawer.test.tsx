import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Drawer } from '@/components/ui/Drawer'
import { BottomSheet } from '@/components/ui/BottomSheet'

// Enable React 19 act environment for jsdom
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
  document.body.style.overflow = ''
  vi.restoreAllMocks()
})

describe('Drawer (BottomSheet wrapper)', () => {
  it('renders nothing when isOpen is false', () => {
    act(() => {
      root.render(
        <Drawer isOpen={false} onClose={() => {}} title="Add Account">
          <p>Sheet content</p>
        </Drawer>
      )
    })
    expect(container.textContent).toBe('')
    expect(document.body.style.overflow).toBe('')
  })

  it('renders title, children, and locks body scroll when isOpen is true', () => {
    act(() => {
      root.render(
        <Drawer isOpen={true} onClose={() => {}} title="Add Account">
          <input aria-label="Account Name" />
        </Drawer>
      )
    })
    expect(container.textContent).toContain('Add Account')
    expect(container.querySelector('input[aria-label="Account Name"]')).not.toBeNull()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    act(() => {
      root.render(
        <Drawer isOpen={true} onClose={onClose} title="Add Account">
          <p>Content</p>
        </Drawer>
      )
    })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop overlay is clicked', () => {
    const onClose = vi.fn()
    act(() => {
      root.render(
        <Drawer isOpen={true} onClose={onClose} title="Add Account">
          <p>Content</p>
        </Drawer>
      )
    })
    const backdrop = container.querySelector('[data-testid="bottom-sheet-backdrop"]') as HTMLElement | null
    expect(backdrop).not.toBeNull()
    act(() => {
      backdrop?.click()
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// BottomSheet swipe-down-to-close tests
// ---------------------------------------------------------------------------

/**
 * jsdom's getBoundingClientRect returns all zeros by default.
 * Stub it so the 30%-of-height threshold calculation is meaningful.
 */
function stubSheetHeight(height = 600) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    height,
    width: 390,
    top: 0,
    left: 0,
    right: 390,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
}

/** Fire pointer events on an element via raw DOM events (fireEvent-style). */
function pointerDown(el: Element, clientY: number, pointerId = 1) {
  el.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, clientY, pointerId, pointerType: 'touch', isPrimary: true })
  )
}
function pointerMove(el: Element, clientY: number, pointerId = 1) {
  el.dispatchEvent(
    new PointerEvent('pointermove', { bubbles: true, clientY, pointerId, pointerType: 'touch', isPrimary: true })
  )
}
function pointerUp(el: Element, clientY: number, pointerId = 1) {
  el.dispatchEvent(
    new PointerEvent('pointerup', { bubbles: true, clientY, pointerId, pointerType: 'touch', isPrimary: true })
  )
}

describe('BottomSheet swipe-down-to-close', () => {
  it('calls onClose when drag exceeds 30% of sheet height', () => {
    stubSheetHeight(600) // 30% threshold = 180 px

    const onClose = vi.fn()
    act(() => {
      root.render(
        <BottomSheet isOpen={true} onClose={onClose} title="Swipe Test">
          <p>Content</p>
        </BottomSheet>
      )
    })

    const handle = container.querySelector('[data-testid="bottomsheet-handle"]') as HTMLElement
    expect(handle).not.toBeNull()

    act(() => {
      // Drag 220 px down — well past the 180 px (30%) threshold.
      pointerDown(handle, 100)
      pointerMove(handle, 200)
      pointerMove(handle, 320)
      pointerUp(handle, 320)
    })

    expect(onClose).toHaveBeenCalledWith()
  })

  it('does NOT call onClose when drag is under the 30% threshold', () => {
    stubSheetHeight(600) // 30% threshold = 180 px

    const onClose = vi.fn()
    act(() => {
      root.render(
        <BottomSheet isOpen={true} onClose={onClose} title="Swipe Test">
          <p>Content</p>
        </BottomSheet>
      )
    })

    const handle = container.querySelector('[data-testid="bottomsheet-handle"]') as HTMLElement
    expect(handle).not.toBeNull()

    act(() => {
      // Drag only 80 px — well under the 180 px threshold.
      pointerDown(handle, 100)
      pointerMove(handle, 150)
      pointerUp(handle, 180)
    })

    expect(onClose).not.toHaveBeenCalled()
  })
})
