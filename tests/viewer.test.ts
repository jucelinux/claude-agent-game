import { describe, expect, it } from 'vitest'
import { execute } from '../src/io/load.ts'
import { emit } from '../src/viewer/page.ts'
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
    const html = emit({ ...BASE, mode: 'bench', cells: cellsFor() })
    for (const external of ['<link', 'src=', 'http://', 'https://', 'fetch(', 'XMLHttpRequest', '@import']) {
      expect(html.includes(external), `page reaches out through "${external}"`).toBe(false)
    }
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
