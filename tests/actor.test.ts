import { describe, expect, it } from 'vitest'
import { MICRO_GAMES } from '../src/micro/registry.ts'
import { toStage } from '../src/scene/layers.ts'
import { loadParams } from '../src/io/load.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { solve } from '../src/core/skeleton.ts'
import { evaluate } from '../src/core/gait.ts'

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
