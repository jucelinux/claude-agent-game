import { describe, expect, it } from 'vitest'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { toStage } from '../src/scene/layers.ts'
import { execute, loadParams } from '../src/io/load.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { solve } from '../src/core/skeleton.ts'
import { evaluate } from '../src/core/gait.ts'
import { sprite } from '../src/core/render.ts'
import type { Grammar, Params } from '../src/core/types.ts'

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
 * **A body has no holes in it, and the check is a DIFFERENCE rather than a ceiling.**
 *
 * His reading of 16/08: *"e esse buraco nas costas do gorila?"* — and nothing was transparent.
 * It was the inner outline ringing the silver saddle, and where a ragged marking's boundary
 * folds back on itself the ring closes into a solid patch. Ink deep inside a body reads as a
 * gap whatever colour the gap technically is.
 *
 * **The first version was an absolute ceiling and it was the wrong instrument.** 90 px,
 * calibrated against the gorilla. It then failed the astronaut seen from behind — whose PLSS
 * pack is a hard-edged box strapped to a suit and *should* be outlined, all 106 px of it. A
 * threshold derived from one body measures that body: a gorilla has no hard-edged solid on it
 * and a spacesuit has three.
 *
 * **What the defect actually was, stated exactly: a MARKING added interior ink.** So the check
 * renders the body twice — once as authored, once with every marking deleted — and asks what
 * the markings *added*. A marking that draws no line adds nothing. A marking that gets ringed
 * adds its whole perimeter, and a ring that closes adds its area.
 *
 * 8 px of slack, because deleting a marking uncovers whatever was beneath it and the solids
 * underneath can meet differently by a pixel or two.
 *
 * **What this lock does NOT do, stated because I checked and it does not.** Reintroducing the
 * original defect — deleting `marking: true` from the saddle — leaves this check green. The
 * saddle is then a solid, so it is present in both renders and the difference is zero.
 *
 * That is not a hole to patch, it is the honest boundary of what a lock can know. **`marking`
 * is a declaration, and no measurement can infer intent**: whether a thing on a body is a
 * separate object or a patch of its surface is a judgement about the subject, not a property
 * of the pixels. What the locks guarantee is that a *declared* marking behaves — draws no
 * line, adds no silhouette. Whether it should have been declared is his eye, and that is the
 * division of labour this whole project is built on (`TASTE-LOOP.md` §7).
 */
/**
 * The clips of every actor — the subjects a state machine drives. **Not the scenery**: a tree
 * of 97 branches carries hundreds of pixels of ink deep inside its own outline and every one
 * of them is a branch. The metric is about a body built from a few big masses.
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

const MARKING_INK_MAX = 8

/** The largest connected mass of outline sitting three or more pixels inside the silhouette. */
function interiorInk(g: Grammar, params: Params): number {
  const ramp = g.palette.ramps.find((r) => r.material === params.outline.material)
  if (ramp === undefined || !params.outline.enabled) return 0
  const ink = new Set<number>(ramp.indices)

  let worst = 0
  for (let f = 0; f < params.frames.walk; f++) {
    const { w, h, data } = sprite(g, params, 1, f / params.frames.walk).buf
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

describe('a marking draws no line, and no hole', () => {
  for (const [name, tunables] of actors()) {
    const g = grammarByName(name)
    if (!g.parts.some((p) => p.marking === true)) continue

    it(`${name}`, () => {
      const params = loadParams(tunables)
      const bare: Grammar = { ...g, parts: g.parts.filter((p) => p.marking !== true) }
      const added = interiorInk(g, params) - interiorInk(bare, params)
      expect(added, `${name}: its markings add ${added} px of outline deep inside the body`)
        .toBeLessThanOrEqual(MARKING_INK_MAX)
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

/**
 * **A limb's segments touch, in every facing and every frame.**
 *
 * His reading of 16/08: *"W, S: os antebraços parecem estar desconectados dos braços"* — a
 * 2.6 px gap at the elbow, and it was there because I had held the forearm outboard with a
 * depth offset. **In the authored side view that offset is pure depth and invisible.** Turned
 * a quarter it is screen displacement, and a joint that does not touch is a broken body.
 *
 * The general form, and it is the whole lesson of the last two readings: **anything authored
 * purely in depth is unfalsifiable in the view it was authored in.** A body that can turn has
 * no such hiding place, so the check has to run over every facing.
 *
 * Half a pixel of slack, for the rounding in a bone's own scale.
 */
const JOINT_GAP_MAX = 0.5

describe('a limb stays joined to itself', () => {
  /** Upper segment, lower segment, and how long the upper one is in bone units. */
  const CHAINS: readonly (readonly [string, string])[] = [
    ['armFU', 'armFL'], ['armNU', 'armNL'], ['legFU', 'legFL'], ['legNU', 'legNL'],
  ]

  for (const [name, tunables] of actors()) {
    const g = grammarByName(name)
    if (!CHAINS.some(([u]) => g.skeleton.bones.some((b) => b.name === u))) continue

    it(`${name}`, () => {
      const params = loadParams(tunables)
      for (const [upper, lower] of CHAINS) {
        const child = g.skeleton.bones.find((b) => b.name === lower)
        if (child === undefined || child.parent !== upper) continue
        const reach = child.y
        for (let f = 0; f < params.frames.walk; f++) {
          const w = solve(g.skeleton, evaluate(g.gait, params, f / params.frames.walk), { x: 0, y: 0, z: 0, a: 0, sx: 1, sy: 1, sz: 1 })
          const u = w.get(upper)!
          const l = w.get(lower)!
          const a = u.a * Math.PI * 2
          // Where the parent's own length ends, in world space.
          const tipX = u.x + u.sx * -Math.sin(a) * reach
          const tipY = u.y + u.sy * Math.cos(a) * reach
          const gap = Math.hypot(tipX - l.x, tipY - l.y)
          expect(gap, `${name} frame ${f}: ${lower} starts ${gap.toFixed(1)} px away from the end of ${upper}`)
            .toBeLessThanOrEqual(JOINT_GAP_MAX)
        }
      }
    })
  }
})

describe('no joint bends both ways', () => {
  for (const [name, tunables] of drawn()) {
    const g = grammarByName(name)
    if (!HINGES.some(([c]) => g.skeleton.bones.some((b) => b.name === c))) continue

    it(`${name}`, () => {
      const params = loadParams(tunables)
      for (const [child, parent] of HINGES) {
        // **Both ends have to exist.** A body that names a hinge's child under a different
        // parent is not that hinge, and looking the parent up anyway crashed the lock rather
        // than skipping it — a lock that throws reports nothing about the body it threw on.
        if (!g.skeleton.bones.some((b) => b.name === child)) continue
        if (!g.skeleton.bones.some((b) => b.name === parent)) continue
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
