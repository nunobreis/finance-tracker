#!/usr/bin/env node
/**
 * Captures a hover-state screenshot of the transactions list.
 * Mobile + desktop, EN only (hover is colour-only; one locale is sufficient).
 *
 * Usage: QS="from=2026-10-01&to=2026-10-31" node scripts/playwright-screenshot-hover.mjs /transactions
 * Or:    node scripts/playwright-screenshot-hover.mjs /transactions 'from=2026-10-01&to=2026-10-31'
 *
 * Output:
 *   <slug>-en-<viewport>-hover.png
 */
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const ROOT_DIR = path.resolve(import.meta.dirname, '..')
const BASE_URL = process.env.BASE_URL ?? process.argv[4] ?? 'http://localhost:3001'
const AUTH_FILE = path.resolve(ROOT_DIR, 'playwright/.auth/user.json')
const OUT_DIR = path.resolve(ROOT_DIR, 'playwright/screenshots')

const rawRoute = process.argv[2] ?? '/transactions'
const qs = process.env.QS ?? process.argv[3] ?? ''
const fullPath = qs ? `${rawRoute}?${qs}` : rawRoute

const baseSlug = rawRoute === '/' ? 'root' : rawRoute.replace(/^\//, '').replace(/\//g, '-')
const qsSuffix = qs
  ? '-' + qs.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/, '')
  : ''
const slug = `${baseSlug}${qsSuffix}`

const VIEWPORTS = [
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
]

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const useAuth = rawRoute !== '/login' && existsSync(AUTH_FILE)
  const browser = await chromium.launch({ headless: true })
  const locale = 'en'

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      ...(useAuth ? { storageState: AUTH_FILE } : {}),
    })
    const urlObj = new URL(BASE_URL)
    await context.addCookies([
      { name: 'locale', value: locale, domain: urlObj.hostname, path: '/' },
      { name: 'NEXT_LOCALE', value: locale, domain: urlObj.hostname, path: '/' },
    ])
    const page = await context.newPage()
    await page.goto(`${BASE_URL}${fullPath}`, { waitUntil: 'networkidle' })
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

    // Wait for content to settle
    await page.waitForTimeout(300)

    const isDesktop = vp.width >= 1024

    if (isDesktop) {
      // Desktop: hover the first tbody tr (TransactionTable renders <tr className="hover:bg-row-hover">)
      const firstRow = page.locator('table tbody tr').first()
      const count = await firstRow.count()
      if (count > 0) {
        await firstRow.hover()
        await page.waitForTimeout(200)
      } else {
        console.warn(`[desktop] No table rows found — screenshotting without hover`)
      }
    } else {
      // Mobile: hover the first transaction card div inside the mobile list container
      // The mobile list is: div.lg:hidden > div.px-4 (each card)
      const firstCard = page.locator('.lg\\:hidden div.px-4').first()
      const count = await firstCard.count()
      if (count > 0) {
        await firstCard.hover()
        await page.waitForTimeout(200)
      } else {
        console.warn(`[mobile] No mobile card found — screenshotting without hover`)
      }
    }

    const outPath = path.join(OUT_DIR, `${slug}-${locale}-${vp.name}-hover.png`)
    await page.screenshot({ path: outPath, fullPage: false })
    console.log(`Saved ${outPath}`)

    await context.close()
  }

  await browser.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
