import type { Grammar, IndexedBuffer, Params } from './types.ts'
import { createPainter, innerOutline, outline, paintPart, rimEdge, OWNER_EMPTY } from './raster.ts'
import { solve } from './skeleton.ts'
import { evaluate } from './gait.ts'
import { mulberry32 } from './rng.ts'

export type Frame = {
  /** Cycle position in [0, 1). */
  readonly t: number
  readonly buf: IndexedBuffer
  /** Part index per pixel, or OWNER_EMPTY / OWNER_OUTLINE. */
  readonly owners: Int16Array
  /** Depth of the winning surface per pixel; `+Infinity` where nothing was painted. */
  readonly depth: Float32Array
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
    // The root sits on the centre plane; a body's depth is authored per bone, relative to
    // it, so the whole sprite can never drift toward or away from the viewer by accident.
    z: 0,
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
    const bone = world.get(part.bone)
    if (bone === undefined) throw new Error(`part "${part.name}" is bound to unknown bone "${part.bone}"`)
    // The part's own depth rides on the bone's, scaled with it: a body that shrinks takes
    // its browridge along instead of leaving it floating where the head used to be.
    const xf = part.z === undefined ? bone : { ...bone, z: bone.z + bone.s * part.z }
    paintPart(painter, part.shape, xf, ramp.indices, params.light, i, rng, params.texture.speckle, part.shift ?? 0)
  }

  if (params.outline.rim) {
    // Before the outer line, so a sample carrying both still ends up with the line outside.
    rimEdge(
      painter,
      (owner) => {
        const part = grammar.parts[owner]
        if (part === undefined) return undefined
        return grammar.palette.ramps.find((r) => r.material === part.material)?.indices
      },
      params.light,
    )
  }

  if (params.outline.inner || params.outline.enabled) {
    const ramp = grammar.palette.ramps.find((r) => r.material === params.outline.material)
    if (ramp === undefined) {
      throw new Error(`outline wants material "${params.outline.material}", absent from palette "${grammar.palette.name}"`)
    }
    // The inner line sits one step above the outer one, so the silhouette stays the darkest
    // thing on screen. With a single-tone ramp they collapse, and that is the ramp's fault.
    if (params.outline.inner) innerOutline(painter, (ramp.indices[1] ?? ramp.indices[0]) as number)
    if (params.outline.enabled) outline(painter, ramp.indices[0] as number)
  }

  return { t, buf: painter.buf, owners: painter.owners, depth: painter.depth }
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
