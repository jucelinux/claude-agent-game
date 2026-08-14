import type { Grammar } from './types.ts'
import type { Frame } from './render.ts'
import { OWNER_OUTLINE } from './raster.ts'

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
}

export function measure(frames: readonly Frame[], grammar: Grammar): Metrics {
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
    inkCoverage,
    partPixels,
    outlinePixels,
    tonesUsed,
    distinctFrames: seenFrames.length,
    minPairDistance,
  }
}
