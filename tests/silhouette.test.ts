import { describe, expect, it } from 'vitest'
import type { Grammar } from '../src/core/types.ts'
import { execute, loadParams } from '../src/io/load.ts'
import { grammarByName } from '../src/grammars/index.ts'
import { measure } from '../src/core/metrics.ts'
import { strip } from '../src/core/render.ts'
import { GROUND_RGB } from '../src/core/color.ts'
import { GROUND } from '../src/viewer/page.ts'

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
  it('the ground the locks measure against is the ground the eye sees', () => {
    // The core may not import the viewer, so the two constants are pinned by this test
    // instead. A lock measuring contrast against a different grey measures nothing.
    const hex = `#${GROUND_RGB.map((c) => c.toString(16).padStart(2, '0')).join('')}`
    expect(hex).toBe(GROUND)
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
