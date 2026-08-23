import { readFileSync, statSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  P66_TERRAIN_ATLAS_COUNT,
  P66_TERRAIN_ALTITUDE_FT,
  P66_TERRAIN_DOWNRANGE_FT,
  P66_TERRAIN_FRAME_COUNT,
  P66_TERRAIN_FRAME_HEIGHT,
  P66_TERRAIN_FRAME_WIDTH,
  P66_TERRAIN_STARTUP_ATLAS_KEYS,
} from '../src/game/landing/bakedTerrain.ts'

type RgbaPng = {
  readonly width: number
  readonly height: number
  readonly pixels: Uint8Array
}

const paeth = (left: number, up: number, upperLeft: number): number => {
  const estimate = left + up - upperLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const upperLeftDistance = Math.abs(estimate - upperLeft)
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left
  return upDistance <= upperLeftDistance ? up : upperLeft
}

const decodeRgbaPng = (path: URL): RgbaPng => {
  const source = readFileSync(path)
  const signature = source.subarray(0, 8).toString('hex')
  expect(signature).toBe('89504e470d0a1a0a')

  let offset = 8
  let width = 0
  let height = 0
  let channels = 0
  const compressed: Buffer[] = []
  while (offset < source.length) {
    const length = source.readUInt32BE(offset)
    const type = source.subarray(offset + 4, offset + 8).toString('ascii')
    const data = source.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      expect(data[8]).toBe(8)
      expect([2, 6]).toContain(data[9])
      channels = data[9] === 6 ? 4 : 3
      expect(data[12]).toBe(0)
    }
    if (type === 'IDAT') compressed.push(data)
    offset += 12 + length
  }

  const inflated = inflateSync(Buffer.concat(compressed))
  const stride = width * channels
  const decoded = new Uint8Array(stride * height)
  let inputOffset = 0
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset]
    inputOffset += 1
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[inputOffset + x] ?? 0
      const left = x >= channels ? decoded[y * stride + x - channels]! : 0
      const up = y > 0 ? decoded[(y - 1) * stride + x]! : 0
      const upperLeft = x >= channels && y > 0
        ? decoded[(y - 1) * stride + x - channels]!
        : 0
      const prediction = filter === 0 ? 0
        : filter === 1 ? left
          : filter === 2 ? up
            : filter === 3 ? Math.floor((left + up) / 2)
              : filter === 4 ? paeth(left, up, upperLeft)
                : Number.NaN
      if (Number.isNaN(prediction)) throw new Error(`Unsupported PNG filter ${filter}`)
      decoded[y * stride + x] = (raw + prediction) & 0xff
    }
    inputOffset += stride
  }
  if (channels === 4) return { width, height, pixels: decoded }

  const pixels = new Uint8Array(width * height * 4)
  for (let source = 0, target = 0; source < decoded.length; source += 3, target += 4) {
    pixels[target] = decoded[source]!
    pixels[target + 1] = decoded[source + 1]!
    pixels[target + 2] = decoded[source + 2]!
    pixels[target + 3] = 255
  }
  return { width, height, pixels }
}

const alphaAt = (png: RgbaPng, x: number, y: number): number =>
  png.pixels[(y * png.width + x) * 4 + 3] ?? -1

const atlasFramePixels = (png: RgbaPng, frame: number): Uint8Array => {
  const frameX = (frame % 4) * P66_TERRAIN_FRAME_WIDTH
  const frameY = Math.floor(frame / 4) * P66_TERRAIN_FRAME_HEIGHT
  const pixels = new Uint8Array(P66_TERRAIN_FRAME_WIDTH * P66_TERRAIN_FRAME_HEIGHT * 4)
  for (let y = 0; y < P66_TERRAIN_FRAME_HEIGHT; y += 1) {
    const sourceStart = ((frameY + y) * png.width + frameX) * 4
    const targetStart = y * P66_TERRAIN_FRAME_WIDTH * 4
    pixels.set(
      png.pixels.subarray(sourceStart, sourceStart + P66_TERRAIN_FRAME_WIDTH * 4),
      targetStart,
    )
  }
  return pixels
}

