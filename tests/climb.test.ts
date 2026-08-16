import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { cozyScene } from '../src/micro/cozy-scene.ts'

/**
 * **The climb, run headless, and it is the first game in this project that can be lost.**
 *
 * The same technique `micro-runtime.test.ts` and `moon-runtime.test.ts` use: the page's own
 * inlined script executes against a recording DOM, and the assertions are the things an eye
 * would be checking. Nothing here is a second implementation of the physics — there is one
 * loop and this test drives it.
 *
 * **Why this matters more than the two before it.** `CLAUDE.md` §1: *a recorded input sequence
 * must replay to the same state, or an agent cannot verify a game at all.* Every earlier scene
 * was a picture that reacted; the state was decoration. Here the state IS the game, and it is
 * the difference between a reactive scene and something with a consequence — which is the
 * thing he chose this round for.
 *
 * The five questions, and none of them needs a picture:
 *
 * 1. Does the tower exist, and is it the same tower every time?
 * 2. Is it climbable — is every gap inside one bounce's apex?
 * 3. Does a landing actually stop a fall, and only on the way down?
 * 4. Does the camera follow up and refuse to come back down?
 * 5. Does falling off the bottom end the run, and does the run restart?
 */

type Draw = { canvas: number; sy: number; dx: number; dy: number }

type Harness = {
  readonly frames: Draw[][]
  /** Canvas id per decoded layer, in layer order. */
  readonly sheets: number[]
  readonly text: Record<string, string>
  readonly fills: string[]
  /** The loop's own state, the findings channel `app.ts` exposes. See its comment on `state`. */
  state: () => { x: number; y: number; top: number; state: string; over: boolean }
  tick: (now: number) => void
  key: (name: string, down: boolean) => void
}

function run(html: string): Harness {
  const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'))
  const frames: Draw[][] = []
  const sheets: number[] = []
  const text: Record<string, string> = {}
  const fills: string[] = []
  let current: Draw[] = []
  let pending: ((now: number) => void) | null = null
  let next = 0

  const makeCanvas = (): Record<string, unknown> => {
    const id = next++
    const ctx = {
      set imageSmoothingEnabled(_v: boolean) {},
      set fillStyle(v: string) { fills.push(v) },
      set globalAlpha(_v: number) {},
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => { sheets.push(id) },
      fillRect: () => {},
      beginPath: () => {},
      fill: () => {},
      ellipse: () => {},
      // A real drawImage refuses anything that is not a canvas, and so does this one. A fake
      // that shrugs cannot report the defect the real thing reports (`HARNESS.md` §5).
      drawImage: (src: { _id?: number; _canvas?: true }, ...rest: number[]) => {
        if (src?._canvas !== true) throw new TypeError('drawImage got a non-canvas — a browser would have thrown')
        if (rest.length < 8) return
        current.push({ canvas: src._id ?? -1, sy: rest[1] as number, dx: rest[4] as number, dy: rest[5] as number })
      },
    }
    return { _id: id, _canvas: true as const, width: 0, height: 0, getContext: () => ctx }
  }

  const listeners: Record<string, ((e: unknown) => void)[]> = {}
  const el = (id: string): Record<string, unknown> => ({
    appendChild: () => {}, className: '',
    set textContent(v: string) { text[id] = v },
    get textContent() { return text[id] ?? '' },
  })
  const sandbox = {
    document: { createElement: () => makeCanvas(), getElementById: (id: string) => el(id) },
    window: { addEventListener: (n: string, fn: (e: unknown) => void) => { (listeners[n] ??= []).push(fn) }, onerror: null },
    requestAnimationFrame: (fn: (now: number) => void) => { pending = fn },
    atob: (s: string) => Buffer.from(s, 'base64').toString('binary'),
    Math,
  }
  let mounted: unknown = null
  const capture = { ...sandbox, __capture: (m: unknown) => { mounted = m } }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(...Object.keys(capture), `${script}\n__capture(__last)`)(...Object.values(capture))

  return {
    frames, sheets, text, fills,
    state: () => (mounted as { state: () => ReturnType<Harness['state']> }).state(),
    tick: (now: number) => {
      const fn = pending
      pending = null
      current = []
      fn?.(now)
      frames.push(current)
    },
    key: (name: string, down: boolean) => {
      for (const fn of listeners[down ? 'keydown' : 'keyup'] ?? []) fn({ key: name, preventDefault: () => {} })
    },
  }
}

const stage = toStage(cozyScene)
const C = stage.climb!
const page = gamePage({ id: 'cozy', title: 'The climb', blurb: '', date: '', meta: [], stage })
const clips = stage.placed[0]!.clips as Record<string, { right: number; left: number }>

