import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { descentScene } from '../src/micro/descent-scene.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { loadParams } from '../src/io/load.ts'
import { evaluate } from '../src/core/gait.ts'
import { solve } from '../src/core/skeleton.ts'
import { sprite } from '../src/core/render.ts'
import type { Harness } from './harness.ts'
import { run } from './harness.ts'

/**
 * **The descent, and the two things batch 7 exists to validate.**
 *
 * 1. **The camera relation**: the first new view since the moon. The slot window, the painter's
 *    order and the loop are asserted here the way the side-scrollers' are.
 * 2. **The composition drift, MEASURED.** The record declares `Bone.roll` approximate: scalars
 *    accumulate, and a rolled subtree whose chain also swings in the screen plane will drift
 *    from the true rigid composition. The carve is that case at amplitude — arms swinging to
 *    ±50° under a chest that rolls 21°, all under a 31–36° bank. The instrument below builds
 *    the TRUE composition from per-bone rotation matrices and measures how far the engine's
 *    scalar accumulation lands from it, on the rendered artifact. Calibrated both ways: the
 *    glide (no roll anywhere) must measure ≈ 0, or the instrument is reading its own noise.
 */

const stage = toStage(descentScene)
const D = stage.descent!
const page = gamePage({ id: 'descent', title: 'The descent', blurb: '', date: '', meta: [], stage })

/** Heights above the snow line, read from each obstacle's own art. */
// Band 0 is the full-size render; collision heights read from it alone.
const heights = D.stones.map((v) => -stage.layers[v[0]!]!.oy)

// ---------------------------------------------------------------------------
// The instrument: true rigid composition vs the engine's scalar accumulation.
// ---------------------------------------------------------------------------

type M3 = readonly number[] // row-major 3×3
const I3: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1]
const mul = (a: M3, b: M3): M3 => {
  const r: number[] = new Array(9).fill(0)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) r[i * 3 + j]! += a[i * 3 + k]! * b[k * 3 + j]!
  return r
}
const Rz = (turns: number): M3 => {
  const c = Math.cos(turns * Math.PI * 2)
  const s = Math.sin(turns * Math.PI * 2)
  // The engine's screen-plane rotation: +angle carries +y offsets toward -x (y grows down).
  return [c, -s, 0, s, c, 0, 0, 0, 1]
}
const Rx = (turns: number): M3 => {
  const c = Math.cos(turns * Math.PI * 2)
  const s = Math.sin(turns * Math.PI * 2)
  // The engine's roll: +roll carries +y away from the camera (+z), -roll brings it forward.
  return [1, 0, 0, 0, c, -s, 0, s, c]
}
const apply = (m: M3, v: readonly [number, number, number]): [number, number, number] => [
  m[0]! * v[0] + m[1]! * v[1] + m[2]! * v[2],
  m[3]! * v[0] + m[4]! * v[1] + m[5]! * v[2],
  m[6]! * v[0] + m[7]! * v[1] + m[8]! * v[2],
]

/**
 * The TRUE world position of a point riding a bone: every ancestor contributes its full local
 * rotation as a matrix, parent-first — the composition the scalar accumulation approximates.
 */
function truthPoint(grammarName: string, tunablesName: string, at: number, boneName: string, local: readonly [number, number, number]): [number, number] {
  const g = grammarByName(grammarName)
  const params = loadParams(tunablesName)
  const pose = evaluate(g.gait, params, at)
  const chain: { off: [number, number, number]; rot: M3 }[] = []
  let cur: string | null = boneName
  while (cur !== null) {
    const bone = g.skeleton.bones.find((b) => b.name === cur)
    if (bone === undefined) throw new Error(`unknown bone ${cur}`)
    const d = pose.get(bone.name)
    const a = bone.angle + (d?.angle ?? 0)
    const roll = (bone.roll ?? 0) + (d?.roll ?? 0)
    chain.unshift({ off: [bone.x + (d?.x ?? 0), bone.y + (d?.y ?? 0), (bone.z ?? 0) + (d?.z ?? 0)], rot: mul(Rz(a), Rx(roll)) })
    cur = bone.parent
  }
  let m: M3 = I3
  let p: [number, number, number] = [params.canvas.originX, params.canvas.originY, 0]
  for (const link of chain) {
    const o = apply(m, link.off)
    p = [p[0] + o[0], p[1] + o[1], p[2] + o[2]]
    m = mul(m, link.rot)
  }
  const world = apply(m, local)
  return [p[0] + world[0], p[1] + world[1]]
}

