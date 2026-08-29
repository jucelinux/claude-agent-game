import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import { PNG } from 'pngjs'

const PROTOTYPE_URL = '/?prototype=einstein-low-poly-prototype'
const MINIMUM_HAIR_PIXELS = 200

type DioramaSample = {
  readonly buffer: Buffer
  readonly lightHairPixels: number
  readonly warmPixels: number
  readonly tealPixels: number
  readonly width: number
  readonly height: number
}

async function sampleCanvas(canvas: Locator): Promise<DioramaSample> {
  const buffer = await canvas.screenshot()
  const png = PNG.sync.read(buffer)
  let lightHairPixels = 0
  let warmPixels = 0
  let tealPixels = 0

  for (let index = 0; index < png.data.length; index += 4) {
    const red = png.data[index] ?? 0
    const green = png.data[index + 1] ?? 0
    const blue = png.data[index + 2] ?? 0
    const alpha = png.data[index + 3] ?? 0
    if (alpha === 0) continue
    const spread = Math.max(red, green, blue) - Math.min(red, green, blue)
    if (red > 135 && green > 125 && blue > 105 && spread < 70) lightHairPixels++
    if (red > 95 && red > green + 18 && green > blue + 10) warmPixels++
    if (blue > red + 8 && green > red + 6 && blue > 34) tealPixels++
  }

  return {
    buffer,
    lightHairPixels,
    warmPixels,
    tealPixels,
    width: png.width,
    height: png.height,
  }
}

async function openDiorama(page: Page): Promise<Locator> {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto(PROTOTYPE_URL)
  const canvas = page.locator('canvas.babylon-canvas')
  await expect(canvas).toBeVisible()
  await page.waitForTimeout(2_000)
  expect(pageErrors).toEqual([])
  await expect(page.locator('.runtime-values')).toContainText('idle', { timeout: 12_000 })
  return canvas
}

async function runtimeNumber(page: Page, label: string): Promise<number> {
  const value = page
    .locator('.runtime-values > div')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('dd')
  return Number(await value.innerText())
}

async function runtimePosition(page: Page): Promise<readonly [x: number, depth: number]> {
  return [
    await runtimeNumber(page, 'Horizontal'),
    await runtimeNumber(page, 'Depth'),
  ]
}

const positionDistance = (
  first: readonly [number, number],
  second: readonly [number, number],
): number => Math.hypot(second[0] - first[0], second[1] - first[1])

test('the low-poly professor mockup loads with its authored lighting and textures', async ({ page }, testInfo: TestInfo) => {
  const canvas = await openDiorama(page)
  const sample = await sampleCanvas(canvas)
  await canvas.screenshot({ path: testInfo.outputPath('relativity-workshop.png') })
  await testInfo.attach('relativity-workshop', {
    body: sample.buffer,
    contentType: 'image/png',
  })

  expect(sample.width).toBeGreaterThan(500)
  expect(sample.height).toBeGreaterThan(400)
  expect(sample.lightHairPixels).toBeGreaterThan(500)
  expect(sample.warmPixels).toBeGreaterThan(2_000)
  expect(sample.tealPixels).toBeGreaterThan(2_000)

  const beforeOrbit = sample.buffer
  const bounds = await canvas.boundingBox()
  expect(bounds).not.toBeNull()
  if (bounds !== null) {
    await page.mouse.move(bounds.x + bounds.width * 0.55, bounds.y + bounds.height * 0.52)
    await page.mouse.down()
    await page.mouse.move(bounds.x + bounds.width * 0.42, bounds.y + bounds.height * 0.52, { steps: 8 })
    await page.mouse.up()
  }
  await page.waitForTimeout(250)
  const afterOrbit = await canvas.screenshot()
  expect(afterOrbit.equals(beforeOrbit)).toBe(false)
})

test('WASD moves the professor camera-relative without losing the character', async ({ page }, testInfo: TestInfo) => {
  const canvas = await openDiorama(page)
  await canvas.click()

  for (const key of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) {
    await page.keyboard.press('KeyR')
    await expect(page.locator('.runtime-values')).toContainText('idle')
    const start = await runtimePosition(page)

    await page.keyboard.down(key)
    await expect(page.locator('.runtime-values')).toContainText(/start|walk|turn/)
    await page.waitForTimeout(850)
    const moving = await sampleCanvas(canvas)
    await page.keyboard.up(key)

    const finish = await runtimePosition(page)
    expect(positionDistance(start, finish)).toBeGreaterThan(0.18)
    await testInfo.attach(`locomotion-${key}`, {
      body: moving.buffer,
      contentType: 'image/png',
    })
    await canvas.screenshot({ path: testInfo.outputPath(`locomotion-${key}.png`) })
    expect(moving.lightHairPixels).toBeGreaterThan(MINIMUM_HAIR_PIXELS)
  }
})

test('a reversal turns before walking and every transition frame stays visible', async ({ page }, testInfo: TestInfo) => {
  const canvas = await openDiorama(page)
  await canvas.click()

  await page.keyboard.down('KeyS')
  await page.waitForTimeout(900)
  await page.keyboard.up('KeyS')
  const forwardPosition = await runtimePosition(page)

  await page.keyboard.down('KeyW')
  const samples: DioramaSample[] = []
  for (let frame = 0; frame < 12; frame++) {
    await page.waitForTimeout(40)
    samples.push(await sampleCanvas(canvas))
  }
  await page.waitForTimeout(900)
  await page.keyboard.up('KeyW')
  const reversedPosition = await runtimePosition(page)

  for (const sample of samples) {
    expect(sample.lightHairPixels).toBeGreaterThan(MINIMUM_HAIR_PIXELS)
  }
  expect(reversedPosition[0]).toBeLessThan(forwardPosition[0] - 0.08)
  expect(reversedPosition[1]).toBeLessThan(forwardPosition[1] - 0.08)
  await testInfo.attach('reversal-middle-frame', {
    body: samples[6]!.buffer,
    contentType: 'image/png',
  })
})

test('native room collisions stop the professor inside the visible floor', async ({ page }) => {
  const canvas = await openDiorama(page)
  await canvas.click()

  await page.keyboard.down('KeyS')
  await page.waitForTimeout(4_800)
  const atBoundary = await runtimePosition(page)
  await page.waitForTimeout(1_000)
  const stillAtBoundary = await runtimePosition(page)
  await page.keyboard.up('KeyS')

  expect(positionDistance(atBoundary, stillAtBoundary)).toBeLessThan(0.08)
  expect(Math.abs(stillAtBoundary[0])).toBeLessThan(3.55)
  expect(Math.abs(stillAtBoundary[1])).toBeLessThan(2.5)
  expect((await sampleCanvas(canvas)).lightHairPixels).toBeGreaterThan(MINIMUM_HAIR_PIXELS)
})