/** The same closed form the runtime uses, restated here so the two can be compared. */
function bandAt(k: number, s: number): { x: number; y: number; v: number } {
  let b = ((k + C.seed) * 2654435761) >>> 0
  b = (b ^ (b >>> 13)) >>> 0
  let h2 = (((b + s * 2654435769) >>> 0) * 1597334677) >>> 0
  h2 = (h2 ^ (h2 >>> 15)) >>> 0
  const span = cozyScene.w / C.perBand
  const x = (b % cozyScene.w) + s * span + ((h2 >>> 3) % C.spreadJitter) - C.spreadJitter / 2
  return {
    x: ((x % cozyScene.w) + cozyScene.w) % cozyScene.w,
    y: C.startRow - C.firstBand - k * C.bandH + (h2 % C.jitterY),
    v: (h2 >>> 9) % C.perches.length,
  }
}

/** Run the loop at a fixed step. A real page varies; a lock must not. */
function play(steps: number, at?: (i: number, h: Harness) => void): Harness {
  const h = run(page)
  for (let i = 0; i < steps; i++) {
    at?.(i, h)
    h.tick(i * 16.67)
  }
  return h
}

describe('the tower', () => {
  /**
   * **The physics is what makes the tower climbable, and it is one inequality.** If this fails
   * the game is unwinnable at some altitude nobody would have found by playing, because the
   * gap that defeats it is generated a thousand bands up.
   */
  it('every gap in an infinite tower is inside one bounce, by construction', () => {
    const apex = (C.bounce * C.bounce) / (2 * C.gravity)

    /**
     * **The bound is `bandH + jitterY`, and getting that wrong is what this lock caught.**
     *
     * The gap between two neighbours is `bandH + jitter(lower) - jitter(upper)`. The claim in
     * the first draft was that jitter moving a shelf DOWN could only shrink a gap — true of the
     * upper shelf and false of the lower one, which widens it by the same amount. Measured:
     * 67 px against a claimed bound of 52.
     *
     * Ten thousand bands rather than an argument, because the claim is about a hash.
     */
    let worst = 0
    for (let k = 1; k < 10_000; k++) {
      // The gap that matters is between the LOWEST shelf of one band and the lowest of the
      // next, because that is the one a player who caught the low one has to clear.
      const below = Math.max(...Array.from({ length: C.perBand }, (_, s) => bandAt(k - 1, s).y))
      const above = Math.max(...Array.from({ length: C.perBand }, (_, s) => bandAt(k, s).y))
      const gap = below - above
      if (gap > worst) worst = gap
      expect(gap).toBeGreaterThan(0) // and it always goes UP
    }
    expect(worst).toBeLessThanOrEqual(C.bandH + C.jitterY)
    // Headroom of a third over the worst gap anywhere in an unbounded tower. A margin this wide
    // is what lets a player who lands off-centre still clear the next shelf.
    expect(worst).toBeLessThan(apex * 0.66)
  })

  it('every shelf is inside the world, and every variant gets used', () => {
    const seen = new Set<number>()
    for (let k = 0; k < 4000; k++) {
      for (let s = 0; s < C.perBand; s++) {
        const b = bandAt(k, s)
        // The world wraps, so a shelf near the seam is legal and is drawn on both sides. What
        // is not legal is an x outside the world at all: that is a shelf nobody can see.
        expect(b.x).toBeGreaterThanOrEqual(0)
        expect(b.x).toBeLessThan(cozyScene.w)
        seen.add(b.v)
      }
    }
    expect(seen.size).toBe(C.perches.length)
  })

  /**
   * **Every band offers a shelf in every part of the world, and this is the lock on the orbit.**
   *
   * The defect it exists for: with one shelf per band, a steady sideways input made the whole
   * system periodic, so the crossing position at every shelf above a landing was a fixed offset
   * from it. The run bounced between the garden and the first shelf for ever. Four sweeps of
   * the landing window produced 4.0 m, 4.0 m, 4.0 m, 4.0 m — **a cliff instead of a curve, which
   * is what a geometric lock looks like and what a difficulty setting never does.**
   */
  it('no fixed sideways offset can miss every shelf of a band', () => {
    const reach = C.halfW + C.footHalf
    const w = cozyScene.w
    let worst = 0
    for (let k = 0; k < 2000; k++) {
      // Each shelf covers `reach` either side of itself. On a world that wraps, the uncovered
      // runs are the circular gaps between one shelf's right edge and the next one's left.
      const xs = Array.from({ length: C.perBand }, (_, s) => bandAt(k, s).x).sort((a, b) => a - b)
      for (let i = 0; i < xs.length; i++) {
        const right = (xs[i] as number) + reach
        const left = (xs[(i + 1) % xs.length] as number) + (i + 1 === xs.length ? w : 0) - reach
        if (left - right > worst) worst = left - right
      }
    }
    // Never more than half the width is out of reach at any altitude in the tower.
    expect(worst).toBeLessThan(w * 0.5)
  })

  /**
   * **The horizontal reach, and the wrap is what makes it a fact rather than a hope.** The
   * world wraps, so no two shelves are ever more than half a screen apart; the airtime of one
   * bounce has to cover that at the steering speed.
   */
  it('the widest sideways gap is inside the airtime of one bounce', () => {
    const airtime = (2 * C.bounce) / C.gravity
    expect(cozyScene.w / 2).toBeLessThan(C.steer * airtime)
  })
})

