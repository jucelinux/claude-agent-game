import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { snowScene } from '../src/micro/snow-scene.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { loadParams } from '../src/io/load.ts'
import { evaluate } from '../src/core/gait.ts'
import { sprite } from '../src/core/render.ts'
import type { Harness } from './harness.ts'
import { run } from './harness.ts'

/**
 * **The rodeo, driven headless — and the question is the COMPOSITION.**
 *
 * The record declares one approximation on `Bone.roll`: it accumulates as a scalar and does not
 * commute with a parent's screen-plane angle. The skate never touched it (an unrotated parent);
 * the biplane barely (5° of attitude). The boarder's root LEANS at rest and keeps changing its
 * lean through the trick, so every frame of the rodeo runs the non-commuting pair at a different
 * value. What these locks hold:
 *
 * 1. The full turn still completes and never unwinds under the composition.
 * 2. The board's two faces still trade places — the value proof surviving the lean.
 * 3. No part is lost to the composition: the drift the record warns about would show first as
 *    a limb detaching or vanishing, and absence is the counting channel's home ground.
 * 4. The jump stays clean of roll (the control), and the game arithmetic holds.
 */

const stage = toStage(snowScene)
const N = stage.runner!
const page = gamePage({ id: 'snow', title: 'Rodeo', blurb: '', date: '', meta: [], stage })

const APEX_ONE = (N.jump * N.jump) / (2 * N.gravity)
const APEX_TWO = APEX_ONE + (N.flip * N.flip) / (2 * N.gravity)
const heights = N.stones.map((i) => -stage.layers[i]!.oy)

describe('the rodeo is a roll composed with a lean', () => {
  it('the leaning root turns one whole circle and never unwinds', () => {
    const g = grammarByName('snow-rodeo')
    const params = loadParams('snow-rodeo')
    const n = params.frames.walk
    // The rest lean is the experiment: without it this file tests what the skate already proved.
    expect(g.skeleton.bones.find((b) => b.name === 'core')?.angle).not.toBe(0)
    const rolls: number[] = []
    for (let i = 0; i < n; i++) {
      const at = g.gait.wrap === false ? i / (n - 1) : i / n
      rolls.push((evaluate(g.gait, params, at).get('core')?.roll ?? 0) * 360)
    }
    expect(rolls[0]).toBeCloseTo(0, 4)
    expect(rolls[n - 1]).toBeCloseTo(-360, 2)
    for (let i = 1; i < n; i++) expect(rolls[i]).toBeLessThan(rolls[i - 1] as number)
  })

  it('the board’s two faces trade places under the lean — base first, topsheet after', () => {
    const g = grammarByName('snow-rodeo')
    const params = loadParams('snow-rodeo')
    const n = params.frames.walk
    const topAt = g.parts.findIndex((p) => p.name === 'topsheet')
    const baseAt = g.parts.findIndex((p) => p.name === 'base')
    const top: number[] = []
    const base: number[] = []
    for (let i = 0; i < n; i++) {
      const f = sprite(g, params, 1, i / (n - 1))
      let a = 0
      let b = 0
      for (const o of f.owners) {
        if (o === topAt) a++
        else if (o === baseAt) b++
      }
      top.push(a)
      base.push(b)
    }
    const peak = (arr: number[]): number => arr.indexOf(Math.max(...arr))
    expect(Math.max(...base)).toBeGreaterThan(60)
    expect(Math.min(...base)).toBeLessThan(12)
    expect(Math.max(...top)).toBeGreaterThan(45)
    expect(Math.min(...top)).toBeLessThan(12)
    expect(peak(base)).toBeLessThan(peak(top))
    expect(peak(top) - peak(base)).toBeGreaterThan(n / 4)
  })

  /**
   * **The composition loses no part.** The declared drift would appear first as a limb whose
   * offset and geometry disagree — detached, or swallowed. Every load-bearing part must paint
   * in most frames of the composed clip; honest mid-turn occlusion is allowed for, absence for
   * the whole clip is not.
   */
  it('no load-bearing part vanishes across the composed turn', () => {
    const g = grammarByName('snow-rodeo')
    const params = loadParams('snow-rodeo')
    const n = params.frames.walk
    const watch = ['skull', 'beanie', 'jacket', 'hips', 'topsheet', 'base', 'legN', 'legF', 'armN', 'armF', 'bootN']
    const idx = watch.map((w) => g.parts.findIndex((p) => p.name === w))
    const seen = new Map<string, number>(watch.map((w) => [w, 0]))
    for (let i = 0; i < n; i++) {
      const f = sprite(g, params, 1, i / (n - 1))
      const counts = new Array(g.parts.length).fill(0) as number[]
      for (const o of f.owners) if (o >= 0) counts[o] = (counts[o] ?? 0) + 1
      watch.forEach((w, j) => {
        if ((counts[idx[j]!] ?? 0) > 0) seen.set(w, (seen.get(w) ?? 0) + 1)
      })
    }
    for (const [w, frames] of seen) {
      expect(frames, `${w} painted in only ${frames} of ${n} frames of the composed roll`).toBeGreaterThanOrEqual(n / 2)
    }
  })

  it('the carve carries no roll — the channel’s null case on this subject', () => {
    const g = grammarByName('snow-carve')
    const params = loadParams('snow')
    expect(params.gait.roll).toBe(0)
    for (let i = 0; i < params.frames.walk; i++) {
      expect(evaluate(g.gait, params, i / params.frames.walk).get('core')?.roll ?? 0).toBe(0)
    }
  })

  it('the jump is the control, authored wholly in the screen plane', () => {
    const g = grammarByName('snow-jump')
    expect(g.gait.tracks.some((t) => t.channel === 'roll')).toBe(false)
    expect(loadParams('snow-jump').gait.roll).toBe(0)
  })
})

