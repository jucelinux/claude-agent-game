/**
 * **A scene: many sprites in one world, on one clock, in one palette.**
 *
 * This is the first thing in the project that is not a sprite, and it exists because a loop
 * on a page cannot answer the question it raises. A sprite shown alone is judged against
 * itself. A sprite standing next to six others is judged against **them** — do these belong
 * in the same game? — and that axis has been declared in `TASTE.md` §1b since 14/08 under
 * the name *sheet cohesion* and has never once been tested.
 *
 * Three things the composition forces into the open, none of which a strip can:
 *
 * 1. **One palette or none.** Every grammar carries its own, and index 3 in the gorilla is
 *    not index 3 in the tree. Compositing in index space means merging them, and the merged
 *    count is a cohesion measurement that needs no opinion: a set that shares colours is a
 *    set, and a set that shares none is a collection.
 * 2. **Relative size is a decision nobody had made.** Each subject was authored to fill its
 *    own 64 px cell, so at their rendered sizes a beetle and a gorilla are the same animal.
 *    A placement carries a scale, and choosing it is the first time these subjects have had
 *    to agree about how big they are.
 * 3. **One clock, many cycles.** A 600 ms walk and a 1200 ms wind have to finish together or
 *    the scene stutters at its loop point. Each subject plays a whole number of its own
 *    cycles inside the scene's, which is the same rule the viewer already applies to a row
 *    of cells and the reason it says a cell may own a rate but never a clock.
 *
 * portable — all three. Any agent composing generated art into a world meets exactly these.
 */
import type { Grammar, IndexedBuffer, Palette, RGB } from '../core/types.ts'
import type { Frame } from '../core/render.ts'
import type { RunSpec } from '../io/load.ts'
import { execute } from '../io/load.ts'

