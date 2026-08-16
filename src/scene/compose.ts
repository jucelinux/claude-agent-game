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
  /** Only used when `footY` is absent: aligns the subject's own origin to this row. */
  readonly y?: number
  /** Overrides `body.scale`, so subjects can agree about how big they are. */
  readonly scale?: number
  /** Overrides the subject's own frame duration, to make its cycle divide the scene's. */
  readonly msPerFrame?: number
  /**
   * Row the subject's lowest painted pixel lands on. **This is how a game places things and
   * `y` is not**: a sprite's origin is wherever its author put it — the hips on the gorilla,
   * the base of the trunk on the tree — so aligning origins puts nothing on the floor. With
   * a foot row the compositor measures each subject and does the arithmetic.
   */
  readonly footY?: number
  /** Offset into its own cycle, 0..1, so two of the same subject are not in lockstep. */
  readonly phase?: number
  readonly seed?: number
  /**
   * Screen pixels this subject travels sideways over one scene cycle, wrapping at the
   * edges. A cloud is a body that moves; it needed no new concept, only the admission that
   * a placement is a position **at a time** rather than a position.
   */
  readonly drift?: number
  /**
   * **Aerial perspective: how far toward the sky's colour this subject's whole palette is
   * pulled, 0 to 1.** Distance, expressed the way distance actually reaches an eye.
   *
   * It exists because of a defect he found in the first wood: *"tem árvores que nem estão
   * posicionadas no solo"*. He was right, and the cause was that I had faked depth by
   * **raising the far trees' feet above the ground line** — which does not read as far
   * away, it reads as floating, because a side-on scene has no receding floor to raise them
   * onto. Fake depth by position was the only tool available, so it got used past where it
   * works.
   *
   * Haze is the tool that actually exists in nature: air between the eye and a thing
   * scatters light, so a far thing loses contrast toward the colour of the sky rather than
   * changing shape. That is one lerp per palette entry, it needs no new geometry, and it
   * lets every tree stand on the same floor — which is where trees stand.
   *
   * **Declared cost, and it is paid in the cohesion reading.** A receded subject cannot
   * share palette entries with an un-receded one, so each distinct value of this field
   * multiplies the wood's 25 colours again. Two haze bands cost 50 extra entries out of
   * 256. That is why it is a small set of *bands* rather than a per-subject number: subjects
   * at the same distance share, and the reading stays honest about what depth cost.
   */
  readonly recede?: number
}

export type Scene = {
  readonly name: string
  readonly w: number
  readonly h: number
  /** Frames in the scene's own loop. */
  readonly frames: number
  readonly msPerFrame: number
  readonly scale: number
  /** Row where the ground starts. Everything below it is ground. */
  readonly ground: number
  readonly sky: RGB
  /** Dark to light, and the lightest is the lit strip at the very top of the ground. */
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
    return { name: `${p.grammar}#${i}`, grammar: result.grammar, result, placement: p, footOffset, recede: p.recede ?? 0 }
  })

  const { palette, maps, cohesion } = mergePalettes(runs, scene.sky)

  // The ground and sky enter the same palette as everything else. A scene whose backdrop
  // lives outside the locked palette is a scene that cannot be exported as one image.
  const skyIndex = palette.length
  palette.push(scene.sky)
  const groundBase = palette.length
  for (const c of scene.groundRamp) palette.push(c)

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
      const depth = y - scene.ground
      const step = depth === 0 ? scene.groundRamp.length - 1 : Math.max(0, scene.groundRamp.length - 2 - Math.floor(depth / 6))
      data.fill(groundBase + step, y * scene.w, (y + 1) * scene.w)
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
          let hsh = ((c + field.seed) * 2654435761) >>> 0
          hsh ^= hsh >>> 13
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
    const order = runs.map((r, i) => i).sort((a, b) => {
      const dr = runs[b]!.recede - runs[a]!.recede
      if (dr !== 0) return dr
      const ay = runs[a]!.placement.footY ?? runs[a]!.placement.y ?? 0
      const by = runs[b]!.placement.footY ?? runs[b]!.placement.y ?? 0
      const dy = ay - by
      return dy !== 0 ? dy : a - b
    })

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
      const wrap = p.drift === undefined ? 0 : Math.round(p.drift * sceneT)
      const ox = p.x + wrap - run.result.params.canvas.originX
      const oy = p.footY === undefined ? (p.y ?? 0) - run.result.params.canvas.originY : p.footY - run.footOffset
      for (let sy = 0; sy < sh; sy++) {
        const dy = oy + sy
        if (dy < 0 || dy >= scene.h) continue
        for (let sx = 0; sx < sw; sx++) {
          const v = src[sy * sw + sx] as number
          if (v === 0) continue
          // A drifting subject wraps rather than leaving: a cloud that sails off the right
          // has to arrive on the left, or the sky empties over one cycle.
          let dx = ox + sx
          if (p.drift !== undefined) dx = ((dx % scene.w) + scene.w) % scene.w
          if (dx < 0 || dx >= scene.w) continue
          data[dy * scene.w + dx] = map[v] as number
        }
      }
    }
    buffers.push({ w: scene.w, h: scene.h, data })
  }

  return { scene, palette: { name: scene.name, colors: palette, ramps: [] }, buffers, cohesion }
}
