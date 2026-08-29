import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import { PNG } from 'pngjs'

const PROTOTYPE_URL = '/?prototype=einstein-low-poly-prototype'
const MINIMUM_HAIR_PIXELS = 180

type QuantumSample = {
  readonly buffer: Buffer
  readonly lightHairPixels: number
  readonly cyanPixels: number
  readonly magentaPixels: number
  readonly amberPixels: number
  readonly width: number
  readonly height: number
}

async function sampleCanvas(canvas: Locator): Promise<QuantumSample> {
  const buffer = await canvas.screenshot()
  const png = PNG.sync.read(buffer)
  let lightHairPixels = 0
  let cyanPixels = 0
  let magentaPixels = 0
  let amberPixels = 0

  for (let index = 0; index < png.data.length; index += 4) {
    const red = png.data[index] ?? 0
    const green = png.data[index + 1] ?? 0
    const blue = png.data[index + 2] ?? 0
    const alpha = png.data[index + 3] ?? 0
    if (alpha === 0) continue
    const spread = Math.max(red, green, blue) - Math.min(red, green, blue)
    if (red > 130 && green > 120 && blue > 105 && spread < 75) lightHairPixels++
    if (green > red + 18 && blue > red + 28 && blue > 70) cyanPixels++
    if (red > green + 30 && blue > green + 5 && red > 85) magentaPixels++
    if (red > 130 && green > 65 && red > blue + 50) amberPixels++
  }

  return {
    buffer,
    lightHairPixels,
    cyanPixels,
    magentaPixels,
    amberPixels,
    width: png.width,
    height: png.height,
  }
}

async function openQuantumField(page: Page): Promise<Locator> {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto(PROTOTYPE_URL)
  const canvas = page.locator('canvas.babylon-canvas')
  await expect(canvas).toBeVisible()
  await page.waitForTimeout(2_000)
  expect(pageErrors).toEqual([])
  await expect(page.locator('.runtime-values')).toContainText('einstein-subatomic')
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

test('Einstein loads in a luminous subatomic field without the workshop', async ({ page }, testInfo: TestInfo) => {
  const canvas = await openQuantumField(page)
  const sample = await sampleCanvas(canvas)
  await canvas.screenshot({ path: testInfo.outputPath('einstein-quantum-field.png') })
  await testInfo.attach('einstein-quantum-field', {
    body: sample.buffer,
    contentType: 'image/png',
  })

  expect(sample.width).toBeGreaterThan(500)
  expect(sample.height).toBeGreaterThan(400)
  expect(sample.lightHairPixels).toBeGreaterThan(MINIMUM_HAIR_PIXELS)
  expect(sample.cyanPixels).toBeGreaterThan(1_000)
  expect(sample.magentaPixels).toBeGreaterThan(400)
  await expect(page.getByText("Einstein's Quantum Field", { exact: true })).toBeVisible()
})

test('A moves left and D moves right in camera space', async ({ page }) => {
  const canvas = await openQuantumField(page)
  await canvas.focus()

  await page.keyboard.down('KeyA')
  await page.waitForTimeout(1_100)
  await page.keyboard.up('KeyA')
  const afterA = await runtimePosition(page)
  expect(afterA[0]).toBeGreaterThan(0.12)
  expect(afterA[1]).toBeLessThan(-0.12)

  await page.keyboard.press('KeyR')
  await page.waitForTimeout(250)
  await page.keyboard.down('KeyD')
  await page.waitForTimeout(1_100)
  await page.keyboard.up('KeyD')
  const afterD = await runtimePosition(page)
  expect(afterD[0]).toBeLessThan(-0.12)
  expect(afterD[1]).toBeGreaterThan(0.12)
  expect((await sampleCanvas(canvas)).lightHairPixels).toBeGreaterThan(MINIMUM_HAIR_PIXELS)
})

test('left click fires a wave and right click fires a particle', async ({ page }, testInfo: TestInfo) => {
  const canvas = await openQuantumField(page)
  const bounds = await canvas.boundingBox()
  expect(bounds).not.toBeNull()
  if (bounds === null) return

  await canvas.click({
    button: 'left',
    position: { x: bounds.width * 0.68, y: bounds.height * 0.6 },
  })
  await expect(page.locator('.runtime-values')).toContainText('wave photon fired')
  await page.waitForTimeout(120)
  const wave = await sampleCanvas(canvas)
  await testInfo.attach('wave-photon', { body: wave.buffer, contentType: 'image/png' })

  await canvas.click({
    button: 'right',
    position: { x: bounds.width * 0.72, y: bounds.height * 0.55 },
  })
  await expect(page.locator('.runtime-values')).toContainText('particle photon fired')
  await page.waitForTimeout(120)
  const particle = await sampleCanvas(canvas)
  await testInfo.attach('particle-photon', { body: particle.buffer, contentType: 'image/png' })

  expect(wave.cyanPixels).toBeGreaterThan(1_000)
  expect(particle.amberPixels).toBeGreaterThan(20)
  expect(particle.lightHairPixels).toBeGreaterThan(MINIMUM_HAIR_PIXELS)
})
