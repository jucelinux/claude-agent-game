import { describe, expect, it } from 'vitest'
import { execute } from '../src/io/load.ts'
import { emit } from '../src/viewer/page.ts'

/**
 * The viewer's null case as a **lock**, not as a page I promise to look at.
 *
 * `selftest.html` says what a broken viewer looks like to a human. This runs the very same
 * inlined runtime headless, against a fake DOM, and asserts the four things the eye would
 * be checking there: the pixels arrive, index 0 is transparent, smoothing is off, and the
 * whole page advances on one tick. An instrument nobody can re-run is a rumour.
 */

type Recorded = {
  smoothing: boolean[]
  put: { data: Uint8ClampedArray; w: number; h: number }[]
  drawn: { w: number; h: number }[]
  canvases: { w: number; h: number }[]
}

function runPage(html: string): { record: Recorded; tick: (now: number) => void } {
  const source = html.match(/<script>\n([\s\S]*?)\nstart\(/)
  const payload = html.match(/\nstart\((\{[\s\S]*\})\);\n/)
  if (source === null || payload === null) throw new Error('the page carries no runnable script')

  const record: Recorded = { smoothing: [], put: [], drawn: [], canvases: [] }
  let pending: ((now: number) => void) | null = null

  const makeCtx = () => ({
    set imageSmoothingEnabled(value: boolean) {
      record.smoothing.push(value)
    },
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: (img: { data: Uint8ClampedArray; width: number; height: number }) => {
      record.put.push({ data: img.data, w: img.width, h: img.height })
    },
    clearRect: () => {},
    // Only the on-screen context ever receives a drawImage; the 1:1 buffer only gets pixels.
    drawImage: (_src: unknown, _x: number, _y: number, w: number, h: number) => {
      record.drawn.push({ w, h })
    },
  })

  const document = {
    getElementById: () => ({ appendChild: () => {} }),
    createElement: (tag: string) => {
      if (tag !== 'canvas') return { className: '', textContent: '', appendChild: () => {} }
      const canvas = { width: 0, height: 0, getContext: (): unknown => null }
      canvas.getContext = () => {
        record.canvases.push({ w: canvas.width, h: canvas.height })
        return makeCtx()
      }
      return canvas
    },
    addEventListener: () => {},
  }

  const requestAnimationFrame = (cb: (now: number) => void) => {
    pending = cb
  }
  const atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary')

  const start = new Function('document', 'atob', 'requestAnimationFrame', `${source[1]}\nreturn start`)(
    document,
    atob,
    requestAnimationFrame,
  ) as (data: unknown) => void

  start(JSON.parse((payload[1] as string).replace(/<\\\//g, '</')))

  return {
    record,
    tick: (now: number) => {
      const cb = pending
      if (cb === null) throw new Error('the page stopped asking for frames')
      pending = null
      cb(now)
    },
  }
}

describe('viewer runtime, headless', () => {
  const result = execute({ grammar: 'fixture', tunables: 'default', seed: 1 })
  const cell = {
    w: result.params.canvas.w,
    h: result.params.canvas.h,
    frames: result.frames.map((f) => f.buf.data),
    palette: result.grammar.palette.colors,
  }
  const html = emit({ mode: 'gate', scale: 4, msPerFrame: 125, cells: [cell, cell] })

  it('the pixels arrive, and they are the pixels that were rendered', () => {
    const page = runPage(html)
    page.tick(0)

    expect(page.record.put.length).toBe(2) // two cells, one frame each, first tick
    const drawn = page.record.put[0]!
    const source = result.frames[0]!.buf

    let opaque = 0
    for (let i = 0; i < source.data.length; i++) {
      const index = source.data[i] as number
      const alpha = drawn.data[i * 4 + 3] as number
      if (index === 0) {
        expect(alpha).toBe(0) // index 0 transparent: no cell brings its own background
      } else {
        opaque++
        const rgb = result.grammar.palette.colors[index]!
        expect([drawn.data[i * 4], drawn.data[i * 4 + 1], drawn.data[i * 4 + 2], alpha]).toEqual([...rgb, 255])
      }
    }
    // ...and it is not an empty page that merely decoded cleanly.
    expect(opaque).toBeGreaterThan(400)
  })

  it('nearest neighbour, at the integer scale, on the way to the screen', () => {
    const page = runPage(html)
    page.tick(0)
    // Smoothing is switched off on every context that reaches the screen, and nowhere is
    // it switched back on.
    expect(page.record.smoothing).toEqual([false, false])
    // Per cell: a 192 px view canvas and a 48 px 1:1 buffer. The scale happens exactly once.
    expect(page.record.canvases).toEqual([
      { w: 192, h: 192 },
      { w: 48, h: 48 },
      { w: 192, h: 192 },
      { w: 48, h: 48 },
    ])
    expect(page.record.drawn).toEqual([{ w: 192, h: 192 }, { w: 192, h: 192 }])
  })

  it('one tick: every cell advances together, at the declared ms per frame', () => {
    const page = runPage(html)
    const frameAt = (now: number): number[] => {
      page.record.put.length = 0
      page.tick(now)
      return page.record.put.map((p) => indexOfFrame(p.data))
    }
    const indexOfFrame = (data: Uint8ClampedArray): number => {
      for (let f = 0; f < result.frames.length; f++) {
        const source = result.frames[f]!.buf.data
        let same = true
        for (let i = 0; i < source.length && same; i++) {
          const index = source[i] as number
          const alpha = data[i * 4 + 3] as number
          if ((index === 0) !== (alpha === 0)) same = false
        }
        if (same) return f
      }
      return -1
    }

    expect(frameAt(0)).toEqual([0, 0])
    expect(frameAt(125)).toEqual([1, 1])
    expect(frameAt(375)).toEqual([3, 3])
    expect(frameAt(500)).toEqual([0, 0]) // and it loops
    // A tick shorter than one frame must not advance anything: the accumulator is real.
    expect(frameAt(560)).toEqual([0, 0])
  })

  it('a dead tick is caught: identical frames stand still while a real cycle does not', () => {
    const still = { ...cell, frames: [cell.frames[0]!, cell.frames[0]!, cell.frames[0]!, cell.frames[0]!] }
    const page = runPage(emit({ mode: 'gate', scale: 4, msPerFrame: 125, cells: [still, cell] }))
    page.tick(0)
    const first = page.record.put.map((p) => Buffer.from(p.data).toString('base64'))
    page.record.put.length = 0
    page.tick(250)
    const later = page.record.put.map((p) => Buffer.from(p.data).toString('base64'))

    expect(later[0]).toBe(first[0]) // the static cell did not move...
    expect(later[1]).not.toBe(first[1]) // ...and the live one did, on the same tick
  })
})
