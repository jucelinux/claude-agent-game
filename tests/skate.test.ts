import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { skateScene } from '../src/micro/skate-scene.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { loadParams } from '../src/io/load.ts'
import { evaluate } from '../src/core/gait.ts'
import { sprite } from '../src/core/render.ts'
import type { Harness } from './harness.ts'
import { run } from './harness.ts'

/**
 * **The street, driven headless, and the question is whether the ROLL is load bearing.**
 *
 * The crypt's version of this file asked whether the somersault was a differentiator or a
 * decoration, and answered it with arithmetic over the art. The same question applies here twice
 * over, because the flip is the thing the whole round was commissioned for:
 *
 * 1. Does the board actually turn a full circle, and does it stay turned?
 * 2. Does the **picture** change because of it — the two deck faces trading places?
 * 3. Is there an obstacle a player cannot clear without pressing twice?
 * 4. Does a collision end the run, now that there is no chaser to spend it on?
 */

const stage = toStage(skateScene)
const N = stage.runner!
const page = gamePage({ id: 'skate', title: 'Kickflip', blurb: '', date: '', meta: [], stage })

const APEX_ONE = (N.jump * N.jump) / (2 * N.gravity)
const APEX_TWO = APEX_ONE + (N.flip * N.flip) / (2 * N.gravity)
/** Each obstacle's height above the ground, read from its own art rather than from a number. */
const heights = N.stones.map((i) => -stage.layers[i]!.oy)

describe('the kickflip is a rotation and not a pose', () => {
  it('the board turns one whole circle and never unwinds', () => {
    /**
     * **The crypt's somersault test, on the channel that did not exist then.**
     *
     * That clip put its full turn on `angle`, in the screen plane, and needed `Gait.wrap: false` so
     * the cyclic Hermite would stop pulling the last frame back toward the first. Roll inherits
     * both the mechanism and the trap: authored as a cycle, a monotone 0-to-1 track climbs to three
     * quarters and then rolls backwards out of it.
     */
    const g = grammarByName('skate-flip')
    const params = loadParams('skate-flip')
    const n = params.frames.walk
    const rolls: number[] = []
    for (let i = 0; i < n; i++) {
      const at = g.gait.wrap === false ? i / (n - 1) : i / n
      rolls.push((evaluate(g.gait, params, at).get('board')?.roll ?? 0) * 360)
    }
    // One full turn, in the direction that brings the pale underside toward the camera first.
    expect(rolls[0]).toBeCloseTo(0, 4)
    expect(rolls[n - 1]).toBeCloseTo(-360, 2)
    // Monotone: every frame turns further than the last. A clip that eased at the quarters would
    // read as four poses rather than one rotation, and a cyclic one would reverse.
    for (let i = 1; i < n; i++) expect(rolls[i]).toBeLessThan(rolls[i - 1] as number)
  })

  it('and as a cycle it does not — `wrap: false` is what fixes it, here as well', () => {
    const g = grammarByName('skate-flip')
    const params = loadParams('skate-flip')
    const n = params.frames.walk
    const cyclic = { ...g.gait, wrap: true }
    const rolls = Array.from({ length: n }, (_, i) => (evaluate(cyclic, params, i / n).get('board')?.roll ?? 0) * 360)
    const monotone = rolls.every((r, i) => i === 0 || r < (rolls[i - 1] as number))
    expect(monotone, 'sampled as a cycle the flip did NOT unwind, so the flag proves nothing').toBe(false)
  })

  /**
   * **The picture changes, and this is the assertion the whole round rests on.**
   *
   * A roll that turned the transform without turning the *image* would pass every arithmetic test
   * above. The deck's underside is `wood` and its top is `grip`, and they are the widest-separated
   * pair in the palette. Through one flip each has to swell to a full face and collapse to nothing,
   * a quarter turn apart — which is a fact about pixels and is counted rather than argued.
   */
  it('the deck shows its wood face, then its grip face, and each one nearly vanishes', () => {
    const g = grammarByName('skate-flip')
    const params = loadParams('skate-flip')
    const n = params.frames.walk
    const deckAt = g.parts.findIndex((p) => p.name === 'deck')
    const gripAt = g.parts.findIndex((p) => p.name === 'grip')
    expect(deckAt).toBeGreaterThanOrEqual(0)
    expect(gripAt).toBeGreaterThanOrEqual(0)

    const deck: number[] = []
    const grip: number[] = []
    for (let i = 0; i < n; i++) {
      const f = sprite(g, params, 1, i / (n - 1))
      let d = 0
      let p = 0
      for (const o of f.owners) {
        if (o === deckAt) d++
        else if (o === gripAt) p++
      }
      deck.push(d)
      grip.push(p)
    }
    const peak = (a: number[]): number => a.indexOf(Math.max(...a))

    // Each face reaches a full width and each nearly disappears: 2.4 px of edge against 8 of face.
    expect(Math.max(...deck)).toBeGreaterThan(80)
    expect(Math.min(...deck)).toBeLessThan(20)
    expect(Math.max(...grip)).toBeGreaterThan(80)
    expect(Math.min(...grip)).toBeLessThan(20)
    // And they peak a quarter turn apart, wood first — which is the read the direction was chosen
    // for. Reversed, a player would see the dark face at the top of the jump.
    expect(peak(deck)).toBeLessThan(peak(grip))
    expect(peak(grip) - peak(deck)).toBeGreaterThan(n / 5)
  })

  it('the rolling clip carries no roll at all, which is the new channel\'s null case', () => {
    const g = grammarByName('skate-roll')
    const params = loadParams('skate')
    expect(params.gait.roll).toBe(0)
    for (let i = 0; i < params.frames.walk; i++) {
      expect(evaluate(g.gait, params, i / params.frames.walk).get('board')?.roll ?? 0).toBe(0)
    }
  })

  /**
   * **The ollie is the control, and it must stay on the old path.**
   *
   * Every rotation in it is `Bone.angle`. If a roll ever appears there, the clip has stopped being
   * a control and a bad reading could no longer be attributed to the new channel — which is the
   * structure run 7 used when it re-rendered run 5's walk through the new depth solver unchanged.
   */
  it('the ollie is authored entirely in the screen plane', () => {
    const g = grammarByName('skate-ollie')
    expect(g.gait.tracks.some((t) => t.channel === 'roll')).toBe(false)
    expect(loadParams('skate-ollie').gait.roll).toBe(0)
  })
})

