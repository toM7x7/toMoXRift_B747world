// Quick visual check: open the dev server and capture screenshots.
import { chromium } from '@playwright/test'

const url = process.env.TARGET_URL ?? 'http://localhost:5173/'
const out = process.argv[2] ?? 'preview.png'
const waitMs = Number(process.argv[3] ?? 9000)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1480, height: 860 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('[page error]', msg.text().slice(0, 300))
})
page.on('pageerror', (err) => console.log('[pageerror]', String(err).slice(0, 400)))
await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(waitMs)
await page.screenshot({ path: out })
await browser.close()
console.log('saved', out)
