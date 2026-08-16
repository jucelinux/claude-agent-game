import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { forestScene } from '../src/micro/forest-scene.ts'

/**
 * **The game loop as a lock, run headless against a fake DOM.**
 *
 * The runtime in `app.ts` is the first code in this project a person can change while it is
 * running, and it is also the first that cannot be checked by rendering a buffer and
 * counting it. So it is checked the way `viewer-runtime.test.ts` checks the viewer: the
 * page's own inlined script is executed against a recording DOM, and the assertions are the
 * things an eye would be looking for.
 *
 * **Two of them are his findings turned into instruments** — which is what he asked for
 * after the third reading: *"seria bom você ter essas referências para não cometer mais esse
 * tipo de erro"*.
 *
 * - **The cloud may only jump when it is entirely off screen.** That is what continuity
 *   means operationally, and it is checkable without a picture.
 * - **The actor obeys the keys, and turning round selects the re-lit layer.** A flip that
 *   reuses the right-facing sprite would pass any test that only looked at position.
 */

type Draw = { canvas: number; sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; slot: number }

type Harness = {
  readonly frames: Draw[][]
  readonly smoothing: boolean[]
  readonly alphaZero: boolean
  /** Canvas id of each decoded layer, in layer order. The runtime makes others too. */
  readonly sheets: number[]
  tick: (now: number) => void
  key: (name: string, down: boolean) => void
}

function run(html: string): Harness {
  const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'))

  const frames: Draw[][] = []
  const smoothing: boolean[] = []
  let current: Draw[] = []
  let pending: ((now: number) => void) | null = null
  let nextCanvas = 0
  let alphaZero = true
  const sheets: number[] = []

  const makeCanvas = (): Record<string, unknown> => {
    const id = nextCanvas++
    const ctx = {
      set imageSmoothingEnabled(v: boolean) { smoothing.push(v) },
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: (img: { data: Uint8ClampedArray }) => {
        // Only a decoded layer is ever written pixel by pixel, so this is the layer order.
        sheets.push(id)
        // Index 0 must arrive fully transparent, everywhere, forever. It is the one palette
        // rule the whole project rests on.
        for (let i = 3; i < img.data.length; i += 4) {
          if (img.data[i] !== 0 && img.data[i] !== 255) alphaZero = false
        }
      },
      fillRect: () => {},
      set fillStyle(_v: string) {},
      set globalAlpha(_v: number) {},
      drawImage: (src: { _id?: number; _canvas?: true }, ...rest: number[]) => {
        // **A real drawImage refuses anything that is not a canvas, and this one must too.**
        //
        // It did not, and that is how a blank page reached him. `var off` inside the rain
        // stamp loop shadowed the offscreen buffer twelve lines above it — `var` is
        // function-scoped — so every frame called drawImage on the number -1. The browser
        // threw on the first frame. This harness shrugged and reported 136 green locks.
        //
        // **A fake that shrugs cannot report the defect the real thing reports.** That is
        // the null-case rule (`HARNESS.md` §5) applied to a test double rather than to a
        // measurement: an instrument has to be able to fail.
        if (src?._canvas !== true) {
          throw new TypeError(`drawImage got ${src === undefined ? 'undefined' : typeof src} — a browser would have thrown here`)
        }
        if (rest.length < 8) return // the backdrop copy and the final blit
        // The slot is the index in `placed`, tracked by the runtime and read back here: a
        // subject that is off screen is not drawn at all, so position in the call list is not
        // the same as position in the scene.
        current.push({ canvas: src._id ?? -1, sx: rest[0]!, sy: rest[1]!, sw: rest[2]!, sh: rest[3]!, dx: rest[4]!, dy: rest[5]!, slot: -1 })
      },
    }
    return { _id: id, _canvas: true as const, width: 0, height: 0, getContext: () => ctx }
  }

  const listeners: Record<string, ((e: unknown) => void)[]> = {}
  const sandbox = {
    document: { createElement: () => makeCanvas(), getElementById: () => ({ appendChild: () => {} }) },
    window: {
      addEventListener: (name: string, fn: (e: unknown) => void) => {
        (listeners[name] ??= []).push(fn)
      },
    },
    requestAnimationFrame: (fn: (now: number) => void) => { pending = fn },
    atob: (s: string) => Buffer.from(s, 'base64').toString('binary'),
    Math,
  }
  let mounted: { drawn: number[] } | null = null
  const capture = { ...sandbox, __capture: (m: { drawn: number[] }) => { mounted = m } }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(...Object.keys(capture), `${script}\n__capture(__last)`)(...Object.values(capture))

  return {
    frames,
    smoothing,
    sheets,
    get alphaZero() { return alphaZero },
    tick: (now: number) => {
      const fn = pending
      pending = null
      current = []
      fn?.(now)
      // The runtime reports which slot each blit belongs to, in call order. Reading it back
      // is the only way to know: a subject that is off screen makes no call at all.
      const slots = (mounted?.drawn ?? []) as number[]
      current.forEach((d, k) => { d.slot = slots[k] ?? -1 })
      frames.push(current)
    },
    key: (name: string, down: boolean) => {
      for (const fn of listeners[down ? 'keydown' : 'keyup'] ?? []) fn({ key: name, preventDefault: () => {} })
    },
  }
}