describe('the street', () => {
  it('some obstacle is out of reach of one ollie and inside two', () => {
    const hard = heights.filter((h) => h > APEX_ONE)
    expect(hard.length, `nothing needs the flip: apex ${APEX_ONE.toFixed(0)} px, heights ${heights.join()}`).toBeGreaterThan(0)
    for (const h of hard) expect(h).toBeLessThan(APEX_TWO)
  })

  it('and some obstacle is clearable without it, or the second press is not a choice', () => {
    expect(heights.some((h) => h < APEX_ONE)).toBe(true)
  })

  it('never puts two obstacles closer than one ollie apart', () => {
    /**
     * **`stoneAt` from the runtime, reproduced byte for byte — and the shift I dropped is the
     * warning worth keeping.**
     *
     * I wrote `(b ^ (b >>> 15)) % N.stones.length` and left off both the `>>> 0` and the `>>> 7`.
     * XOR returns a *signed* int32, so the modulus went negative and the test reported **9 distinct
     * obstacle kinds out of 5** — a world that does not exist, asserted against a game that does.
     *
     * A hash copied into a test is a second implementation of the world's layout, which is the
     * exact smell the engine already paid for: *"a rule copied into three places is three rules"*.
     * It is kept because the runtime is a string and cannot be imported, and the comment is here so
     * whoever touches `stoneAt` knows this copy exists.
     */
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
    // The jitter only ever adds, so the base spacing is NOT a floor: a gap is
    // `spacing + jitter(k) - jitter(k-1)`, and the worst case is `spacing - jitterX`. That is the
    // crypt's mistake and the climb's before it, so it is asserted rather than reasoned about.
    expect(worst).toBeGreaterThanOrEqual(N.spacing - N.jitterX)
    const hang = (2 * N.jump) / N.gravity
    expect(worst / N.maxSpeed).toBeGreaterThan(hang * 0.9)
    expect(seen.size).toBe(N.stones.length)
  })
})

describe('the loop', () => {
  const play = (seconds: number): Harness => {
    const h = run(page)
    for (let i = 0; i < Math.round(seconds * 60); i++) h.tick(i * 16.67)
    return h
  }

  it('he rolls without being told to, and the distance counts up', () => {
    // **1.5 s, and not the crypt's 4.** At 4 seconds this asserted 300 px and measured 247, which
    // is not a slow start — it is the first kerb at 240 px ending the run. The crypt allows six
    // collisions, so it can afford to measure distance over four idle seconds; a street cannot.
    // The number that looked like a bug was the new consequence working.
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
    expect(h.state().jumps, 'a third press bought another jump').toBe(2)
  })

  /**
   * **One collision ends the run, and that is the whole consequence.**
   *
   * The crypt spends a hit as time off a closing gap and allows six. A street has nothing chasing
   * you, so the first kerb at speed is the end — the dinosaur's rule. This is also the lock on
   * `Runner.reaper` being optional: without the guard, the runtime reads `creep` off `undefined` on
   * the first frame and the page never renders at all.
   */
  it('never jumping ends the run at the first obstacle, and space starts another', () => {
    const h = play(12)
    expect(h.state().over, 'twelve seconds of never jumping never ended the run').toBe(true)
    expect(h.text['score']).toMatch(/you ate it at \d+ m/)
    // The chaser is absent rather than merely invisible: `menace` never moves off zero.
    expect(h.state().menace).toBe(0)

    h.key(' ', true)
    h.tick(99_999)
    h.key(' ', false)
    h.tick(100_016)
    expect(h.state().over).toBe(false)
    // A fresh run starts on clear ground, or restarting costs a collision before a key is pressed.
    expect(h.state().dist).toBeLessThan(N.leadIn)
  })
})