/**
 * **The ENGINE's answer, computed exactly.** `solve()` gives the bone's accumulated scalars;
 * the renderer's part transform is Rz(Σangle)·Rx(Σroll) about the bone (raster.ts, verified).
 * Reproducing that arithmetic gives the engine's position for the probe with NO rendering
 * noise — the first draft of this instrument took the rendered centroid, and its null case
 * measured 0.64 px against a real signal of ~0.3: an instrument that cannot separate the null
 * from the case is not an instrument (HARNESS §5), so the centroid version was retired the
 * same hour and survives only as the sanity bridge below.
 */
function enginePointExact(grammarName: string, tunablesName: string, at: number, boneName: string, local: readonly [number, number, number]): [number, number] {
  const g = grammarByName(grammarName)
  const params = loadParams(tunablesName)
  const pose = evaluate(g.gait, params, at)
  const world = solve(g.skeleton, pose, {
    x: params.canvas.originX, y: params.canvas.originY, z: 0, a: 0, roll: 0,
    sx: params.body.scale, sy: params.body.scale, sz: params.body.scale,
  })
  const b = world.get(boneName)!
  const v = apply(mul(Rz(b.a), Rx(b.roll)), local)
  return [b.x + b.sx * v[0], b.y + b.sy * v[1]]
}

/** The rendered part's centroid — kept ONLY as the bridge from formula to artifact. */
function renderedCentroid(grammarName: string, tunablesName: string, at: number, partName: string): [number, number] | null {
  const g = grammarByName(grammarName)
  const params = loadParams(tunablesName)
  const idx = g.parts.findIndex((p) => p.name === partName)
  const f = sprite(g, params, 1, at)
  let n = 0
  let sx = 0
  let sy = 0
  for (let y = 0; y < f.buf.h; y++) {
    for (let x = 0; x < f.buf.w; x++) {
      if (f.owners[y * f.buf.w + x] !== idx) continue
      n++; sx += x + 0.5; sy += y + 0.5
    }
  }
  return n === 0 ? null : [sx / n, sy / n]
}

/** The probe: the left mitt — a small sphere at the end of the drifting chain. */
const MITT: readonly [number, number, number] = [-2.8, 5.6, 0]

const drift = (grammarName: string, tunablesName: string, at: number): number => {
  const e = enginePointExact(grammarName, tunablesName, at, 'armL', MITT)
  const t = truthPoint(grammarName, tunablesName, at, 'armL', MITT)
  return Math.hypot(e[0] - t[0], e[1] - t[1])
}

describe('the composition drift, measured', () => {
  it('the null case: the unrolled glide measures exactly zero', () => {
    const params = loadParams('descent')
    const n = params.frames.walk
    for (let i = 0; i < n; i++) {
      // With no roll anywhere in the chain, scalar accumulation IS the matrix product, so the
      // divergence is zero in floating point, not merely small.
      expect(drift('descent-glide', 'descent', i / n)).toBeLessThan(1e-9)
    }
  })

  it('the carve drift is real, measured, and under the visibility floor — the validation number', () => {
    const params = loadParams('descent-carve')
    const n = params.frames.walk
    let worst = 0
    for (let i = 0; i < n; i++) worst = Math.max(worst, drift('descent-carve', 'descent-carve', i / n))
    /**
     * **The number the whole test C exists to produce.** Arms at ±50° under a 21° chest roll
     * under a 36° bank — the worst interleave the carve reaches — costs ~0.3 px on a 34 px
     * body. The floor proves the instrument sees the non-commuting pair at all (zero would be
     * a broken measurement, since the matrices genuinely differ); the ceiling is one device
     * pixel: below it, the approximation is invisible at every scale the shelf ships, and the
     * declared risk is DOWNGRADED from "will drift" to "drifts by less than a pixel at carve
     * amplitude". Past it, the finding would be the capability (a matrix per bone) instead.
     */
    expect(worst).toBeGreaterThan(0.1)
    expect(worst).toBeLessThan(1.0)
  })

  it('the formula is the artifact: the engine prediction lands inside the rendered mitt', () => {
    // The bridge: the exact arithmetic above must describe the same picture the player sees,
    // or the drift number is about a formula nobody renders. Centroid bias allows ~a pixel.
    const params = loadParams('descent-carve')
    const n = params.frames.walk
    for (let i = 0; i < n; i++) {
      const c = renderedCentroid('descent-carve', 'descent-carve', i / n, 'mittL')
      if (c === null) continue
      const e = enginePointExact('descent-carve', 'descent-carve', i / n, 'armL', MITT)
      expect(Math.hypot(c[0] - e[0], c[1] - e[1])).toBeLessThan(1.4)
    }
  })
})

