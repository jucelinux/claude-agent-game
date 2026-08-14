import { describe, expect, it } from 'vitest'
import { execute, loadParams } from '../src/io/load.ts'
import { strip } from '../src/core/render.ts'
import { measure } from '../src/core/metrics.ts'
import { fixture } from '../src/grammars/fixture.ts'

const SPEC = { grammar: 'fixture', tunables: 'default', seed: 1 } as const

/**
 * The animation family lock. Byte-inequality is not the rule — an equality rule passes on
 * a trivial difference (`TASTE-LOOP.md` §2.2), which is exactly how a four-state cycle
 * collapses into a two-state flip and still goes green.
 *
 * **Margin:** 0.02 of the canvas = 46 px of 2304. Anchored to one leg: the fixture's leg
 * is 4 px wide by 12 px long ≈ 48 px, so a pair of frames that differ by less than the
 * margin has not moved a limb. Calibrated in both directions below.
 */
const FAMILY_MARGIN = 0.02

describe('animation family', () => {
  it('no frame is a copy of another, with margin', () => {
    const m = execute(SPEC).metrics
    expect(m.distinctFrames).toBe(m.frames)
    expect(m.minPairDistance).toBeGreaterThanOrEqual(FAMILY_MARGIN)
  })

  it('the margin is calibrated: a dead gait fails it, a live one clears it', () => {
    // Dead — every amplitude off. Frames are byte-identical: the floor case.
    const dead = execute({ ...SPEC, overrides: { 'gait.swing': 0, 'gait.lift': 0 } }).metrics
    expect(dead.minPairDistance).toBe(0)
    expect(dead.minPairDistance).toBeLessThan(FAMILY_MARGIN)

    // Nearly dead — a twitch a byte-equality lock happily passes: four distinct buffers,
    // 0.0009 of the canvas between the closest pair. Measured, not guessed: the lock trips
    // below a swing of ~0.007 turns and clears above it; the shipped 0.08 sits at 0.109.
    const twitch = execute({ ...SPEC, overrides: { 'gait.swing': 0.002, 'gait.lift': 0.3 } }).metrics
    expect(twitch.distinctFrames).toBe(twitch.frames) // equality lock: green
    expect(twitch.minPairDistance).toBeLessThan(FAMILY_MARGIN) // margin lock: red

    // Live — the shipped tunables clear it with room.
    expect(execute(SPEC).metrics.minPairDistance).toBeGreaterThan(FAMILY_MARGIN)
  })

  it('the gait has named phases, not a sine', () => {
    const { phases } = fixture.gait
    expect(phases.length).toBeGreaterThanOrEqual(4)
    expect(new Set(phases.map((p) => p.name)).size).toBe(phases.length)
    expect(phases[0]!.at).toBe(0)
    for (let i = 1; i < phases.length; i++) expect(phases[i]!.at).toBeGreaterThan(phases[i - 1]!.at)
    for (const track of fixture.gait.tracks) expect(track.keys.length).toBe(phases.length)
  })

  it('position is computed in body space: moving the root translates every pixel exactly', () => {
    const params = loadParams('default')
    const shifted = { ...params, canvas: { ...params.canvas, originX: params.canvas.originX + 2 } }
    const a = strip(fixture, params, 1)
    const b = strip(fixture, shifted, 1)

    for (let f = 0; f < a.length; f++) {
      const src = a[f]!.buf
      const dst = b[f]!.buf
      let compared = 0
      for (let y = 0; y < src.h; y++) {
        for (let x = 0; x < src.w - 2; x++) {
          expect(dst.data[y * src.w + x + 2]).toBe(src.data[y * src.w + x])
          compared++
        }
      }
      expect(compared).toBeGreaterThan(0)
    }
  })

  it('rotation orients the part instead of redrawing it', () => {
    // Same parts, same palette, same paint order; only the bone angle differs. If parts
    // were baked bitmaps the ink count would be identical — a rotated sample is not.
    const flat = execute({ ...SPEC, overrides: { 'gait.swing': 0 } })
    const swung = execute({ ...SPEC, overrides: { 'gait.swing': 0.14 } })
    const legFlat = measure(flat.frames, fixture).partPixels['legL']!
    const legSwung = measure(swung.frames, fixture).partPixels['legL']!
    expect(legFlat.every((c) => c > 0)).toBe(true)
    expect(legSwung.every((c) => c > 0)).toBe(true)
    expect(legSwung.join(',')).not.toBe(legFlat.join(','))
  })
})
