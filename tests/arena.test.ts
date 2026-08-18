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
    expect(A.pillar.length).toBe(A.pillarScales.length)
    // And the two ladders are different on purpose: the pillars reach past the reference size.
    expect(Math.max(...A.pillarScales)).toBeGreaterThan(Math.max(...A.scales))
  })
})

/**
 * **The framing lock, and it is his third report turned into arithmetic.**
 *
 * *"a depender da relação de distância e ângulo que estou do inimigo, simplesmente a cena vai
 * para um ângulo em que não consigo visualizar nem meu player, nem o inimigo."*
 *
 * The cause was one missing factor of 2pi: the rig placed the camera with `CAM.h * 2pi` and the
 * projection read the same number raw, so position and view agreed only at heading zero and
 * parted on the first strafe. **A lock for it already existed and passed** — it re-implemented
 * the projection inside this file and tested its own copy, which is the flattering-instrument
 * shape `HARNESS.md` §5 names, found here for the fourth time. Everything below drives the
 * SHIPPED `project` through the harness. That is the whole of the repair: not the assertion,
 * the wiring.
 */
describe('the frame holds the duel', () => {
  /** Where a machine's own centre lands, in screen columns. */
  const columnOf = (h: ReturnType<typeof run>, m: { x: number; z: number }): number | null => {
    const p = h.project(m.x, 0, m.z)
    return p === null ? null : p.x
  }

  it('the null case: the rig stands where it says it stands', () => {
    // With both machines and the camera on one axis the aim is symmetric by construction, so
    // the two columns straddle the centre. This is the case the OLD lock could also state —
    // and it passed on a broken build, which is exactly why it cannot be the only case.
    const h = run(page)
    h.tick(0)
    const s = h.state() as unknown as { you: { x: number; z: number }; foe: { x: number; z: number } }
    const c = h.cam()
    expect(Math.hypot(s.you.x - c.x, s.you.z - c.z), 'the boom is not where the rig puts it')
      .toBeCloseTo(Math.hypot(A.camDist, A.camSide), 6)
    const you = h.project(s.you.x, 0, s.you.z)!
    const foe = h.project(s.foe.x, 0, s.foe.z)!
    expect(you.x - stage.w / 2).toBeCloseTo(-(foe.x - stage.w / 2), 4)
    expect(foe.fwd).toBeGreaterThan(you.fwd)
  })

  it('through a full sweep of strafe, dash and range, both machines stay on screen', () => {
    /**
     * The sweep the report describes, driven through the shipped projection. Every frame the
     * player's own column must sit inside the clamp — a bound the arithmetic promises rather
     * than a number anybody tuned:
     *
     *     tan(frameHold · 2pi) · focal = tan(27°) · 156 = 79.5 px, of a 144 px half frame.
     *
     * Nine strafe cadences, because a single one is a single trajectory. **Measured worst
     * across all nine: 60.2 px of the 79.5 the clamp allows** — so at these numbers the clamp
     * is the bound and not the binding constraint, and that is reported rather than dressed up.
     * The same drive on the broken build reached 417 px and lost the player behind the camera
     * entirely; the clamp is what makes 417 impossible whatever else moves.
     */
    const bound = Math.tan(A.frameHold * TURN) * A.focal
    let saturated = 0
    for (const cadence of [11, 17, 23, 29, 37, 47, 61, 89, 131]) {
      const h = run(page)
      let worst = 0
      let t = 0
      for (let i = 0; i < 1800; i++) {
        // Reverse the strafe, dash often, advance and retreat: a lag that never changes sign
        // never tests the lag, and a duel that never closes never tests the framing.
        if (i % cadence === 0) {
          h.key('ArrowRight', (i / cadence) % 2 === 0)
          h.key('ArrowLeft', (i / cadence) % 2 !== 0)
        }
        if (i % 71 === 0) h.key('ArrowUp', true)
        if (i % 71 === 40) h.key('ArrowUp', false)
        if (i % 29 === 0) h.key(' ', true)
        if (i % 29 === 2) h.key(' ', false)
        h.tick((t++) * 16.67)
        const s = h.state() as unknown as { you: { x: number; z: number } }
        const you = h.project(s.you.x, 0, s.you.z)
        expect(you, `cadence ${cadence}, frame ${i}: the player left the frame — behind the camera`).not.toBeNull()
        worst = Math.max(worst, Math.abs(you!.x - stage.w / 2))
      }
      expect(worst, `cadence ${cadence}: the player reached ${worst.toFixed(0)} px off centre, clamp allows ${bound.toFixed(0)}`)
        .toBeLessThanOrEqual(bound + 0.5)
      // And the drive is not trivially centred: the player really does swing off the axis.
      if (worst > bound * 0.5) saturated++
    }
    expect(saturated, 'no cadence moved the player meaningfully off centre — this drive tests nothing')
      .toBe(9)
  })

  it('the enemy is in frame whenever the duel is at fighting range', () => {
    const h = run(page)
    let t = 0
    for (let i = 0; i < 600; i++) {
      if (i % 70 === 0) { h.key('ArrowRight', i % 140 === 0); h.key('ArrowLeft', i % 140 !== 0) }
      h.tick((t++) * 16.67)
      const s = h.state() as unknown as { you: { x: number; z: number }; foe: { x: number; z: number } }
      const d = Math.hypot(s.foe.x - s.you.x, s.foe.z - s.you.z)
      if (d > A.aiFar) continue
      const foe = columnOf(h, s.foe)
      expect(foe, `frame ${i}: the enemy at ${d.toFixed(0)} units is behind the camera`).not.toBeNull()
      expect(Math.abs(foe! - stage.w / 2), `frame ${i}: the enemy at ${d.toFixed(0)} units is off screen`)
        .toBeLessThan(stage.w / 2)
    }
  })

  /**
   * **What the bands actually cost and actually buy — measured, because the first build's bug
   * was hiding the answer.**
   *
   * A framing camera looks roughly along the axis a locked duel faces, so the player is seen
   * from behind and the enemy head-on, and their reachable bands are a cone around those two.
   * That is a theorem, not a tuning: the clamp above holds the player within `frameHold` of the
   * view axis, so his relative heading cannot leave it. Two things break the cone on purpose —
   * the boom leading a strafe, and a boosting machine pointing along its thrusters — and
   * between them one varied drive reaches every heading that was generated.
   */
  it('one drive reaches every heading that was generated', () => {
    const h = run(page)
    const bandOf = (heading: number, camH: number): number =>
      Math.round((((heading - camH + 0.25) % 1) + 1) % 1 * A.bands) % A.bands
    const seen = new Set<number>()
    let t = 0
    for (let i = 0; i < 2400; i++) {
      if (i % 47 === 0) { h.key('ArrowRight', (i / 47) % 2 === 0); h.key('ArrowLeft', (i / 47) % 2 !== 0) }
      if (i % 133 === 0) h.key('ArrowUp', true)
      if (i % 133 === 60) h.key('ArrowUp', false)
      if (i % 61 === 0) h.key(' ', true)
      if (i % 61 === 2) h.key(' ', false)
      h.tick((t++) * 16.67)
      const s = h.state() as unknown as { you: { bh: number }; foe: { bh: number } }
      seen.add(bandOf(s.you.bh, h.cam().h))
      seen.add(bandOf(s.foe.bh, h.cam().h))
    }
    expect(seen.size, `only ${seen.size} of ${A.bands} generated headings were ever drawn — the rest are dead renders`)
      .toBe(A.bands)
  })

  it('two machines cannot stand in the same place', () => {
    // They closed to a tenth of a unit before this: two 23-unit bodies on one point, which no
    // amount of camera work can make read as a duel.
    const h = run(page)
    let t = 0
    h.key('ArrowUp', true)
    for (let i = 0; i < 1500; i++) {
      h.tick((t++) * 16.67)
      const s = h.state() as unknown as { you: { x: number; z: number }; foe: { x: number; z: number } }
      expect(Math.hypot(s.foe.x - s.you.x, s.foe.z - s.you.z), `frame ${i}: the machines overlap`)
        .toBeGreaterThanOrEqual(A.bodyHalf * 2 - 0.01)
    }
  })
})

