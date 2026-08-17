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
import { execute, loadParams } from '../io/load.ts'
import type { Climb, Descent, Placement, Runner, Scene } from './types.ts'
import { floorDepth, hazeAt, paintOrder, standRow } from './types.ts'

/** One sprite's whole cycle, cropped, in index space. */
export type Layer = {
  readonly id: string
  /** The cropped box. */
  readonly w: number
  readonly h: number
  /** Where the crop sits relative to the sprite's own origin. */
  readonly ox: number
  readonly oy: number
  /**
   * The row just below the lowest painted pixel, relative to the origin. **Per layer, because
   * it is per pose.**
   *
   * A photographer standing has his feet 21 px below his pelvis and lying down has them
   * beside it, so a subject anchored by its feet cannot be placed once and then have every
   * clip drawn at that offset — which is exactly what happened, and it left the prone
   * photographer floating at standing height.
   */
  readonly footOff: number
  /** The `body.scale` this render used. A subject's clips must all agree; a lock says so. */
  readonly scale: number
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
  readonly x: number
  /**
   * **The contact row, not a pre-computed sprite offset.** Whoever draws applies the anchor,
   * using the *drawn layer's* own `footOff` — because which pose is on screen decides where
   * that pose's feet are.
   */
  readonly y: number
  readonly anchor: 'origin' | 'foot'
  /**
   * The `body.scale` every clip of this subject was rendered at. Recorded rather than implied,
   * because it is the answer to "did the engine make the clips agree" and a lock has to be
   * able to read it.
   */
  readonly scale: number
  readonly phase: number
  readonly motion?: Placement['motion']
  /**
   * Layer index per clip name, one for each facing. Present on anything with `clips`.
   *
   * **Both facings are real renders.** `left` is the same body with the lamp mirrored and the
   * pixels flipped, so the two mirrors cancel on the light and compose on the shape.
   */
  readonly clips?: Readonly<Record<string, { readonly right: number; readonly left: number }>>
  readonly player?: Placement['player']
  readonly approach?: Placement['approach']
  readonly climber?: Placement['climber']
  readonly runs?: Placement['runs']
  readonly rides?: Placement['rides']
}

/**
 * The climb, with every grammar name already resolved to a layer index.
 *
 * The runtime never looks a grammar up by name. It is handed indices into `Stage.layers` and
 * stamps them, which is the same contract every other subject on the page has: the browser is
 * a consumer of pre-rendered indexed bytes and has never heard of a grammar.
 */
/** The runner, with every grammar name already resolved to a layer index. */
export type StageRunner = Omit<Runner, 'stones' | 'reaper' | 'drift'> & {
  readonly stones: readonly number[]
  /** Absent when the game has no chaser: a collision is then the consequence on its own. */
  readonly reaper: (Omit<NonNullable<Runner['reaper']>, 'grammar' | 'tunables'> & { readonly layer: number }) | null
  /** The drifting bands, each with its puff grammars resolved to layer indices. */
  readonly drift: readonly (Omit<NonNullable<Runner['drift']>[number], 'puffs'> & { readonly puffs: readonly number[] })[]
}

/** The descent, with every grammar name already resolved to a layer index. */
export type StageDescent = Omit<Descent, 'stones' | 'ridge' | 'clouds'> & {
  /**
   * **Per variant, one layer per scale band** — `stones[v][s]` matches `scales[s]`. Each band
   * is a full render at its own `body.scale`, so a distant snowman is a small crisp drawing
   * and never a resampled big one. Collision heights read from band 0, the full size.
   */
  readonly stones: readonly (readonly number[])[]
  readonly ridge: (Omit<NonNullable<Descent['ridge']>, 'puffs'> & { readonly puffs: readonly number[] }) | null
  readonly clouds: (Omit<NonNullable<Descent['clouds']>, 'grammar' | 'tunables'> & { readonly layer: number }) | null
}

