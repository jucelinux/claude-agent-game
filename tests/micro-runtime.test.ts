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

type Draw = { canvas: number; sx: number; sy: number; sw: number; sh: number; dx: number; dy: number }

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
      drawImage: (src: { _id?: number }, ...rest: number[]) => {
        if (rest.length < 8) return // the backdrop copy and the final blit
        current.push({ canvas: src._id ?? -1, sx: rest[0]!, sy: rest[1]!, sw: rest[2]!, sh: rest[3]!, dx: rest[4]!, dy: rest[5]! })
      },
    }
    return { _id: id, width: 0, height: 0, getContext: () => ctx }
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
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(...Object.keys(sandbox), script)(...Object.values(sandbox))

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
  it('decodes index 0 as fully transparent and turns smoothing off', () => {
    const h = run(page)
    h.tick(0)
    expect(h.alphaZero).toBe(true)
    expect(h.smoothing).toContain(false)
    expect(h.smoothing).not.toContain(true)
  })

  it('draws every placed subject once per animation frame, back to front', () => {
    const h = run(page)
    h.tick(0)
    h.tick(16)
    expect(h.frames[1]).toHaveLength(stage.placed.length)
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

  it('the actor moves on the keys, stops at the edges, and holds still when released', () => {
    const h = run(page)
    const i = stage.placed.findIndex((p) => p.control !== undefined)
    expect(i).toBeGreaterThanOrEqual(0)
    const control = stage.placed[i]!.control!

    const xAt = (f: number): number => h.frames[f]![i]!.dx
    h.tick(0)
    const start = xAt(0)

    h.key('ArrowRight', true)
    for (let f = 1; f <= 30; f++) h.tick(f * 33.3)
    expect(xAt(30), 'right did not move him right').toBeGreaterThan(start)

    h.key('ArrowRight', false)
    const held = xAt(30)
    for (let f = 31; f <= 60; f++) h.tick(f * 33.3)
    expect(xAt(60), 'he kept walking after the key came up').toBe(held)

    // Walk into the wall and stay there.
    h.key('ArrowRight', true)
    for (let f = 61; f <= 400; f++) h.tick(f * 33.3)
    const wall = xAt(400)
    expect(wall).toBeLessThanOrEqual(control.maxX + stage.layers[stage.placed[i]!.layer]!.ox + 1)
    for (let f = 401; f <= 430; f++) h.tick(f * 33.3)
    expect(xAt(430), 'he walked through the right edge of the world').toBe(wall)
  })

  it('turning round selects the re-lit layer rather than reusing the sprite', () => {
    // Mirroring a sprite mirrors its lighting. The left-facing gorilla is a second render
    // with the lamp mirrored, and this is the check that the runtime actually reaches for it.
    const h = run(page)
    const i = stage.placed.findIndex((p) => p.control !== undefined)
    const placed = stage.placed[i]!
    const right = placed.layer
    const left = placed.control!.flip
    expect(left).not.toBe(right)

    h.key('ArrowRight', true); h.tick(0); h.tick(33)
    expect(h.frames[1]![i]!.canvas).toBe(h.sheets[right])
    h.key('ArrowRight', false); h.key('ArrowLeft', true)
    h.tick(66); h.tick(99)
    expect(h.frames[3]![i]!.canvas).toBe(h.sheets[left])
  })

  it('the two facings are the same body, centred on the same column', () => {
    const i = stage.placed.findIndex((p) => p.control !== undefined)
    const a = stage.layers[stage.placed[i]!.layer]!
    const b = stage.layers[stage.placed[i]!.control!.flip]!
    expect(b.w).toBe(a.w)
    expect(b.h).toBe(a.h)
    expect(b.oy).toBe(a.oy)
    // Mirrored about the origin column, so he does not slide sideways the moment he turns.
    expect(Math.abs(a.ox + a.w + b.ox)).toBeLessThanOrEqual(1)
    // ...and the two are genuinely different pixels, or the lamp was never mirrored.
    expect(Buffer.compare(Buffer.from(a.indices), Buffer.from(b.indices))).not.toBe(0)
  })
})