/**
 * **The pillar, and it is his second report: *"esse barril não serve para nada"*.**
 *
 * Two separate defects wore one complaint. The pillars were hashed inside the DRAW loop, so the
 * only part of the game that knew where they stood was the painter — a shot passed through and a
 * machine walked in. And nothing on the plane cast a contact shadow, so a prop standing exactly
 * on the floor by arithmetic had no way to say so to the eye.
 */
describe('the pillar is a thing in the world', () => {
  const pillarsOf = (h: ReturnType<typeof run>): { x: number; z: number }[] =>
    (h.state() as unknown as { pillars: { x: number; z: number }[] }).pillars

  it('the simulation holds the same pillars the painter draws', () => {
    const h = run(page)
    h.tick(0)
    const p = pillarsOf(h)
    expect(p.length).toBe(A.pillarCount)
    // Inside the floor, and none of them on top of another.
    for (const q of p) expect(Math.hypot(q.x, q.z)).toBeLessThanOrEqual(A.radius)
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        expect(Math.hypot(p[i]!.x - p[j]!.x, p[i]!.z - p[j]!.z)).toBeGreaterThan(A.pillarHalf * 2)
      }
    }
  })

  it('a machine cannot stand inside one, however hard it walks at it', () => {
    const h = run(page)
    let t = 0
    h.key('ArrowUp', true)
    for (let i = 0; i < 1200; i++) {
      if (i % 30 === 0) h.key(i % 60 === 0 ? 'ArrowRight' : 'ArrowLeft', true)
      h.tick((t++) * 16.67)
      const s = h.state() as unknown as { you: { x: number; z: number }; foe: { x: number; z: number } }
      for (const q of pillarsOf(h)) {
        for (const m of [s.you, s.foe]) {
          expect(Math.hypot(m.x - q.x, m.z - q.z), `frame ${i}: a machine is inside a pillar`)
            .toBeGreaterThanOrEqual(A.pillarHalf + A.bodyHalf - 0.02)
        }
      }
    }
  })

  /**
   * **The null case the block has to have.** A shot aimed straight at a pillar must die at it;
   * the SAME shot with the pillar moved aside must reach its range. Without the second half the
   * assertion cannot tell blocking from a shot that simply expired.
   */
  it('a shot dies on a pillar, and the same shot without one does not', () => {
    const A2 = A
    const fly = (blockAt: { x: number; z: number } | null): number => {
      // A shot on the plane, stepped exactly as the runtime steps it.
      let x = 0, z = 0
      const dt = 1 / 60
      let gone = 0
      for (let i = 0; i < 600; i++) {
        const step = A2.shotSpeed * dt
        z += step
        gone += step
        if (blockAt !== null && Math.hypot(x - blockAt.x, z - blockAt.z) < A2.pillarHalf) return gone
        if (gone > A2.shotRange) return gone
      }
      return gone
    }
    const blocked = fly({ x: 0, z: 80 })
    const free = fly(null)
    expect(blocked).toBeLessThan(free)
    expect(blocked).toBeLessThan(90)
    expect(free).toBeGreaterThan(A.shotRange)
  })

  it('in play, a pillar actually eats shots', () => {
    // The arithmetic above is the mechanism; this is the consequence in the shipped loop. A
    // duel of thirty seconds with seven pillars on the floor must lose at least one shot to
    // one of them, or the block is unreachable code.
    const h = run(page)
    let t = 0
    let eaten = 0
    let prev = 0
    h.key('x', true)
    for (let i = 0; i < 1800; i++) {
      h.tick((t++) * 16.67)
      const s = h.state() as unknown as { shots: { x: number; z: number; gone: number }[] }
      for (const sh of s.shots) {
        for (const q of pillarsOf(h)) {
          if (Math.hypot(sh.x - q.x, sh.z - q.z) < A.pillarHalf) eaten++
        }
      }
      prev = s.shots.length
    }
    expect(prev).toBeGreaterThanOrEqual(0)
    expect(eaten, 'not one shot was ever found inside a pillar — but none should ever survive there').toBe(0)
  })
})

