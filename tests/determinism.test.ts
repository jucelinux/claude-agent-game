import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { execute, loadParams, ROOT } from '../src/io/load.ts'
import { sprite } from '../src/core/render.ts'
import { hashBuffers } from '../src/core/hash.ts'
import { fixture } from '../src/grammars/fixture.ts'

const SPEC = { grammar: 'fixture', tunables: 'default', seed: 1 } as const

describe('determinism — the blocker (HARNESS §2.5)', () => {
  it('same run, twice, same hash', () => {
    expect(execute(SPEC).hash).toBe(execute(SPEC).hash)
  })

  it('same t, twice, byte-identical frame', () => {
    const params = loadParams('default')
    const a = sprite(fixture, params, 1, 0.375)
    const b = sprite(fixture, params, 1, 0.375)
    expect(Buffer.from(a.buf.data).equals(Buffer.from(b.buf.data))).toBe(true)
  })

  it('the seed is inert while speckle is off — and live when it is on', () => {
    // Inert: with no stochastic channel enabled, two seeds must agree exactly.
    const a = execute({ ...SPEC, seed: 1 })
    const b = execute({ ...SPEC, seed: 999 })
    expect(a.hash).toBe(b.hash)

    // Live: this is the absence check on the RNG itself. If the injected source were
    // never actually called, the assertion above would pass for the wrong reason.
    const on = { ...SPEC, overrides: { 'texture.speckle': 0.25 } }
    const c = execute({ ...on, seed: 1 })
    const d = execute({ ...on, seed: 999 })
    expect(c.hash).not.toBe(d.hash)
    expect(execute({ ...on, seed: 1 }).hash).toBe(c.hash)
  })

  it('the frame is a closed form in t: order of evaluation does not matter', () => {
    const params = loadParams('default')
    const ts = [0, 0.25, 0.5, 0.75]
    const forward = ts.map((t) => sprite(fixture, params, 1, t).buf)
    const backward = [...ts].reverse().map((t) => sprite(fixture, params, 1, t).buf)
    expect(hashBuffers(forward)).toBe(hashBuffers([...backward].reverse()))
  })

  it('no ambient randomness anywhere below the core', () => {
    const banned = [/Math\.random/, /Date\.now/, /new Date\b/, /process\.hrtime/, /performance\.now/]
    for (const file of sourcesUnder('src')) {
      // Comments are stripped first: the lock hunts the defect, not prose that names it.
      const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      for (const pattern of banned) {
        expect(pattern.test(text), `${file} contains ${pattern}`).toBe(false)
      }
    }
  })
})

function sourcesUnder(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(new URL(dir, `file://${ROOT}`), { withFileTypes: true })) {
    const child = `${dir}/${entry.name}`
    if (entry.isDirectory()) out.push(...sourcesUnder(child))
    else if (entry.name.endsWith('.ts')) out.push(`${ROOT}${child}`)
  }
  return out
}
