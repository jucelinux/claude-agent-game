import { describe, expect, it } from 'vitest'
import { gamePage } from '../src/micro/app.ts'
import { toStage } from '../src/scene/layers.ts'
import { moonScene } from '../src/micro/moon-scene.ts'

/**
 * **The three mechanics his commission asked for, run headless.**
 *
 * *"pular e andar em todas as direções"* plus a floor to walk on. Each is checkable without a
 * picture: which clip is drawn, where the sprite lands, and in what order.
 */

type Draw = { canvas: number; sy: number; dx: number; dy: number; slot: number }

function run(html: string): {
  frames: Draw[][]
  sheets: number[]
  ellipses: { x: number; y: number; rx: number }[]
  tick: (now: number) => void
  key: (name: string, down: boolean) => void
} {
  const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'))
  const frames: Draw[][] = []
  const sheets: number[] = []
  let ellipses: { x: number; y: number; rx: number }[] = []
  let current: Draw[] = []
  let pending: ((now: number) => void) | null = null
  let next = 0
  let mounted: { drawn: number[] } | null = null

  const makeCanvas = (): Record<string, unknown> => {
    const id = next++
    const ctx = {
      set imageSmoothingEnabled(_v: boolean) {},
      set fillStyle(_v: string) {},
      set globalAlpha(_v: number) {},
      createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => { sheets.push(id) },
      fillRect: () => {},
      beginPath: () => {},
      fill: () => {},
      ellipse: (x: number, y: number, rx: number) => { ellipses.push({ x, y, rx }) },
      drawImage: (src: { _id?: number; _canvas?: true }, ...rest: number[]) => {
        if (src?._canvas !== true) throw new TypeError('drawImage got a non-canvas — a browser would have thrown')
        if (rest.length < 8) return
        current.push({ canvas: src._id ?? -1, sy: rest[1]!, dx: rest[4]!, dy: rest[5]!, slot: -1 })
      },
    }
    return { _id: id, _canvas: true as const, width: 0, height: 0, getContext: () => ctx }
  }

  const listeners: Record<string, ((e: unknown) => void)[]> = {}
  const sandbox = {
    document: { createElement: () => makeCanvas(), getElementById: () => ({ appendChild: () => {}, textContent: '', className: '' }) },
    window: { addEventListener: (n: string, fn: (e: unknown) => void) => { (listeners[n] ??= []).push(fn) }, onerror: null },
    requestAnimationFrame: (fn: (now: number) => void) => { pending = fn },
    atob: (s: string) => Buffer.from(s, 'base64').toString('binary'),
    Math,
  }
  const capture = { ...sandbox, __capture: (m: { drawn: number[] }) => { mounted = m } }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(...Object.keys(capture), `${script}\n__capture(__last)`)(...Object.values(capture))

  return {
    frames,
    sheets,
    get ellipses() { return ellipses },
    tick: (now: number) => {
      const fn = pending
      pending = null
      current = []
      ellipses = []
      fn?.(now)
      const slots = (mounted?.drawn ?? []) as number[]
      current.forEach((d, k) => { d.slot = slots[k] ?? -1 })
      frames.push(current)
    },
    key: (name: string, down: boolean) => {
      for (const fn of listeners[down ? 'keydown' : 'keyup'] ?? []) fn({ key: name, preventDefault: () => {} })
    },
  }
}

const stage = toStage(moonScene)
const page = gamePage({ id: 'moon', title: 'The moon', blurb: '', date: '', meta: [], stage })
const slot = stage.placed.findIndex((p) => p.player !== undefined)
const pd = stage.placed[slot]!.player!
const clips = stage.placed[slot]!.clips as Record<string, { right: number; left: number }>
const at = (h: ReturnType<typeof run>, f: number): Draw => h.frames[f]!.find((d) => d.slot === slot) as Draw