export type StageClimb = Omit<Climb, 'perches'> & {
  /** Layer index per platform variant, in the order the scene declared them. */
  readonly perches: readonly number[]
  /**
   * The world row the run starts on — the garden floor. Every altitude in the game is measured
   * from here, so the score is a distance rather than a coordinate.
   */
  readonly startRow: number
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
  /** Stars, painted once into the backdrop. Nothing in a fixed sky moves. */
  readonly stars: Scene['stars'] | null
  /** Grain scattered over the floor. Regolith is dust, and dust is not a flat fill. */
  readonly dust: Scene['dust'] | null
  readonly rain: {
    readonly colors: readonly RGB[]
    readonly spacing: number
    readonly length: number
    readonly slant: number
    readonly speed: number
    readonly seed: number
  } | null
  readonly layers: readonly Layer[]
  /** Present on a climbing scene, null on every other kind. */
  readonly climb: StageClimb | null
  /** Present on an endless runner, null on every other kind. */
  readonly runner: StageRunner | null
  /** Present on a down-slope game, null on every other kind. */
  readonly descent: StageDescent | null
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
function layerOf(
  spec: { grammar: string; tunables: string; scale?: number; msPerFrame?: number; seed?: number },
  id: string,
  sky: RGB,
  recede: number,
  flipLight: boolean,
): { layer: Layer; foot: number; origin: { x: number; y: number } } {
  const run = execute({ grammar: spec.grammar, tunables: spec.tunables, seed: spec.seed ?? 1 })
  /**
   * **An override that restates the tunables' own value is not an override.**
   *
   * A caller that resolves `body.scale` up front — which every caller now does, so that one
   * subject's clips cannot disagree about how big it is — hands this function a number that is
   * usually the file's own. Setting it anyway forced a second `execute` for an identical result.
   * Compared rather than assumed, so the second render happens only when something differs.
   */
  const overrides: Record<string, number> = {}
  if (spec.scale !== undefined && spec.scale !== run.params.body.scale) overrides['body.scale'] = spec.scale
  if (spec.msPerFrame !== undefined && spec.msPerFrame !== run.params.playback.msPerFrame) {
    overrides['playback.msPerFrame'] = spec.msPerFrame
  }
  const lit = flipLight
    ? execute({
        grammar: spec.grammar, tunables: spec.tunables, seed: spec.seed ?? 1,
        overrides: { ...overrides, 'light.x': -run.params.light.x, 'fill.x': -run.params.fill.x },
      })
    : Object.keys(overrides).length === 0
      ? run
      : execute({ grammar: spec.grammar, tunables: spec.tunables, seed: spec.seed ?? 1, overrides })

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
    layer: {
      id, w, h, ox, oy: b.y0 - originY, footOff: b.y1 + 1 - originY, scale: lit.params.body.scale,
      frames: n, msPerFrame: lit.params.playback.msPerFrame, palette, indices,
    },
    foot: b.y1 + 1,
    origin: { x: originX, y: originY },
  }
}

