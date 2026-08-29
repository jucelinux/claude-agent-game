import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import { PNG } from 'pngjs'

const PROTOTYPE_URL = '/?prototype=lcd-platformer-prototype'
const MINIMUM_MECHA_PIXELS = 250

type CanvasSample = {
  readonly buffer: Buffer
  readonly mechaPixels: number
  readonly copperPixels: number
  readonly width: number
  readonly height: number
  readonly centerX: number
  readonly centerY: number
  readonly background: readonly [red: number, green: number, blue: number]
}

async function sampleCanvas(canvas: Locator): Promise<CanvasSample> {
  const buffer = await canvas.screenshot()
  const png = PNG.sync.read(buffer)
  let mechaPixels = 0
  let copperPixels = 0
  let minX = png.width
  let minY = png.height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const index = (y * png.width + x) * 4
      const red = png.data[index] ?? 255
      const green = png.data[index + 1] ?? 255
      const blue = png.data[index + 2] ?? 255
      const alpha = png.data[index + 3] ?? 0
      const spread = Math.max(red, green, blue) - Math.min(red, green, blue)
      const isArmor = red > 75 && spread < 35
      const isCopper = red > 85 && red > green + 12 && green > blue + 12
      if (alpha > 0 && isCopper) copperPixels++
      if (alpha > 0 && isArmor) {
        mechaPixels++
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }
  const backgroundIndex = (8 * png.width + 8) * 4
  return {
    buffer,
    mechaPixels,
    copperPixels,
    width: png.width,
    height: png.height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    background: [
      png.data[backgroundIndex] ?? 0,
      png.data[backgroundIndex + 1] ?? 0,
      png.data[backgroundIndex + 2] ?? 0,
    ],
  }
}

async function attachSample(
  testInfo: TestInfo,
  name: string,
  sample: CanvasSample,
): Promise<void> {
  await testInfo.attach(name, { body: sample.buffer, contentType: 'image/png' })
}

async function waitForRenderedMecha(canvas: Locator): Promise<void> {
  await expect.poll(async () => (await sampleCanvas(canvas)).mechaPixels, {
    message: 'the Babylon canvas should contain the mecha after shader compilation',
    timeout: 8_000,
  }).toBeGreaterThan(MINIMUM_MECHA_PIXELS)
}

async function openMotionScene(page: Page): Promise<Locator> {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto(PROTOTYPE_URL)
  const canvas = page.locator('canvas.babylon-canvas')
  await expect(canvas).toBeVisible()
  await expect(page.locator('.runtime-values')).toContainText('idle')
  await waitForRenderedMecha(canvas)
  await canvas.click()
  expect(pageErrors).toEqual([])
  return canvas
}

test('the mecha remains visible while starting in both directions', async ({ page }, testInfo) => {
  const canvas = await openMotionScene(page)
  const idle = await sampleCanvas(canvas)
  await attachSample(testInfo, 'idle', idle)
  expect(idle.mechaPixels).toBeGreaterThan(MINIMUM_MECHA_PIXELS)
  expect(idle.copperPixels).toBeGreaterThan(250)
  expect(Math.max(...idle.background)).toBeLessThan(45)
  expect(idle.background[1]).toBeGreaterThan(idle.background[0] + 5)
  expect(idle.background[2]).toBeGreaterThan(idle.background[0] + 5)
  expect(Math.abs(idle.centerX - idle.width / 2)).toBeLessThan(idle.width * 0.04)
  expect(Math.abs(idle.centerY - idle.height / 2)).toBeLessThan(idle.height * 0.04)

  await page.keyboard.down('KeyA')
  await page.waitForTimeout(850)
  await page.keyboard.up('KeyA')
  await expect(page.locator('.runtime-values')).toContainText('left')
  const left = await sampleCanvas(canvas)
  await attachSample(testInfo, 'locomotion-left', left)
  expect(left.mechaPixels).toBeGreaterThan(MINIMUM_MECHA_PIXELS)

  await page.keyboard.press('KeyR')
  await page.keyboard.down('KeyD')
  await page.waitForTimeout(850)
  await page.keyboard.up('KeyD')
  await expect(page.locator('.runtime-values')).toContainText('right')
  const right = await sampleCanvas(canvas)
  await attachSample(testInfo, 'locomotion-right', right)
  expect(right.mechaPixels).toBeGreaterThan(MINIMUM_MECHA_PIXELS)
})

test('no rendered frame disappears during a direction reversal', async ({ page }, testInfo) => {
  const canvas = await openMotionScene(page)
  await page.keyboard.down('KeyD')
  await page.waitForTimeout(650)
  await page.keyboard.up('KeyD')
  await page.keyboard.down('KeyA')

  const samples: CanvasSample[] = []
  for (let frame = 0; frame < 12; frame++) {
    await page.waitForTimeout(35)
    samples.push(await sampleCanvas(canvas))
  }
  await page.keyboard.up('KeyA')

  expect(samples.map((sample) => sample.mechaPixels)).not.toContain(0)
  for (const sample of samples) {
    expect(sample.mechaPixels).toBeGreaterThan(MINIMUM_MECHA_PIXELS)
  }
  await attachSample(testInfo, 'reversal-first-frame', samples[0]!)
  await attachSample(testInfo, 'reversal-middle-frame', samples[6]!)
  await attachSample(testInfo, 'reversal-last-frame', samples[11]!)
})

test('jump and landing remain visible and expose authored motion states', async ({ page }, testInfo) => {
  const canvas = await openMotionScene(page)
  await page.keyboard.down('Space')
  await page.waitForTimeout(180)
  await page.keyboard.up('Space')
  await expect(page.locator('.runtime-values')).toContainText(/jump-rise|fall/)
  const airborne = await sampleCanvas(canvas)
  await attachSample(testInfo, 'airborne', airborne)
  expect(airborne.mechaPixels).toBeGreaterThan(MINIMUM_MECHA_PIXELS)

  await expect(page.locator('.runtime-values')).toContainText('land', { timeout: 3_000 })
  const landed = await sampleCanvas(canvas)
  await attachSample(testInfo, 'landing', landed)
  expect(landed.mechaPixels).toBeGreaterThan(MINIMUM_MECHA_PIXELS)
})
