/**
 * **A scene, taken apart instead of flattened.**
 *
 * `compose.ts` renders a scene to a list of finished pictures. That is right for the gallery,
 * which freezes, and it is the reason two of his readings could not be answered:
 *
 * - **a cloud jumped at the loop point.** A pre-composited frame list is periodic by
 *   construction, so a cloud could only return to its start by crossing the whole scene in
 *   one 1200 ms cycle — seamless, and it reads as a jet.
 * - **the gorilla could not be controlled.** A picture nobody can change is a picture nobody
 *   can play.
 *
 * Both are the same limitation and it is not in the drawing. It is that *composition* had
 * been done ahead of time. This module keeps every sprite pre-rendered — a walk cycle is
 * still a pure function of its grammar, still deterministic, still hashed — and ships the
 * **arrangement** as data, so the browser composes each animation frame from live state.
 *
 * That is the split `HARNESS.md` §2.1 already requires: a deterministic core, and rendering
 * as a consumer of it. Until now the consumer happened to run at build time. **This is the
 * first piece of the engine slice, and content asked for it rather than a plan** — which is
 * the right way round.
 *
 * **What crosses the wire.** Indexed bytes and a palette, exactly as everywhere else in this
 * project: a locked palette is verifiable in index space and an RGBA image is not. Each
 * layer is cropped to its own painted box over the whole cycle, because a tree occupies
 * about half its cell and the margin is pure transfer.
 */
import type { RGB } from '../core/types.ts'
import { execute } from '../io/load.ts'
import type { Placement, Scene } from './compose.ts'
import { floorDepth, hazeAt, paintOrder, standRow } from './compose.ts'

/** One sprite's whole cycle, cropped, in index space. */
export type Layer = {
  readonly id: string
  /** The cropped box. */
  readonly w: number
  readonly h: number
  /** Where the crop sits relative to the sprite's own origin. */
  readonly ox: number
  readonly oy: number
  readonly frames: number
  readonly msPerFrame: number
  /** Index 0 is transparent. Already hazed by the placement's `recede`. */
  readonly palette: readonly RGB[]
  /** Every frame concatenated, one byte per pixel, row-major. */
  readonly indices: Uint8Array
}

/** A layer placed in the world, with whatever makes it move. */
export type Placed = {
  readonly layer: number
  /** Where the sprite's origin lands. */
  readonly x: number
  readonly y: number
  readonly phase: number
  readonly motion?: Placement['motion']
  /** Present on a controlled subject. `flip` is the layer to draw when it faces left. */
  readonly control?: Placement['control'] & { readonly flip: number }
}

export type Stage = {
  readonly name: string
  readonly w: number
  readonly h: number
  readonly scale: number
  readonly ground: number
  readonly sky: RGB
  readonly groundRamp: readonly RGB[]
  /** One colour per floor row, from `ground` down. The recede is already in it. */
  readonly floor: readonly RGB[]
  /** Rain, retimed from passes-per-loop into pixels per second — there is no loop now. */
  readonly rain: {
    readonly colors: readonly RGB[]
    readonly spacing: number
    readonly length: number
    readonly slant: number
    readonly speed: number
    readonly seed: number
  } | null
  readonly layers: readonly Layer[]
  /** Back to front. */
  readonly placed: readonly Placed[]
  /** Distinct colours across every layer — the same cohesion reading, on the same terms. */
  readonly colours: number
}

const haze = (c: RGB, sky: RGB, k: number): RGB => [
  Math.round(c[0] + (sky[0] - c[0]) * k),
  Math.round(c[1] + (sky[1] - c[1]) * k),
  Math.round(c[2] + (sky[2] - c[2]) * k),
]

/** The painted box over the whole cycle, so a subject whose limbs move keeps one crop. */
function box(frames: readonly { readonly buf: { w: number; h: number; data: Uint8Array } }[]): {
  x0: number; y0: number; x1: number; y1: number
} {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
  for (const f of frames) {
    const { w, h, data } = f.buf
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[y * w + x] === 0) continue
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  return x0 === Infinity ? { x0: 0, y0: 0, x1: 0, y1: 0 } : { x0, y0, x1, y1 }
}

/**
 * Render one placement to a cropped layer. `flipLight` mirrors the lamp before rendering and
 * then mirrors the pixels, which is how a subject faces the other way **without** its light
 * turning round with it.
 */
