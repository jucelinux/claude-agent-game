import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { execute, loadParams, ROOT } from '../src/io/load.ts'
import { PAIRS, grammarByName } from '../src/grammars/index.ts'

const SPEC = { grammar: 'fixture', tunables: 'default', seed: 1 } as const

describe('tunables', () => {
  it('one value changed, behaviour changed, no code edit (HARNESS §4)', () => {
    const base = execute(SPEC).hash
    expect(execute({ ...SPEC, overrides: { 'gait.swing': 0.14 } }).hash).not.toBe(base)
    expect(execute({ ...SPEC, overrides: { 'outline.enabled': false } }).hash).not.toBe(base)
    expect(execute({ ...SPEC, overrides: { 'tones.perMaterial': 4 } }).hash).toBe(base)
  })

  it('an unknown override path is an error, not a silent no-op', () => {
    expect(() => execute({ ...SPEC, overrides: { 'gait.swingg': 1 } })).toThrow()
  })

  it('every tunable in every file is anchored (HARNESS §2.7)', () => {
    // Every file, not just the default one: a free-floating number in a probe file is
    // still a free-floating number, and probe files are where knobs actually get turned.
    const files = readdirSync(`${ROOT}tunables`).filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    expect(files.length).toBeGreaterThan(1)
    const missing: string[] = []
    for (const file of files) {
      const raw = JSON.parse(readFileSync(`${ROOT}tunables/${file}`, 'utf8')) as Record<string, unknown>
      const anchors = raw['_anchors'] as Record<string, string>
      for (const [group, value] of Object.entries(raw)) {
        if (group === '_anchors') continue
        for (const leaf of Object.keys(value as Record<string, unknown>)) {
          const path = `${group}.${leaf}`
          if (typeof anchors[path] !== 'string' || anchors[path]!.length < 10) missing.push(`${file}: ${path}`)
        }
      }
    }
    expect(missing, 'a free-floating number breaks on the first knob turn').toEqual([])
  })

  it('the tone budget is a lock, not a suggestion — in every grammar', () => {
    for (const pair of PAIRS) {
      const params = loadParams(pair.tunables)
      for (const ramp of grammarByName(pair.grammar).palette.ramps) {
        expect(ramp.indices.length, `${pair.grammar} / ${ramp.material}`).toBe(params.tones.perMaterial)
      }
    }
  })

  it('index 0 is background and no ramp anywhere claims it', () => {
    for (const pair of PAIRS) {
      for (const ramp of grammarByName(pair.grammar).palette.ramps) {
        expect(ramp.indices, `${pair.grammar} / ${ramp.material}`).not.toContain(0)
      }
    }
  })
})
