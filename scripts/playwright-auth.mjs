#!/usr/bin/env node
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const AUTH_FILE = path.resolve(process.cwd(), 'playwright/.auth/user.json')

async function main() {
  await mkdir(path.dirname(AUTH_FILE), { recursive: true })
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  console.log(`Opening ${BASE_URL}/login — please sign in...`)
  await page.goto(`${BASE_URL}/login`)
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 300_000 })
  await page.waitForLoadState('networkidle')

  await context.storageState({ path: AUTH_FILE })
  console.log(`Saved authenticated storageState to ${AUTH_FILE}`)
  await browser.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