function layerOf(p: Placement, id: string, sky: RGB, recede: number, flipLight: boolean): { layer: Layer; foot: number; origin: { x: number; y: number } } {
  const overrides: Record<string, number> = {}
  if (p.scale !== undefined) overrides['body.scale'] = p.scale
  if (p.msPerFrame !== undefined) overrides['playback.msPerFrame'] = p.msPerFrame
  const run = execute({ grammar: p.grammar, tunables: p.tunables, seed: p.seed ?? 1 })
  const lit = flipLight
    ? execute({
        grammar: p.grammar, tunables: p.tunables, seed: p.seed ?? 1,
        overrides: { ...overrides, 'light.x': -run.params.light.x, 'fill.x': -run.params.fill.x },
      })
    : Object.keys(overrides).length === 0
      ? run
      : execute({ grammar: p.grammar, tunables: p.tunables, seed: p.seed ?? 1, overrides })

  const { originX, originY } = lit.params.canvas
  const b = box(lit.frames)
  const w = b.x1 - b.x0 + 1
  const h = b.y1 - b.y0 + 1
  const n = lit.frames.length
  const indices = new Uint8Array(w * h * n)
  for (let f = 0; f < n; f++) {
    const src = lit.frames[f]!.buf
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // The horizontal flip happens here, after the lamp was already mirrored above, so the
        // two mirrors cancel on the lighting and compose on the shape.
        const sx = flipLight ? b.x1 - x : b.x0 + x
        indices[f * w * h + y * w + x] = src.data[(b.y0 + y) * src.w + sx] as number
      }
    }
  }
  const palette = lit.grammar.palette.colors.map((c, i) => (i === 0 || recede === 0 ? c : haze(c, sky, recede)))

  // A flip mirrors the crop about the origin column too, or the sprite would jump sideways
  // the moment it turns round.
  const ox = flipLight ? originX - b.x1 : b.x0 - originX
  return {
    layer: { id, w, h, ox, oy: b.y0 - originY, frames: n, msPerFrame: lit.params.playback.msPerFrame, palette, indices },
    foot: b.y1 + 1,
    origin: { x: originX, y: originY },
  }
}

export function toStage(scene: Scene): Stage {
  const layers: Layer[] = []
  const placed: (Placed & { readonly order: number })[] = []

  for (const [i, p] of scene.placements.entries()) {
    const recede = p.sky === true ? 0 : hazeAt(scene, p.depth ?? 0)
    const main = layerOf(p, `${p.grammar}#${i}`, scene.sky, recede, false)
    const index = layers.push(main.layer) - 1

    // Depth gives the contact row; `anchor` says how the sprite meets it. `origin` is exact,
    // `foot` measures the lowest painted pixel. Same rule as the compositor, by the same
    // functions, because two implementations of one rule is two rules eventually.
    const row = p.sky === true ? (p.y ?? 0) : standRow(scene, p.depth ?? 0)
    const y = p.anchor === 'foot' ? row - main.foot + main.origin.y : row

    let control: Placed['control']
    if (p.control !== undefined) {
      const flip = layers.push(layerOf(p, `${p.grammar}#${i}:left`, scene.sky, recede, true).layer) - 1
      control = { ...p.control, flip }
    }

    placed.push({
      layer: index,
      x: p.x,
      y,
      phase: p.phase ?? 0,
      ...(p.motion === undefined ? {} : { motion: p.motion }),
      ...(control === undefined ? {} : { control }),
      order: paintOrder(p, i),
    })
  }
  placed.sort((a, b) => a.order - b.order)

  // The rain was authored as whole passes per scene loop, because a loop was the only clock
  // there was. In seconds it is one number and it stops being tied to anything.
  const field = (scene.fields ?? [])[0]
  const cycleSeconds = (scene.frames * scene.msPerFrame) / 1000
  const rain =
    field === undefined
      ? null
      : {
          colors: field.colors, spacing: field.spacing, length: field.length, slant: field.slant,
          speed: (field.passes * (scene.h + field.length * 2)) / cycleSeconds,
          seed: field.seed,
        }

  // **The floor as one colour per row.** Computed here rather than in the browser, so the
  // runtime and the compositor cannot disagree about where the horizon is — the recurring
  // failure in this file's history is two consumers each doing the same arithmetic.
  const floorTone = scene.groundRamp[0] as RGB
  const floor: RGB[] = []
  for (let y = scene.ground; y < scene.h; y++) {
    floor.push(
      y === scene.ground
        ? (scene.groundRamp[scene.groundRamp.length - 1] as RGB)
        : haze(floorTone, scene.sky, scene.haze * floorDepth(scene, y)),
    )
  }

  const seen = new Set<string>()
  for (const l of layers) for (let i = 1; i < l.palette.length; i++) seen.add(String(l.palette[i]))

  return {
    name: scene.name, w: scene.w, h: scene.h, scale: scene.scale, ground: scene.ground,
    sky: scene.sky, groundRamp: scene.groundRamp, rain, floor,
    layers, placed: placed.map(({ order, ...rest }) => rest), colours: seen.size,
  }
}
