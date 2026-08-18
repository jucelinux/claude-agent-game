import { describe, expect, it } from 'vitest'
import { execute, loadParams } from '../src/io/load.ts'
import { sprite, strip } from '../src/core/render.ts'
import { findings, regions } from '../src/perception/structure.ts'
import type { Grammar, Params } from '../src/core/types.ts'

/**
 * **The null case for the findings channel**, run before anything is believed
 * (`HARNESS.md` §5, `TASTE-LOOP.md` §2.1).
 *
 * Every check is calibrated **in both directions**: it must fire when the defect is there
 * and stay silent when it is not. One direction proves nothing — a check hard-wired to
 * `true` passes the first half perfectly, and a check hard-wired to `false` passes the
 * second.
 *
 * The instrument's own worst failure mode is the opposite of flattery: **a check that
 * alerts on healthy work**. It trains the reader to skip the output, which is the same
 * outcome as reporting nothing while costing more. The last test in this file is that
 * guard, and one check was already withdrawn before shipping for failing it.
 */
const subject = (opts: { flat?: boolean; sliver?: boolean; gone?: boolean }): Grammar => ({
  name: 'structure-fixture',
  palette: {
    name: 'structure-neutral',
    colors: [
      [0, 0, 0],
      [24, 24, 28],
      [70, 70, 78],
      [130, 130, 140],
      [200, 200, 210],
    ],
    ramps: [{ material: 'mass', indices: [1, 2, 3, 4] }],
  },
  skeleton: { bones: [{ name: 'a', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    {
      name: 'subject',
      bone: 'a',
      material: 'mass',
      // The sliver is offset by half a pixel on purpose. Pixel centres sit at .5 from an
      // integer origin, so a shape centred on the origin always straddles an even number of
      // rows; at cy 0.5 exactly one row of centres falls inside it. Below ry 0.5 nothing
      // renders at all, which is a different defect and is what `absent` is for.
      shape: opts.sliver === true
        ? { kind: 'ellipse', cx: 0, cy: 0.5, rx: 9, ry: 0.6 }
        : { kind: 'ellipse', cx: 0, cy: 0, rx: 9, ry: 9 },
    },
  ],
  gait: {
    name: 'still',
    phases: [{ name: 'a', at: 0 }, { name: 'b', at: 0.5 }],
    tracks: opts.gone === true ? [{ bone: 'a', channel: 'scale', keys: [-1, -1] }] : [],
  },
})

function bench(patch: Partial<Params> = {}): Params {
  const base = loadParams('default')
  return {
    ...base,
    canvas: { w: 32, h: 32, originX: 16, originY: 16 },
    outline: { enabled: false, material: 'mass', inner: false, rim: false },
    texture: { speckle: 0, dither: 0, lattice: 4, facet: 0 },
    frames: { walk: 2 },
    ...patch,
  }
}

const fired = (g: Grammar, p: Params, check: string): boolean =>
  findings(strip(g, p, 1), g).some((f) => f.check === check)

describe('the findings channel — null cases', () => {
  it('absent fires on a collapsed part and stays quiet on a whole one', () => {
    expect(fired(subject({ gone: true }), bench(), 'absent')).toBe(true)
    expect(fired(subject({}), bench(), 'absent')).toBe(false)
  })

  it('clipped fires when the subject reaches the cell edge, and not when it is inside', () => {
    // Same subject, same size. Only the origin moves, so nothing but the framing differs.
    expect(fired(subject({}), bench({ canvas: { w: 32, h: 32, originX: 2, originY: 16 } }), 'clipped')).toBe(true)
    expect(fired(subject({}), bench(), 'clipped')).toBe(false)
  })

  it('thin fires on a sliver and stays quiet on a disc', () => {
    expect(fired(subject({ sliver: true }), bench(), 'thin')).toBe(true)
    expect(fired(subject({}), bench(), 'thin')).toBe(false)
  })

  it('flat fires on a part with no modelling and stays quiet on a modelled one', () => {
    // The knob is the light, not the shape. With the lamp aimed straight down the barrel
    // every surface normal returns nearly the same dot product, so the disc collapses to one
    // or two tones. Raked, the same disc spends its ramp.
    const flatLight = bench({ light: { x: 0, y: 0, z: -1, curve: 1 } })
    const rakedLight = bench({ light: { x: -0.6, y: -0.8, z: -0.2, curve: 1 } })
    expect(fired(subject({}), flatLight, 'flat')).toBe(true)
    expect(fired(subject({}), rakedLight, 'flat')).toBe(false)
  })

  it('the region metric separates noise from shading, and the direction is right', () => {
    const clean = regions(sprite(subject({}), bench(), 1, 0).buf)
    const noisy = regions(sprite(subject({}), bench({ texture: { speckle: 0.4, dither: 0, lattice: 4, facet: 0 } }), 1, 0).buf)
    // Same shape, same size, same palette. Only per-pixel noise differs.
    expect(noisy.count).toBeGreaterThan(clean.count * 2)
    expect(noisy.meanSize).toBeLessThan(clean.meanSize)
    // **The singleton fraction is deliberately NOT asserted, and that is a finding about
    // the metric.** It is not monotonic in noise: at a heavy speckle rate the dropped
    // pixels start touching each other and form blobs, so the proportion of one-pixel
    // regions falls even as the region count doubles. It reads correctly at the rates real
    // samples use and misleads at extremes, so the findings channel prints it and no lock
    // depends on it. Count and mean size are the discriminators.
  })

  it('an empty output says it is empty instead of reporting nothing wrong', () => {
    // The defect `HARNESS.md` §3 records as having shipped in this method: a blank output
    // behind a green suite. Silence and health must not print the same thing.
    const blank = findings([], subject({}))
    expect(blank.some((f) => f.check === 'empty' && f.level === 'alert')).toBe(true)

    const collapsed = findings(strip(subject({ gone: true }), bench(), 1), subject({ gone: true }))
    expect(collapsed.some((f) => f.level === 'alert')).toBe(true)
  })

  it('the silhouette report names the material that actually owns the boundary', () => {
    const found = findings(strip(subject({}), bench(), 1), subject({}))
    const line = found.find((f) => f.check === 'silhouette')
    expect(line?.message).toContain('mass')
  })

  /**
   * **The guard against the instrument's own failure mode.** A check that alerts on healthy
   * work is worse than no check. The subject here is the idiom he ranked first on 15/08, so
   * "healthy" is his verdict and not the model's opinion of its own output.
   */
  it('stays silent on work the human ranked first', () => {
    const result = execute({ grammar: 'gorilla-jump-chrono', tunables: 'gorilla-jump-chrono', seed: 1 })
    const alerts = findings(result.frames, result.grammar).filter((f) => f.level === 'alert')
    expect(alerts.map((a) => `${a.check}: ${a.message}`)).toEqual([])
  })

  /**
   * And the same instrument is loud on the idiom he ranked last, with nothing changed but
   * the sample. Without this the test above passes for a channel that never alerts at all.
   *
   * **The sample moved on 16/08, and the reason is a good one.** It used to be `gorilla-jump`,
   * which was in the incumbent idiom — eight tones over a narrow range with 18% noise. That
   * whole family went to Chrono when he asked for the micro game to be repainted, so the old
   * sample stopped being an example of the thing this check exists to catch. `probe-c` is
   * still there, is still the incumbent, and is not going anywhere: it is a retired probe
   * rather than a shipped subject, which is exactly what a calibration sample should be.
   */
  it('is loud on the idiom he ranked last', () => {
    const result = execute({ grammar: 'probe-c', tunables: 'probe-c', seed: 1 })
    const alerts = findings(result.frames, result.grammar).filter((f) => f.level === 'alert')
    expect(alerts.some((a) => a.check === 'regions')).toBe(true)
  })
})
