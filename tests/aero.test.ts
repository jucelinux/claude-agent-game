import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { aeroScene } from '../src/micro/aero-scene.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { loadParams } from '../src/io/load.ts'
import { evaluate } from '../src/core/gait.ts'
import { sprite } from '../src/core/render.ts'
import type { Harness } from './harness.ts'
import { run } from './harness.ts'

/**
 * **The dawn patrol, driven headless — and the question is whether the roll TRANSFERRED.**
 *
 * The kickflip proved `Bone.roll` on a plank: a leaf bone, three children, no rotating parent.
 * `TASTE.md` §2b says dominance transfers along the axis it was proven on and never across it, so
 * this file is the transfer's evidence, on the questions the skate file could not ask:
 *
 * 1. Does a roll on the **root** of a 21-part skeleton turn the whole machine — including every
 *    positioned child the run-17 defect class would have left behind?
 * 2. Does the **span** prove it — mass that lives entirely in depth at rest arriving on screen at
 *    the quarter turn? A face swap can be painted; a silhouette that grows cannot.
 * 3. Is the climb still clean of roll, so a bad reading can be attributed?
 * 4. Does the street's game arithmetic survive the move into the air?
 */

const stage = toStage(aeroScene)
const N = stage.runner!
const page = gamePage({ id: 'aero', title: 'Barrel roll', blurb: '', date: '', meta: [], stage })

const APEX_ONE = (N.jump * N.jump) / (2 * N.gravity)
const APEX_TWO = APEX_ONE + (N.flip * N.flip) / (2 * N.gravity)
/** Each obstacle's height above the cruise line, read from its own art. */
const heights = N.stones.map((i) => -stage.layers[i]!.oy)