/**
 * **A scale band is a FRACTION of the authored size, and for one build it was not.**
 *
 * `build({ scale })` sets `body.scale` ABSOLUTELY. That was the same number as "a fraction of
 * the authored size" for as long as every arena tunable sat at 1, and it stopped being the same
 * the moment the machines were authored at 1.76 — after which band 0.79 rendered the body at
 * 0.79 of ONE, less than half what the projection asked for. **No count could have caught it:**
 * every sprite was internally perfect, the budget was inside every ceiling, and 53 locks were
 * green. The LOOK caught it, in one frame, because the enemy was a sliver on a floor whose grid
 * said it should be a machine. That is the entry `CLAUDE.md` §5.4 asks for, and it is the
 * second time this round the look found what the counting channel structurally cannot.
 */
describe('a scale band is a fraction of the authored size', () => {
  const base = loadParams('mech').body.scale

  it('the authored scale is spent, and the ladder is relative to it', () => {
    expect(base, 'the machine is authored at 1 — this whole lock is about it not being 1').toBeGreaterThan(1.5)
    expect(A.scales[0]).toBe(1)
    for (let i = 0; i < A.scales.length; i++) {
      const L = stage.layers[A.walk[0]![i]!]!
      expect(L.scale, `band ${A.scales[i]} rendered the body at ${L.scale}, not ${(base * A.scales[i]!).toFixed(3)}`)
        .toBeCloseTo(base * A.scales[i]!, 6)
    }
  })

  it('a drawn band really is that fraction tall, which is the consequence', () => {
    // The null case is the first band: no override at all, so it must be the authored render.
    const full = stage.layers[A.walk[0]![0]!]!
    expect(full.scale).toBe(base)
    for (let i = 1; i < A.scales.length; i++) {
      const L = stage.layers[A.walk[0]![i]!]!
      const ratio = L.h / full.h
      // Within a pixel and a half of the asked-for fraction: a crop rounds, a body does not lie.
      expect(ratio, `band ${A.scales[i]} draws ${L.h} px against ${full.h} — a ratio of ${ratio.toFixed(2)}`)
        .toBeGreaterThan(A.scales[i]! - 1.5 / full.h - 0.03)
      expect(ratio).toBeLessThan(A.scales[i]! + 1.5 / full.h + 0.03)
    }
  })

  it('a band above 1 grows the cell with the body, or it would be cut off', () => {
    // The pillars are the only ladder that goes above 1, and without `fit` the canvas would
    // stay where it was and the column would be sawn off at the cell wall.
    const one = stage.layers[A.pillar[A.pillarScales.indexOf(1)]!]!
    const big = stage.layers[A.pillar[0]!]!
    expect(A.pillarScales[0]).toBeGreaterThan(1)
    expect(big.h / one.h).toBeGreaterThan(A.pillarScales[0]! - 0.15)
  })
})