export function toStage(scene: Scene): Stage {
  const layers: Layer[] = []
  const placed: (Placed & { readonly order: number })[] = []

  /**
   * **One render per distinct (grammar, tunables, haze, facing), shared by everyone who wants
   * it.** Two photographers entering from two edges are two behaviours over one set of
   * sprites, and rendering the body twice would double the largest cost on the page for a
   * picture nobody could tell apart.
   */
  const cache = new Map<string, { layer: number; foot: number; origin: { x: number; y: number } }>()
  const build = (
    spec: { grammar: string; tunables: string; scale?: number; msPerFrame?: number; seed?: number },
    recede: number,
    flip: boolean,
  ): { layer: number; foot: number; origin: { x: number; y: number } } => {
    // **The key is also the id.** A shared layer must not claim to belong to the first
    // placement that happened to ask for it — two photographers on one set of sprites is the
    // case, and a layer named after one of them is a layer that lies about the other.
    const key = `${spec.grammar}@${spec.tunables}${spec.scale === undefined ? '' : `×${spec.scale}`}` +
      `${spec.msPerFrame === undefined ? '' : `/${spec.msPerFrame}ms`}${spec.seed === undefined || spec.seed === 1 ? '' : `#${spec.seed}`}` +
      `${recede === 0 ? '' : `~${recede.toFixed(3)}`}${flip ? ':left' : ''}`
    const hit = cache.get(key)
    if (hit !== undefined) return hit
    const made = layerOf(spec, key, scene.sky, recede, flip)
    const entry = { layer: layers.push(made.layer) - 1, foot: made.foot, origin: made.origin }
    cache.set(key, entry)
    return entry
  }

  for (const [i, p] of scene.placements.entries()) {
    const recede = p.sky === true ? 0 : hazeAt(scene, p.depth ?? 0)

    /**
     * **Every clip of one subject renders at one scale, and the subject decides which.**
     *
     * `gorilla-attack` was authored at `body.scale` 0.88 so it would sit on a sheet beside the
     * jump; `gorilla` and `gorilla-idle` are at 1. Nothing noticed until the three became one
     * character, and then the animal visibly shrank every time it swung. A clip's tunables own
     * its lighting and its timing; **they do not get to own how big the body is**, because
     * that is a fact about the subject and not about the action.
     *
     * **It is resolved HERE, above the main build, and that placement is the whole of his
     * fourth item.** It used to be resolved below: the main layer was built from the placement
     * with `scale` left undefined, and the clips were built with the same number written out.
     * `cat-fall@cat` and `cat-fall@cat×1` are two cache keys for one picture, so every subject
     * with clips was rendered, stored, shipped and decoded **twice** — the moon, the forest and
     * the climb all carried it. *"Em jogos mais robustos vai custar caro esse desperdício."*
     *
     * The lesson is about the cache rather than about the scale: **a key built from an
     * unresolved field is a key that varies with how the caller spelled the request.** Resolve
     * first, key second.
     */
    const scale = p.scale ?? loadParams(p.tunables).body.scale
    const main = build({ ...p, scale }, recede, false)

    // Depth gives the contact row and nothing here adjusts it. `anchor` is passed through so
    // the draw applies it against whichever clip is on screen — resolving it once, against the
    // main clip, is what put the prone photographer 21 px in the air.
    const row = p.sky === true ? (p.y ?? 0) : standRow(scene, p.depth ?? 0)

    let clips: Placed['clips']
    if (p.clips !== undefined) {
      const built: Record<string, { right: number; left: number }> = {}
      for (const [name, spec] of Object.entries(p.clips)) {
        // The placement's own frame rate reaches its clips too. Without it the main layer and
        // the clips of one subject could run at two speeds, which is the same class of
        // disagreement the scale had.
        const sized = { ...spec, scale, ...(p.msPerFrame === undefined ? {} : { msPerFrame: p.msPerFrame }) }
        built[name] = { right: build(sized, recede, false).layer, left: build(sized, recede, true).layer }
      }
      clips = built
    }

    placed.push({
      layer: main.layer,
      x: p.x,
      y: row,
      anchor: p.anchor ?? 'origin',
      scale,
      phase: p.phase ?? 0,
      ...(p.motion === undefined ? {} : { motion: p.motion }),
      ...(clips === undefined ? {} : { clips }),
      ...(p.player === undefined ? {} : { player: p.player }),
      ...(p.approach === undefined ? {} : { approach: p.approach }),
      ...(p.climber === undefined ? {} : { climber: p.climber }),
      ...(p.runs === undefined ? {} : { runs: p.runs }),
      ...(p.rides === undefined ? {} : { rides: p.rides }),
      order: paintOrder(p, i),
    })
  }
  placed.sort((a, b) => a.order - b.order)

  /**
   * **The platform variants, rendered once each and stamped for ever after.**
   *
   * A tower is unbounded and the sprites in it are four. They go through exactly the same
   * `build` as every other subject — same crop, same palette, same cache — and the only thing
   * that makes them platforms is that nothing puts them in `placed`: the runtime decides where
   * they are, from a band index and a hash, on every frame.
   */
  let runner: StageRunner | null = null
  if (scene.runner !== undefined) {
    const { stones, reaper, drift, ...rest } = scene.runner
    runner = {
      ...rest,
      stones: stones.map((o) => build({ grammar: o.grammar, tunables: o.tunables }, 0, false).layer),
      reaper:
        reaper === undefined
          ? null
          : {
              creep: reaper.creep, hit: reaper.hit, relief: reaper.relief, fromX: reaper.fromX,
              layer: build({ grammar: reaper.grammar, tunables: reaper.tunables }, 0, false).layer,
            },
      // The drift bands go through the same build as everything else — same crop, same cache.
      // A `scale` here is how a far band gets small clouds without a second grammar.
      drift: (drift ?? []).map((band) => ({
        ...band,
        puffs: band.puffs.map((p) => build(p, 0, false).layer),
      })),
    }
  }

  let descent: StageDescent | null = null
  if (scene.descent !== undefined) {
    const { stones, ridge, clouds, ...rest } = scene.descent
    descent = {
      ...rest,
      stones: stones.map((o) =>
        rest.scales.map((s) =>
          build({
            grammar: o.grammar,
            tunables: s <= (rest.farBelow ?? 0) && rest.farTunables !== undefined ? rest.farTunables : o.tunables,
            ...(s === 1 ? {} : { scale: s }),
          }, 0, false).layer,
        ),
      ),
      ridge:
        ridge === undefined
          ? null
          : { spacing: ridge.spacing, jitterX: ridge.jitterX, row: ridge.row, seed: ridge.seed,
              puffs: ridge.puffs.map((p) => build(p, 0, false).layer) },
      clouds:
        clouds === undefined
          ? null
          : { count: clouds.count, minY: clouds.minY, maxY: clouds.maxY, seed: clouds.seed,
              layer: build({ grammar: clouds.grammar, tunables: clouds.tunables }, 0, false).layer },
    }
  }

  let climb: StageClimb | null = null
  if (scene.climb !== undefined) {
    const c = scene.climb
    const climberAt = scene.placements.find((p) => p.climber !== undefined)
    if (climberAt === undefined) {
      throw new Error(`scene "${scene.name}" declares a climb with no climber in it`)
    }
    const { perches, ...rest } = c
    climb = {
      ...rest,
      perches: perches.map((p) => build({ grammar: p.grammar, tunables: p.tunables }, 0, false).layer),
      startRow: standRow(scene, climberAt.depth ?? 0),
    }
  }

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
  /**
   * **The floor has its own value gradient, and haze rides on top of it.**
   *
   * It used to be one tone hazed by depth, which works in a forest and produced **a flat black
   * plane on the moon** — because the moon has no air, `haze` is zero, and zero times anything
   * is the same colour on every row. His reading: *"esse solo lunar não está bem representado.
   * Me parece apenas um chão preto com pedras."*
   *
   * The ramp is walked by depth first, so a floor recedes even when nothing dilutes it. That
   * is also the truer picture in a forest: ground close to the eye is in its own shadow and
   * ground further off catches more sky. **Haze was doing two jobs and only one of them was
   * about air.**
   */
  const floor: RGB[] = []
  const last = scene.groundRamp.length - 1
  for (let y = scene.ground; y < scene.h; y++) {
    const d = floorDepth(scene, y)
    const u = d * last
    const lo = scene.groundRamp[Math.min(last, Math.floor(u))] as RGB
    const hi = scene.groundRamp[Math.min(last, Math.ceil(u))] as RGB
    const f = u - Math.floor(u)
    const tone: RGB = [
      Math.round(lo[0] + (hi[0] - lo[0]) * f),
      Math.round(lo[1] + (hi[1] - lo[1]) * f),
      Math.round(lo[2] + (hi[2] - lo[2]) * f),
    ]
    floor.push(haze(tone, scene.sky, scene.haze * d))
  }

  const seen = new Set<string>()
  for (const l of layers) for (let i = 1; i < l.palette.length; i++) seen.add(String(l.palette[i]))

  return {
    name: scene.name, w: scene.w, h: scene.h, scale: scene.scale, ground: scene.ground,
    sky: scene.sky, groundRamp: scene.groundRamp, stars: scene.stars ?? null, dust: scene.dust ?? null, rain, floor,
    layers, climb, runner, descent, placed: placed.map(({ order, ...rest }) => rest), colours: seen.size,
  }
}
