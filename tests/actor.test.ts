import { describe, expect, it } from 'vitest'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { toStage } from '../src/scene/layers.ts'
import { execute, loadParams } from '../src/io/load.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { solve } from '../src/core/skeleton.ts'
import { evaluate } from '../src/core/gait.ts'
import { sprite } from '../src/core/render.ts'
import type { Grammar } from '../src/core/types.ts'

/**
 * **The three defects of his fifth reading, turned into instruments.**
 *
 * All three are engine defects rather than scene defects, which is the reason they are locked
 * here against *every* micro game rather than fixed in the forest: his standing rule is that a
 * fix in the engine is a fix for every game on the shelf.
 *
 * | his words | what was wrong |
 * |---|---|
 * | *"o fotógrafo não está deitando no chão"* | `anchor: 'foot'` was resolved once, against a subject's MAIN clip |
 * | *"as pernas estão invertidas"* | the prone knees folded 43° backwards |
 * | *"a lente se posiciona no rosto"* | the camera inherited the forearm's angle, and a forearm folded to the eye points back at the face |
 * | *"no ataque ele fica um pouco menor"* | `gorilla-attack` is authored at `body.scale` 0.88 and the other two clips at 1 |
 *
 * Two of them share a shape worth naming: **a fact about a subject was being read off one of
 * its clips.** Where the feet are and how big the body is belong to the character; only the
 * lighting and the timing belong to the action.
 */

describe('a subject is one body, whatever it is doing', () => {
  for (const game of MICRO_GAMES) {
    const stage = toStage(game.scene)

    it(`${game.id}: every clip of a subject renders at the same scale`, () => {
      // `gorilla-attack` is authored at `body.scale` 0.88 so it would sit on a sheet beside
      // the jump; the other two clips are at 1. Nothing noticed until the three became one
      // character, and then the animal shrank by a tenth every time it swung.
      //
      // **The check reads what the engine RESOLVED, not what a tunables file declares.** The
      // declarations still disagree and are allowed to — a clip's tunables own its lighting
      // and its timing. How big the body is belongs to the subject, and the engine overrides
      // it. A lock on the declaration would demand a fix in the wrong file.
      for (const p of stage.placed) {
        if (p.clips === undefined) continue
        for (const [name, pair] of Object.entries(p.clips)) {
          for (const side of ['right', 'left'] as const) {
            const layer = stage.layers[pair[side]]!
            expect(layer.scale, `clip "${name}" (${side}) rendered at ${layer.scale}, the subject at ${p.scale}`)
              .toBe(p.scale)
          }
        }
      }
    })

    it(`${game.id}: a foot-anchored subject meets the floor in every clip`, () => {
      // **The float.** A photographer standing has his feet 24 px below his pelvis and lying
      // down has them 5 px below it. Anchoring once, off the walk clip, drew him lying down
      // at standing height — 19 px in the air.
      for (const p of stage.placed) {
        if (p.anchor !== 'foot' || p.clips === undefined) continue
        for (const [name, pair] of Object.entries(p.clips)) {
          for (const side of ['right', 'left'] as const) {
            const layer = stage.layers[pair[side]]!
            // `rowOf` in the runtime: crop top = y + oy - footOff, so the bottom lands on y.
            const bottom = p.y + layer.oy - layer.footOff + layer.h
            expect(bottom, `${p.clips === undefined ? '' : name} (${side}) puts its lowest pixel on row ${bottom}, not ${p.y}`)
              .toBe(p.y)
          }
        }
      }
    })
  }
})

/**
 * Where the prone body's landmarks land, measured in bone space. The findings channel answers
 * questions about parts; this asks "is the lens in front of his face or on it" without
 * drawing anything, which is the only way I can ask it at all.
 */