export type Placement = {
  readonly grammar: string
  readonly tunables: string
  /** Where this subject's own origin lands in the scene. */
  readonly x: number
  /** Only for a `sky` subject, which has no contact row: places the origin outright. */
  readonly y?: number
  /** Overrides `body.scale`, so subjects can agree about how big they are. */
  readonly scale?: number
  /** Overrides the subject's own frame duration, to make its cycle divide the scene's. */
  readonly msPerFrame?: number
  /**
   * **Distance, and it is the only statement of it: 0 at the camera, 1 at the horizon.**
   *
   * The row this subject stands on, how much haze it carries and where it falls in the paint
   * order are all *derived* from this one number. That is the correction his fourth reading
   * asked for, and it is a correction to the engine rather than to the scene.
   *
   * **What it replaces and why.** Distance used to be stated twice — `recede` for the haze
   * and `baseY` for the row — with nothing tying them together. Two independent fields for
   * one fact means the two can disagree, and they did: trees drawn behind the gorilla with
   * their bases below his feet, which is a picture saying "further away" and "nearer" about
   * the same object. **The fix is not to check for the contradiction. It is to remove the
   * ability to express it.**
   */
  readonly depth?: number
  /**
   * How the sprite meets the row its depth puts it on.
   *
   * - `origin` — the sprite's own origin lands there. Right when the author put the origin at
   *   the ground contact, which is every tree. Exact, and it measures nothing.
   * - `foot` — the lowest painted pixel lands there. Right when the origin is somewhere else:
   *   the gorilla's is his hips.
   *
   * The distinction cost two readings on its own. `foot` on a tree lifts the trunk base by
   * however much its roots paint below it; `origin` on the gorilla buries him to the waist.
   */
  readonly anchor?: 'origin' | 'foot'
  /**
   * **Above the world rather than in it.** No floor, no ground haze, drawn before everything.
   *
   * A cloud is the case. It has no contact row, so `y` places it directly, and hazing it with
   * the *forest's* haze would be wrong twice over — thirty kilometres of air is not fifty
   * metres of trees, and a cloud is not behind the canopy because it is far, it is behind it
   * because it is sky.
   */
  readonly sky?: boolean
  /** Offset into its own cycle, 0..1, so two of the same subject are not in lockstep. */
  readonly phase?: number
  readonly seed?: number
  /**
   * **Continuous motion, in seconds rather than in frames.** For a subject with no floor,
   * which so far means a cloud.
   *
   * It replaces `drift`, and the reason is his third reading: *"vamos deixar o movimento da
   * nuvem mais natural, cadenciado e fluído"*. `drift` was a fraction of the **scene's
   * frame loop**, so a cloud could only return to its start by crossing the entire scene in
   * one cycle — 320 px in 1200 ms, which is seamless and reads as a jet. Anything slower
   * jumped at the loop point.
   *
   * The frame loop was the whole problem. A pre-rendered frame list has no elapsed time, so
   * every motion in it had to be periodic in 24 frames. `speed` is scene pixels per
   * **second**, evaluated live, and it wraps a full sprite width off each edge — so there is
   * no loop point to be seamless at.
   *
   * `swayX`, `bobY` and `period` are the cadence: the cloud gains and loses a little speed
   * and rises and falls, on its own period. Two clouds with different periods never pulse
   * together, which is what stops a sky of three from reading as one object with three
   * parts.
   */
  readonly motion?: {
    /** Scene pixels per second, positive to the right. */
    readonly speed: number
    /** Sideways cadence amplitude, in pixels. It is what makes the speed vary. */
    readonly swayX: number
    /** Vertical cadence amplitude, in pixels. */
    readonly bobY: number
    /** Seconds in one cadence. */
    readonly period: number
    /** Offset into the cadence, 0..1. */
    readonly at: number
  }
  /**
   * **The clips a subject can play.** Named animations over one body — the gorilla's idle,
   * walk and attack; the photographer's walk, prone and run.
   *
   * Each clip is a separate grammar sharing the same skeleton and parts, which is the shape
   * run 7 established and the reason an action costs a gait rather than a redrawing. The
   * runtime holds a *state*, and the state names a clip; nothing about which animation plays
   * lives in the sprites.
   */
  readonly clips?: Readonly<Record<string, { readonly grammar: string; readonly tunables: string }>>
  /**
   * **Driven by the keyboard**, and the first thing in this project a person can change while
   * it is running.
   *
   * It forces the runtime to stop being a frame player: input, state and draw happen per
   * animation frame, and the scene can no longer be a list of pre-composited pictures. The
   * sprites stay pre-rendered — a walk cycle is still a pure function of its grammar — and
   * what moved into the browser is only the *composition*, which is exactly the split
   * `HARNESS.md` §2.1 already requires between a deterministic core and its consumers.
   *
   * **Facing costs a second render, not a flip.** Mirroring a sprite mirrors its lighting, so
   * a body lit from the upper left becomes a body lit from the upper right and the whole wood
   * disagrees with it. The subject is rendered again with the lamp mirrored and then flipped,
   * which puts the light back where the scene keeps it. Cheap here and impossible for a
   * painted sprite sheet, so it is one of the few places where generating the art is
   * straightforwardly better than drawing it.
   */
  readonly player?: {
    /** Scene pixels per second. */
    readonly speed: number
    readonly minX: number
    readonly maxX: number
    readonly idle: string
    readonly walk: string
    readonly attack?: string
    /** How far in front of him the blow reaches, in scene pixels. */
    readonly reach?: number
    /** Where in the attack clip the blow lands, 0..1. Anticipation is longer than impact. */
    readonly hitAt?: number
    /**
     * **Walking in eight directions instead of two**, which is the gap named on 15/08 and the
     * half of his commission of 16/08 that the engine could not reach.
     *
     * When present, the player also moves along the depth axis: `minRow` and `maxRow` bound
     * which contact rows he may stand on, and his **paint order follows him** — walk toward
     * the camera and you pass in front of a boulder you were behind. That is the y-sort every
     * overhead game has, arriving because a commission asked for it.
     *
     * `clip` names the clip prefix; the runtime appends the compass point, so `lope` reaches
     * `lope-e`, `lope-ne`, `lope-n` and their mirrors.
     */
    readonly roam?: {
      readonly minRow: number
      readonly maxRow: number
      /** Rows per second along the depth axis. Lower than `speed`: the floor is foreshortened. */
      readonly depthSpeed: number
    }
    /**
     * **A jump, and it is the first vertical motion in this engine.**
     *
     * `gravity` is scene pixels per second squared and `impulse` is the upward speed a press
     * buys. On the moon that ratio is the whole subject: a sixth of a g means a hang of well
     * over a second, and getting it wrong is what makes lunar gravity look like a trampoline.
     *
     * A jumping body lifts off its contact row and **its shadow does not**. That shadow is the
     * only thing telling a player where he will land, and without it a jump in an overhead
     * view is unreadable.
     */
    readonly jump?: {
      readonly clip: string
      readonly gravity: number
      readonly impulse: number
    }
  }
  /**
   * **A subject that walks in from an edge, settles at a distance from the player, and runs
   * home when it is struck.** The photographer, and it is named for the behaviour rather than
   * for the character.
   *
   * **It is deliberately not a framework.** `CLAUDE.md` §5 says harvest generality, never
   * design it: this is the first non-player behaviour in the project, and a behaviour tree
   * written for a sample of one is the judge built before the artifact all over again. When
   * there is a second, whatever the two share becomes the mechanism and this becomes one of
   * its cases.
   */
  readonly approach?: {
    readonly walk: string
    readonly prone: string
    readonly flee: string
    /** The edge it comes from and returns to. */
    readonly from: 'left' | 'right'
    readonly walkSpeed: number
    readonly fleeSpeed: number
    /** Scene pixels from the player it settles at. */
    readonly standoff: number
    /** Seconds before its first entrance, and between one exit and the next entrance. */
    readonly delay: number
    readonly period: number
    /** Seconds between shutter flashes once it is prone. */
    readonly shutter: number
  }
}

