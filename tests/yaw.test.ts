import { describe, expect, it } from 'vitest'
import { yaw, YAW_OF, FACINGS } from '../src/core/yaw.ts'
import { execute, loadParams } from '../src/io/load.ts'
import { sprite } from '../src/core/render.ts'
import { hashBuffers } from '../src/core/hash.ts'
import { grammarByName } from '../src/grammars/index.ts'
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
    expect(width['n'], 'a body seen from behind is not narrower than one seen from the side').toBeLessThan(width['e'] as number)
    expect(width['n'], 'the body collapsed when turned').toBeGreaterThan(12)
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

describe('the compass', () => {
  it('names eight points and the western half mirrors the eastern', () => {
    expect(FACINGS).toHaveLength(8)
    for (const f of FACINGS) expect(YAW_OF[f]).toBeTypeOf('number')
    // A body turned west genuinely is a body turned east seen in a mirror, which is why only
    // five are ever rendered. The lamp is the part that must not be mirrored, and `layers.ts`
    // re-renders it — the same trick the gorilla's facing already uses.
    expect(YAW_OF['w']).toBeCloseTo(-YAW_OF['e']! - 0.5, 6)
    expect(ASTRONAUT.map((g) => g.name).filter((n) => n.startsWith('astro-lope'))).toHaveLength(5)
  })
})