describe('P66 production art contracts', () => {
  it('ships the cockpit on the 320 × 180 logical pixel grid', () => {
    const source = readFileSync(new URL('../public/assets/landing/p66-cockpit-snes.png', import.meta.url))
    expect(source.readUInt32BE(16)).toBe(320)
    expect(source.readUInt32BE(20)).toBe(180)
  })

  it('keeps the entire inner window transparent, including the lower seal', () => {
    const overlay = decodeRgbaPng(new URL('../public/assets/landing/p66-cockpit-snes.png', import.meta.url))
    expect([overlay.width, overlay.height]).toEqual([320, 180])

    for (const [x, y] of [
      [160, 27],
      [100, 83],
      [67, 103],
      [133, 116],
      [183, 124],
    ]) expect(alphaAt(overlay, x!, y!)).toBe(0)

    for (const [x, y] of [
      [17, 17],
      [133, 137],
      [243, 100],
      [313, 173],
    ]) expect(alphaAt(overlay, x!, y!)).toBe(255)
  })

  it('ships all terrain states as complete 4 × 4 overscan atlases', () => {
    for (let index = 0; index < P66_TERRAIN_ATLAS_COUNT; index += 1) {
      const name = `p66-terrain-atlas-${String(index).padStart(2, '0')}.png`
      const source = readFileSync(new URL(`../public/assets/landing/${name}`, import.meta.url))
      expect(source.subarray(0, 8).toString('hex'), name).toBe('89504e470d0a1a0a')
      expect(source.readUInt32BE(16), name).toBe(P66_TERRAIN_FRAME_WIDTH * 4)
      expect(source.readUInt32BE(20), name).toBe(P66_TERRAIN_FRAME_HEIGHT * 4)
      expect(source.length, name).toBeGreaterThan(100_000)
    }
  })

  it('keeps the blocking terrain payload below one fifth of the complete descent', () => {
    const sizeOf = (key: string): number => statSync(new URL(
      `../public/assets/landing/${key}.png`,
      import.meta.url,
    )).size
    const completeBytes = Array.from({ length: P66_TERRAIN_ATLAS_COUNT }, (_, index) =>
      sizeOf(`p66-terrain-atlas-${String(index).padStart(2, '0')}`),
    ).reduce((sum, bytes) => sum + bytes, 0)
    const startupBytes = P66_TERRAIN_STARTUP_ATLAS_KEYS
      .map(sizeOf)
      .reduce((sum, bytes) => sum + bytes, 0)

    expect(startupBytes).toBeLessThan(2_000_000)
    expect(startupBytes / completeBytes).toBeLessThan(0.2)
  })

  it('does not repeat the previous touchdown view at an atlas boundary', () => {
    const firstAtlas = decodeRgbaPng(new URL(
      '../public/assets/landing/p66-terrain-atlas-00.png',
      import.meta.url,
    ))
    const secondAtlas = decodeRgbaPng(new URL(
      '../public/assets/landing/p66-terrain-atlas-01.png',
      import.meta.url,
    ))

    expect(atlasFramePixels(secondAtlas, 0)).not.toEqual(atlasFramePixels(firstAtlas, 15))
  })

  it('locks every terrain state to one shared 16-color palette', () => {
    const palette = decodeRgbaPng(new URL(
      '../public/assets/landing/p66-terrain-palette.png',
      import.meta.url,
    ))
    expect([palette.width, palette.height]).toEqual([16, 16])

    const colors = new Set<string>()
    for (let index = 0; index < palette.pixels.length; index += 4) {
      colors.add([
        palette.pixels[index],
        palette.pixels[index + 1],
        palette.pixels[index + 2],
        palette.pixels[index + 3],
      ].join(','))
    }
    expect(colors.size).toBeLessThanOrEqual(16)
  })

  it('keeps the Blender manifest synchronized with the runtime state grid', () => {
    const manifest = JSON.parse(readFileSync(new URL(
      '../public/assets/landing/p66-terrain-manifest.json',
      import.meta.url,
    ), 'utf8'))
    expect([manifest.logicalWidth, manifest.logicalHeight]).toEqual([
      P66_TERRAIN_FRAME_WIDTH,
      P66_TERRAIN_FRAME_HEIGHT,
    ])
    expect([manifest.contentWidth, manifest.contentHeight]).toEqual([320, 180])
    expect(manifest.downrangeFt).toEqual([...P66_TERRAIN_DOWNRANGE_FT])
    expect(manifest.altitudeFt).toEqual([...P66_TERRAIN_ALTITUDE_FT])
    expect(manifest.frames).toHaveLength(P66_TERRAIN_FRAME_COUNT)
  })
})
