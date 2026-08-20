import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { orreryScene } from '../src/micro/orrery-scene.ts'
import { toStage } from '../src/scene/layers.ts'
import { boxWalls, turnBox, turnPoint } from '../src/runtime/collision.ts'
import { run } from './harness.ts'

type Eye = {
  x: number; y: number; vx: number; vy: number; state: string
  turn: number; turning: number; suns: number; over: boolean; won: boolean; elapsed: number
}

const stage = toStage(orreryScene)
const page = gamePage({
  id: 'orrery', title: 'The Orrery', blurb: 'test', date: '2026-08-20', meta: [],
  keys: 'arrows · space · X · R', stage,
  actions: { primary: [' '], secondary: ['x', 'z'] },
})
const state = (h: ReturnType<typeof run>): Eye => h.state() as unknown as Eye
const tickTo = (h: ReturnType<typeof run>, end: number, every = 8): void => {
  for (let t = 0; t <= end; t += every) h.tick(t)
}

/** A short, deliberately non-optimal complete route. Times are milliseconds. */
const SOLUTION: readonly (readonly [number, string, boolean])[] = [
  [100, 'ArrowRight', true], [1100, 'ArrowRight', false],
  [1100, 'ArrowLeft', true], [1600, 'ArrowLeft', false],
  [2170, 'x', true], [2200, 'x', false],
  [2600, 'ArrowRight', true], [3600, 'ArrowRight', false],
  [3620, ' ', true], [3650, ' ', false],
  [4100, 'ArrowRight', true], [5100, 'ArrowRight', false],
  [5170, 'x', true], [5200, 'x', false],
  [6670, 'x', true], [6700, 'x', false],
  [8170, 'x', true], [8200, 'x', false],
  [9100, 'ArrowRight', true], [9620, ' ', true], [9650, ' ', false], [10600, 'ArrowRight', false],
  [11670, 'x', true], [11700, 'x', false],
]

describe('the orrery turns one exact room', () => {
  it('four quarter turns are identity for every authored collision box', () => {
    const n = orreryScene.platformer!
    for (const b of n.solids) expect(turnBox(b, 4, 160, 90)).toEqual(b)
    for (const sun of n.suns) expect(turnPoint(sun.x, sun.y, 4, 160, 90)).toEqual({ x: sun.x, y: sun.y })
    for (let turn = 0; turn < 4; turn++) expect(turnBox(n.bounds, turn, 160, 90)).toEqual(n.bounds)
    expect(boxWalls(n.bounds, n.wall)).toEqual([
      { x: 76, y: 6, w: 168, h: 8 },
      { x: 76, y: 166, w: 168, h: 8 },
      { x: 76, y: 6, w: 8, h: 168 },
      { x: 236, y: 6, w: 8, h: 168 },
    ])
  })

  it('shows a turn before committing it, then commits exactly once', () => {
    const h = run(page)
    h.feed([[100, 'x', true], [130, 'x', false]])
    tickTo(h, 360)
    expect(state(h).state).toBe('brace')
    expect(state(h).turn).toBe(0)
    expect(state(h).turning).toBe(1)
    for (let t = 368; t <= 620; t += 8) h.tick(t)
    expect(state(h).turn).toBe(1)
    expect(state(h).turning).toBe(0)
    // The hatch foot rotates to the left wall, then the upright body is moved to its inner face.
    expect(state(h).x).toBeCloseTo(89, 4)
    expect(state(h).y).toBeGreaterThan(90)
  })

  it('keeps the keeper inside the border after a turn toward the wall', () => {
    const h = run(page)
    h.feed([
      [100, 'x', true], [130, 'x', false],
      [700, 'ArrowLeft', true], [3000, 'ArrowLeft', false],
    ])
    for (let t = 0; t <= 3200; t += 8) {
      h.tick(t)
      const s = state(h)
      expect(s.x - orreryScene.platformer!.bodyHalfW).toBeGreaterThanOrEqual(orreryScene.platformer!.bounds.x)
    }
    expect(state(h).over).toBe(false)
  })

  it('lets a running keeper leave a platform and become airborne', () => {
    const h = run(page)
    // After one turn, the keeper lands on the former right wall. Running down its finite edge is
    // ordinary play and must be a legal run -> fall transition.
    h.feed([
      [100, 'x', true], [130, 'x', false],
      [700, 'ArrowRight', true], [2400, 'ArrowRight', false],
    ])
    let previous = state(h).state
    let crossedEdge = false
    expect(() => {
      for (let t = 0; t <= 2600; t += 8) {
        h.tick(t)
        const current = state(h).state
        if (previous === 'run' && current === 'fall') crossedEdge = true
        previous = current
      }
    }).not.toThrow()
    expect(crossedEdge, 'the regression route did not exercise run -> fall').toBe(true)
  })

  it('makes the core a consequence and R a clean restart', () => {
    const h = run(page)
    h.feed([[500, ' ', true], [530, ' ', false]])
    tickTo(h, 1200)
    expect(state(h).over, 'jumping straight through the central core did not end the run').toBe(true)
    h.key('r', true, 1210); h.tick(1224); h.key('r', false, 1230); h.tick(1240)
    expect(state(h).over).toBe(false)
    expect(state(h).turn).toBe(0)
    expect(state(h).suns).toBe(0)
  })

  it('has a complete route: three suns, the hatch, then a replay prompt', () => {
    const h = run(page)
    h.feed(SOLUTION)
    tickTo(h, 13_000)
    expect(state(h).suns).toBe(7)
    expect(state(h).won).toBe(true)
    expect(h.text.score).toContain('CIRCUIT COMPLETE')
  })

  it('replays to the same state at different presentation rates', () => {
    const at = (every: number): string => {
      const h = run(page); h.feed(SOLUTION); tickTo(h, 13_000, every); return JSON.stringify(h.state())
    }
    expect(at(8)).toBe(at(16))
  })
})
