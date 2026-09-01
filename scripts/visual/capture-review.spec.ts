import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { VISUAL_REVIEW_SCENARIOS } from './review-scenarios.ts'

for (const scenario of VISUAL_REVIEW_SCENARIOS) {
  test(`capture ${scenario.title} review contact sheet`, async ({ page }) => {
    const pageErrors: string[] = []
    const maturityLabel = scenario.maturity === 'approved'
      ? 'APPROVED'
      : `${scenario.maturity.toUpperCase()} · VISUAL DIRECTION NOT APPROVED`
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto(`/?prototype=${scenario.prototypeId}`)
    const canvas = page.locator('canvas.babylon-canvas')
    const runtime = page.locator('.runtime-values')
    await expect(canvas).toBeVisible()
    await expect(runtime).toContainText('Scene')
    await canvas.focus()

    const outputDirectory = path.resolve(
      process.cwd(),
      'artifacts',
      'visual-review',
      scenario.prototypeId,
    )
    await mkdir(outputDirectory, { recursive: true })

    const captures: Array<{
      readonly label: string
      readonly purpose: string
      readonly slug: string
      readonly dataUrl: string
    }> = []

    for (const view of scenario.views) {
      await page.keyboard.press(view.key)
      await expect(runtime).toContainText(`review view · ${view.label}`)
      await page.waitForTimeout(350)
      const image = await canvas.screenshot()
      await writeFile(path.join(outputDirectory, `${view.slug}.png`), image)
      captures.push({
        label: view.label,
        purpose: view.purpose,
        slug: view.slug,
        dataUrl: `data:image/png;base64,${image.toString('base64')}`,
      })
    }

    expect(pageErrors).toEqual([])

    const cards = captures.map((capture, index) => `
      <article>
        <img src="${capture.dataUrl}" alt="${capture.label}">
        <div>
          <span>${String(index + 1).padStart(2, '0')} · ${capture.slug}</span>
          <h2>${capture.label}</h2>
          <p>${capture.purpose}</p>
        </div>
      </article>
    `).join('')

    await page.setViewportSize({ width: 1640, height: 1100 })
    await page.setContent(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 46px; color: #dce3ee; background: #080b12; font-family: Inter, system-ui, sans-serif; }
            header { display: flex; align-items: end; justify-content: space-between; gap: 30px; margin-bottom: 30px; padding-bottom: 24px; border-bottom: 1px solid #283246; }
            header div { display: grid; gap: 8px; }
            h1, h2, p { margin: 0; }
            h1 { font-size: 30px; font-weight: 560; letter-spacing: -0.03em; }
            header p, article p { color: #8995a6; font-size: 12px; line-height: 1.55; }
            header code { color: #8090a6; font-size: 11px; }
            .maturity { padding: 7px 10px; border: 1px solid #6b552b; color: #e4b75c; background: #17130d; font: 800 10px/1 monospace; letter-spacing: 0.08em; }
            main { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
            article { overflow: hidden; border: 1px solid #283246; border-radius: 4px; background: #0d121b; }
            article:first-child { grid-column: 1 / -1; }
            article img { display: block; width: 100%; aspect-ratio: 16 / 8.75; object-fit: cover; background: #05070c; }
            article div { display: grid; gap: 7px; padding: 15px 17px 18px; }
            article span { color: #5be7ff; font: 700 9px/1 monospace; letter-spacing: 0.08em; text-transform: uppercase; }
            article h2 { font-size: 15px; font-weight: 600; }
          </style>
        </head>
        <body>
          <header>
            <div>
              <p>Agent Game Builder · canonical visual review</p>
              <h1>${scenario.title}</h1>
              <code>${scenario.brief}</code>
            </div>
            <span class="maturity">${maturityLabel}</span>
          </header>
          <main>${cards}</main>
        </body>
      </html>`)

    await page.screenshot({
      path: path.join(outputDirectory, 'contact-sheet.png'),
      fullPage: true,
    })
    await writeFile(
      path.join(outputDirectory, 'manifest.json'),
      `${JSON.stringify({
        prototypeId: scenario.prototypeId,
        maturity: maturityLabel,
        brief: scenario.brief,
        captures: captures.map(({ dataUrl: _dataUrl, ...capture }) => capture),
      }, null, 2)}\n`,
    )
  })
}
