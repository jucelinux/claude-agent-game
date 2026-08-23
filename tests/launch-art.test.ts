import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readPngSize = (path: URL): readonly [number, number, number] => {
  const source = readFileSync(path)
  expect(source.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return [source.readUInt32BE(16), source.readUInt32BE(20), source.length]
}

describe('launch-day production art contracts', () => {
  it('ships the Pad 39A opening on the 320 × 180 logical canvas', () => {
    const [width, height, bytes] = readPngSize(new URL(
      '../public/assets/launch/pad39a-establishing-snes.png',
      import.meta.url,
    ))
    expect([width, height]).toEqual([320, 180])
    expect(bytes).toBeGreaterThan(100_000)
  })

  it('keeps overscan around the animated Armstrong window', () => {
    const [width, height, bytes] = readPngSize(new URL(
      '../public/assets/launch/armstrong-window-exterior-snes.png',
      import.meta.url,
    ))
    expect([width, height]).toEqual([480, 270])
    expect(bytes).toBeGreaterThan(250_000)
  })

  it('records generated-art provenance and its evidence boundary', () => {
    const provenance = readFileSync(new URL(
      '../public/assets/launch/README.md',
      import.meta.url,
    ), 'utf8')
    expect(provenance).toContain('visual translations, never historical evidence')
    expect(provenance).toContain('Final prompt set')
  })
})
