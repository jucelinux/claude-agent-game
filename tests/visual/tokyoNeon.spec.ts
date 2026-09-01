import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import { PNG } from 'pngjs'

const PROTOTYPE_URL = '/?prototype=tokyo-neon-89'

async function openTokyoNeon(page: Page): Promise<Locator> {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto(PROTOTYPE_URL)
  const canvas = page.locator('canvas.babylon-canvas')
  await expect(canvas).toBeVisible()
  await expect(page.locator('.runtime-values')).toContainText('neon-crossing')
  await page.waitForTimeout(900)
  expect(pageErrors).toEqual([])
  return canvas
}

async function runtimeNumber(page: Page, label: string): Promise<number> {
  const value = page
    .locator('.runtime-values > div')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('dd')
  return Number(await value.innerText())
}

// Rendering smoke test only. Visual approval is tracked in the prototype's direction brief.
test('the art-pass canvas renders geometry across a visible light range', async ({
  page,
}, testInfo: TestInfo) => {
  const canvas = await openTokyoNeon(page)
  const buffer = await canvas.screenshot({ path: testInfo.outputPath('tokyo-neon-89.png') })
  const png = PNG.sync.read(buffer)
  let darkPixels = 0
  let illuminatedPixels = 0

  for (let index = 0; index < png.data.length; index += 4) {
    const red = png.data[index] ?? 0
    const green = png.data[index + 1] ?? 0
    const blue = png.data[index + 2] ?? 0
    if (red < 38 && green < 45 && blue < 62) darkPixels++
    if (Math.max(red, green, blue) > 115) illuminatedPixels++
  }

  expect(png.width).toBeGreaterThan(500)
  expect(png.height).toBeGreaterThan(400)
  expect(darkPixels).toBeGreaterThan(png.width * png.height * 0.28)
  expect(illuminatedPixels).toBeGreaterThan(240)
  await expect(page.getByText('Shinjuku alley art pass')).toBeVisible()
  await expect(page.locator('.runtime-values')).toContainText('WASD/arrows move')
})

test('rain produces visible atmospheric motion while the player remains idle', async ({
  page,
}) => {
  const canvas = await openTokyoNeon(page)
  const beforeRain = PNG.sync.read(await canvas.screenshot())
  await page.waitForTimeout(180)
  const afterRain = PNG.sync.read(await canvas.screenshot())
  let changedPixels = 0

  for (let index = 0; index < beforeRain.data.length; index += 4) {
    const difference = Math.abs((beforeRain.data[index] ?? 0) - (afterRain.data[index] ?? 0))
      + Math.abs((beforeRain.data[index + 1] ?? 0) - (afterRain.data[index + 1] ?? 0))
      + Math.abs((beforeRain.data[index + 2] ?? 0) - (afterRain.data[index + 2] ?? 0))
    if (difference > 20) changedPixels++
  }

  expect(changedPixels).toBeGreaterThan(beforeRain.width * beforeRain.height * 0.003)
})

test('walking is visible in diagnostics and R restores the entrance', async ({ page }) => {
  const canvas = await openTokyoNeon(page)
  await canvas.focus()
  await expect(canvas).toBeFocused()
  const startDepth = await runtimeNumber(page, 'Depth')
  const beforeWalk = PNG.sync.read(await canvas.screenshot())

  await page.keyboard.down('w')
  await expect(page.locator('.runtime-values')).toContainText('walk')
  await page.waitForTimeout(500)
  await page.keyboard.up('w')
  expect(await runtimeNumber(page, 'Depth')).toBeGreaterThan(startDepth + 0.2)

  const afterWalk = PNG.sync.read(await canvas.screenshot())
  let changedPixels = 0
  for (let index = 0; index < beforeWalk.data.length; index += 4) {
    const difference = Math.abs((beforeWalk.data[index] ?? 0) - (afterWalk.data[index] ?? 0))
      + Math.abs((beforeWalk.data[index + 1] ?? 0) - (afterWalk.data[index + 1] ?? 0))
      + Math.abs((beforeWalk.data[index + 2] ?? 0) - (afterWalk.data[index + 2] ?? 0))
    if (difference > 24) changedPixels++
  }
  expect(changedPixels).toBeGreaterThan(beforeWalk.width * beforeWalk.height * 0.03)

  await page.keyboard.press('r')
  await expect(page.locator('.runtime-values')).toContainText('returned to the neon crossing')
  await expect.poll(() => runtimeNumber(page, 'Depth')).toBeCloseTo(-16.8, 1)
})

test('camera-relative left and right match their screen directions', async ({ page }) => {
  const canvas = await openTokyoNeon(page)
  await canvas.focus()
  const startHorizontal = await runtimeNumber(page, 'Horizontal')

  await page.keyboard.down('d')
  await page.waitForTimeout(350)
  await page.keyboard.up('d')
  await expect.poll(() => runtimeNumber(page, 'Horizontal')).toBeGreaterThan(startHorizontal + 0.2)

  await page.keyboard.press('r')
  await expect.poll(() => runtimeNumber(page, 'Horizontal')).toBeCloseTo(startHorizontal, 1)

  await page.keyboard.down('a')
  await page.waitForTimeout(350)
  await page.keyboard.up('a')
  await expect.poll(() => runtimeNumber(page, 'Horizontal')).toBeLessThan(startHorizontal - 0.2)
})
