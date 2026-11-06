import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Drawer } from '@/components/ui/Drawer'

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