describe('the carve is the composition at amplitude', () => {
  it('the bank is past thirty degrees and never releases', () => {
    const g = grammarByName('descent-carve')
    const params = loadParams('descent-carve')
    const n = params.frames.walk
    for (let i = 0; i < n; i++) {
      const bank = (evaluate(g.gait, params, i / n).get('core')?.angle ?? 0) * 360
      expect(bank, `frame ${i} released the bank`).toBeGreaterThan(30)
      expect(bank).toBeLessThan(38)
    }
  })

  it('rolled children live under the banked root', () => {
    const g = grammarByName('descent-carve')
    expect(g.gait.tracks.some((t) => t.bone === 'chest' && t.channel === 'roll')).toBe(true)
    expect(g.gait.tracks.some((t) => t.bone === 'board' && t.channel === 'roll')).toBe(true)
    // And the drifting interleave exists: an ANGLE track on a child of the rolled chest.
    expect(g.gait.tracks.some((t) => (t.bone === 'armL' || t.bone === 'armR') && t.channel === 'angle')).toBe(true)
  })

  it('the glide and the launch stay clean — the null case and the control', () => {
    expect(grammarByName('descent-glide').gait.tracks.some((t) => t.channel === 'roll')).toBe(false)
    expect(grammarByName('descent-launch').gait.tracks.some((t) => t.channel === 'roll')).toBe(false)
    expect(loadParams('descent').gait.roll).toBe(0)
    expect(loadParams('descent-launch').gait.roll).toBe(0)
  })

  it('no load-bearing part vanishes in any clip', () => {
    for (const [gn, tn] of [['descent-glide', 'descent'], ['descent-carve', 'descent-carve'], ['descent-launch', 'descent-launch']] as const) {
      const g = grammarByName(gn)
      const params = loadParams(tn)
      const n = params.frames.walk
      const watch = ['deck', 'edge', 'jacket', 'skull', 'beanie', 'armL', 'armR', 'mittL', 'mittR', 'legL', 'legR']
      for (const w of watch) {
        const idx = g.parts.findIndex((p) => p.name === w)
        let seen = 0
        for (let i = 0; i < n; i++) {
          const f = sprite(g, params, 1, g.gait.wrap === false ? i / (n - 1) : i / n)
          if (f.owners.some((o) => o === idx)) seen++
        }
        expect(seen, `${gn}: ${w} painted in ${seen} of ${n}`).toBeGreaterThanOrEqual(n - 1)
      }
    }
  })
})

