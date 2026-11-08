#!/usr/bin/env node
/**
 * check-horizontal-overflow.mjs
 *
 * Visits every (app) route at 375px and 390px widths in EN and PT-PT.
 * For each route checks document.scrollWidth <= window.innerWidth.
 * Also runs each route with a populated October 2026 range AND with no
 * query string (November empty state).
 *
 * Exits non-zero if any overflow is detected.
 * Prints a summary table at the end.
 *
 * Usage:
 *   node scripts/check-horizontal-overflow.mjs
 *   BASE_URL=http://localhost:3001 node scripts/check-horizontal-overflow.mjs
 */
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT_DIR = path.resolve(import.meta.dirname, '..')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001'
const AUTH_FILE = path.resolve(ROOT_DIR, 'playwright/.auth/user.json')

const ROUTES = [
  '/dashboard',
  '/accounts',
  '/transactions',
  '/transactions/import',
  '/budgets',
  '/recurring-bills',
  '/investments',
  '/net-worth',
  '/settings',
  '/account',
]

const VIEWPORTS = [
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
]

const LOCALES = ['en', 'pt-PT']

// Routes that accept date range query string
const RANGE_ROUTES = ['/transactions', '/budgets']
const OCTOBER_QS = 'from=2026-10-01&to=2026-10-31'

/** Find widest overflowing element on the page (best-effort) */
async function findWidestElement(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth
    let worst = null
    let worstW = 0
    const all = document.querySelectorAll('*')
    for (const el of all) {
      try {
        const rect = el.getBoundingClientRect()
        const right = Math.round(rect.right)
        if (right > vw + 1 && right > worstW) {
          worstW = right
          worst = {
            tag: el.tagName,
            id: el.id || null,
            className: (el.className || '').toString().slice(0, 120),
            right,
            width: Math.round(rect.width),
            left: Math.round(rect.left),
          }
        }
      } catch (_) {
        // ignore
      }
    }
    return worst
  })
}

async function checkPage(page, url, label) {
  await page.goto(url, { waitUntil: 'networkidle' })
  // Suppress Next.js overlay
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' }).catch(() => {})

  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))

  const overflow = scrollWidth > innerWidth
  let culprit = null
  if (overflow) {
    culprit = await findWidestElement(page)
  }

  return { label, url, scrollWidth, innerWidth, overflow, culprit }
}

async function main() {
  if (!existsSync(AUTH_FILE)) {
    console.error(`Auth file not found: ${AUTH_FILE}`)
    console.error('Run:  node scripts/playwright-auth.mjs  to authenticate first.')
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })
  const results = []

  for (const locale of LOCALES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        storageState: AUTH_FILE,
      })
      // Set locale cookies
      const urlObj = new URL(BASE_URL)
      await context.addCookies([
        { name: 'locale',       value: locale, domain: urlObj.hostname, path: '/' },
        { name: 'NEXT_LOCALE',  value: locale, domain: urlObj.hostname, path: '/' },
      ])

      const page = await context.newPage()

      for (const route of ROUTES) {
        // 1. No query string (empty state / current month)
        const plainUrl = `${BASE_URL}${route}`
        const plainLabel = `${locale} | ${vp.name} | ${route} [no-qs]`
        results.push(await checkPage(page, plainUrl, plainLabel))

        // 2. October range (populated month) for range-aware routes
        if (RANGE_ROUTES.includes(route)) {
          const rangeUrl = `${BASE_URL}${route}?${OCTOBER_QS}`
          const rangeLabel = `${locale} | ${vp.name} | ${route} [oct]`
          results.push(await checkPage(page, rangeUrl, rangeLabel))
        }
      }

      await context.close()
    }
  }

  await browser.close()

  // --- Print summary ---
  const failures = results.filter(r => r.overflow)
  const passes   = results.filter(r => !r.overflow)

  console.log('\n=== Horizontal Overflow Check ===\n')

  if (failures.length === 0) {
    console.log(`All ${results.length} checks passed. No horizontal overflow detected.\n`)
  } else {
    console.log(`FAILED: ${failures.length} / ${results.length} checks have overflow.\n`)
    for (const f of failures) {
      console.log(`  FAIL  ${f.label}`)
      console.log(`        scrollWidth=${f.scrollWidth}  innerWidth=${f.innerWidth}  overflow=${f.scrollWidth - f.innerWidth}px`)
      if (f.culprit) {
        const c = f.culprit
        console.log(`        Widest element: <${c.tag.toLowerCase()}${c.id ? ` id="${c.id}"` : ''}> right=${c.right}px  width=${c.width}px  left=${c.left}px`)
        if (c.className) console.log(`          class="${c.className}"`)
      }
      console.log()
    }
  }

  // Print passes summary
  console.log(`Passed ${passes.length} / ${results.length} checks.`)
  if (failures.length > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