describe('the piste', () => {
  it('the tall pine is out of reach of one jump and inside two', () => {
    const hard = heights.filter((h) => h > APEX_ONE)
    expect(hard.length, `nothing needs the rodeo: apex ${APEX_ONE.toFixed(0)}, heights ${heights.join()}`).toBeGreaterThan(0)
    for (const h of hard) expect(h).toBeLessThan(APEX_TWO)
  })

  it('the snowman and the sapling fall to the jump alone', () => {
    expect(heights.some((h) => h < APEX_ONE)).toBe(true)
  })

  it('never puts two obstacles closer than one jump apart', () => {
    const hash = (k: number): { x: number } => {
      let a = ((k + N.seed) * 2654435761) >>> 0
      a = (a ^ (a >>> 13)) >>> 0
      return { x: N.leadIn + k * N.spacing + (a % N.jitterX) }
    }
    let worst = Infinity
    for (let k = 1; k < 400; k++) worst = Math.min(worst, hash(k).x - hash(k - 1).x)
    expect(worst).toBeGreaterThanOrEqual(N.spacing - N.jitterX)
    expect(worst / N.maxSpeed).toBeGreaterThan(((2 * N.jump) / N.gravity) * 0.9)
  })

  /**
   * **The aesthetic decisions, locked as data.** "Yoshi's Island" compiled to knobs: the 2×2
   * checker on the sky (not the 4×4 Bayer), snowfall present and slow, and a treeline band
   * standing on the horizon. A refactor that silently swaps the lattice un-ships the round.
   */
  it('the sky weaves on the 2×2 checker, and the snow falls at snow speed', () => {
    expect(N.dither).toEqual({ amount: 1, lattice: 2 })
    expect(stage.rain).not.toBeNull()
    // Slower than 60 px/s or it reads as rain; faster than 15 or the sky is static.
    expect(stage.rain!.speed).toBeGreaterThan(15)
    expect(stage.rain!.speed).toBeLessThan(60)
    const treeline = N.drift[N.drift.length - 1]!
    expect(treeline.maxY).toBeLessThan(N.groundRow)
    expect(treeline.minY).toBeGreaterThan(N.groundRow - 12)
  })
})

describe('the loop', () => {
  const play = (seconds: number): Harness => {
    const h = run(page)
    for (let i = 0; i < Math.round(seconds * 60); i++) h.tick(i * 16.67)
    return h
  }

  it('he carves without being told to, and the distance counts up', () => {
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
    tap(); step(2)
    expect(h.state().state).toBe('flip')
    expect(h.state().jumps).toBe(2)
    tap(); step(2)
    expect(h.state().jumps).toBe(2)
  })

  it('never jumping ends the run at the first obstacle, and space starts another', () => {
    const h = play(12)
    expect(h.state().over).toBe(true)
    expect(h.text['score']).toMatch(/you wiped out at \d+ m/)
    expect(h.state().menace).toBe(0)
    h.key(' ', true)
    h.tick(99_999)
    h.key(' ', false)
    h.tick(100_016)
    expect(h.state().over).toBe(false)
    expect(h.state().dist).toBeLessThan(N.leadIn)
  })
})
