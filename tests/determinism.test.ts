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

  /**
   * **The two files that emit browser runtime code may read a clock, and nothing else may.**
   *
   * `HARNESS.md` §2.1 makes rendering a *consumer* of the deterministic core, and a consumer
   * running an animation loop has to know what time it is — both of these already take a
   * timestamp from `requestAnimationFrame`. What was added on 16/08 is a frame-time meter,
   * which needs a second reading inside the frame to measure the work between them.
   *
   * **The exemption is a clock and only a clock.** `Math.random`, `Date.now` and `new Date`
   * stay banned in every file in the tree without exception, because those are the ones that
   * would make output differ run to run. A clock that measures how long the drawing took
   * cannot change what was drawn — and if one ever did, the determinism hash above catches
   * it, which is the guarantee this lock is only the cheap early warning for.
   */
  // One consumer now, and it used to be two. The bench page that showed sprites in cells was
  // deleted on 16/08 at his instruction: drawing only makes sense inside a game scene, so the
  // only thing allowed to read a clock is the thing that runs one.
  const CONSUMERS = ['src/micro/app.ts']

  it('no ambient randomness anywhere, and no clock below the consumers', () => {
    const always = [/Math\.random/, /Date\.now/, /new Date\b/]
    const clocks = [/process\.hrtime/, /performance\.now/]
    let exempted = 0
    for (const file of sourcesUnder('src')) {
      // Comments are stripped first: the lock hunts the defect, not prose that names it.
      const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      const isConsumer = CONSUMERS.some((c) => file.endsWith(c))
      if (isConsumer) exempted++
      for (const pattern of [...always, ...(isConsumer ? [] : clocks)]) {
        expect(pattern.test(text), `${file} contains ${pattern}`).toBe(false)
      }
    }
    // The exemption list must name files that exist, or it silently stops exempting anything
    // and silently stops meaning anything.
    expect(exempted, 'the consumer exemption names files that are not in the tree').toBe(CONSUMERS.length)
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
