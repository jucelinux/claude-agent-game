import { describe, expect, it } from 'vitest'
import type { Grammar } from '../src/core/types.ts'
import { loadParams } from '../src/io/load.ts'
import { sprite, strip } from '../src/core/render.ts'
import { measure } from '../src/core/metrics.ts'
import { fixture } from '../src/grammars/fixture.ts'
import { CHARS, dumpFrame, silhouette } from '../src/perception/lum.ts'

/**
 * **The null case, run before the channel is believed** (`TASTE-LOOP.md` §2.1,
 * `HARNESS.md` §5). The inherited instrument's three known defects all pointed the same
 * way: they made the instrument *approve* what it exists to denounce. So each case below
 * asks the channel to fail, and fails the build if it cannot.
 */
describe('perception channel — null cases', () => {
  const params = loadParams('default')
  const real = sprite(fixture, params, 1, 0)
  const realDump = dumpFrame(real.buf, fixture.palette)

  it('subject off: an empty grammar prints an empty sheet, and a full one does not', () => {
    const empty: Grammar = { ...fixture, parts: [] }
    const off = sprite(empty, params, 1, 0)
    const offDump = dumpFrame(off.buf, fixture.palette)

    expect(offDump.replace(/[\n ]/g, '')).toBe('')
    expect(offDump).not.toBe(realDump)
    expect(realDump.replace(/[\n ]/g, '').length).toBeGreaterThan(100)
  })

  it('the dump loses no ink: every non-background pixel prints a visible character', () => {
    const metrics = measure([real], fixture)
    const painted = Math.round((metrics.inkCoverage[0] as number) * real.buf.w * real.buf.h)
    const printed = realDump.split('\n').join('').split('').filter((c) => c !== CHARS[0]).length
    // A dark outline against an empty background is exactly the pair a luminance ramp
    // collapses if its lowest visible step is left at ' '.
    expect(printed).toBe(painted)
  })

  it('the reduction separates two frames I know differ (HARNESS §5)', () => {
    const frames = strip(fixture, params, 1)
    const a = frames[0]!
    const b = frames[2]!
    expect(Buffer.from(a.buf.data).equals(Buffer.from(b.buf.data))).toBe(false)

    // The full dump must see it...
    expect(dumpFrame(a.buf, fixture.palette)).not.toBe(dumpFrame(b.buf, fixture.palette))
    // ...and so must the 25% silhouette, which is the instrument that throws information
    // away. A reduction that cannot tell a forward leg from a back leg is not a silhouette
    // read, it is a blur that approves everything.
    expect(silhouette(a.buf)).not.toBe(silhouette(b.buf))
  })

  it('absence is caught by counting, not by looking', () => {
    // A part that is authored, bound, and never reaches the buffer: the image still looks
    // like a body, so the eye approves it. Only the ownership count says it is missing.
    const offstage: Grammar = {
      ...fixture,
      parts: fixture.parts.map((p) =>
        p.name === 'head' ? { ...p, shape: { kind: 'ellipse' as const, cx: 999, cy: 999, rx: 5, ry: 5 } } : p,
      ),
    }
    const frames = strip(offstage, params, 1)
    const metrics = measure(frames, offstage)

    expect(metrics.partPixels['head']!.every((c) => c === 0)).toBe(true)
    expect(metrics.partPixels['trunk']!.every((c) => c > 0)).toBe(true)
    // ...and the sheet still reads as a body. That is the whole point.
    expect(dumpFrame(frames[0]!.buf, fixture.palette).replace(/[\n ]/g, '').length).toBeGreaterThan(100)
  })

  it('with the real grammar, no part is absent', () => {
    const metrics = measure(strip(fixture, params, 1), fixture)
    for (const [part, counts] of Object.entries(metrics.partPixels)) {
      expect(counts.some((c) => c > 0), `part "${part}" never reaches the buffer`).toBe(true)
    }
  })
})
