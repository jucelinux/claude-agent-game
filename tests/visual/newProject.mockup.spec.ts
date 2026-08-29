import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import { PNG } from 'pngjs'

const PROTOTYPE_URL = '/?prototype=new-project-prototype'

async function openScaffold(page: Page): Promise<Locator> {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto(PROTOTYPE_URL)
  const canvas = page.locator('canvas.babylon-canvas')
  await expect(canvas).toBeVisible()
  await expect(page.locator('.runtime-values')).toContainText('new-project')
  await page.waitForTimeout(500)
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

test('the neutral Babylon scaffold renders and exposes Builder diagnostics', async ({
  page,
}, testInfo: TestInfo) => {
  const canvas = await openScaffold(page)
  const buffer = await canvas.screenshot({ path: testInfo.outputPath('neutral-scaffold.png') })
  const png = PNG.sync.read(buffer)
  let stagePixels = 0
  for (let index = 0; index < png.data.length; index += 4) {
    const red = png.data[index] ?? 0
    const green = png.data[index + 1] ?? 0
    const blue = png.data[index + 2] ?? 0
    if (red > 25 && green > 25 && blue > 25) stagePixels++
  }

  expect(png.width).toBeGreaterThan(500)
  expect(png.height).toBeGreaterThan(400)
  expect(stagePixels).toBeGreaterThan(png.width * png.height * 0.5)
  await expect(page.getByText('A clean stage with proven tooling')).toBeVisible()
  await expect(page.locator('.runtime-values')).toContainText('WASD/arrows move')
})

test('movement diagnostics update and R restores the scaffold origin', async ({ page }) => {
  const canvas = await openScaffold(page)
  await canvas.focus()
  const startDepth = await runtimeNumber(page, 'Depth')

  await page.keyboard.down('KeyW')
  await expect(page.locator('.runtime-values')).toContainText('walk')
  await page.waitForTimeout(450)
  await page.keyboard.up('KeyW')
  expect(await runtimeNumber(page, 'Depth')).toBeGreaterThan(startDepth + 0.2)

  await page.keyboard.press('KeyR')
  await expect(page.locator('.runtime-values')).toContainText('camera returned')
  await expect.poll(() => runtimeNumber(page, 'Depth')).toBeCloseTo(-12, 1)
})
