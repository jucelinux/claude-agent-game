import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { cryptScene } from '../src/micro/crypt-scene.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { loadParams } from '../src/io/load.ts'
import { evaluate } from '../src/core/gait.ts'
import type { Harness } from './harness.ts'
import { run } from './harness.ts'

/**
 * **The run, driven headless, and the question it answers is whether the double jump is load
 * bearing.**
 *
 * His commission named the somersault as *the differentiator*. A differentiator that a player
 * never needs is decoration, so the assertion is not "the flip plays" — it is **the graveyard
 * contains obstacles that cannot be cleared without it**, and that is arithmetic over the art
 * rather than an opinion about the design.
 */

const stage = toStage(cryptScene)
const N = stage.runner!
const page = gamePage({ id: 'crypt', title: 'The run', blurb: '', date: '', meta: [], stage })

const APEX_ONE = (N.jump * N.jump) / (2 * N.gravity)
const APEX_TWO = APEX_ONE + (N.flip * N.flip) / (2 * N.gravity)
/** Every stone's height is read from its own art: the crop's top row above the ground line. */
const heights = N.stones.map((i) => -stage.layers[i]!.oy)

describe('the somersault is load bearing', () => {
  /**
   * **The commission's differentiator has to be a mechanic and not a flourish**, and the only
   * way to say that without an opinion is arithmetic: some obstacle must be taller than one jump
   * can reach and shorter than two.
   */
  it('some stone is out of reach of one jump and inside two', () => {
    expect(heights.some((h) => h > APEX_ONE)).toBe(true)
    expect(heights.every((h) => h < APEX_TWO - 2)).toBe(true)
  })

  it('and some stone is clearable without it, or the second jump is not a choice', () => {
    expect(heights.some((h) => h < APEX_ONE - 2)).toBe(true)
  })

  /**
   * **The turn completes.** This is the defect `Gait.wrap` exists for, asserted at the level it
   * was found: the root's angle across the clip's frames must reach a full revolution and must
   * never come back down. Authored as a cycle it climbed to 270 degrees and unwound to 77.
   */
  it('the flip turns one whole circle and never unwinds', () => {
    const g = grammarByName('bones-flip')
    const params = loadParams('bones-flip')
    const n = params.frames.walk
    const angles: number[] = []
    for (let i = 0; i < n; i++) {
      angles.push((evaluate(g.gait, params, i / (n - 1)).get('hips')?.angle ?? 0) * 360)
    }
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i]!, `frame ${i} turned back toward frame ${i - 1}`).toBeGreaterThan(angles[i - 1]!)
    }
    expect(angles[0]).toBeCloseTo(0, 5)
    expect(angles.at(-1)).toBeCloseTo(360, 3)
  })

  /** The null case: with the flag on, the same clip is the defect again. */
  it('and as a cycle it does not — the flag is what fixes it', () => {
    const g = grammarByName('bones-flip')
    const params = loadParams('bones-flip')
    const cyclic = { ...g.gait, wrap: true }
    const n = params.frames.walk
    const angles = Array.from({ length: n }, (_, i) => (evaluate(cyclic, params, i / n).get('hips')?.angle ?? 0) * 360)
    // A cyclic curve cannot end a whole turn from where it began: it either unwinds toward the
    // first key or overshoots past it reaching for one. Both are the same defect — the body does
    // not finish upright — and neither is a full revolution.
    expect(Math.abs((angles.at(-1) as number) - 360)).toBeGreaterThan(10)
    const monotone = angles.every((a, i) => i === 0 || a > (angles[i - 1] as number))
    expect(monotone, 'the cyclic version happened to be monotone, so the flag proves nothing').toBe(false)
  })
})

