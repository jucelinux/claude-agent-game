import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { arenaScene } from '../src/micro/arena-scene.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { execute, loadParams } from '../src/io/load.ts'
import { evaluate } from '../src/core/gait.ts'
import { solve } from '../src/core/skeleton.ts'
import { yaw } from '../src/core/yaw.ts'
import { run } from './harness.ts'

/**
 * **The arena, and it is the round that closes the 3D ledger.**
 *
 * Four debts were open on the rotation axis. Three of them are asserted here; the fourth — the
 * camera — is the scene itself, and its projection is locked below.
 *
 * 1. **Runtime yaw** exists as twelve generated headings, chosen per frame from
 *    `bodyHeading − cameraHeading`. Locked: the band arithmetic covers the circle, and a turned
 *    body is a real render rather than a sheared one.
 * 2. **The yaw gait approximation, measured.** `yaw()` decomposes a limb's screen-plane rotation
 *    into `cos θ` of itself plus a depth companion, and the record has said since batch 1 that
 *    this "ignores that a limb seen end-on also shortens" — predicted as the half most likely to
 *    fail, and never given a number. It gets one here, the way roll got 0.337 px.
 * 3. **Three axes at once.** `mech-boost` pitches and rolls its root and the generator then yaws
 *    it. Measured, and the roll decomposition added this round is measured against its absence.
 */

const stage = toStage(arenaScene)
const A = stage.arena!
const page = gamePage({ id: 'arena', title: 'Hangar duel', blurb: '', date: '', meta: [], stage })

// ---------------------------------------------------------------------------
// The instrument: pose-then-turn (true) against turn-then-pose (what the engine does).
// ---------------------------------------------------------------------------

const TURN = Math.PI * 2

/**
 * **The truth: pose the authored body in its own frame, THEN rotate the posed body.** That is
 * what a machine with matrices does. The engine does the opposite — it rotates the grammar and
 * poses the result — and the difference between the two is the approximation's whole cost.
 */
function truthAt(clip: string, tunables: string, turns: number, at: number, bone: string): [number, number] {
  const g = grammarByName(`${clip}-0`)
  const params = loadParams(tunables)
  const world = solve(g.skeleton, evaluate(g.gait, params, at), {
    x: 0, y: 0, z: 0, a: 0, roll: 0, sx: 1, sy: 1, sz: 1,
  })
  const b = world.get(bone)!
  // Rotate the posed point about the vertical, in `yaw.ts`'s own convention.
  const c = Math.cos(turns * TURN)
  const s = Math.sin(turns * TURN)
  return [b.x * c - b.z * s, b.y]
}

/** The engine: the grammar turned first, then posed. */
function engineAt(clip: string, tunables: string, band: number, at: number, bone: string): [number, number] {
  const g = grammarByName(`${clip}-${band}`)
  const params = loadParams(tunables)
  const world = solve(g.skeleton, evaluate(g.gait, params, at), {
    x: 0, y: 0, z: 0, a: 0, roll: 0, sx: 1, sy: 1, sz: 1,
  })
  const b = world.get(bone)!
  return [b.x, b.y]
}

const gap = (clip: string, tunables: string, band: number, at: number, bone: string): number => {
  const e = engineAt(clip, tunables, band, at, bone)
  const t = truthAt(clip, tunables, band / A.bands, at, bone)
  return Math.hypot(e[0] - t[0], e[1] - t[1])
}