describe('the mountain', () => {
  it('the hop splits the furniture by drawn height alone', () => {
    const low = heights.filter((h) => h < D.clearance)
    const high = heights.filter((h) => h >= D.clearance)
    expect(low.length, `nothing jumpable: heights ${heights.join()}`).toBeGreaterThan(0)
    expect(high.length, `everything jumpable: heights ${heights.join()}`).toBeGreaterThan(0)
  })

  it('a lane change costs a fraction of the warning the horizon gives', () => {
    const warning = D.range / D.maxSpeed
    const laneChange = (D.stoneHalfW + D.bodyHalfW) / D.steer
    expect(warning / laneChange).toBeGreaterThan(4)
  })

  it('every slot inside the perspective window is drawn — the batch-5 property, on the new curve', () => {
    const slopeAt = (k: number): { d: number } => {
      let a = ((k + D.seed) * 2654435761) >>> 0
      a = (a ^ (a >>> 13)) >>> 0
      return { d: D.leadIn + k * D.spacingD + (a % D.jitterD) }
    }
    const behind = D.zNear * 1.6
    for (let dist = 0; dist < 12000; dist += 41) {
      const kFirst = Math.max(0, Math.floor((dist - behind - D.jitterD - D.leadIn) / D.spacingD))
      const kLast = Math.floor((dist + D.range - D.leadIn) / D.spacingD) + 1
      const kAround = Math.round(dist / D.spacingD)
      for (let k = Math.max(0, kAround - 12); k <= kAround + 12; k++) {
        const A = slopeAt(k).d - dist
        // The runtime culls on the same ahead-window it walks, so the property is exact:
        // anything the perspective can place is a slot the walk visits.
        const inView = A <= D.range && A >= -behind
        if (!inView) continue
        expect(k, `slot ${k} in view at dist ${dist} but outside [${kFirst}, ${kLast}]`).toBeGreaterThanOrEqual(kFirst)
        expect(k).toBeLessThanOrEqual(kLast)
      }
    }
  })

  it('the perspective is monotone and calibrated at both ends', () => {
    // factor 1 at the rider's row, shrinking toward the spawn — his sentence as arithmetic.
    const persp = (A: number): number => D.zNear / Math.max(D.zNear * 0.28, A + D.zNear)
    expect(persp(0)).toBeCloseTo(1, 5)
    expect(persp(D.range)).toBeLessThan(0.2)
    for (let A = 0; A < D.range; A += 40) expect(persp(A + 40)).toBeLessThan(persp(A))
    // And every band the snap can pick is a real render: one layer per scale per variant.
    for (const variant of D.stones) expect(variant.length).toBe(D.scales.length)
  })
})

describe('the loop', () => {
  const play = (seconds: number, hold?: string): Harness => {
    const h = run(page)
    if (hold !== undefined) h.key(hold, true)
    for (let i = 0; i < Math.round(seconds * 60); i++) h.tick(i * 16.67)
    return h
  }

  it('he descends without being told to, and the distance counts up', () => {
    const h = play(1.5)
    expect(h.state().dist).toBeGreaterThan(120)
    expect(h.state().over).toBe(false)
    expect(h.text['score']).toMatch(/\d+ m/)
  })

  it('holding a key steers across the slope and plays the carve', () => {
    const h = run(page)
    const x0 = (h.state() as unknown as { x: number }).x
    h.key('ArrowRight', true)
    for (let i = 0; i < 30; i++) h.tick(i * 16.67)
    const s = h.state() as unknown as { x: number; steer: number }
    expect(s.x).toBeGreaterThan(x0 + 10)
    expect(s.steer).toBe(1)
  })

  it('the hop rises and lands', () => {
    const h = run(page)
    let t = 0
    const step = (n: number): void => { for (let i = 0; i < n; i++) h.tick((t++) * 16.67) }
    step(5)
    h.key(' ', true); step(1); h.key(' ', false)
    step(8)
    expect((h.state() as unknown as { y: number }).y).toBeGreaterThan(4)
    step(40)
    expect((h.state() as unknown as { y: number }).y).toBe(0)
  })

  it('the mountain eventually wins a run that never steers, and space starts another', () => {
    const h = play(30)
    expect(h.state().over, 'thirty seconds straight down an obstacle field never hit anything').toBe(true)
    expect(h.text['score']).toMatch(/you wiped out at \d+ m/)
    h.key(' ', true)
    h.tick(999_999)
    h.key(' ', false)
    h.tick(999_016)
    expect(h.state().over).toBe(false)
    expect(h.state().dist).toBeLessThan(D.leadIn)
  })
})