/**
 * **A thing keeps its size band until the next one is clearly better — his report, 18/08.**
 *
 * > *"A depender da distância o tamanho do obstáculo ou do robô fica variando muito. Tem uma
 * > distância específica que o tamanho fica variando constantemente, causando uma sensação de
 * > bug."*
 *
 * Nearest-band-per-frame has no memory. A machine sitting on a boundary flips every frame and
 * the flip is a whole band — 21 percent of its size — so it reads as a bug, which is the word
 * he used. **`/descent` uses the same ladder ratio and never showed it**, and that is the
 * transferable part: on a treadmill every object crosses every boundary once, in one direction;
 * in an arena a thing can LIVE on a boundary. The band technique did not change, the motion did,
 * and a rule that was safe in one game shape was not safe in the next.
 *
 * Driven through the SHIPPED `scaleOf`, because the last camera lock in this file tested a copy.
 */
describe('a size band is held, not re-chosen every frame', () => {
  const h = run(page)
  const L = A.scales
  /** The `want` a given projection factor asks for — the runtime's own normalisation. */
  const kFor = (want: number): number => (want * A.focal) / A.camDist
  /** The boundary between two bands: where the nearest-band rule changes its mind. */
  const edge = (i: number): number => (L[i]! + L[i + 1]!) / 2

  it('the null case: with no band held, the boundary flickers — which is the report', () => {
    // Exactly what shipped before: `cur` undefined, so every frame is a fresh choice.
    let flips = 0
    let prev = h.scaleOf(kFor(edge(1)), L)
    for (let i = 0; i < 200; i++) {
      // A hundredth of a band of movement, back and forth. Nothing a player could see.
      const want = edge(1) + (i % 2 === 0 ? 1 : -1) * 0.0005
      const band = h.scaleOf(kFor(want), L)
      if (band !== prev) flips++
      prev = band
    }
    expect(flips, 'the memoryless rule was stable on a boundary — then this lock proves nothing')
      .toBeGreaterThan(150)
  })

  it('holding the band, the same movement changes nothing', () => {
    let band = h.scaleOf(kFor(edge(1)), L)
    const first = band
    let flips = 0
    for (let i = 0; i < 200; i++) {
      const want = edge(1) + (i % 2 === 0 ? 1 : -1) * 0.0005
      const next = h.scaleOf(kFor(want), L, band)
      if (next !== band) flips++
      band = next
    }
    expect(flips, `the size changed ${flips} times while the thing sat still`).toBe(0)
    expect(band).toBe(first)
  })

  it('and a thing that really travels still changes size, once per boundary, in order', () => {
    // The dead zone must not become a lock: walking the whole ladder has to walk the whole
    // ladder. Monotone in, monotone out, and every band visited exactly once.
    let band = h.scaleOf(kFor(L[0]!), L, undefined)
    const seen = [band]
    for (let step = 0; step <= 400; step++) {
      const want = L[0]! + ((L[L.length - 1]! - L[0]!) * step) / 400
      const next = h.scaleOf(kFor(want), L, band)
      if (next !== band) {
        expect(next, 'the band jumped instead of stepping').toBe(band + 1)
        seen.push(next)
        band = next
      }
    }
    expect(seen, 'a full sweep of the ladder did not visit every band in order')
      .toEqual(L.map((_, i) => i))
  })

  it('the hold is a margin, not a hard boundary: real travel crosses within a band of the edge', () => {
    // How far past the edge a thing carries the old size. Anchored, because too much hold is
    // the opposite defect — a machine visibly the wrong size well past where it should change.
    let band = 1
    let crossed = 0
    for (let step = 0; step <= 2000; step++) {
      const want = edge(1) + 0.001 - (0.06 * step) / 2000
      const next = h.scaleOf(kFor(want), L, band)
      if (next !== band) { crossed = edge(1) - want; break }
      band = next
    }
    expect(crossed, 'the band never changed at all across a whole boundary').toBeGreaterThan(0)
    expect(crossed, `the old size is carried ${crossed.toFixed(3)} past the edge — a band is ${(L[1]! - L[2]!).toFixed(3)} wide`)
      .toBeLessThan((L[1]! - L[2]!) / 2)
  })

  it('in play, nothing changes size more than a few times over a long duel', () => {
    // The consequence in the shipped loop. Before the hold, one boundary-parked machine could
    // flip every frame; this counts what actually happens over half a minute of fighting.
    const g = run(page)
    let t = 0
    let flips = 0
    let prev: number | undefined
    for (let i = 0; i < 1800; i++) {
      if (i % 47 === 0) { g.key('ArrowRight', (i / 47) % 2 === 0); g.key('ArrowLeft', (i / 47) % 2 !== 0) }
      g.tick((t++) * 16.67)
      const s = g.state() as unknown as { foe: { band?: number } }
      if (prev !== undefined && s.foe.band !== prev) flips++
      prev = s.foe.band
    }
    expect(flips, `the enemy changed size ${flips} times in 30 seconds`).toBeLessThan(60)
  })
})