export type Scene = {
  readonly name: string
  readonly w: number
  readonly h: number
  /** Frames in the scene's own loop. */
  readonly frames: number
  readonly msPerFrame: number
  readonly scale: number
  /**
   * **The floor, as a plane rather than a line.** `ground` is the row a subject at depth 1
   * stands on and where the floor starts painting; `nearRow` is the row a subject at depth 0
   * stands on. Everything between is the floor receding away from the camera.
   *
   * The scene used to declare only `ground` and leave the rest of the band undifferentiated,
   * which is why depth was not readable in it: rows 128 to 176 were one flat colour, so
   * nothing told the eye that lower meant nearer. It does now, by the same haze the subjects
   * carry — one rule for the floor and the things standing on it.
   */
  readonly ground: number
  readonly nearRow: number
  /** How far a subject at depth 1 is pulled toward the sky's colour. */
  readonly haze: number
  readonly sky: RGB
  /**
   * **Stars, and they are a backdrop rather than a field.**
   *
   * A field is evaluated per pixel per frame because it *moves*. Stars do not: the moon is
   * tidally locked and its sky is fixed, so they are painted once into the backdrop from an
   * integer hash. Two colours and a count, which is the whole of a night sky at this scale.
   */
  readonly stars?: { readonly count: number; readonly colors: readonly RGB[]; readonly seed: number; readonly below: number }
  /**
   * **Dust on the floor, and it is a backdrop rather than a field**, for the same reason the
   * stars are: it does not move.
   *
   * Regolith is powder churned by four billion years of impacts. Painted as a flat fill it
   * reads as a floor tile, and no amount of value gradient fixes that — *"me parece apenas um
   * chão preto com pedras"*. A scattering of single pixels in two tones is the whole of it,
   * and it is the cheapest texture this engine can express.
   */
  readonly dust?: { readonly count: number; readonly colors: readonly RGB[]; readonly seed: number }
  /** Dark to light, walked by depth. The lightest is the far edge of the floor. */
  readonly groundRamp: readonly RGB[]
  readonly placements: readonly Placement[]
  /**
   * **Fields: weather, and the first thing here that is not a body.**
   *
   * A grammar is bones and parts, so two hundred raindrops would be two hundred parts. Rain,
   * snow, sparks, embers and smoke are none of them bodies — they are **functions of
   * position and time**, evaluated per pixel, owning no skeleton and attached to nothing.
   * That makes them scene-level by nature: a body belongs to a creature, and weather belongs
   * to the world.
   *
   * Closed form and seeded by an integer hash, so a field is as deterministic as everything
   * else here and loops exactly when its speed completes a whole number of passes.
   */
  readonly fields?: readonly Field[]
}