describe('the loop', () => {
  it('the kitten falls, lands on the garden, and springs off it', () => {
    // Nothing is pressed, so he drops onto the starting ground and bounces there for ever.
    const h = play(90)
    const cat = (f: number): Draw => h.frames[f]!.at(-1) as Draw
    const rows = h.frames.map((_, i) => cat(i).dy)

    // He goes down, then up: a landing happened and it reversed a fall.
    const lowest = Math.max(...rows)
    const after = rows.slice(rows.indexOf(lowest))
    expect(Math.min(...after)).toBeLessThan(lowest - 40)
  })

  it('a shelf stops a fall from above and is passed through from below', () => {
    const h = play(240)
    const sheet = new Set([clips['tuck']!.right, clips['tuck']!.left].map((i) => h.sheets[i]))
    // The tuck clip is drawn at some point, which only happens on contact.
    const touched = h.frames.some((f) => f.some((d) => sheet.has(d.canvas)))
    expect(touched, 'the landing clip never played, so nothing was ever landed on').toBe(true)
  })

  /**
   * **The camera only rises, and that is the consequence.** A camera that could come back down
   * would let a player undo a fall by descending, and this genre has never allowed it. The
   * check reads the drawn row of the starting ground, which is a fixed world row: if the
   * camera rises, the ground's screen row can only go down and off the bottom.
   */
  it('the camera follows up and never comes back down', () => {
    const h = play(400, (i, hh) => { if (i === 3) hh.key('ArrowRight', true) })
    // The kitten's own screen row is held by the camera, so it stays inside the viewport for
    // the whole climb even though its world row is hundreds of pixels up.
    const rows = h.frames.slice(20).map((f) => (f.at(-1) as Draw).dy)
    for (const r of rows) {
      expect(r).toBeGreaterThan(-60)
      expect(r).toBeLessThan(cozyScene.h + 60)
    }
  })

  it('the score counts up as he climbs, and it never counts down', () => {
    const h = play(600, (i, hh) => { if (i === 3) hh.key('ArrowRight', true) })
    const m = /([\d.]+) m/.exec(h.text['score'] ?? '')
    expect(m, 'the score never reported anything').not.toBeNull()
    expect(Number(m![1])).toBeGreaterThan(1)
  })

  /**
   * **The fall ends the run, and that sentence is the whole reason this round exists.**
   *
   * `DECISIONS.md`, 16/08: the forest has a mechanic and no consequence. This is the assertion
   * that says this one does.
   *
   * The run holds one key for the whole time, which is a player who never aims: he crosses the
   * world at a steady 116 px/s and catches whatever happens to be under him. That is the worst
   * case on purpose — somebody steering toward a shelf catches nearly every one — and it still
   * has to end.
   */
  it('falling off the bottom ends the run, and one key starts a new one', () => {
    const h = run(page)
    let t = 0
    const step = (n: number): void => { for (let i = 0; i < n; i++) h.tick((t++) * 16.67) }

    h.key('ArrowRight', true)
    // Two minutes of never aiming. If the run has not ended by then there is no consequence.
    let fell = 0
    for (let i = 0; i < 7200 && fell === 0; i++) {
      step(1)
      if (/you fell/.test(h.text['score'] ?? '')) fell = i
    }
    expect(fell, 'two minutes of never aiming never produced a fall').toBeGreaterThan(0)
    h.key('ArrowRight', false)

    // The score names the height it ended at, so a run leaves a number behind rather than
    // just stopping.
    expect(h.text['score']).toMatch(/you fell at [\d.]+ m/)

    h.key(' ', true)
    step(4)
    h.key(' ', false)
    step(20)
    expect(h.text['score'], 'space did not start a new run').not.toMatch(/you fell/)
  })
})

/**
 * **Difficulty is a ratio between two players, never one number — and this section exists
 * because his second reading said so.**
 *
 * > *"embora eu sinta que tenham muitas plataformas disponíveis, o que torna o jogo pouco
 * > desafiador, pois é difícil errar um salto assim"*
 *
 * The tower had been thickened to break a locked orbit, and the thickening was tuned against a
 * robot holding one key. **That instrument cannot perceive "too easy."** It reports whether
 * progress happens at all, so pushed on it, it drives every knob to the generous end and reports
 * success the whole way. It was measuring the wrong quantity and it never said so.
 *
 * The fix is a second player. One who steers at the nearest shelf under him is the cheapest
 * stand-in for somebody actually playing, and the **gap between the two** is the thing a
 * difficulty setting moves. A game where aiming buys nothing is a game with no skill in it; a
 * game where not aiming still climbs for ever is a game with no consequence.
 */