describe('the barrel roll is a rotation of the whole machine', () => {
  it('the hull turns one whole circle and never unwinds', () => {
    const g = grammarByName('aero-roll')
    const params = loadParams('aero-roll')
    const n = params.frames.walk
    const rolls: number[] = []
    for (let i = 0; i < n; i++) {
      const at = g.gait.wrap === false ? i / (n - 1) : i / n
      rolls.push((evaluate(g.gait, params, at).get('hull')?.roll ?? 0) * 360)
    }
    expect(rolls[0]).toBeCloseTo(0, 4)
    expect(rolls[n - 1]).toBeCloseTo(-360, 2)
    // Monotone: a roll that eased at the quarters would read as four poses, not one turn.
    for (let i = 1; i < n; i++) expect(rolls[i]).toBeLessThan(rolls[i - 1] as number)
  })

  it('and as a cycle it does not — wrap: false is load-bearing here as it was on the deck', () => {
    const g = grammarByName('aero-roll')
    const params = loadParams('aero-roll')
    const n = params.frames.walk
    const cyclic = { ...g.gait, wrap: true }
    const rolls = Array.from({ length: n }, (_, i) => (evaluate(cyclic, params, i / n).get('hull')?.roll ?? 0) * 360)
    const monotone = rolls.every((r, i) => i === 0 || r < (rolls[i - 1] as number))
    expect(monotone, 'sampled as a cycle the roll did NOT unwind, so the flag proves nothing').toBe(false)
  })

  /**
   * **The two wing faces trade places — the deck's proof, on fabric.** Crimson above, cream
   * below, the widest-separated pair on the subject. Through one turn each must swell to a face
   * and collapse to nearly an edge, pale first (the roll is negative for exactly that reason).
   */
  it('the wing shows its cream face, then its crimson face, and each nearly vanishes', () => {
    const g = grammarByName('aero-roll')
    const params = loadParams('aero-roll')
    const n = params.frames.walk
    const topAt = g.parts.findIndex((p) => p.name === 'wingTopA')
    const underAt = g.parts.findIndex((p) => p.name === 'wingTopB')
    expect(topAt).toBeGreaterThanOrEqual(0)
    expect(underAt).toBeGreaterThanOrEqual(0)

    const crimson: number[] = []
    const cream: number[] = []
    for (let i = 0; i < n; i++) {
      const f = sprite(g, params, 1, i / (n - 1))
      let a = 0
      let b = 0
      for (const o of f.owners) {
        if (o === topAt) a++
        else if (o === underAt) b++
      }
      crimson.push(a)
      cream.push(b)
    }
    const peak = (arr: number[]): number => arr.indexOf(Math.max(...arr))

    // Each face reaches many times its resting sliver: 1.2 px of edge against a 10×26 face.
    expect(Math.max(...crimson)).toBeGreaterThan(80)
    expect(Math.min(...crimson)).toBeLessThan(20)
    expect(Math.max(...cream)).toBeGreaterThan(40)
    expect(Math.min(...cream)).toBeLessThan(12)
    // Pale before dark, half a turn apart: the direction was chosen so the middle of the trick
    // is the flash, the kickflip's reasoning verbatim.
    expect(peak(cream)).toBeLessThan(peak(crimson))
    expect(peak(crimson) - peak(cream)).toBeGreaterThan(n / 4)
  })

  /**
   * **The span sweep: the machine grows mass that was never on screen.** 26 px of wing live
   * entirely in depth at rest. At the quarter turn they stand vertical, and the painted box has
   * to say so — this is the assertion a painted face-swap could never pass, and the reason the
   * biplane was chosen over a second plank.
   */
  it('at the quarter turn the sprite is at least half again as tall as at rest', () => {
    const g = grammarByName('aero-roll')
    const params = loadParams('aero-roll')
    const n = params.frames.walk
    const heightAt = (t: number): number => {
      const f = sprite(g, params, 1, t)
      let y0 = Infinity
      let y1 = -1
      for (let y = 0; y < f.buf.h; y++) {
        for (let x = 0; x < f.buf.w; x++) {
          if (f.buf.data[y * f.buf.w + x] === 0) continue
          if (y < y0) y0 = y
          if (y > y1) y1 = y
        }
      }
      return y1 - y0 + 1
    }
    const rest = heightAt(0)
    const quarter = heightAt(3 / (n - 1))
    const threeQ = heightAt(9 / (n - 1))
    expect(quarter).toBeGreaterThan(rest * 1.5)
    expect(threeQ).toBeGreaterThan(rest * 1.5)
    // And it comes back: the machine ends the turn the shape it began it.
    expect(heightAt(1)).toBeLessThan(rest * 1.25)
  })

  /**
   * **The far running gear crosses the machine mid-turn.** At rest the far wheel hides exactly
   * behind the near one and paints nothing — symmetric on purpose, the skate's wheels. Through
   * the roll it must appear, because a child's OFFSET has to come round with a rolled parent:
   * the run-17 defect class ("every field that carries a position has to rotate"), asserted on
   * the deepest skeleton the channel has turned.
   */
  it('the far wheel paints nothing at rest and something mid-roll', () => {
    const g = grammarByName('aero-roll')
    const params = loadParams('aero-roll')
    const n = params.frames.walk
    const farAt = g.parts.findIndex((p) => p.name === 'wheelF')
    const counts: number[] = []
    for (let i = 0; i < n; i++) {
      const f = sprite(g, params, 1, i / (n - 1))
      counts.push(f.owners.reduce((s, o) => s + (o === farAt ? 1 : 0), 0))
    }
    expect(counts[0], 'at rest the far wheel should hide behind the near one').toBe(0)
    expect(Math.max(...counts), 'the far wheel never came round — offsets did not roll').toBeGreaterThan(4)
  })

  it('the cruise carries no roll at all — the channel’s null case on this subject', () => {
    const g = grammarByName('aero-cruise')
    const params = loadParams('aero')
    expect(params.gait.roll).toBe(0)
    for (let i = 0; i < params.frames.walk; i++) {
      expect(evaluate(g.gait, params, i / params.frames.walk).get('hull')?.roll ?? 0).toBe(0)
    }
  })

  /**
   * **The climb is the control, and it must stay on the old path.** Every rotation in it is
   * `Bone.angle`; if a roll ever appears there, a bad reading could no longer be attributed to
   * the new channel — the ollie's duty, inherited with its lock.
   */
  it('the climb is authored entirely in the screen plane', () => {
    const g = grammarByName('aero-climb')
    expect(g.gait.tracks.some((t) => t.channel === 'roll')).toBe(false)
    expect(loadParams('aero-climb').gait.roll).toBe(0)
  })
})