describe('walking in eight directions', () => {
  it('each direction selects its own yawed clip, and the western half mirrors', () => {
    const h = run(page)
    const seen = new Map<string, number>()
    const press = (k: string): void => { h.key(k, true) }
    const release = (k: string): void => { h.key(k, false) }
    let f = 0
    const step = (): void => { h.tick(++f * 33.3) }

    for (const [keys, want] of [
      [['ArrowRight'], 'lope-e'],
      [['ArrowRight', 'ArrowUp'], 'lope-ne'],
      [['ArrowUp'], 'lope-n'],
      [['ArrowLeft'], 'lope-e'],
      [['ArrowDown'], 'lope-s'],
      [['ArrowRight', 'ArrowDown'], 'lope-se'],
    ] as const) {
      for (const k of keys) press(k)
      step(); step()
      seen.set(want, (seen.get(want) ?? 0) + 1)
      const drew = at(h, f - 1).canvas
      const pair = clips[want]!
      expect([h.sheets[pair.right], h.sheets[pair.left]], `${keys.join('+')} did not draw ${want}`).toContain(drew)
      for (const k of keys) release(k)
      step()
    }
    // Six inputs reached five distinct clips: left and right share one, mirrored.
    expect(seen.size).toBe(5)
  })

  it('a diagonal is not faster than a straight line', () => {
    // The oldest bug in top-down movement, and the one every engine that skips the
    // normalisation gets reported for.
    const straight = run(page)
    straight.key('ArrowRight', true)
    for (let f = 1; f <= 30; f++) straight.tick(f * 33.3)
    const dx = at(straight, 29).dx - at(straight, 0).dx

    const diag = run(page)
    diag.key('ArrowRight', true)
    diag.key('ArrowDown', true)
    for (let f = 1; f <= 30; f++) diag.tick(f * 33.3)
    const dxd = at(diag, 29).dx - at(diag, 0).dx
    expect(dxd, 'a diagonal moves as far across as a straight line, so it is faster').toBeLessThan(dx)
  })

  it('walking toward the camera changes what he is drawn in front of', () => {
    // **The y-sort**, and it exists because he can now walk into the picture. Every other
    // subject here has a fixed contact row; his is state.
    const h = run(page)
    h.tick(0)
    const before = h.frames[0]!.findIndex((d) => d.slot === slot)
    h.key('ArrowDown', true)
    for (let f = 1; f <= 60; f++) h.tick(f * 33.3)
    const after = h.frames[60]!.findIndex((d) => d.slot === slot)
    expect(after, 'his paint order did not follow him toward the camera').toBeGreaterThan(before)
  })
})

describe('the jump', () => {
  it('leaves the ground, hangs, and comes back to exactly where it started', () => {
    const h = run(page)
    h.tick(0)
    const ground = at(h, 0).dy

    h.key(' ', true)
    h.key(' ', false)
    let apex = ground
    let airborne = 0
    for (let f = 1; f <= 200; f++) {
      h.tick(f * 33.3)
      const y = at(h, f).dy
      if (y < ground) airborne++
      if (y < apex) apex = y
    }
    expect(ground - apex, 'he barely left the ground').toBeGreaterThan(30)
    expect(at(h, 200).dy, 'he did not land where he took off').toBe(ground)

    /**
     * **The hang, and it is the number the whole commission rests on.**
     *
     * 42 px/s² of gravity against a 62 px/s push is 2.95 s in the air. On Earth the same push
     * at 26 px per metre would be over in 0.6 s. That contrast is the only place in the scene
     * where the moon is something a player feels rather than something I drew.
     */
    const seconds = (airborne * 33.3) / 1000
    expect(seconds, `the hang was ${seconds.toFixed(2)} s, which is not lunar`).toBeGreaterThan(2.2)
    expect(seconds).toBeLessThan(3.6)
  })

  it('the shadow stays on the ground while the body rises', () => {
    // Without it a jump in an overhead view is a sprite drifting upward for no reason, and
    // the landing is a surprise.
    const h = run(page)
    h.tick(0)
    const rest = h.ellipses[0]
    expect(rest, 'nothing drew a shadow').toBeDefined()

    h.key(' ', true); h.key(' ', false)
    for (let f = 1; f <= 30; f++) h.tick(f * 33.3)
    const up = h.ellipses[0] as { x: number; y: number; rx: number }
    expect(up.y, 'the shadow left the ground with him').toBe((rest as { y: number }).y)
    expect(up.rx, 'the shadow did not shrink as he rose').toBeLessThan((rest as { rx: number }).rx)
  })

  it('a second press in mid-air does nothing', () => {
    const h = run(page)
    h.tick(0)
    h.key(' ', true); h.key(' ', false)
    for (let f = 1; f <= 20; f++) h.tick(f * 33.3)
    const rising = at(h, 20).dy
    h.key(' ', true); h.key(' ', false)
    for (let f = 21; f <= 40; f++) h.tick(f * 33.3)
    // Still on one arc: a double jump would have re-launched from wherever he was.
    let apex = rising
    for (let f = 21; f <= 40; f++) apex = Math.min(apex, at(h, f).dy)
    expect(apex).toBeGreaterThan(at(h, 0).dy - 60)
  })
})

describe('the scene declares what the moon is', () => {
  it('has no aerial perspective, because it has no air', () => {
    expect(moonScene.haze, 'the moon has haze, which means it has an atmosphere').toBe(0)
  })

  it('the Earth does not move', () => {
    const earth = moonScene.placements.find((p) => p.grammar === 'earth')
    expect(earth?.sky).toBe(true)
    expect(earth?.motion, 'the Earth drifts, and a tidally locked moon holds it still').toBeUndefined()
  })

  it('the jump ratio is lunar and the numbers say so', () => {
    // 26 px per metre: the astronaut is 46 px for a 1.8 m person. Lunar g is 1.62 m/s².
    const jump = pd.jump!
    const perMetre = jump.gravity / 1.62
    expect(perMetre).toBeGreaterThan(20)
    expect(perMetre).toBeLessThan(32)
  })
})