describe('the graveyard', () => {
  it('never puts two stones closer than one jump apart', () => {
    const hash = (k: number): { x: number; v: number } => {
      let h = ((k + N.seed) * 2654435761) >>> 0
      h = (h ^ (h >>> 13)) >>> 0
      let h2 = (h * 1597334677) >>> 0
      h2 = (h2 ^ (h2 >>> 15)) >>> 0
      return { x: N.leadIn + k * N.spacing + (h % N.jitterX), v: (h2 >>> 7) % N.stones.length }
    }
    let worst = Infinity
    const seen = new Set<number>()
    for (let k = 1; k < 10_000; k++) {
      const gap = hash(k).x - hash(k - 1).x
      if (gap < worst) worst = gap
      seen.add(hash(k).v)
      expect(gap).toBeGreaterThan(0)
    }
    /**
     * **The floor is `spacing - jitterX`, not `spacing`.** The gap between two stones is
     * `spacing + jitter(k) - jitter(k-1)`, so a jitter that only ever adds still shortens half
     * the gaps. It is the climb's band-height mistake in a second scene, which is why the bound
     * is asserted rather than reasoned about.
     */
    expect(worst).toBeGreaterThanOrEqual(N.spacing - N.jitterX)
    // A single jump hangs for this long; the closest pair must not arrive inside one.
    const hang = (2 * N.jump) / N.gravity
    expect(worst / N.maxSpeed).toBeGreaterThan(hang * 0.9)
    expect(seen.size).toBe(N.stones.length)
  })
})

describe('the loop', () => {
  const play = (seconds: number, at?: (i: number, h: Harness) => void): Harness => {
    const h = run(page)
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      at?.(i, h)
      h.tick(i * 16.67)
    }
    return h
  }

  it('he runs without being told to, and the distance counts up', () => {
    const h = play(4)
    expect(h.state().dist).toBeGreaterThan(300)
    expect(h.text['score']).toMatch(/\d+ m/)
  })

  /** Two presses, two impulses, and the second one only in the air. */
  it('the second press flips him and a third does nothing', () => {
    const h = run(page)
    let t = 0
    const step = (n: number): void => { for (let i = 0; i < n; i++) h.tick((t++) * 16.67) }
    const tap = (): void => { h.key(' ', true); step(1); h.key(' ', false) }
    step(10)
    tap(); step(4)
    expect(h.state().state).toBe('leap')
    expect(h.state().jumps).toBe(1)
    tap(); step(2)
    expect(h.state().state).toBe('flip')
    expect(h.state().jumps).toBe(2)
    const before = h.state().y
    tap(); step(2)
    expect(h.state().jumps, 'a third press bought another jump').toBe(2)
    expect(h.state().y).toBeLessThan(before + 40)
  })

  /**
   * **Death arrives, and she is the consequence.** A player who never presses anything hits
   * every stone in the graveyard, and six collisions is the whole budget.
   */
  it('never jumping ends the run, and space starts another', () => {
    const h = play(40)
    expect(h.state().over, 'forty seconds of never jumping never ended the run').toBe(true)
    expect(h.text['score']).toMatch(/she caught you at \d+ m/)
    h.key(' ', true)
    h.tick(99_999)
    h.key(' ', false)
    h.tick(100_016)
    expect(h.state().over).toBe(false)
    // **A fresh run starts on clear ground.** Without `leadIn` the first stone could sit inside
    // the runner's own box at distance zero, so restarting cost a collision before the player
    // had touched a key — a defect that only ever happens on frame one and that no amount of
    // playing would have found reliably.
    expect(h.state().menace).toBeLessThan(0.01)
  })

  /** And jumping keeps her off: the same seconds, a very different outcome. */
  it('a player who jumps survives what a player who does not cannot', () => {
    const idle = play(24)
    const jumper = play(24, (i, h) => {
      // Press on a fixed rhythm — not aiming, just moving. It is the worst case that still
      // uses the mechanic at all.
      if (i % 34 === 0) { h.key(' ', true) } else if (i % 34 === 2) { h.key(' ', false) }
    })
    expect(jumper.state().menace).toBeLessThan(idle.state().menace)
  })
})
