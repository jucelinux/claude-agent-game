import { describe, expect, it } from 'vitest'
import type { Grammar } from '../src/core/types.ts'
import { execute, loadParams } from '../src/io/load.ts'
import { PAIRS, grammarByName } from '../src/grammars/index.ts'
import { measure } from '../src/core/metrics.ts'
import { strip } from '../src/core/render.ts'
import { GROUND_RGB, luminance } from '../src/core/color.ts'
import { OWNER_OUTLINE } from '../src/core/raster.ts'

/**
 * **The silhouette and value locks**, the two that round zero deferred with the note "the
 * lock itself waits for a sample worth locking". The sample exists now, and the round that
 * built it is the round that calibrates them.
 *
 * Both measure the same thing from two sides: *does the shape read against the ground.*
 *  - **edge contrast** — how far the sprite's boundary pixels sit from the ground in
 *    luminance. This is where the high-budget idiom was failing: a boundary pixel 0.058
 *    away from the ground is a pixel nobody can see.
 *  - **the 25% read** — throw three quarters of the sprite away and the shape must still be
 *    one body. Coverage alone would pass a cloud of dust, so what is locked is the share of
 *    the surviving cells held by the largest connected blob.
 */

/** Measured, not guessed. The failing sample sits at 0.058; both fixes clear 0.13. */
const EDGE_MIN = 0.1
const EDGE_MEAN = 0.25
/** A shape that survives reduction keeps one body. Dust spreads across many. */
const BLOB_SHARE = 0.9

const SAMPLES = ['probe-a', 'probe-b', 'probe-c-line', 'probe-c-value', 'probe-d'] as const

describe('silhouette and value', () => {
  /**
   * **This test used to pin two constants together and now it pins one to a property, and the
   * demotion is stated rather than hidden.**
   *
   * The edge-contrast lock measures a sprite's boundary against `GROUND_RGB`. That number used
   * to be duplicated in the bench page, so the two were pinned to each other here: a lock
   * measuring contrast against a different grey than the one on screen measures nothing.
   *
   * **The bench page was deleted on 16/08** — drawing only makes sense inside a game scene — so
   * there is no second constant left to agree with, and no page anybody looks at. `GROUND_RGB`
   * is now a **measurement reference** rather than a surface: it says how hard an edge pushes
   * against a neutral mid grey, which is a proxy for "does this silhouette read at all".
   *
   * What survives is the property that makes the proxy honest: **the reference must sit in the
   * middle of the range.** Against black, every light sprite passes; against white, every dark
   * one does. A lock calibrated at either end measures the palette instead of the drawing.
   */
  it('the reference the locks measure against is neutral and mid-range', () => {
    const [r, g, b] = GROUND_RGB
    expect(Math.max(r, g, b) - Math.min(r, g, b), 'the reference is not neutral').toBeLessThanOrEqual(2)
    const l = luminance(GROUND_RGB)
    expect(l).toBeGreaterThan(0.35)
    expect(l).toBeLessThan(0.65)
  })

  it('every shipped sample reads against the ground, in every frame', () => {
    for (const tunables of SAMPLES) {
      const grammar = tunables.startsWith('probe-c') ? 'probe-c' : tunables
      const m = execute({ grammar, tunables, seed: 1 }).metrics
      for (const [i, edge] of m.edgeContrast.entries()) {
        expect(edge.min, `${tunables} frame ${i} has a boundary pixel that vanishes`).toBeGreaterThanOrEqual(EDGE_MIN)
        expect(edge.mean, `${tunables} frame ${i} edge reads weakly overall`).toBeGreaterThanOrEqual(EDGE_MEAN)
      }
      for (const [i, s] of m.silhouette.entries()) {
        expect(s.filled, `${tunables} frame ${i} vanishes at 25%`).toBeGreaterThan(0.05)
        expect(s.largest, `${tunables} frame ${i} breaks into pieces at 25%`).toBeGreaterThanOrEqual(BLOB_SHARE)
      }
    }
  })

  it('the locks are calibrated: the sample that failed by eye fails by number', () => {
    // `probe-c` as the human first saw it: eight tones, no outline, no rim. He liked its
    // richness; its edge is where it was weakest, and this is that weakness as a number.
    const before = execute({ grammar: 'probe-c', tunables: 'probe-c', seed: 1 }).metrics
    expect((before.edgeContrast[0] as { min: number }).min).toBeLessThan(EDGE_MIN)

    // Both answers clear it, and they clear it differently — which is why the round has
    // two variants rather than one and a tweak.
    const line = execute({ grammar: 'probe-c', tunables: 'probe-c-line', seed: 1 }).metrics
    const value = execute({ grammar: 'probe-c', tunables: 'probe-c-value', seed: 1 }).metrics
    expect((line.edgeContrast[0] as { min: number }).min).toBeGreaterThan(EDGE_MIN)
    expect((value.edgeContrast[0] as { min: number }).min).toBeGreaterThan(EDGE_MIN)
    // The line answer is uniform by construction: one ink tone all the way round.
    const l = line.edgeContrast[0] as { min: number; mean: number }
    expect(l.min).toBeCloseTo(l.mean, 5)
    // The value answer is not: it swings between rim and occlusion, which is the point.
    const v = value.edgeContrast[0] as { min: number; mean: number }
    expect(v.mean - v.min).toBeGreaterThan(0.1)
  })

  it('an empty strip cannot pass by accident', () => {
    // The null case for both metrics. Subject switched off: no sprite means no edge and no
    // silhouette, and the numbers have to say zero rather than the 1.0 an unguarded minimum
    // would report — a lock whose failure mode is reporting a perfect score is worse than
    // no lock, and that is the direction this one would fail in.
    const params = loadParams('probe-c')
    const empty: Grammar = { ...grammarByName('probe-c'), parts: [] }
    const m = measure(strip(empty, { ...params, outline: { ...params.outline, inner: false, enabled: false } }, 1), empty)
    expect((m.edgeContrast[0] as { min: number; mean: number }).min).toBe(0)
    expect((m.edgeContrast[0] as { min: number; mean: number }).mean).toBe(0)
    expect((m.silhouette[0] as { filled: number; largest: number }).filled).toBe(0)
    expect((m.silhouette[0] as { filled: number; largest: number }).largest).toBe(0)
  })
})

