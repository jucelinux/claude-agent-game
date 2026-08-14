import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { execute, loadRun, ROOT } from '../src/io/load.ts'

/**
 * The second determinism test (`HARNESS.md` §2.6): the run still ends where it ended last
 * time. When this fails, a behaviour change happened — the question is whether it was
 * meant to. Regenerate with `npm run baseline`, and only ever in the turn that intends it.
 */
describe('baseline', () => {
  const baseline = JSON.parse(readFileSync(`${ROOT}runs/fixture.baseline.json`, 'utf8')) as {
    hash: string
    command: string
    date: string
  }

  it('the recorded run still produces the recorded hash', () => {
    expect(execute(loadRun(`${ROOT}runs/fixture.run.json`)).hash).toBe(baseline.hash)
  })

  it('carries the command that regenerates it and its date (TASTE-LOOP §3b.4)', () => {
    expect(baseline.command).toBeTruthy()
    expect(baseline.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