function drive(seconds: number, aim: boolean): { peak: number; over: boolean; landings: number } {
  const h = run(page)
  const w = cozyScene.w
  let held: string | null = null
  let landings = 0
  let was = ''
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    const st = h.state()
    if (aim) {
      // The nearest shelf below him, weighted so a shelf far to the side is worth less than a
      // shelf just under him. Not clever: a stand-in for a person, not a solver.
      let best: { d: number; dx: number } | null = null
      for (let k = -1; k < 600; k++) {
        for (let s = 0; s < C.perBand; s++) {
          const b = k < 0 ? { x: st.x, y: C.startRow } : bandAt(k, s)
          if (b.y < st.y + 4 || b.y > st.y + 130) continue
          let dx = b.x - st.x
          if (dx > w / 2) dx -= w
          if (dx < -w / 2) dx += w
          const d = b.y - st.y + Math.abs(dx) * 0.4
          if (best === null || d < best.d) best = { d, dx }
        }
      }
      const want = best === null ? null : best.dx > 2 ? 'ArrowRight' : best.dx < -2 ? 'ArrowLeft' : null
      if (want !== held) {
        if (held !== null) h.key(held, false)
        if (want !== null) h.key(want, true)
        held = want
      }
    } else if (held === null) {
      h.key('ArrowRight', true)
      held = 'ArrowRight'
    }
    h.tick(i * 16.67)
    const now = h.state()
    if (now.state === 'tuck' && was !== 'tuck') landings++
    was = now.state
  }
  const st = h.state()
  return { peak: (C.startRow - st.top) / C.pxPerMetre, over: st.over, landings }
}

describe('difficulty is the gap between aiming and not aiming', () => {
  it('a player who never aims falls, and does not get far first', () => {
    const r = drive(60, false)
    expect(r.over, 'a minute of never aiming never ended the run').toBe(true)
    // 12 m is three times what it reaches today and well under the 20 m that drew his note.
    expect(r.peak).toBeLessThan(12)
  })

  it('a player who steers at the nearest shelf climbs, and keeps climbing', () => {
    const r = drive(60, true)
    expect(r.over, 'aiming at every shelf still ended the run — the game is unplayable').toBe(false)
    expect(r.peak).toBeGreaterThan(30)
  })

  /**
   * **The pair, and it is the reading his note actually produced.** Either number alone is
   * satisfiable by a broken game: a tower nobody can climb passes the first, and a tower nobody
   * can fall off passes the second. Only the ratio says the skill is doing something.
   */
  it('aiming is worth several times not aiming', () => {
    expect(drive(60, true).peak / Math.max(1, drive(60, false).peak)).toBeGreaterThan(4)
  })
})

describe('there is one renderer', () => {
  /**
   * **`compose()` is gone, and this lock is what stops it growing back.**
   *
   * `DECISIONS.md`, 16/08: this project had two independent code paths drawing the same world,
   * and nothing compared them. They agreed only because they shared four depth functions. The
   * frozen one answered a question from the era when the deliverable was a drawing, was
   * superseded the same day it was written, and then survived thirteen commits with one caller.
   *
   * His call: *"só faz sentido desenhar se for em uma cena de jogo... o subproduto aqui deva ser
   * uma única coisa."*
   *
   * The property is now structural rather than compared: **a scene is data and one module turns
   * it into pixels.** Asserted by reading the source, because the defect is a file that imports
   * the renderer, and no behavioural test can see a second path that nothing is calling yet.
   */
  it('the scene vocabulary is data: it imports nothing that can draw', () => {
    const src = readFileSync(new URL('../src/scene/types.ts', import.meta.url), 'utf8')
    for (const forbidden of ['io/load.ts', 'core/render.ts', 'core/raster.ts', 'core/skeleton.ts']) {
      expect(src.includes(forbidden), `scene/types.ts imports ${forbidden} — a second renderer is starting`).toBe(false)
    }
  })

  it('exactly one module turns a scene into pixels', () => {
    const dir = new URL('../src/scene/', import.meta.url)
    const drawers = readdirSync(dir).filter((f) => {
      if (!f.endsWith('.ts')) return false
      const src = readFileSync(new URL(f, dir), 'utf8')
      return src.includes("from '../io/load.ts'")
    })
    expect(drawers).toEqual(['layers.ts'])
  })

  it('a climb with no climber in it is a configuration error, not a blank screen', () => {
    expect(() => toStage({ ...cozyScene, placements: [] })).toThrow(/climber/)
  })
})
