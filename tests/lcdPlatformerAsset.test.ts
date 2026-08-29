import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PNG } from 'pngjs'

const ATLAS_PATH = new URL(
  '../public/assets/lcd-platformer/mecha/motion-atlas.png',
  import.meta.url,
)

describe('LCD mecha atlas contract', () => {
  it('keeps the authored frame grid and real transparency', () => {
    const atlas = PNG.sync.read(readFileSync(ATLAS_PATH))
    let transparentPixels = 0
    let visiblePixels = 0
    for (let index = 3; index < atlas.data.length; index += 4) {
      const alpha = atlas.data[index] ?? 0
      if (alpha === 0) transparentPixels++
      if (alpha > 0) visiblePixels++
    }

    expect(atlas.width).toBe(320 * 12)
    expect(atlas.height).toBe(320 * 5)
    expect(transparentPixels).toBeGreaterThan(visiblePixels)
    expect(visiblePixels).toBeGreaterThan(50_000)
  })

  it('keeps every authored pose inside its atlas cell', () => {
    const atlas = PNG.sync.read(readFileSync(ATLAS_PATH))
    const cellSize = 320
    const columns = 12
    const clippedFrames: number[] = []
    for (let frame = 0; frame < columns * 5; frame++) {
      const originX = frame % columns * cellSize
      const originY = Math.floor(frame / columns) * cellSize
      let touchesEdge = false
      for (let pixel = 0; pixel < cellSize && !touchesEdge; pixel++) {
        const edgePixels = [
          [originX + pixel, originY],
          [originX + pixel, originY + cellSize - 1],
          [originX, originY + pixel],
          [originX + cellSize - 1, originY + pixel],
        ] as const
        touchesEdge = edgePixels.some(([x, y]) => (
          (atlas.data[(y * atlas.width + x) * 4 + 3] ?? 0) > 0
        ))
      }
      if (touchesEdge) clippedFrames.push(frame)
    }

    expect(clippedFrames).toEqual([])
  })
})
