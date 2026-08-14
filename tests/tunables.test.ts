import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { execute, loadParams, ROOT } from '../src/io/load.ts'
import { fixture } from '../src/grammars/fixture.ts'

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

  it('every tunable is anchored (HARNESS §2.7)', () => {
    const raw = JSON.parse(readFileSync(`${ROOT}tunables/default.json`, 'utf8')) as Record<string, unknown>
    const anchors = raw['_anchors'] as Record<string, string>
    const missing: string[] = []
    for (const [group, value] of Object.entries(raw)) {
      if (group === '_anchors') continue
      for (const leaf of Object.keys(value as Record<string, unknown>)) {
        const path = `${group}.${leaf}`
        if (typeof anchors[path] !== 'string' || anchors[path]!.length < 10) missing.push(path)
      }
    }
    expect(missing, 'a free-floating number breaks on the first knob turn').toEqual([])
  })

  it('the tone budget is a lock, not a suggestion', () => {
    const params = loadParams('default')
    for (const ramp of fixture.palette.ramps) {
      expect(ramp.indices.length, `material "${ramp.material}"`).toBe(params.tones.perMaterial)
    }
  })

  it('index 0 is background and no ramp claims it', () => {
    for (const ramp of fixture.palette.ramps) expect(ramp.indices).not.toContain(0)
  })
})
