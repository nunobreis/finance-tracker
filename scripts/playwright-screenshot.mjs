#!/usr/bin/env node
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const AUTH_FILE = path.resolve(process.cwd(), 'playwright/.auth/user.json')
const OUT_DIR = path.resolve(process.cwd(), 'playwright/screenshots')

const route = process.argv[2] ?? '/dashboard'
const slug = route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '-')

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
        {
          name: 'NEXT_LOCALE',
          value: locale,
          domain: urlObj.hostname,
          path: '/',
        },
      ])
      const page = await context.newPage()
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' })
      const outPath = path.join(OUT_DIR, `${slug}-${locale}-${vp.name}.png`)
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
