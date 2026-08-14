import type { Grammar, IndexedBuffer, Params } from './types.ts'
import { createPainter, outline, paintPart, OWNER_EMPTY } from './raster.ts'
import { solve } from './skeleton.ts'
import { evaluate } from './gait.ts'
import { mulberry32 } from './rng.ts'

export type Frame = {
  /** Cycle position in [0, 1). */
  readonly t: number
  readonly buf: IndexedBuffer
  /** Part index per pixel, or OWNER_EMPTY / OWNER_OUTLINE. */
  readonly owners: Int16Array
}

/**
 * `sprite(grammar, params, seed) -> indexed buffer`, closed form in `t`.
 * No clock, no `Math.random`, no DOM — the whole core is this function's dependencies.
 */
export function sprite(grammar: Grammar, params: Params, seed: number, t: number): Frame {
  const pose = evaluate(grammar.gait, params, t)
  const world = solve(grammar.skeleton, pose, {
    x: params.canvas.originX,
    y: params.canvas.originY,
    a: 0,
    s: params.body.scale,
  })

  const painter = createPainter(params.canvas.w, params.canvas.h)
  // Pure in `t`: the same frame is reproducible without knowing its index in the strip.
  const rng = params.texture.speckle > 0 ? mulberry32((seed ^ Math.round(t * 65536)) >>> 0) : null

  for (let i = 0; i < grammar.parts.length; i++) {
    const part = grammar.parts[i] as Grammar['parts'][number]
    const ramp = grammar.palette.ramps.find((r) => r.material === part.material)
    if (ramp === undefined) {
      throw new Error(`part "${part.name}" wants material "${part.material}", absent from palette "${grammar.palette.name}"`)
    }
    const xf = world.get(part.bone)
    if (xf === undefined) throw new Error(`part "${part.name}" is bound to unknown bone "${part.bone}"`)
    paintPart(painter, part.shape, xf, ramp.indices, params.light, i, rng, params.texture.speckle)
  }

  if (params.outline.enabled) {
    const ramp = grammar.palette.ramps.find((r) => r.material === params.outline.material)
    if (ramp === undefined) {
      throw new Error(`outline wants material "${params.outline.material}", absent from palette "${grammar.palette.name}"`)
    }
    outline(painter, ramp.indices[0] as number)
  }

  return { t, buf: painter.buf, owners: painter.owners }
}

/** One walk cycle, `params.frames.walk` frames evenly spaced over t in [0, 1). */
export function strip(grammar: Grammar, params: Params, seed: number): Frame[] {
  const n = params.frames.walk
  if (n < 1) throw new Error(`frames.walk must be >= 1, is ${n}`)
  const frames: Frame[] = []
  for (let i = 0; i < n; i++) frames.push(sprite(grammar, params, seed, i / n))
  return frames
}

export { OWNER_EMPTY }