function landmarks(): Record<string, { x: number; y: number }> {
  const g = grammarByName('photog-prone')
  const params = loadParams('photog')
  const world = solve(g.skeleton, evaluate(g.gait, params, 0.5), { x: 0, y: 0, z: 0, a: 0, sx: 1, sy: 1, sz: 1 })
  const at = (bone: string, lx: number, ly: number): { x: number; y: number } => {
    const w = world.get(bone)!
    const a = w.a * Math.PI * 2
    return { x: w.x + Math.cos(a) * lx - Math.sin(a) * ly, y: w.y + Math.sin(a) * lx + Math.cos(a) * ly }
  }
  return {
    head: at('head', 0, 0),
    boot: at('legNL', 1.5, 9.5),
    elbow: at('armNL', 0, 0),
    lens: at('cam', 5.8, 0),
    knee: { x: (world.get('legNL')!.a - world.get('legNU')!.a) * 360, y: (world.get('legFL')!.a - world.get('legFU')!.a) * 360 },
  }
}

/** Every grammar any micro game actually draws, with the tunables it draws it under. */
function drawn(): readonly (readonly [string, string])[] {
  const out = new Map<string, readonly [string, string]>()
  for (const game of MICRO_GAMES) {
    for (const p of game.scene.placements) {
      out.set(`${p.grammar}|${p.tunables}`, [p.grammar, p.tunables])
      for (const spec of Object.values(p.clips ?? {})) out.set(`${spec.grammar}|${spec.tunables}`, [spec.grammar, spec.tunables])
    }
  }
  return [...out.values()]
}

/**
 * **A body has no holes in it.**
 *
 * His reading of 16/08: *"e esse buraco nas costas do gorila?"* — and it was not a hole in the
 * usual sense. Nothing was transparent. It was the inner outline **ringing the silver saddle**,
 * and where a ragged marking's boundary folds back on itself the ring closes into a solid
 * patch. Ink deep inside a body reads as a gap whatever colour the gap technically is.
 *
 * **The measurement:** the largest connected mass of outline whose pixels sit three or more
 * pixels from any transparent one, over the whole cycle. A real inner line is a *ring* and
 * stays near an edge; a closed ring is a *disc* and does not.
 *
 * **Calibrated in both directions, which is the only way a threshold is worth anything
 * (`HARNESS.md` §5):**
 *
 * | sample | px |
 * |---|---|
 * | `gorilla-jump-chrono`, the idiom he ranked first | 83 |
 * | the gorilla with the saddle un-ringed — after the fix | 75–81 |
 * | **the gorilla with the saddle ringed — the defect he saw** | **101–111** |
 *
 * 90 sits between the worst healthy sample and the best sick one. The first draft of this
 * check used 12, taken from one frame of one pose, and it failed every subject in the project
 * including the one he ranked first — a threshold read off a single sample measures that
 * sample.
 *
 * A marking opts out with `Part.line = false`: a saddle, a blaze, a stripe. A region of a
 * surface rather than a solid, and grey hair does not have an edge drawn around it.
 */
const INTERIOR_INK_MAX = 90

function interiorInk(grammar: string, tunables: string): number {
  const run = execute({ grammar, tunables, seed: 1 })
  const g = grammarByName(grammar)
  const ramp = g.palette.ramps.find((r) => r.material === run.params.outline.material)
  if (ramp === undefined || !run.params.outline.enabled) return 0
  const ink = new Set<number>(ramp.indices)

  let worst = 0
  for (const frame of run.frames) {
    const { w, h, data } = frame.buf
    // Chessboard distance from every pixel to the nearest transparent one, in two passes.
    const dist = new Int32Array(w * h).fill(1e6)
    for (let i = 0; i < w * h; i++) if (data[i] === 0) dist[i] = 0
    const relax = (i: number, j: number): void => { if ((dist[j] as number) + 1 < (dist[i] as number)) dist[i] = (dist[j] as number) + 1 }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x
      if (x > 0) relax(i, i - 1); if (y > 0) relax(i, i - w)
      if (x > 0 && y > 0) relax(i, i - w - 1); if (x < w - 1 && y > 0) relax(i, i - w + 1) }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x
      if (x < w - 1) relax(i, i + 1); if (y < h - 1) relax(i, i + w)
      if (x < w - 1 && y < h - 1) relax(i, i + w + 1); if (x > 0 && y < h - 1) relax(i, i + w - 1) }

    const seen = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) {
      if (seen[i] === 1 || !ink.has(data[i] as number)) continue
      let deep = 0
      const stack = [i]
      while (stack.length > 0) {
        const j = stack.pop() as number
        if (seen[j] === 1 || !ink.has(data[j] as number)) continue
        seen[j] = 1
        if ((dist[j] as number) >= 3) deep++
        const x = j % w, y = (j / w) | 0
        if (x > 0) stack.push(j - 1); if (x < w - 1) stack.push(j + 1)
        if (y > 0) stack.push(j - w); if (y < h - 1) stack.push(j + w)
      }
      if (deep > worst) worst = deep
    }
  }
  return worst
}

