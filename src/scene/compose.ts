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

/**
 * **Merge every subject's palette into one, and count what that cost.**
 *
 * Exact-match dedupe only. Nothing here quietly nudges two nearly-equal colours together:
 * that would manufacture the cohesion the reading exists to measure, which is the shape of
 * instrument defect `HARNESS.md` §5 warns about — the flattering kind.
 */
function mergePalettes(
  runs: readonly { readonly name: string; readonly grammar: Grammar }[],
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
      const c = colours[i] as RGB
      const k = key(c)
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
    return { name: `${p.grammar}#${i}`, grammar: result.grammar, result, placement: p, footOffset }
  })

  const { palette, maps, cohesion } = mergePalettes(runs)

  // The ground and sky enter the same palette as everything else. A scene whose backdrop
  // lives outside the locked palette is a scene that cannot be exported as one image.
  const skyIndex = palette.length
  palette.push(scene.sky)
  const groundBase = palette.length
  for (const c of scene.groundRamp) palette.push(c)

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
    // Back to front by where a subject's feet are: lower on screen is nearer the viewer.
    // Stable, because ties fall back to placement order.
    const order = runs.map((r, i) => i).sort((a, b) => {
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
      const ox = p.x - run.result.params.canvas.originX
      const oy = p.footY === undefined ? (p.y ?? 0) - run.result.params.canvas.originY : p.footY - run.footOffset
      for (let sy = 0; sy < sh; sy++) {
        const dy = oy + sy
        if (dy < 0 || dy >= scene.h) continue
        for (let sx = 0; sx < sw; sx++) {
          const v = src[sy * sw + sx] as number
          if (v === 0) continue
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