export type Field =
  /**
   * Rain. Drops fall in columns spaced `spacing` apart, each column offset by a hash of its
   * index so the sheet never marches in step. A drop is a short streak, slanted by `slant`
   * pixels of drift per pixel of fall — which is what makes rain read as weather rather than
   * as a scan line.
   */
  | {
      readonly kind: 'rain'
      /** Palette entries, dark to light. A near drop is lighter than a far one. */
      readonly colors: readonly RGB[]
      readonly spacing: number
      readonly length: number
      readonly slant: number
      /** Whole passes down the screen per scene cycle. An integer, or the loop jumps. */
      readonly passes: number
      readonly seed: number
    }

export type Composed = {
  readonly scene: Scene
  readonly palette: Palette
  readonly buffers: readonly IndexedBuffer[]
  /** What the merge cost, which is the cohesion reading. */
  readonly cohesion: {
    readonly totalColours: number
    readonly perSubject: readonly { readonly name: string; readonly colours: number; readonly shared: number }[]
  }
}

/**
 * **Everything about distance, derived from one number, in one place.**
 *
 * Both consumers — this compositor and `layers.ts` — call these rather than each doing the
 * arithmetic. Two implementations of a rule is two rules eventually.
 */
export const standRow = (s: Scene, depth: number): number =>
  Math.round(s.nearRow - (s.nearRow - s.ground) * depth)

/**
 * **Haze, quantised to four bands.**
 *
 * Every distinct haze value is a distinct copy of a subject's whole palette — 25 entries for
 * a tree — so a haze that varies continuously with depth spends the 256 indices on air. Seven
 * depth planes cost 171 colours before this; four bands cost about a hundred.
 *
 * The cost is declared rather than hidden: two planes that share a haze band are separated by
 * their **row** alone, which is exactly what separates two trees standing side by side in any
 * case. It is the same trade the floor makes with its eight steps, and the same one indexed
 * colour has made everywhere in this project since round zero.
 */
const HAZE_STEPS = 4
export const hazeAt = (s: Scene, depth: number): number =>
  (s.haze * Math.round(depth * HAZE_STEPS)) / HAZE_STEPS

/**
 * Where a subject falls in the paint order. Sky first, then far to near.
 *
 * `depth` is the whole of it, which is the point: when the row and the haze are both derived
 * from the same number, the order cannot disagree with either.
 */
export const paintOrder = (p: Placement, i: number): number =>
  (p.sky === true ? -1 : 1 - (p.depth ?? 0)) * 1000 + i * 0.001

/** How far the floor at row `y` has receded. 1 at the horizon, 0 at the near edge. */
export const floorDepth = (s: Scene, y: number): number =>
  Math.max(0, Math.min(1, (s.nearRow - y) / Math.max(1, s.nearRow - s.ground)))

const key = (c: RGB): string => `${c[0]},${c[1]},${c[2]}`

/** One lerp toward the sky. Haze does not change a colour's hue relationships, it dilutes them. */
const haze = (c: RGB, sky: RGB, k: number): RGB => [
  Math.round(c[0] + (sky[0] - c[0]) * k),
  Math.round(c[1] + (sky[1] - c[1]) * k),
  Math.round(c[2] + (sky[2] - c[2]) * k),
]

/**
 * **Merge every subject's palette into one, and count what that cost.**
 *
 * Exact-match dedupe only. Nothing here quietly nudges two nearly-equal colours together:
 * that would manufacture the cohesion the reading exists to measure, which is the shape of
 * instrument defect `HARNESS.md` §5 warns about — the flattering kind.
 *
 * A subject's `recede` is part of its key, so two trees in the same haze band share every
 * entry and two in different bands share none. The reading therefore reports the true price
 * of depth rather than hiding it.
 */