/**
 * The clips of every actor — the subjects a state machine drives. **Not the scenery**, and the
 * first draft of the hole check did not make that distinction and was wrong for it: a tree of
 * 97 branches carries hundreds of pixels of ink deep inside its own outline and every one of
 * them is a branch, not a hole. A cloud does not even outline in ink. The metric is about a
 * body built from a few big masses, so it is scoped to bodies.
 */
function actors(): readonly (readonly [string, string])[] {
  const out = new Map<string, readonly [string, string]>()
  for (const game of MICRO_GAMES) {
    for (const p of game.scene.placements) {
      if (p.clips === undefined) continue
      for (const spec of Object.values(p.clips)) out.set(`${spec.grammar}|${spec.tunables}`, [spec.grammar, spec.tunables])
    }
  }
  return [...out.values()]
}

/**
 * **A marking may not change a silhouette, and this is the check that says so.**
 *
 * Render the body, then render it again with every marking deleted, and compare *which pixels
 * are painted* — not their colours. The two must be identical: a marking recolours a surface,
 * so it can neither add to an outline nor cut into one.
 *
 * **It is the defect he had to report twice.** The first fix stopped the inner outline ringing
 * the silver saddle, which was real and was not what he was pointing at. The saddle's lobed
 * boundary stood three pixels proud of the chest and hips it lay on, and where the two masses
 * failed to meet the gap between them was empty canvas with the outer outline traced around it
 * — *"as costas do gorila possui um vão na região da cintura"*. A notch cut into the back.
 *
 * Comparing silhouettes rather than pixels is what makes this catch it: the notch was never a
 * hole a flood fill could find, because it opened onto the sky.
 */
describe('a marking recolours a body, it does not reshape one', () => {
  for (const [name, tunables] of actors()) {
    const g = grammarByName(name)
    if (!g.parts.some((p) => p.marking === true)) continue

    it(`${name}`, () => {
      const params = loadParams(tunables)
      const bare: Grammar = { ...g, parts: g.parts.filter((p) => p.marking !== true) }
      for (let f = 0; f < params.frames.walk; f++) {
        const t = f / params.frames.walk
        const withMark = sprite(g, params, 1, t).buf
        const without = sprite(bare, params, 1, t).buf
        let added = 0
        let removed = 0
        for (let i = 0; i < withMark.data.length; i++) {
          const a = (withMark.data[i] as number) !== 0
          const b = (without.data[i] as number) !== 0
          if (a && !b) added++
          if (b && !a) removed++
        }
        expect(added, `${name} frame ${f}: the markings add ${added} px to the silhouette`).toBe(0)
        expect(removed, `${name} frame ${f}: the markings cut ${removed} px out of the silhouette`).toBe(0)
      }
    })
  }
})

describe('a body has no holes in it', () => {
  for (const [name, tunables] of actors()) {
    it(`${name}`, () => {
      const deep = interiorInk(name, tunables)
      expect(deep, `${name} carries ${deep} px of outline three or more pixels inside its own silhouette`)
        .toBeLessThanOrEqual(INTERIOR_INK_MAX)
    })
  }
})