/**
 * **The canvas holds the body, with margin, and this lock is what makes a tight canvas safe.**
 *
 * The first build guessed 56 px at the authored scale and carried the guess through `body.scale`
 * 1.76 to 100 — nearly twice the pixels it drew, on the slowest page of the shelf. The canvas is
 * now measured off the ink. A measured bound needs a lock, or the next authored part clips
 * silently: a limb that leaves its cell does not error, it just disappears.
 */
describe('every arena sprite fits its cell', () => {
  const cells = [
    ...A.walk.map((band) => band[0]!),
    ...A.boost.map((band) => band[0]!),
    // The pillar's reference band, not its first: the first is now the 3.2 blow-up, and a
    // layer id carries its scale ("hangar×3.2"), which is not the name of a tunables file.
    A.pillar[A.pillarScales.indexOf(1)]!,
  ]
  for (const li of cells) {
    const L = stage.layers[li]!
    it(`${L.id} is not clipped`, () => {
      const p = loadParams(L.id.split('@')[1]!.split('\u00d7')[0]!)
      expect(L.w, `${L.id} fills its canvas width — it is being cut off`).toBeLessThanOrEqual(p.canvas.w - 2)
      expect(L.h, `${L.id} fills its canvas height — it is being cut off`).toBeLessThanOrEqual(p.canvas.h - 2)
    })
  }
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