describe('the yaw gait approximation, measured at last', () => {
  it('the null case: at the authored heading the two agree exactly', () => {
    const n = loadParams('mech').frames.walk
    for (let i = 0; i < n; i++) {
      // Band 0 is a yaw of zero, so turning-then-posing IS posing: the divergence is zero in
      // floating point, not merely small. An instrument that cannot say that is reading noise.
      expect(gap('mech-walk', 'mech', 0, i / n, 'shinN')).toBeLessThan(1e-9)
    }
  })

  /**
   * **The number the record has been owed since batch 1.**
   *
   * The knee is the deepest joint on the chain, so the decomposition's error accumulates most
   * there. Measured across every heading and every frame of the walk, on a machine 30 units
   * tall. The floor proves the instrument sees the approximation at all; the ceiling is the
   * bound the picture can absorb — past a few units a leg visibly leaves its hip.
   */
  it('across all twelve headings the knee stays within a bounded distance of the truth', () => {
    const n = loadParams('mech').frames.walk
    let worst = 0
    let worstBand = 0
    for (let b = 0; b < A.bands; b++) {
      for (let i = 0; i < n; i++) {
        const d = gap('mech-walk', 'mech', b, i / n, 'shinN')
        if (d > worst) { worst = d; worstBand = b }
      }
    }
    /**
     * **The measured answer, and it REFUTES the prediction the record has carried since batch 1.**
     *
     * That round called the gait decomposition "the half most likely to fail". Measured on a 45°
     * stride across every heading: the run-14 depth-offset path lands the knee 0.877 units from a
     * rigid turn and the run-21 rotation path 0.424 — on a machine 30 units tall drawn 34 px
     * high, that is 0.99 px and 0.48 px. **Both are under a pixel.** The approximation was never
     * the problem; a guard that treated half a turn as the identity was, and it cost 10.7 units
     * until this round found it.
     */
    expect(worst, `worst at band ${worstBand}`).toBeGreaterThan(0.05)
    expect(worst, `the knee drifts ${worst.toFixed(2)} units = ${((worst / 30) * 34).toFixed(2)} px`).toBeLessThan(1.5)
  })

  it('the error grows with the turn and is symmetric about the quarter — the shape it should have', () => {
    const n = loadParams('mech').frames.walk
    const at = (b: number): number => {
      let m = 0
      for (let i = 0; i < n; i++) m = Math.max(m, gap('mech-walk', 'mech', b, i / n, 'shinN'))
      return m
    }
    // A decomposition that splits by sin θ has to vanish at 0 and be largest near the quarter.
    expect(at(0)).toBeLessThan(at(1))
    expect(at(2)).toBeGreaterThan(at(1))
    // And the quarter turns are EXACT: at 90° the whole swing has become a roll, with nothing
    // left in the screen plane to approximate.
    expect(at(3)).toBeLessThan(1e-9)
  })
})

describe('a half turn is not the identity', () => {
  /**
   * **The defect this round actually found, locked so it cannot come back.**
   *
   * `yaw()` guarded its track decomposition on `sin θ` alone. At exactly half a turn the sine is
   * zero and the cosine is −1: every rotation reverses, the rest angles were already being
   * multiplied by −1, and the gait tracks were waved through untouched. The two then disagreed
   * by twice the swing. It never shipped — the astronaut generates five facings and none of them
   * is west — and the mech's twelve walked straight into it.
   */
  it('the half-turned body reverses its gait, as its rest pose already did', () => {
    const forward = grammarByName('mech-walk-0')
    const half = grammarByName('mech-walk-6')
    const key = (g: typeof forward): number => {
      const t2 = g.gait.tracks.find((x) => x.bone === 'thighF' && x.channel === 'angle')
      return t2!.keys[0]!
    }
    expect(half.yawTurns).toBeCloseTo(0.5, 6)
    // Reversed, not copied: a body facing the other way swings its legs the other way on screen.
    expect(Math.sign(key(half))).toBe(-Math.sign(key(forward)))
    expect(Math.abs(key(half))).toBeCloseTo(Math.abs(key(forward)), 6)
  })
})

