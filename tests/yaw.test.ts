import { describe, expect, it } from 'vitest'
import { yaw, YAW_OF, FACINGS } from '../src/core/yaw.ts'
import { execute, loadParams } from '../src/io/load.ts'
import { sprite } from '../src/core/render.ts'
import { hashBuffers } from '../src/core/hash.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { findings } from '../src/perception/structure.ts'
import { ASTRONAUT } from '../src/grammars/run14/astronaut.ts'

/**
 * **Turning a body, and the checks are the ones a yaw can actually fail.**
 *
 * This is the gap named on 15/08 — *"facing — one direction is rendered"* — and the half of
 * his commission of 16/08 the engine could not reach. It is also the piece I predicted would
 * fail, in `BACKLOG.md`, before he looked at it.
 */

describe('a yaw of nothing changes nothing', () => {
  it('renders byte-identical at zero turns', () => {
    // **The null case, and it is the one that says the transform is a rotation rather than a
    // rearrangement** (`HARNESS.md` §5).
    //
    // It compares **rendered output**, not the data. A yaw of zero writes an explicit `rz`
    // where the author left it to default, so the two grammars differ as JSON and agree as
    // pictures — and the picture is what the transform promises.
    const g = grammarByName('gorilla')
    const params = loadParams('gorilla')
    const turned = yaw(g, 0, 'gorilla')
    for (let f = 0; f < params.frames.walk; f++) {
      const t = f / params.frames.walk
      expect(hashBuffers([sprite(turned, params, 1, t).buf])).toBe(hashBuffers([sprite(g, params, 1, t).buf]))
    }
  })

  it('a full turn returns a body to itself', () => {
    const g = grammarByName('gorilla')
    const round = yaw(g, 1, 'x')
    for (const [i, b] of round.skeleton.bones.entries()) {
      expect(b.x).toBeCloseTo(g.skeleton.bones[i]!.x, 6)
      expect(b.z ?? 0).toBeCloseTo(g.skeleton.bones[i]!.z ?? 0, 6)
    }
  })
})

describe('a capsule survives being turned exactly', () => {
  it('keeps its radius at every angle', () => {
    // A swept sphere is rotation-invariant in its radius. This is the one primitive the
    // transform is exact for, and it is why a limb is a capsule in this vocabulary.
    const g = grammarByName('gorilla')
    for (const turns of [0.125, 0.25, 0.375, 0.5]) {
      const t = yaw(g, turns, 'x')
      for (const [i, p] of t.parts.entries()) {
        const before = g.parts[i]!.shape
        if (before.kind !== 'capsule' || p.shape.kind !== 'capsule') continue
        expect(p.shape.r).toBe(before.r)
        expect(p.shape.r1).toBe(before.r1)
      }
    }
  })

  it('a body with no depth cannot be turned, and the astronaut has depth everywhere', () => {
    // A bone at z 0 stays at x 0 through every yaw — a body with no depth turns into a line.
    // The astronaut is the first body in the project authored with that in mind.
    //
    // Only the limb ROOTS need it — the four bones that hang off the trunk and define which
    // depth row a limb belongs to. A forearm's offset from its upper arm runs along the limb,
    // so its own depth is legitimately zero and the solver carries the row down to it. The
    // trunk itself is on the centre plane by definition.
    const g = grammarByName('astro-idle-e')
    const rows = g.skeleton.bones.filter((b) => /^(arm|leg)[FN]U$/.test(b.name))
    expect(rows.length).toBeGreaterThan(3)
    for (const b of rows) {
      expect(Math.abs(b.z ?? 0), `${b.name} hangs off the trunk with no depth, so it cannot turn`)
        .toBeGreaterThan(1)
    }
  })
})

