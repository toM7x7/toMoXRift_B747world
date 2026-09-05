// Capture the world canvas (no dev UI) as the world thumbnail.
import { chromium } from '@playwright/test'

const url = process.env.TARGET_URL ?? 'http://localhost:5173/'
const out = process.argv[2] ?? 'public/thumbnail.png'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(11000)
await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  if (!canvas) return
  document.body.querySelectorAll('*').forEach((el) => {
    if (el !== canvas && !el.contains(canvas) && !canvas.contains(el)) {
      el.style.visibility = 'hidden'
    }
  })
})
await page.locator('canvas').first().screenshot({ path: out })
await browser.close()
console.log('saved', out)