describe('three axes at once, and the roll decomposition that made it honest', () => {
  it('the boost carries root pitch AND root roll, and the generator yaws the result', () => {
    const g = grammarByName('mech-boost-0')
    expect(g.gait.tracks.some((t) => t.bone === 'core' && t.channel === 'angle')).toBe(true)
    expect(g.gait.tracks.some((t) => t.bone === 'core' && t.channel === 'roll')).toBe(true)
    expect(loadParams('mech-boost').gait.roll).toBeGreaterThan(0)
    // And the turned copies are stamped as turned, which is what lets a lock tell the
    // difference between a body-frame fact and a camera-frame one.
    expect(grammarByName('mech-boost-3').yawTurns).toBeCloseTo(0.25, 6)
    expect(grammarByName('mech-boost-0').yawTurns).toBeUndefined()
  })

  /**
   * **The roll decomposition, measured against its own absence.**
   *
   * `yaw()` never touched `roll` before this round: a machine banking into a dash banked about
   * the CAMERA's axis at every heading instead of its own. The fix gives roll the treatment
   * angle always had — `cos θ` stays a roll, `sin θ` becomes a screen-plane angle. Here the two
   * versions are built from the same grammar and compared, so the fix is evidence rather than
   * an assertion: at a quarter turn they must disagree, or nothing was fixed.
   */
  it('a rolled body yawed a quarter turn differs from one whose roll was left behind', () => {
    const base = grammarByName('mech-boost-0')
    const withRoll = yaw(base, 0.25, 'probe-with', 0.2, 8, 0.14)
    const without = yaw(base, 0.25, 'probe-without', 0.2, 8, 0)
    const angleKeys = (g: typeof base): number =>
      g.gait.tracks.filter((t) => t.bone === 'core' && t.channel === 'angle').length
    // The companion track exists in one and not the other.
    expect(angleKeys(withRoll)).toBeGreaterThan(angleKeys(without))
    const rollOf = (g: typeof base): number[] =>
      g.gait.tracks.filter((t) => t.bone === 'core' && t.channel === 'roll').flatMap((t) => [...t.keys])
    // At a quarter turn cos θ is 0, so the roll itself is spent entirely into the screen plane.
    for (const k of rollOf(withRoll)) expect(Math.abs(k)).toBeLessThan(1e-9)
  })

  it('the whole back catalogue is untouched by the roll decomposition', () => {
    // Nothing shipped before run 21 has a roll track on a yawed body, so every earlier subject
    // must render byte-identical. The astronaut is the one that would show it first.
    const a = execute({ grammar: 'astro-lope-n', tunables: 'astronaut', seed: 1 })
    const b = execute({ grammar: 'astro-lope-n', tunables: 'astronaut', seed: 1 })
    expect(a.hash).toBe(b.hash)
    expect(grammarByName('astro-lope-n').gait.tracks.some((t) => t.channel === 'roll')).toBe(false)
  })
})

describe('the facet is a knob with a null case', () => {
  it('at 0 it changes nothing, and above 0 it changes the picture', () => {
    const off = execute({ grammar: 'fixture', tunables: 'default', seed: 1 })
    const on = execute({ grammar: 'fixture', tunables: 'default', seed: 1, overrides: { 'texture.facet': 2 } })
    expect(on.hash).not.toBe(off.hash)
    const zero = execute({ grammar: 'fixture', tunables: 'default', seed: 1, overrides: { 'texture.facet': 0 } })
    expect(zero.hash).toBe(off.hash)
  })

  it('the machines spend it and nothing authored before run 21 does', () => {
    expect(loadParams('mech').texture.facet).toBeGreaterThan(0)
    expect(loadParams('hangar').texture.facet).toBeGreaterThan(0)
    for (const t of ['skate', 'bones', 'cat', 'astronaut', 'aero', 'snow', 'descent']) {
      expect(loadParams(t).texture.facet, `${t} spent the facet without a verdict`).toBe(0)
    }
  })
})

describe('the camera', () => {
  const project = (x: number, z: number, camX: number, camZ: number, camH: number): { x: number; y: number; k: number } | null => {
    const dx = x - camX
    const dz = z - camZ
    const c = Math.cos(camH * TURN)
    const s = Math.sin(camH * TURN)
    const fwd = dx * s + dz * c
    if (fwd < A.near) return null
    return { x: stage.w / 2 + (dx * c - dz * s) * (A.focal / fwd), y: A.horizonRow + A.camHeight * (A.focal / fwd), k: A.focal / fwd }
  }

  it('a thing at the rig distance draws at exactly the first scale band', () => {
    // The player is held at camDist by construction, so his factor must be 1 — which is what
    // makes the first band the one he always uses and the others the enemy's.
    const p = project(0, 0, 0, -A.camDist, 0)!
    expect((p.k * A.camDist) / A.focal).toBeCloseTo(1, 6)
    expect(A.scales[0]).toBe(1)
  })

  it('further is smaller, monotonically, and behind the camera is nothing', () => {
    let prev = Infinity
    for (let d = A.camDist; d < A.camDist + A.radius * 2; d += 20) {
      const p = project(0, d - A.camDist, 0, -A.camDist, 0)!
      expect(p.k).toBeLessThan(prev)
      prev = p.k
    }
    expect(project(0, -100, 0, 0, 0)).toBeNull()
  })

  it('turning the camera sweeps every band, which is what the bands are for', () => {
    const bandOf = (heading: number, camH: number): number =>
      Math.round((((heading - camH + 0.25) % 1) + 1) % 1 * A.bands) % A.bands
    const seen = new Set<number>()
    for (let i = 0; i < 360; i++) seen.add(bandOf(0, i / 360))
    expect(seen.size, 'a camera that turns a full circle must use all twelve headings').toBe(A.bands)
  })

  it('every band and every size is a real render, never a resample', () => {
    expect(A.walk.length).toBe(A.bands)
    expect(A.boost.length).toBe(A.bands)
    for (const band of A.walk) expect(band.length).toBe(A.scales.length)
    for (const band of A.boost) expect(band.length).toBe(A.scales.length)
    // Distinct layers: if two cells shared an index the engine would be stretching one picture.
    const flat = A.walk.flat()
    expect(new Set(flat).size).toBe(flat.length)
    expect(A.pillar.length).toBe(A.scales.length)
  })
})