/**
 * **If there is a line, the line owns the whole silhouette.**
 *
 * Born 15/08 from a defect that had been latent since round zero and needed two things to
 * surface at once: an idiom that actually enables the outer line, and a pose that reaches
 * the edge of the cell. The jump's absorb frame ran off the bottom of the canvas, so the
 * body's own mid-tone fur formed the boundary there — 0.022 from the ground, against a
 * floor of 0.10. Every idiom shipped before it turns the line off and carries the edge with
 * `rim`, which pushes edge pixels to a ramp end and hid the hole by accident.
 *
 * The lock is conditional on the feature, not universal: a sample with no outer line is
 * entitled to put its own pixels on the boundary, and several shipped ones do.
 */
describe('the outline owns the silhouette', () => {
  const outlined = PAIRS.filter((p) => loadParams(p.tunables).outline.enabled)

  it('there is at least one outlined grammar to check', () => {
    // Otherwise this whole block passes by being empty, which is the shape of a lock that
    // reports success because it never ran (`HARNESS.md` §5).
    expect(outlined.length).toBeGreaterThan(0)
  })

  for (const pair of outlined) {
    it(`${pair.grammar}: no painted part reaches the background or the cell edge`, () => {
      const params = loadParams(pair.tunables)
      const frames = strip(grammarByName(pair.grammar), params, 1)
      for (const [i, frame] of frames.entries()) {
        const { w, h, data } = frame.buf
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const at = y * w + x
            if (data[at] === 0) continue
            if (frame.owners[at] === OWNER_OUTLINE) continue
            const exposed =
              x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
              data[at - 1] === 0 || data[at + 1] === 0 || data[at - w] === 0 || data[at + w] === 0
            expect(exposed, `${pair.grammar} frame ${i}: part pixel exposed at ${x},${y}`).toBe(false)
          }
        }
      }
    })
  }
})
