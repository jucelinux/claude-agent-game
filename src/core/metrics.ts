import type { Grammar } from './types.ts'
import type { Frame } from './render.ts'
import { OWNER_OUTLINE } from './raster.ts'
import { GROUND_RGB, luminance } from './color.ts'

/**
 * Objective numbers about a strip. These are what a lock will assert on later; here they
 * exist so the bench turn reports **counts**, because looking catches what is wrong and
 * only counting catches what is absent (`TASTE-LOOP.md` §3c).
 */
export type Metrics = {
  readonly frames: number
  /** Fraction of the canvas that is not background, per frame. */
  readonly inkCoverage: readonly number[]
  /** Pixels each part actually owns in the finished buffer, per frame. Zero = absent. */
  readonly partPixels: Readonly<Record<string, readonly number[]>>
  readonly outlinePixels: readonly number[]
  /** Distinct palette indices used per material, across the whole strip. */
  readonly tonesUsed: Readonly<Record<string, number>>
  /** Frames whose buffers are not byte-identical to any earlier frame. */
  readonly distinctFrames: number
  /** Smallest fraction of differing pixels between any two frames. The animation margin. */
  readonly minPairDistance: number
  /**
   * How hard the silhouette's edge pushes against the ground, in luminance, per frame.
   * `min` is the weakest pixel on the boundary — where the shape starts dissolving — and
   * `mean` is how the edge reads overall.
   */
  readonly edgeContrast: readonly { readonly min: number; readonly mean: number }[]
  /**
   * The 25% read, per frame. `filled` is how much of the reduced grid the shape occupies;
   * `largest` is the share of that held by its **biggest connected blob**. A shape that
   * survives reduction keeps one body; a shape that dissolves becomes dust, and dust still
   * has coverage — which is why coverage alone would flatter it.
   */
  readonly silhouette: readonly { readonly filled: number; readonly largest: number }[]
}

export function measure(frames: readonly Frame[], grammar: Grammar): Metrics {
  const groundLum = luminance(GROUND_RGB)
  const lumOf = (index: number): number => {
    const rgb = grammar.palette.colors[index]
    return rgb === undefined ? groundLum : luminance(rgb)
  }
  const edgeContrast: { min: number; mean: number }[] = []
  const silhouette: { filled: number; largest: number }[] = []
  if (frames.length === 0) throw new Error('cannot measure an empty strip')
  const first = frames[0] as Frame
  const total = first.buf.w * first.buf.h

  const inkCoverage: number[] = []
  const outlinePixels: number[] = []
  const partPixels: Record<string, number[]> = {}
  for (const part of grammar.parts) partPixels[part.name] = []

  const indexToMaterial = new Map<number, string>()
  for (const ramp of grammar.palette.ramps) {
    for (const index of ramp.indices) indexToMaterial.set(index, ramp.material)
  }
  const tonesSeen = new Map<string, Set<number>>()

  for (const frame of frames) {
    let ink = 0
    let outlined = 0
    const counts = new Int32Array(grammar.parts.length)
    for (let at = 0; at < frame.buf.data.length; at++) {
      const index = frame.buf.data[at] as number
      if (index !== 0) {
        ink++
        const material = indexToMaterial.get(index)
        if (material !== undefined) {
          let seen = tonesSeen.get(material)
          if (seen === undefined) {
            seen = new Set<number>()
            tonesSeen.set(material, seen)
          }
          seen.add(index)
        }
      }
      const owner = frame.owners[at] as number
      if (owner === OWNER_OUTLINE) outlined++
      else if (owner >= 0) counts[owner] = (counts[owner] as number) + 1
    }
    inkCoverage.push(ink / total)
    edgeContrast.push(measureEdge(frame, lumOf, groundLum))
    silhouette.push(measureSilhouette(frame))
    outlinePixels.push(outlined)
    for (let i = 0; i < grammar.parts.length; i++) {
      const part = grammar.parts[i] as Grammar['parts'][number]
      ;(partPixels[part.name] as number[]).push(counts[i] as number)
    }
  }

  const tonesUsed: Record<string, number> = {}
  for (const ramp of grammar.palette.ramps) tonesUsed[ramp.material] = tonesSeen.get(ramp.material)?.size ?? 0

  let minPairDistance = 1
  const seenFrames: string[] = []
  for (let i = 0; i < frames.length; i++) {
    const a = frames[i] as Frame
    const key = Buffer.from(a.buf.data).toString('base64')
    if (!seenFrames.includes(key)) seenFrames.push(key)
    for (let j = i + 1; j < frames.length; j++) {
      const b = frames[j] as Frame
      let diff = 0
      for (let at = 0; at < a.buf.data.length; at++) if (a.buf.data[at] !== b.buf.data[at]) diff++
      const d = diff / total
      if (d < minPairDistance) minPairDistance = d
    }
  }
  if (frames.length === 1) minPairDistance = 0

  return {
    frames: frames.length,
    edgeContrast,
    silhouette,
    inkCoverage,
    partPixels,
    outlinePixels,
    tonesUsed,
    distinctFrames: seenFrames.length,
    minPairDistance,
  }
}


/** Luminance distance from the ground, over every sprite pixel that touches the outside. */
function measureEdge(
  frame: Frame,
  lumOf: (index: number) => number,
  groundLum: number,
): { min: number; mean: number } {
  const { w, h, data } = frame.buf
  let min = 1
  let sum = 0
  let count = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      if (data[at] === 0) continue
      const outside =
        x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
        data[at - 1] === 0 || data[at + 1] === 0 || data[at - w] === 0 || data[at + w] === 0
      if (!outside) continue
      const d = Math.abs(lumOf(data[at] as number) - groundLum)
      if (d < min) min = d
      sum += d
      count++
    }
  }
  return count === 0 ? { min: 0, mean: 0 } : { min, mean: sum / count }
}

/** The 25% read: how much survives, and whether what survives is still one body. */
function measureSilhouette(frame: Frame, factor = 4, threshold = 0.5): { filled: number; largest: number } {
  const { w, h, data } = frame.buf
  const rw = Math.ceil(w / factor)
  const rh = Math.ceil(h / factor)
  const hits = new Float32Array(rw * rh)
  const seen = new Int32Array(rw * rh)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] === 0) continue
      const cellAt = Math.floor(y / factor) * rw + Math.floor(x / factor)
      hits[cellAt] = (hits[cellAt] as number) + 1
    }
  }
  const cell = factor * factor
  const on: boolean[] = []
  let filled = 0
  for (let i = 0; i < hits.length; i++) {
    const isOn = (hits[i] as number) / cell >= threshold
    on.push(isOn)
    if (isOn) filled++
  }
  if (filled === 0) return { filled: 0, largest: 0 }

  // Largest connected blob, 4-connectivity, flood filled iteratively.
  let largest = 0
  for (let i = 0; i < on.length; i++) {
    if (on[i] !== true || seen[i] === 1) continue
    let size = 0
    const stack = [i]
    seen[i] = 1
    while (stack.length > 0) {
      const at = stack.pop() as number
      size++
      const x = at % rw
      const y = Math.floor(at / rw)
      const neighbours = [x > 0 ? at - 1 : -1, x < rw - 1 ? at + 1 : -1, y > 0 ? at - rw : -1, y < rh - 1 ? at + rw : -1]
      for (const n of neighbours) {
        if (n >= 0 && on[n] === true && seen[n] === 0) {
          seen[n] = 1
          stack.push(n)
        }
      }
    }
    if (size > largest) largest = size
  }
  return { filled: filled / (rw * rh), largest: largest / filled }
}
