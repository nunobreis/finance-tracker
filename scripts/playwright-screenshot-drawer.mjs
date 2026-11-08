#!/usr/bin/env node
/**
 * Captures the "Add Transaction" drawer open state.
 * Mobile 390×844 only, EN + PT-PT.
 * Usage: node scripts/playwright-screenshot-drawer.mjs
 * Output: playwright/screenshots/transactions-drawer-<locale>-mobile-390x844.png
 */
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const ROOT_DIR = path.resolve(import.meta.dirname, '..')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001'
const AUTH_FILE = path.resolve(ROOT_DIR, 'playwright/.auth/user.json')
const OUT_DIR = path.resolve(ROOT_DIR, 'playwright/screenshots')

const LOCALES = ['en', 'pt-PT']

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const useAuth = existsSync(AUTH_FILE)
  const browser = await chromium.launch({ headless: true })

  for (const locale of LOCALES) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      ...(useAuth ? { storageState: AUTH_FILE } : {}),
    })
    const urlObj = new URL(BASE_URL)
    await context.addCookies([
      { name: 'locale', value: locale, domain: urlObj.hostname, path: '/' },
      { name: 'NEXT_LOCALE', value: locale, domain: urlObj.hostname, path: '/' },
    ])
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: 'networkidle' })
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })

    // Click the "+ Add transaction" button in the page header
    // Try multiple possible selectors
    const addBtn =
      page.getByRole('button', { name: /add transaction/i }).first() ||
      page.getByRole('link', { name: /add transaction/i }).first()

    // The Add transaction button text varies by locale. Try both.
    let clicked = false
    for (const selector of [
      'button:has-text("Add transaction")',
      'button:has-text("Adicionar transação")',
      'button:has-text("Adicionar")',
    ]) {
      try {
        await page.locator(selector).first().click({ timeout: 2000 })
        clicked = true
        break
      } catch {
        // try next
      }
    }
    if (!clicked) {
      console.warn(`[${locale}] Could not find Add button — screenshotting page as-is`)
    }

    // Wait for the drawer/dialog to appear
    try {
      await page.waitForSelector('[role="dialog"], [data-vaul-drawer], [data-state="open"]', {
        timeout: 4000,
      })
    } catch {
      console.warn(`[${locale}] Drawer did not appear — screenshotting anyway`)
    }

    await page.waitForTimeout(300)

    const outPath = path.join(OUT_DIR, `transactions-drawer-${locale}-mobile-390x844.png`)
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
