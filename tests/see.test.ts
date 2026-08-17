/**
 * The structured look is an instrument, so it gets a null case before it is believed
 * (`HARNESS.md` §5), calibrated in both directions: it must not drift on identical
 * input, and it must move when the picture moves.
 */
import { describe, expect, it } from 'vitest'
import { execute } from '../src/io/load.ts'
import { encodePng, sheetPng } from '../src/io/png.ts'

const SPEC = { grammar: 'fixture', tunables: 'default', seed: 1 } as const

function sheet(overrides?: Record<string, number | boolean>): Uint8Array {
  const result = execute({ ...SPEC, overrides })
  return sheetPng(result.frames.map((f) => f.buf), result.grammar.palette, 2)
}

describe('the structured look', () => {
  it('writes a well-formed PNG: signature, IHDR dimensions, IEND', () => {
    const result = execute(SPEC)
    const frames = result.frames.map((f) => f.buf)
    const png = sheetPng(frames, result.grammar.palette, 2)
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const view = new DataView(png.buffer, png.byteOffset)
    const first = frames[0]!
    const w = (first.w * frames.length + 2 * (frames.length - 1)) * 2
    expect(view.getUint32(16)).toBe(w)
    expect(view.getUint32(20)).toBe(first.h * 2)
    const tail = String.fromCharCode(...png.subarray(png.length - 8, png.length - 4))
    expect(tail).toBe('IEND')
  })

  it('is deterministic: the same run encodes byte-identical twice', () => {
    expect(Buffer.compare(Buffer.from(sheet()), Buffer.from(sheet()))).toBe(0)
  })

  it('moves when the picture moves: a knob turn changes the bytes', () => {
    const on = sheet()
    const off = sheet({ 'outline.enabled': false })
    expect(Buffer.compare(Buffer.from(on), Buffer.from(off))).not.toBe(0)
  })

  it('refuses a buffer that does not match its declared size', () => {
    expect(() => encodePng(2, 2, new Uint8Array(5))).toThrow()
  })
})
