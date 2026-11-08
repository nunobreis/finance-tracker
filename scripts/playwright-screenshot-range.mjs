#!/usr/bin/env node
/**
 * Like playwright-screenshot.mjs but accepts a query string appended to the route.
 * Usage: QS="from=2026-10-01&to=2026-10-31" node scripts/playwright-screenshot-range.mjs /transactions
 * Or:    node scripts/playwright-screenshot-range.mjs /transactions 'from=2026-10-01&to=2026-10-31'
 *
 * Output per viewport/locale:
 *   <slug>-<locale>-<viewport>.png       (viewport-top crop, fullPage: false)
 *   <slug>-<locale>-<viewport>-full.png  (full-page capture)
 */
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const ROOT_DIR = path.resolve(import.meta.dirname, '..')
const BASE_URL = process.env.BASE_URL ?? process.argv[4] ?? 'http://localhost:3001'
const AUTH_FILE = path.resolve(ROOT_DIR, 'playwright/.auth/user.json')
const OUT_DIR = path.resolve(ROOT_DIR, 'playwright/screenshots')

const rawRoute = process.argv[2] ?? '/dashboard'
// Query string: prefer env var QS, then argv[3]
const qs = process.env.QS ?? process.argv[3] ?? ''

// Build the full URL path (with query string)
const fullPath = qs ? `${rawRoute}?${qs}` : rawRoute

// Build a filesystem-safe slug from the base route only (strip leading slash, replace slashes)
const baseSlug = rawRoute === '/' ? 'root' : rawRoute.replace(/^\//, '').replace(/\//g, '-')
// Append a compact query suffix so the filename reflects the range
const qsSuffix = qs
  ? '-' + qs.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/, '')
  : ''
const slug = `${baseSlug}${qsSuffix}`

const isMoreSheet = rawRoute === '/more-sheet'
const navigatePath = isMoreSheet ? '/dashboard' : fullPath

const VIEWPORTS = isMoreSheet
  ? [{ name: 'mobile-390x844', width: 390, height: 844 }]
  : [
      { name: 'mobile-390x844', width: 390, height: 844 },
      { name: 'desktop-1440x900', width: 1440, height: 900 },
    ]

const LOCALES = ['en', 'pt-PT']

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const useAuth = rawRoute !== '/login' && existsSync(AUTH_FILE)
  const browser = await chromium.launch({ headless: true })

  for (const locale of LOCALES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        ...(useAuth ? { storageState: AUTH_FILE } : {}),
      })
      const urlObj = new URL(BASE_URL)
      await context.addCookies([
        {
          name: 'locale',
          value: locale,
          domain: urlObj.hostname,
          path: '/',
        },
        {
          name: 'NEXT_LOCALE',
          value: locale,
          domain: urlObj.hostname,
          path: '/',
        },
      ])
      const page = await context.newPage()
      await page.goto(`${BASE_URL}${navigatePath}`, { waitUntil: 'networkidle' })
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

      if (isMoreSheet) {
        await page.locator('nav[aria-label="Primary Bottom Navigation"] button').click()
        await page.waitForSelector('[role="dialog"]')
        await page.mouse.move(0, 0)
      }

      // Viewport-top crop
      const cropPath = path.join(OUT_DIR, `${slug}-${locale}-${vp.name}.png`)
      await page.screenshot({ path: cropPath, fullPage: false })
      console.log(`Saved ${cropPath}`)

      // Full-page capture
      const fullPath2 = path.join(OUT_DIR, `${slug}-${locale}-${vp.name}-full.png`)
      await page.screenshot({ path: fullPath2, fullPage: true })
      console.log(`Saved ${fullPath2}`)

      await context.close()
    }
  }

  await browser.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