const stage = toStage(forestScene)
const page = gamePage({ id: 'forest', title: 'The forest', blurb: '', date: '', meta: [], stage })

describe('the micro runtime', () => {
  it('runs for a full minute without throwing', () => {
    // The cheapest lock in the file and the one that would have caught the blank page. Every
    // other test here ticks a handful of frames for a specific answer; this one just runs.
    const h = run(page)
    for (let f = 0; f < 1800; f++) h.tick(f * 33.3)
    expect(h.frames).toHaveLength(1800)
    expect(h.frames[1799]!.length, 'the loop stopped drawing').toBeGreaterThan(0)
  })

  it('decodes index 0 as fully transparent and turns smoothing off', () => {
    const h = run(page)
    h.tick(0)
    expect(h.alphaZero).toBe(true)
    expect(h.smoothing).toContain(false)
    expect(h.smoothing).not.toContain(true)
  })

  it('draws every subject that is on screen, and only those', () => {
    // A photographer waiting off screen makes no draw call at all, which is the cheapest
    // possible form of culling and the reason this count is not simply `placed.length`.
    const h = run(page)
    h.tick(0)
    h.tick(16)
    const waiting = stage.placed.filter((p) => p.approach !== undefined).length
    expect(h.frames[1]).toHaveLength(stage.placed.length - waiting)
    expect(new Set(h.frames[1]!.map((d) => d.slot)).size).toBe(h.frames[1]!.length)
  })

  it('a cloud only jumps when it is entirely off screen', () => {
    // The whole point of the runtime. `drift` could not do this: it was a fraction of the
    // frame loop, so a cloud returned to its start by teleporting once per cycle.
    const h = run(page)
    const cloud = stage.placed.findIndex((p) => p.motion !== undefined)
    expect(cloud).toBeGreaterThanOrEqual(0)
    const width = stage.layers[stage.placed[cloud]!.layer]!.w

    let previous: number | null = null
    let wraps = 0
    // Two minutes at 30 fps: long enough that the fastest cloud leaves and returns.
    for (let f = 0; f < 3600; f++) {
      h.tick(f * 33.3)
      const draw = h.frames[f]![cloud]
      if (draw === undefined) continue
      if (previous !== null) {
        const step = Math.abs(draw.dx - previous)
        if (step > 3) {
          wraps++
          const offBefore = previous >= stage.w || previous + width <= 0
          const offAfter = draw.dx >= stage.w || draw.dx + width <= 0
          expect(offBefore && offAfter, `a cloud jumped ${step.toFixed(0)} px while on screen at x ${previous}`).toBe(true)
        }
      }
      previous = draw.dx
    }
    expect(wraps, 'the cloud never wrapped, so continuity was never actually exercised').toBeGreaterThan(0)
  })

  it('the player moves on the keys, stops at the edges, and holds still when released', () => {
    const h = run(page)
    const i = stage.placed.findIndex((p) => p.player !== undefined)
    expect(i).toBeGreaterThanOrEqual(0)
    const pd = stage.placed[i]!.player!

    const xAt = (f: number): number => (h.frames[f]!.find((d) => d.slot === i) as Draw).dx
    h.tick(0)
    const start = xAt(0)

    h.key('ArrowRight', true)
    for (let f = 1; f <= 30; f++) h.tick(f * 33.3)
    expect(xAt(30), 'right did not move him right').toBeGreaterThan(start)

    // One frame to settle into the idle clip first: a different pose has a different painted
    // box, so its crop offset differs by a pixel or two. That is the sprite changing, not the
    // character moving, and comparing across a clip change measures the wrong thing.
    h.key('ArrowRight', false)
    h.tick(31 * 33.3)
    const held = xAt(31)
    for (let f = 32; f <= 60; f++) h.tick(f * 33.3)
    expect(xAt(60), 'he kept walking after the key came up').toBe(held)

    h.key('ArrowRight', true)
    for (let f = 61; f <= 500; f++) h.tick(f * 33.3)
    const wall = xAt(500)
    for (let f = 501; f <= 530; f++) h.tick(f * 33.3)
    expect(xAt(530), 'he walked through the right edge of the world').toBe(wall)
    expect(wall).toBeLessThanOrEqual(pd.maxX + 40)
  })

  it('a released key gives the idle clip, not a held frame of the walk', () => {
    // **His ask of 16/08, as a lock.** Holding frame 0 of a walk is the single most common
    // way a standing character reads as a crash, and it is invisible to any check that only
    // looks at position.
    const h = run(page)
    const i = stage.placed.findIndex((p) => p.player !== undefined)
    const clips = stage.placed[i]!.clips as Record<string, { right: number; left: number }>
    const pd = stage.placed[i]!.player!

    h.tick(0); h.tick(33)
    const still = (h.frames[1]!.find((d) => d.slot === i) as Draw).canvas
    expect(still, 'standing still does not draw the idle clip').toBe(h.sheets[clips[pd.idle]!.right])

    h.key('ArrowRight', true); h.tick(66); h.tick(99)
    expect((h.frames[3]!.find((d) => d.slot === i) as Draw).canvas).toBe(h.sheets[clips[pd.walk]!.right])
  })

  it('the idle actually animates rather than resting on one frame', () => {
    const h = run(page)
    const i = stage.placed.findIndex((p) => p.player !== undefined)
    const seen = new Set<number>()
    for (let f = 0; f < 90; f++) { h.tick(f * 33.3); seen.add((h.frames[f]!.find((d) => d.slot === i) as Draw).sy) }
    expect(seen.size, 'the idle drew the same source row for three seconds').toBeGreaterThan(4)
  })

  it('attack plays once and holds its last frame rather than looping', () => {
    const h = run(page)
    const i = stage.placed.findIndex((p) => p.player !== undefined)
    const clips = stage.placed[i]!.clips as Record<string, { right: number; left: number }>
    const pd = stage.placed[i]!.player!
    const sheet = h.sheets[clips[pd.attack]!.right] as number

    // Pressed and released between two frames, on purpose: a tap that short is exactly the
    // input a loop sampling key state would drop, and a person taps that fast constantly.
    h.tick(0)
    h.key(' ', true); h.key(' ', false)
    let rows: number[] = []
    for (let f = 1; f <= 40; f++) {
      h.tick(f * 16.7)
      const d = h.frames[f]!.find((x) => x.slot === i) as Draw
      if (d.canvas === sheet) rows.push(d.sy)
    }
    expect(rows.length, 'the attack key did nothing').toBeGreaterThan(4)
    // Monotone: a clip that loops would step back down to row 0 partway through.
    for (let k = 1; k < rows.length; k++) {
      expect(rows[k], 'the attack looped instead of holding its last frame').toBeGreaterThanOrEqual(rows[k - 1] as number)
    }
  })

  it('turning round selects the re-lit layer rather than reusing the sprite', () => {
    const h = run(page)
    const i = stage.placed.findIndex((p) => p.player !== undefined)
    const clips = stage.placed[i]!.clips as Record<string, { right: number; left: number }>
    const walk = clips['walk'] as { right: number; left: number }
    expect(walk.left).not.toBe(walk.right)

    h.key('ArrowRight', true); h.tick(0); h.tick(33)
    expect((h.frames[1]!.find((d) => d.slot === i) as Draw).canvas).toBe(h.sheets[walk.right])
    h.key('ArrowRight', false); h.key('ArrowLeft', true)
    h.tick(66); h.tick(99)
    expect((h.frames[3]!.find((d) => d.slot === i) as Draw).canvas).toBe(h.sheets[walk.left])
  })

  it('the two facings are the same body, centred on the same column', () => {
    const i = stage.placed.findIndex((p) => p.player !== undefined)
    const clips = stage.placed[i]!.clips as Record<string, { right: number; left: number }>
    const a = stage.layers[(clips['walk'] as { right: number }).right]!
    const b = stage.layers[(clips['walk'] as { left: number }).left]!
    expect(b.w).toBe(a.w)
    expect(b.h).toBe(a.h)
    expect(b.oy).toBe(a.oy)
    // Mirrored about the origin column, so he does not slide sideways the moment he turns.
    expect(Math.abs(a.ox + a.w + b.ox)).toBeLessThanOrEqual(1)
    // ...and the two are genuinely different pixels, or the lamp was never mirrored.
    expect(Buffer.compare(Buffer.from(a.indices), Buffer.from(b.indices))).not.toBe(0)
  })

  it('a photographer walks in, lies down, and runs home when it is struck', () => {
    // **The whole mechanic, end to end**, and it is checkable without a picture: which clip
    // is drawn and which way the position is moving are both numbers.
    const h = run(page)
    const i = stage.placed.findIndex((p) => p.approach !== undefined)
    expect(i).toBeGreaterThanOrEqual(0)
    const ap = stage.placed[i]!.approach!
    const clips = stage.placed[i]!.clips as Record<string, { right: number; left: number }>
    const at = (f: number): Draw | undefined => h.frames[f]!.find((d) => d.slot === i)

    // Off screen until his delay is up: he is not drawn at all.
    h.tick(0)
    expect(at(0), 'a photographer who has not entered yet is still being drawn').toBeUndefined()

    // Walk in.
    let f = 1
    for (; f <= 400; f++) h.tick(f * 33.3)
    const walking = at(200)
    expect(walking, 'the photographer never entered').toBeDefined()

    // Settle prone, and stay there while nobody hits him.
    for (; f <= 700; f++) h.tick(f * 33.3)
    const prone = at(699) as Draw
    const proneSheets = [h.sheets[clips[ap.prone]!.right], h.sheets[clips[ap.prone]!.left]]
    expect(proneSheets, 'he never lay down').toContain(prone.canvas)
    const settled = prone.dx

    // He settles just outside the reach, so the player has to step in — which is the point of
    // the standoff and worth stating as a check of its own.
    const player = stage.placed.find((p) => p.player !== undefined)!.player!
    expect(ap.standoff, 'the photographer settles inside the reach, so the player never moves')
      .toBeGreaterThan(player.reach)

    h.key('ArrowLeft', true)
    for (; f <= 712; f++) h.tick(f * 33.3)
    h.key('ArrowLeft', false)
    h.key(' ', true); h.key(' ', false)
    // Sampled while he is still on screen: at 92 px/s he clears the frame in under two
    // seconds, and a check that waits too long measures an empty stage.
    for (; f <= 730; f++) h.tick(f * 33.3)

    const fleeing = at(730) as Draw
    const runSheets = [h.sheets[clips[ap.flee]!.right], h.sheets[clips[ap.flee]!.left]]
    expect(runSheets, 'he did not get up and run').toContain(fleeing.canvas)
    // And he runs toward the edge he came from.
    expect(ap.from === 'left' ? fleeing.dx < settled : fleeing.dx > settled, 'he ran the wrong way').toBe(true)
  })
})