function mergePalettes(
  runs: readonly { readonly name: string; readonly grammar: Grammar; readonly recede: number }[],
  sky: RGB,
): { palette: RGB[]; maps: Map<string, Uint8Array>; cohesion: Composed['cohesion'] } {
  const palette: RGB[] = [[0, 0, 0]]
  const seen = new Map<string, number>()
  const maps = new Map<string, Uint8Array>()
  const perSubject: { name: string; colours: number; shared: number }[] = []

  for (const run of runs) {
    const colours = run.grammar.palette.colors
    const map = new Uint8Array(Math.max(256, colours.length))
    let own = 0
    let shared = 0
    for (let i = 1; i < colours.length; i++) {
      const c = run.recede === 0 ? (colours[i] as RGB) : haze(colours[i] as RGB, sky, run.recede)
      const k = `${key(c)}@${run.recede}`
      const already = seen.get(k)
      if (already === undefined) {
        palette.push(c)
        seen.set(k, palette.length - 1)
        map[i] = palette.length - 1
        own++
      } else {
        map[i] = already
        shared++
      }
    }
    maps.set(run.name, map)
    perSubject.push({ name: run.name, colours: own, shared })
  }
  return { palette, maps, cohesion: { totalColours: palette.length, perSubject } }
}

export function compose(scene: Scene): Composed {
  const runs = scene.placements.map((p, i) => {
    const spec: RunSpec = {
      grammar: p.grammar,
      tunables: p.tunables,
      seed: p.seed ?? 1,
      ...(p.scale === undefined && p.msPerFrame === undefined
        ? {}
        : {
            overrides: {
              ...(p.scale === undefined ? {} : { 'body.scale': p.scale }),
              ...(p.msPerFrame === undefined ? {} : { 'playback.msPerFrame': p.msPerFrame }),
            },
          }),
    }
    const result = execute(spec)
    // The lowest painted row across the whole cycle, so a subject whose feet move keeps
    // the same floor: measured once, from the art, rather than declared by hand.
    let footOffset = 0
    for (const frame of result.frames) {
      const { w, h, data } = frame.buf
      for (let y = h - 1; y >= 0; y--) {
        let any = false
        for (let x = 0; x < w; x++) if (data[y * w + x] !== 0) { any = true; break }
        if (any) { if (y + 1 > footOffset) footOffset = y + 1; break }
      }
    }
    return {
      name: `${p.grammar}#${i}`, grammar: result.grammar, result, placement: p, footOffset,
      recede: p.sky === true ? 0 : hazeAt(scene, p.depth ?? 0),
    }
  })

  const { palette, maps, cohesion } = mergePalettes(runs, scene.sky)

  // The ground and sky enter the same palette as everything else. A scene whose backdrop
  // lives outside the locked palette is a scene that cannot be exported as one image.
  const skyIndex = palette.length
  palette.push(scene.sky)
  /**
   * **The floor recedes, by the same haze its trees carry.** One lit strip at the horizon,
   * then the floor's own dark tone pulled toward the sky in proportion to how far away that
   * row is. Quantised to eight steps, because every distinct tone is a palette entry and a
   * smooth gradient would spend a third of the 256 on ground nobody looks at.
   */
  const FLOOR_STEPS = 8
  const floorBase = palette.length
  const lastTone = scene.groundRamp.length - 1
  for (let k = 0; k <= FLOOR_STEPS; k++) {
    const d = k / FLOOR_STEPS
    const u = d * lastTone
    const lo = scene.groundRamp[Math.min(lastTone, Math.floor(u))] as RGB
    const hi = scene.groundRamp[Math.min(lastTone, Math.ceil(u))] as RGB
    const f = u - Math.floor(u)
    palette.push(haze([
      Math.round(lo[0] + (hi[0] - lo[0]) * f),
      Math.round(lo[1] + (hi[1] - lo[1]) * f),
      Math.round(lo[2] + (hi[2] - lo[2]) * f),
    ], scene.sky, scene.haze * d))
  }
  const floorIndex = (y: number): number =>
    floorBase + Math.round(floorDepth(scene, y) * FLOOR_STEPS)

  // Fields paint after the ground and before the subjects, so weather sits behind what it
  // falls on. A layer in front would need depth it does not have.
  const fieldBase = palette.length
  for (const f of scene.fields ?? []) for (const c of f.colors) palette.push(c)

  const total = scene.w * scene.h
  const buffers: IndexedBuffer[] = []
  const sceneMs = scene.frames * scene.msPerFrame

  for (let f = 0; f < scene.frames; f++) {
    const data = new Uint8Array(total)
    data.fill(skyIndex)
    // The ground: the lightest tone is a one-pixel lit strip along the top edge, and the
    // rest steps down. Three tones is enough for a flat plane and more would compete with
    // the subjects standing on it.
    for (let y = scene.ground; y < scene.h; y++) {
      data.fill(floorIndex(y), y * scene.w, (y + 1) * scene.w)
    }

    const sceneT = f / scene.frames

    // **The fields.** Evaluated per pixel, closed form in (x, y, t): no particle is stored
    // and none needs to be, which is the whole point of a field over a body.
    let fieldAt = fieldBase
    for (const field of scene.fields ?? []) {
      if (field.kind === 'rain') {
        const cols = Math.ceil(scene.w / field.spacing) + 2
        for (let c = 0; c < cols; c++) {
          // An integer hash, so the sheet is irregular and identical on every run.
          // The trailing >>> 0 is load-bearing. XOR yields a SIGNED 32-bit integer in JS, so
          // without it `hsh` goes negative and `hsh % colors.length` returns -1 — which wrote
          // the palette entry BEFORE the rain's, silently, for about half the columns. Found
          // by the micro runtime's headless lock, not by looking: the wrong colour is a
          // plausible grey and the right one is a plausible grey.
          let hsh = ((c + field.seed) * 2654435761) >>> 0
          hsh = (hsh ^ (hsh >>> 13)) >>> 0
          const phase = (hsh % 1024) / 1024
          const tone = hsh % field.colors.length
          const x0 = c * field.spacing + (hsh % field.spacing)
          const fall = ((sceneT * field.passes + phase) % 1) * (scene.h + field.length * 2) - field.length
          for (let k = 0; k < field.length; k++) {
            const y = Math.round(fall + k)
            if (y < 0 || y >= scene.h) continue
            const x = Math.round(x0 + k * field.slant)
            if (x < 0 || x >= scene.w) continue
            data[y * scene.w + x] = fieldAt + tone
          }
        }
      }
      fieldAt += field.colors.length
    }
    // Back to front. **Haze outranks the foot row**, because haze is now the scene's
    // statement about distance and the foot row is only its consequence: two trees in the
    // same band are separated by where they stand, but a hazier tree is behind a clearer
    // one whatever their feet do. Stable, because ties fall back to placement order.
    const order = runs
      .map((r, i) => i)
      .sort((a, b) => paintOrder(runs[a]!.placement, a) - paintOrder(runs[b]!.placement, b))

    for (const i of order) {
      const run = runs[i]!
      const p = run.placement
      const own = run.result.frames.length
      const ownMs = own * run.result.params.playback.msPerFrame
      // A whole number of its own cycles inside the scene's, so the loop point is silent.
      const cycles = Math.max(1, Math.round(sceneMs / ownMs))
      const t = (sceneT * cycles + (p.phase ?? 0)) % 1
      const frame = run.result.frames[Math.floor(t * own) % own] as Frame
      const map = maps.get(run.name) as Uint8Array
      const { w: sw, h: sh, data: src } = frame.buf
      const ox = p.x - run.result.params.canvas.originX
      // `origin` is exact and measures nothing; `foot` measures the lowest painted pixel of
      // the frames actually being drawn. Which one is right depends on where the sprite's
      // author put its origin, and getting that wrong put five trees in the air, then one
      // below the gorilla, then a photographer lying down at standing height.
      const row = p.sky === true ? (p.y ?? 0) : standRow(scene, p.depth ?? 0)
      const oy = p.anchor === 'foot' ? row - run.footOffset : row - run.result.params.canvas.originY
      for (let sy = 0; sy < sh; sy++) {
        const dy = oy + sy
        if (dy < 0 || dy >= scene.h) continue
        for (let sx = 0; sx < sw; sx++) {
          const v = src[sy * sw + sx] as number
          if (v === 0) continue
          // The compositor is the frozen path now: continuous motion belongs to the live
          // runtime, which has elapsed time to move things with. A cloud stands still here.
          const dx = ox + sx
          if (dx < 0 || dx >= scene.w) continue
          data[dy * scene.w + dx] = map[v] as number
        }
      }
    }
    buffers.push({ w: scene.w, h: scene.h, data })
  }

  return { scene, palette: { name: scene.name, colors: palette, ramps: [] }, buffers, cohesion }
}
