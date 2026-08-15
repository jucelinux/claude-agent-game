import { describe, expect, it } from 'vitest'
import { execute } from '../src/io/load.ts'
import { emit } from '../src/viewer/page.ts'
import { SELFTEST } from '../src/viewer/selftest.ts'
import type { ViewCell } from '../src/viewer/page.ts'

const SPEC = { grammar: 'fixture', tunables: 'default', seed: 1 } as const

function cellsFor(): ViewCell[] {
  const result = execute(SPEC)
  return [
    {
      w: result.params.canvas.w,
      h: result.params.canvas.h,
      frames: result.frames.map((f) => f.buf.data),
      palette: result.grammar.palette.colors,
      label: `fixture · ${result.hash}`,
    },
  ]
}

function payloadOf(html: string): { mode: string; scale: number; msPerFrame: number; cells: Record<string, unknown>[] } {
  const match = html.match(/\nstart\((\{[\s\S]*\})\);\n/)
  if (match === null) throw new Error('the page carries no payload at all')
  return JSON.parse((match[1] as string).replace(/<\\\//g, '</'))
}

const BASE = { scale: 4, msPerFrame: 125 } as const

describe('viewer — the human channel', () => {
  it('the frames reach the page: what is embedded decodes back to what was rendered', () => {
    // The absence check for this instrument. A page can be laid out perfectly and ship an
    // empty payload; looking at the HTML would never say so, and the browser would show a
    // neutral grey rectangle that reads as "background", not as "broken".
    const cells = cellsFor()
    const payload = payloadOf(emit({ ...BASE, mode: 'bench', cells }))
    const cell = payload.cells[0] as { indices: string; n: number; w: number; h: number }
    const bytes = Buffer.from(cell.indices, 'base64')
    const source = Buffer.concat((cells[0] as ViewCell).frames.map((f) => Buffer.from(f)))

    expect(cell.n).toBe((cells[0] as ViewCell).frames.length)
    expect(bytes.length).toBe(cell.w * cell.h * cell.n)
    expect(bytes.equals(source)).toBe(true)
    expect(bytes.some((b) => b !== 0)).toBe(true)
  })

  it('gate mode carries no tell', () => {
    const html = emit({ ...BASE, mode: 'gate', cells: cellsFor(), title: 'should be dropped' })
    const payload = payloadOf(html)

    // Nothing that names a cell, in the payload or anywhere in the document.
    expect(payload.cells.every((c) => !('label' in c))).toBe(true)
    for (const tell of ['fixture', 'seed', 'grammar', '.run.json', 'should be dropped']) {
      expect(html.includes(tell), `gate page leaks "${tell}"`).toBe(false)
    }
    // And no way to stop time: the controls are compiled out, not switched off.
    for (const control of ['keydown', 'ArrowRight', '<button', '<input', 'addEventListener']) {
      expect(html.includes(control), `gate page ships a control: "${control}"`).toBe(false)
    }
    // The naming machinery is gone too, not merely unused: dead code that writes a name
    // into the DOM is one typo away from live code that ends the reading.
    expect(html.includes('label'), 'gate page still knows how to name a cell').toBe(false)
  })

  it('bench mode keeps the labels and the controls — the rule protects his reading, not mine', () => {
    const html = emit({ ...BASE, mode: 'bench', cells: cellsFor() })
    expect(payloadOf(html).cells.every((c) => typeof c['label'] === 'string')).toBe(true)
    expect(html).toContain('keydown')
  })

  it('one tick for the page, never one per cell', () => {
    const payload = payloadOf(emit({ ...BASE, mode: 'gate', cells: [...cellsFor(), ...cellsFor()] }))
    expect(payload.msPerFrame).toBe(125)
    for (const cell of payload.cells) {
      for (const key of Object.keys(cell)) {
        expect(['msPerFrame', 'fps', 'delay', 'speed'].includes(key), `cell owns timing: "${key}"`).toBe(false)
      }
    }
  })

  it('nearest neighbour at an integer scale, or the comparison is of renderers', () => {
    const html = emit({ ...BASE, mode: 'gate', cells: cellsFor() })
    expect(html).toContain('imageSmoothingEnabled = false')
    expect(html).toContain('image-rendering: pixelated')
    expect(() => emit({ ...BASE, scale: 2.5, mode: 'gate', cells: cellsFor() })).toThrow()
    expect(() => emit({ ...BASE, scale: 0, mode: 'gate', cells: cellsFor() })).toThrow()
  })

  it('self-contained: no network in the path', () => {
    // Every page that reaches a file. `live` is the one exception and it is served, never
    // written — a file on disk that expects a server behind it lies the day it is opened
    // without one.
    for (const mode of ['bench', 'gate', 'selftest'] as const) {
      const html = emit({ ...BASE, mode, cells: cellsFor() })
      for (const external of ['<link', 'src=', 'http://', 'https://', 'fetch(', 'EventSource', 'XMLHttpRequest', '@import']) {
        expect(html.includes(external), `${mode} page reaches out through "${external}"`).toBe(false)
      }
    }
  })

  it('live is the served page, and the gate is never live', () => {
    const live = emit({ ...BASE, mode: 'live', cells: [] })
    expect(live).toContain('fetch(')
    expect(live).toContain('EventSource')
    // Swapping frames must not restart the loop, or a change is judged from a standstill.
    expect(live).toContain('page.swap')
    // And the swap machinery is compiled out of every page that is not live. A page that
    // knows how to replace its frames is one line away from a sheet that changes under him.
    for (const mode of ['bench', 'gate', 'selftest'] as const) {
      expect(emit({ ...BASE, mode, cells: cellsFor() }).includes('swap'), `${mode} can swap`).toBe(false)
    }
  })

  it('the live page is slides; every comparison page is not', () => {
    // One at a time is right for a history that only grows. It is wrong for the gate,
    // which is a comparison, and wrong for the self-test, whose four cells only mean
    // anything side by side.
    const live = emit({ ...BASE, mode: 'live', cells: [] })
    expect(live).toContain('id="nav"')
    expect(live).toContain('id="caption"')
    for (const mode of ['gate', 'selftest', 'bench'] as const) {
      const html = emit({ ...BASE, mode, cells: cellsFor() })
      expect(html.includes('id="nav"'), `${mode} is on slides`).toBe(false)
    }
    // A comparison asked to become a slideshow is an error, not a quietly dropped option:
    // the gate reading *is* six cells at once, and the self-test means nothing sequentially.
    for (const mode of ['gate', 'selftest'] as const) {
      expect(() => emit({ ...BASE, mode, slides: true, cells: cellsFor() })).toThrow()
    }
    // A history published as a file still gets slides — that is what history wants.
    expect(emit({ ...BASE, mode: 'bench', slides: true, cells: cellsFor() })).toContain('id="nav"')
  })

  it('the ground is a mid grey, on every page, for a reason worth keeping', () => {
    // Black was tried and reverted by the human after looking. Index 0 is transparent, so
    // the ground *is* the sprite's background: against black the darkest ink vanishes, and
    // what vanishes with it is the outline — the thing a silhouette is judged on.
    for (const mode of ['live', 'gate', 'bench'] as const) {
      expect(emit({ ...BASE, mode, cells: mode === 'live' ? [] : cellsFor() })).toContain('background: #6b6b6b')
    }
    expect(emit({ ...SELFTEST })).toContain('background: #6b6b6b')
  })

  it('a slide is a run: cells sharing a group land together', () => {
    const one = { ...(cellsFor()[0] as ViewCell), group: 'the probe' }
    const two = { ...(cellsFor()[0] as ViewCell), group: 'the probe' }
    const three = { ...(cellsFor()[0] as ViewCell), group: 'round zero' }
    const payload = payloadOf(emit({ ...BASE, mode: 'bench', slides: true, cells: [one, two, three] }))
    expect(payload.cells.map((c) => c['group'])).toEqual(['the probe', 'the probe', 'round zero'])
    // The gate never groups, because it never slides.
    const gate = payloadOf(emit({ ...BASE, mode: 'gate', cells: [one] }))
    expect(gate.cells.every((c) => !('group' in c))).toBe(true)
  })

  it('index 0 is transparent, so no cell carries a ground the others do not', () => {
    expect(emit({ ...BASE, mode: 'gate', cells: cellsFor() })).toContain('img.data[o + 3] = 0')
  })

  it('a frame that does not fit its cell is an error, not a smear', () => {
    const cells = cellsFor()
    const broken: ViewCell = { ...(cells[0] as ViewCell), w: 47 }
    expect(() => emit({ ...BASE, mode: 'bench', cells: [broken] })).toThrow()
  })
})