/**
 * **A hinge bends to one side of straight and never through it.**
 *
 * He asked whether the gorilla's elbow and knee were right, before any number said they were
 * not — *"estou um pouco incomodado com o cotovelo do gorila e com seu joelho. O movimento
 * está correto?"*. It was not: the knee spent seven frames of eight between -36° and +4°,
 * which is a shin pointing forward of the thigh. A knee that does that is a bird's, or a
 * broken one.
 *
 * The check is the general form and it is cheap: for every elbow and knee in every gait, take
 * the child bone's angle relative to its parent across the whole cycle. If the range spans
 * both signs by more than a few degrees, the joint is bending both ways.
 *
 * **Three degrees of tolerance**, because a real joint does hyperextend a little and a key
 * that lands exactly on straight is not a defect. Twenty is.
 */
const HINGE_TOL = 3

const HINGES: readonly (readonly [string, string])[] = [
  ['armFL', 'armFU'], ['armNL', 'armNU'], ['legFL', 'legFU'], ['legNL', 'legNU'],
]

describe('no joint bends both ways', () => {
  for (const [name, tunables] of drawn()) {
    const g = grammarByName(name)
    if (!HINGES.some(([c]) => g.skeleton.bones.some((b) => b.name === c))) continue

    it(`${name}`, () => {
      const params = loadParams(tunables)
      for (const [child, parent] of HINGES) {
        if (!g.skeleton.bones.some((b) => b.name === child)) continue
        const angles: number[] = []
        for (let f = 0; f < params.frames.walk; f++) {
          const w = solve(g.skeleton, evaluate(g.gait, params, f / params.frames.walk), { x: 0, y: 0, z: 0, a: 0, sx: 1, sy: 1, sz: 1 })
          angles.push((w.get(child)!.a - w.get(parent)!.a) * 360)
        }
        const lo = Math.min(...angles)
        const hi = Math.max(...angles)
        expect(
          lo >= -HINGE_TOL || hi <= HINGE_TOL,
          `${name}: ${child} swings ${lo.toFixed(0)}° to ${hi.toFixed(0)}° against ${parent} — it folds both ways`,
        ).toBe(true)
      }
    })
  }
})

describe('a body lying on its belly', () => {
  const m = landmarks()

  it('puts its head forward of its hips and lifted off the floor', () => {
    expect(m['head']!.x, 'the head is not forward of the hips: this is a body kneeling, not lying down')
      .toBeGreaterThanOrEqual(15)
    expect(m['head']!.y).toBeLessThan(-5)
    expect(m['head']!.y).toBeGreaterThan(-15)
  })

  it('trails its legs behind it', () => {
    expect(m['boot']!.x, 'the boots are not behind the hips').toBeLessThan(-14)
  })

  it('does not fold its knees backwards', () => {
    // 43° the wrong way is what read as inverted legs. A prone leg is very nearly straight.
    expect(Math.abs(m['knee']!.x), 'the near knee folds too far for a leg').toBeLessThan(20)
    expect(Math.abs(m['knee']!.y), 'the far knee folds too far for a leg').toBeLessThan(20)
  })

  it('plants its elbows on the floor', () => {
    expect(m['elbow']!.y).toBeGreaterThan(-3)
    expect(m['elbow']!.y).toBeLessThan(8)
  })

  it('points the lens away from its own face', () => {
    // **His finding, and the reason the camera has an angle track of its own.** Without one
    // it inherits the forearm, and a forearm folded back to the eye aims the lens at the head.
    expect(m['lens']!.x, 'the lens is behind the head, which is where the photographer is')
      .toBeGreaterThan(m['head']!.x + 4)
    expect(Math.abs(m['lens']!.y - m['head']!.y), 'the lens is not at eye height').toBeLessThan(7)
  })
})