describe('the eight facings are eight different pictures', () => {
  const facings = ['e', 'ne', 'n', 'se', 's'] as const

  it('narrows as the body turns away, and never collapses', () => {
    // A body turning from side-on to back-on must get narrower — that IS the turn — and must
    // never get so narrow that it stops being a body.
    const width: Record<string, number> = {}
    for (const f of facings) {
      const run = execute({ grammar: `astro-idle-${f}`, tunables: 'astronaut', seed: 1 })
      const { w, h, data } = run.frames[0]!.buf
      let x0 = w
      let x1 = -1
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[y * w + x] !== 0) { if (x < x0) x0 = x; if (x > x1) x1 = x }
      width[f] = x1 - x0 + 1
    }
    /**
     * **Not "narrower", which is what this asserted first and it was simply wrong about
     * bodies.** A person is *wider* seen from the front than from the side: shoulders are
     * further apart than a chest is deep. The astronaut proved it the moment his arms were
     * pushed out to where a suit actually holds them, and the test failed on a fix.
     *
     * What a turn must do is *change the silhouette*, and no facing may collapse. A body with
     * no depth yaws into a line, and that is the failure this is really watching for.
     *
     * **12% is a weak floor and it is honest about why.** A pressure suit is a stack of
     * near-cylinders, which is exactly why it survives being turned at all — and it is also
     * why its facings differ less than any other body's would. A gorilla is a slab and would
     * spread far wider; asserting a gorilla's ratio here would be asserting a fact about a
     * subject this file has never seen.
     */
    const w = Object.values(width)
    expect(Math.min(...w), 'a facing collapsed').toBeGreaterThan(12)
    expect(Math.max(...w) / Math.min(...w), 'every facing is the same width, so nothing turned')
      .toBeGreaterThan(1.12)
    // Every facing is a distinct picture; two that render alike are one facing wearing two names.
    const hashes = facings.map((f) => execute({ grammar: `astro-idle-${f}`, tunables: 'astronaut', seed: 1 }).hash)
    expect(new Set(hashes).size, 'two facings render identically').toBe(facings.length)
  })

  it('every facing still moves when it walks', () => {
    /**
     * **The check I wrote my prediction against.**
     *
     * A stride is authored as limb rotation in the *screen plane*. Turned to face the camera,
     * that rotation becomes motion in depth — and depth moves no pixels in 2.5D. If the
     * decomposition in `yaw.ts` is wrong, the back view is a still image of a man standing.
     *
     * The floor is a third of the side view's motion. The side view is the authored one and
     * will always move most; a facing under a third of it has lost the walk.
     */
    const motion = (name: string): number => {
      const run = execute({ grammar: name, tunables: 'astronaut', seed: 1 })
      let changed = 0
      let body = 0
      for (let i = 0; i < run.frames.length; i++) {
        const a = run.frames[i]!.buf.data
        const b = run.frames[(i + 1) % run.frames.length]!.buf.data
        for (let k = 0; k < a.length; k++) {
          if (a[k] !== 0) body++
          if (a[k] !== b[k]) changed++
        }
      }
      return changed / body
    }
    const side = motion('astro-lope-e')
    for (const f of facings) {
      const m = motion(`astro-lope-${f}`)
      expect(m, `astro-lope-${f} moves ${(100 * m).toFixed(0)}% against the side view's ${(100 * side).toFixed(0)}%`)
        .toBeGreaterThan(side / 3)
    }
  })
})

/**
 * **Every facing keeps every limb**, and it is the lock his fifth reading asked for.
 *
 * *"quando ando com S, não visualizo os braços"* · *"quando ando AS... vejo apenas o braço
 * direito"* · *"quando ando SD, eu nem consigo descrever o que está errado"*. Three ways of
 * reporting the same measurable thing: a part that renders zero pixels.
 *
 * The findings channel has asked this question since round zero. Nothing had ever asked it
 * **per facing**, because until this morning a body had one.
 *
 * **The far arm behind the body in a pure side view is exempt, and it is the only exemption.**
 * That one is correct: it is what "behind" means. Every other facing shows some of both arms
 * or the turn is lying about where the limbs are.
 */
describe('a turned body keeps its limbs', () => {
  for (const clip of ['idle', 'lope', 'leap']) {
    for (const facing of ['ne', 'n', 'se', 's']) {
      it(`astro-${clip}-${facing}`, () => {
        const name = `astro-${clip}-${facing}`
        const run = execute({ grammar: name, tunables: 'astronaut', seed: 1 })
        const gone = findings(run.frames, grammarByName(name))
          .filter((f) => f.check === 'absent' && /arm[FN][UL]/.test(f.message))
        expect(gone.map((f) => f.message), `${name} loses a limb entirely`).toEqual([])
      })
    }
  }
})

describe('which way he is looking', () => {
  it('walking away shows the pack, walking toward shows the visor', () => {
    /**
     * **His finding in one look, as an instrument.** *"quando ando para cima (W), deveria ver
     * as costas do astronauta. Ao invés disso vejo o visor dele."*
     *
     * Two defects made it: the compass signs were inverted, and `Part.z` was never yawed at
     * all — so the visor, which sits on the front of the helmet at `z: -3.6`, stayed on the
     * camera side in every facing. Rotating a part's `x` and leaving its `z` is not an
     * approximation, it is half a rotation.
     */
    const depth = (facing: string, part: string): number => {
      const g = grammarByName(`astro-idle-${facing}`)
      return g.parts.find((p) => p.name === part)!.z ?? 0
    }
    // Walking away: the pack is nearer the camera than the visor.
    expect(depth('n', 'pack'), 'walking north shows his face').toBeLessThan(depth('n', 'visor'))
    // Walking toward, and side-on: the visor is nearer.
    expect(depth('s', 'visor'), 'walking south shows his back').toBeLessThan(depth('s', 'pack'))
    expect(depth('e', 'visor')).toBeLessThan(depth('e', 'pack'))
  })
})

describe('the compass', () => {
  it('names eight points and the western half mirrors the eastern', () => {
    expect(FACINGS).toHaveLength(8)
    for (const f of FACINGS) expect(YAW_OF[f]).toBeTypeOf('number')
    // **North turns the face AWAY from the camera**, and it did not: the signs were inverted
    // and he walked north and saw the visor. `n` is a positive quarter turn, which sends a
    // bone in front of the body to +z — away.
    expect(YAW_OF['n']).toBeGreaterThan(0)
    expect(YAW_OF['s']).toBeLessThan(0)
    // A body turned west genuinely is a body turned east seen in a mirror, which is why only
    // five are ever rendered. The lamp is the part that must not be mirrored, and `layers.ts`
    // re-renders it — the same trick the gorilla's facing already uses.
    expect(Math.abs(YAW_OF['w']!)).toBeCloseTo(0.5, 6)
    expect(ASTRONAUT.map((g) => g.name).filter((n) => n.startsWith('astro-lope'))).toHaveLength(5)
  })
})