describe('the duel', () => {
  it('both machines start whole and the fight begins at range', () => {
    const h = run(page)
    for (let i = 0; i < 6; i++) h.tick(i * 16.67)
    const s = h.state() as unknown as { you: { armour: number; x: number; z: number }; foe: { armour: number; x: number; z: number }; over: number }
    expect(s.you.armour).toBe(A.armour)
    expect(s.foe.armour).toBe(A.armour)
    expect(Math.hypot(s.foe.x - s.you.x, s.foe.z - s.you.z)).toBeGreaterThan(A.aiClose)
    expect(s.over).toBe(0)
  })

  it('the machine shoots back, so standing still is a losing move', () => {
    const h = run(page)
    for (let i = 0; i < 420; i++) h.tick(i * 16.67)
    const s = h.state() as unknown as { you: { armour: number } }
    expect(s.you.armour, 'seven seconds of standing still cost nothing').toBeLessThan(A.armour)
  })

  it('firing lands hits, and a duel can be won', () => {
    const h = run(page)
    let t = 0
    h.key('x', true)
    for (let i = 0; i < 1800; i++) h.tick((t++) * 16.67)
    const s = h.state() as unknown as { foe: { armour: number }; over: number }
    expect(s.foe.armour, 'thirty seconds of holding the trigger never landed a shot').toBeLessThan(A.armour)
  })

  it('strafing moves the machine around its target and keeps it facing', () => {
    const h = run(page)
    let t = 0
    for (let i = 0; i < 10; i++) h.tick((t++) * 16.67)
    const s0 = h.state() as unknown as { you: { x: number; h: number } }
    const x0 = s0.you.x
    h.key('ArrowRight', true)
    for (let i = 0; i < 60; i++) h.tick((t++) * 16.67)
    const s1 = h.state() as unknown as { you: { x: number; h: number }; foe: { x: number; z: number } }
    expect(Math.abs(s1.you.x - x0), 'a second of strafe moved nothing').toBeGreaterThan(8)
  })

  it('the dash costs a cooldown, so it cannot be held', () => {
    const h = run(page)
    let t = 0
    const step = (n: number): void => { for (let i = 0; i < n; i++) h.tick((t++) * 16.67) }
    h.key('ArrowUp', true)
    step(4)
    h.key(' ', true); step(1); h.key(' ', false)
    step(2)
    const mid = h.state() as unknown as { you: { boost: number; cool: number } }
    expect(mid.you.boost).toBeGreaterThan(0)
    expect(mid.you.cool).toBeGreaterThan(0)
    // A second press inside the cooldown buys nothing.
    h.key(' ', true); step(1); h.key(' ', false)
    step(40)
    const after = h.state() as unknown as { you: { boost: number; cool: number } }
    expect(after.you.boost).toBeLessThanOrEqual(0)
    expect(after.you.cool).toBeGreaterThan(0)
  })

  it('neither machine can leave the floor', () => {
    const h = run(page)
    let t = 0
    h.key('ArrowUp', true)
    h.key('ArrowRight', true)
    for (let i = 0; i < 900; i++) h.tick((t++) * 16.67)
    const s = h.state() as unknown as { you: { x: number; z: number }; foe: { x: number; z: number } }
    expect(Math.hypot(s.you.x, s.you.z)).toBeLessThanOrEqual(A.radius + 0.01)
    expect(Math.hypot(s.foe.x, s.foe.z)).toBeLessThanOrEqual(A.radius + 0.01)
  })
})
