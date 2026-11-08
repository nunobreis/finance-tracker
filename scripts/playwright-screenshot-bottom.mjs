#!/usr/bin/env node
/**
 * Like playwright-screenshot.mjs but scrolls to the bottom before capturing.
 * Usage: node scripts/playwright-screenshot-bottom.mjs <route>
 * Output: playwright/screenshots/<slug>-<locale>-<viewport>-bottom.png
 */
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const ROOT_DIR = path.resolve(import.meta.dirname, '..')
const BASE_URL = process.env.BASE_URL ?? process.argv[3] ?? 'http://localhost:3001'
const AUTH_FILE = path.resolve(ROOT_DIR, 'playwright/.auth/user.json')
const OUT_DIR = path.resolve(ROOT_DIR, 'playwright/screenshots')

const rawRoute = process.argv[2] ?? '/transactions'
const route = rawRoute
const slug = rawRoute === '/' ? 'root' : rawRoute.replace(/^\//, '').replace(/\//g, '-')

const VIEWPORTS = [
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
]

const LOCALES = ['en', 'pt-PT']

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const useAuth = route !== '/login' && existsSync(AUTH_FILE)
  const browser = await chromium.launch({ headless: true })

  for (const locale of LOCALES) {
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
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' })
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

      // Scroll to the very bottom
      await page.evaluate(() => {
        const el = document.scrollingElement ?? document.documentElement
        el.scrollTop = el.scrollHeight
      })
      // Brief pause to let any lazy-loaded content settle
      await page.waitForTimeout(400)

      const outPath = path.join(OUT_DIR, `${slug}-${locale}-${vp.name}-bottom.png`)
      await page.screenshot({ path: outPath, fullPage: false })
      console.log(`Saved ${outPath}`)
      await context.close()
    }
  }

  await browser.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
