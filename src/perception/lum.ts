/**
 * The agent's eye. No human, no browser in the path (`TASTE-LOOP.md` §3c).
 *
 * Two views, because they fail differently:
 *  - **the dump** — one character per pixel, by luminance. Catches what is *wrong*.
 *  - **the silhouette** — a 25% reduction, thresholded. Catches whether the shape reads
 *    at all. It is a *reducing* instrument and therefore the one that can hide the very
 *    difference it exists to show (`HARNESS.md` §5) — its null case is not optional.
 *
 * Background (index 0) is always blank and ink is always at least `.`: a dark ink pixel
 * and an empty pixel must never print the same character, or the instrument flatters.
 */
import type { IndexedBuffer, Palette } from '../core/types.ts'

/** Nine visible steps, dark to light. Index 0 of the string is reserved for background. */
export const CHARS = ' .:-=+*#%@'

export function luminanceOf(palette: Palette, index: number): number {
  const rgb = palette.colors[index]
  if (rgb === undefined) throw new Error(`palette "${palette.name}" has no colour at index ${index}`)
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
}

export function charFor(palette: Palette, index: number): string {
  if (index === 0) return CHARS[0] as string
  const lum = luminanceOf(palette, index)
  const level = 1 + Math.min(8, Math.max(0, Math.floor(lum * 9)))
  return CHARS[level] as string
}

export function dumpFrame(buf: IndexedBuffer, palette: Palette): string {
  const rows: string[] = []
  for (let y = 0; y < buf.h; y++) {
    let row = ''
    for (let x = 0; x < buf.w; x++) row += charFor(palette, buf.data[y * buf.w + x] as number)
    rows.push(row)
  }
  return rows.join('\n')
}

/** The contact sheet: every frame of the strip side by side, one line per pixel row. */
export function dumpStrip(buffers: readonly IndexedBuffer[], palette: Palette, gap = ' | '): string {
  if (buffers.length === 0) return ''
  const grids = buffers.map((b) => dumpFrame(b, palette).split('\n'))
  const height = (grids[0] as string[]).length
  const rows: string[] = []
  for (let y = 0; y < height; y++) rows.push(grids.map((g) => g[y] as string).join(gap))
  return rows.join('\n')
}

/** Ink coverage per cell of a `factor`-times reduction. */
export function coverage(buf: IndexedBuffer, factor: number): { w: number; h: number; cells: Float32Array } {
  if (factor < 1) throw new Error(`reduction factor must be >= 1, is ${factor}`)
  const w = Math.ceil(buf.w / factor)
  const h = Math.ceil(buf.h / factor)
  const cells = new Float32Array(w * h)
  const counts = new Int32Array(w * h)
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      const at = Math.floor(y / factor) * w + Math.floor(x / factor)
      counts[at] = (counts[at] as number) + 1
      if (buf.data[y * buf.w + x] !== 0) cells[at] = (cells[at] as number) + 1
    }
  }
  for (let i = 0; i < cells.length; i++) cells[i] = (cells[i] as number) / (counts[i] as number)
  return { w, h, cells }
}

/** The 25% silhouette read: does the shape survive being thrown away four times over? */
export function silhouette(buf: IndexedBuffer, factor = 4, threshold = 0.5): string {
  const { w, h, cells } = coverage(buf, factor)
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) row += (cells[y * w + x] as number) >= threshold ? '#' : ' '
    rows.push(row)
  }
  return rows.join('\n')
}

export function silhouetteStrip(
  buffers: readonly IndexedBuffer[],
  factor = 4,
  threshold = 0.5,
  gap = ' | ',
): string {
  if (buffers.length === 0) return ''
  const grids = buffers.map((b) => silhouette(b, factor, threshold).split('\n'))
  const height = (grids[0] as string[]).length
  const rows: string[] = []
  for (let y = 0; y < height; y++) rows.push(grids.map((g) => g[y] as string).join(gap))
  return rows.join('\n')
}