describe('the sky', () => {
  it('the kite balloon is out of reach of one climb and inside two', () => {
    const hard = heights.filter((h) => h > APEX_ONE)
    expect(hard.length, `nothing needs the roll: apex ${APEX_ONE.toFixed(0)} px, heights ${heights.join()}`).toBeGreaterThan(0)
    for (const h of hard) expect(h).toBeLessThan(APEX_TWO)
  })

  it('and the balloon and the flock are clearable without it, or the second press is not a choice', () => {
    expect(heights.some((h) => h < APEX_ONE)).toBe(true)
  })

  it('never puts two obstacles closer than one climb apart', () => {
    // stoneAt reproduced byte for byte, signed-shift traps and all — the skate file records why
    // this copy exists: the runtime is a string and cannot be imported.
    const hash = (k: number): { x: number; v: number } => {
      let a = ((k + N.seed) * 2654435761) >>> 0
      a = (a ^ (a >>> 13)) >>> 0
      let b = (a * 1597334677) >>> 0
      b = (b ^ (b >>> 15)) >>> 0
      return { x: N.leadIn + k * N.spacing + (a % N.jitterX), v: (b >>> 7) % N.stones.length }
    }
    let worst = Infinity
    const seen = new Set<number>()
    for (let k = 1; k < 400; k++) {
      worst = Math.min(worst, hash(k).x - hash(k - 1).x)
      seen.add(hash(k).v)
    }
    expect(worst).toBeGreaterThanOrEqual(N.spacing - N.jitterX)
    const hang = (2 * N.jump) / N.gravity
    expect(worst / N.maxSpeed).toBeGreaterThan(hang * 0.9)
    expect(seen.size).toBe(N.stones.length)
  })

  /**
   * **The drift bands are behind the traffic and inside the sky.** A cloud whose centre could
   * land below the horizon would drift through the valley, which is the depth statement of the
   * whole scene contradicted by its own decoration.
   */
  it('every drift band lives above the horizon and scrolls slower than the world', () => {
    expect(N.drift.length).toBeGreaterThan(0)
    for (const band of N.drift) {
      expect(band.maxY).toBeLessThan(N.groundRow - 20)
      expect(band.parallax).toBeGreaterThan(0)
      expect(band.parallax).toBeLessThan(1)
      for (const li of band.puffs) expect(stage.layers[li]).toBeDefined()
    }
    // Far means smaller AND slower, or the two depth statements disagree.
    const far = N.drift[0]!
    const near = N.drift[N.drift.length - 1]!
    expect(far.parallax).toBeLessThan(near.parallax)
  })
})

describe('the loop', () => {
  const play = (seconds: number): Harness => {
    const h = run(page)
    for (let i = 0; i < Math.round(seconds * 60); i++) h.tick(i * 16.67)
    return h
  }

  it('he cruises without being told to, and the distance counts up', () => {
    const h = play(1.5)
    expect(h.state().dist).toBeGreaterThan(150)
    expect(h.state().over).toBe(false)
    expect(h.text['score']).toMatch(/\d+ m/)
  })

  it('two presses, two impulses, and a third does nothing', () => {
    const h = run(page)
    let t = 0
    const step = (n: number): void => { for (let i = 0; i < n; i++) h.tick((t++) * 16.67) }
    const tap = (): void => { h.key(' ', true); step(1); h.key(' ', false) }
    step(10)
    tap(); step(3)
    expect(h.state().state).toBe('leap')
    expect(h.state().jumps).toBe(1)
    tap(); step(2)
    expect(h.state().state).toBe('flip')
    expect(h.state().jumps).toBe(2)
    tap(); step(2)
    expect(h.state().jumps, 'a third press bought another impulse').toBe(2)
  })

  it('never climbing ends the run at the first obstacle, and space starts another', () => {
    const h = play(12)
    expect(h.state().over, 'twelve seconds of level flight never hit anything').toBe(true)
    expect(h.text['score']).toMatch(/you went down at \d+ m/)
    // No chaser in the sky: menace never moves, the street's rule.
    expect(h.state().menace).toBe(0)

    h.key(' ', true)
    h.tick(99_999)
    h.key(' ', false)
    h.tick(100_016)
    expect(h.state().over).toBe(false)
    expect(h.state().dist).toBeLessThan(N.leadIn)
  })
})
