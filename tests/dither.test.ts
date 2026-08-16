import { describe, expect, it } from 'vitest'
import type { IndexedBuffer } from '../src/core/types.ts'
import { bayer, ditherOffset } from '../src/core/dither.ts'
import { PERIODIC, weave } from '../src/perception/weave.ts'
import { mulberry32 } from '../src/core/rng.ts'
import { NOISE_FLOOR, regions } from '../src/perception/structure.ts'

/**
 * The three quantisers that have to be told apart, over one identical gradient.
 *
 * This is the instrument's null case and it runs in both directions (`HARNESS.md` §5): the
 * measure must fire on the weave and stay quiet on the two things that are not a weave. Without
 * the second half a number that simply always reads high would look like a working instrument.
 */
const W = 64
const H = 64
const LEVELS = 4
const RAMP = [1, 2, 3, 4] as const

function gradient(quantise: (u: number, x: number, y: number) => number): IndexedBuffer {
  const data = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // A slow horizontal ramp, which is the case pixel art dithers and a render bands.
      const u = (x + 0.5) / W
      let level = quantise(u, x, y)
      if (level < 0) level = 0
      if (level >= LEVELS) level = LEVELS - 1
      data[y * W + x] = RAMP[level] as number
    }
  }
  return { w: W, h: H, data }
}

const HARD = gradient((u) => Math.floor(u * LEVELS))
const WOVEN = gradient((u, x, y) => Math.floor(u * LEVELS + ditherOffset(1, x, y)))
const SPECKLED = (() => {
  // The retired idiom, reproduced exactly as `raster.ts` applied it: a level knocked one step
  // darker with probability `p`, from the injected RNG.
  const rng = mulberry32(12345)
  return gradient((u) => {
    const level = Math.floor(u * LEVELS)
    return rng() < 0.25 && level > 0 ? level - 1 : level
  })
})()

describe('the lattice, before anything uses it', () => {
  it('every threshold is distinct and the mean is zero', () => {
    const seen = new Set<number>()
    let sum = 0
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const t = bayer(x, y)
        seen.add(t)
        sum += t
        expect(t).toBeGreaterThan(-0.5)
        expect(t).toBeLessThan(0.5)
      }
    }
    expect(seen.size).toBe(16)
    // Zero mean is what keeps a dithered region's average tone where the hard cut put it, and
    // therefore what makes every existing value lock blind to this change.
    expect(Math.abs(sum)).toBeLessThan(1e-12)
  })

  it('repeats at 4 and disagrees at 2, which is the property the instrument reads', () => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        expect(bayer(x + 4, y)).toBe(bayer(x, y))
        expect(bayer(x, y + 4)).toBe(bayer(x, y))
        expect(bayer(x + 2, y)).not.toBe(bayer(x, y))
      }
    }
  })

  it('amount 0 is the identity, so no sample that does not ask for it can change', () => {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) expect(ditherOffset(0, x, y)).toBe(0)
  })
})

describe('the weave instrument separates texture from dirt', () => {
  it('a hard cut is almost untextured', () => {
    // Three band boundaries in 64 columns: only the pixels beside them differ from a neighbour.
    expect(weave(HARD).textured).toBeLessThan(0.12)
  })

  it('an ordered weave is textured and periodic', () => {
    const w = weave(WOVEN)
    expect(w.textured).toBeGreaterThan(0.4)
    expect(w.period).toBeGreaterThan(PERIODIC)
  })

  it('speckle is textured and NOT periodic — this is the whole discrimination', () => {
    const s = weave(SPECKLED)
    expect(s.textured).toBeGreaterThan(0.3)
    expect(s.period).toBeLessThan(PERIODIC)
  })

  it('the two margins are real, not a threshold squeezed between neighbours', () => {
    const w = weave(WOVEN).period
    const s = weave(SPECKLED).period
    // The threshold has to sit clear of both, or it is a number tuned to one sample.
    expect(w - PERIODIC).toBeGreaterThan(0.15)
    expect(PERIODIC - s).toBeGreaterThan(0.15)
  })

  it('half amplitude still reads as a weave, so the knob has a usable range', () => {
    // The knob has to be turnable without falling off the instrument: at 0.5 the texture halves
    // (0.316 against 0.514) and the periodicity barely moves (0.589 against 0.628). That is the
    // signature of an *ordered* pattern — its lattice does not weaken with its amplitude.
    const h = weave(gradient((u, x, y) => Math.floor(u * LEVELS + ditherOffset(0.5, x, y))))
    expect(h.textured).toBeGreaterThan(0.25)
    expect(h.textured).toBeLessThan(weave(WOVEN).textured)
    expect(h.period).toBeGreaterThan(PERIODIC)
  })

  it('an empty buffer reports nothing rather than dividing by zero', () => {
    expect(weave({ w: 8, h: 8, data: new Uint8Array(64) })).toEqual({ surface: 0, textured: 0, orphans: 0, period: 0 })
  })
})

describe('why the existing noise check had to learn the lattice', () => {
  /**
   * **The region statistics have the two cases exactly backwards, and that is the finding.**
   *
   * `structure.ts` calls shading "per-pixel noise" when the mean same-tone region falls below
   * 5 px. Measured over one gradient: the ordered weave lands at **4.2 px with a singleton
   * fraction of 1.00**, and the retired speckle at **10.0 px with 0.65**. So the check as
   * calibrated fires on the correct work and passes the dirt it was written to catch.
   *
   * I expected them to be indistinguishable and asserted that first; the numbers refuted it and
   * the truth is worse than my guess. This is the `swallowed` lesson of 16/08 in a second
   * shape: a check that over-fires on healthy work is asserting the invariant about the wrong
   * artifact. Region size measures how *finely* shading is cut. It was standing in for whether
   * the cutting is *intentional*, and only the lattice carries that.
   */
  it('the weave breaks the noise floor and the speckle clears it', () => {
    expect(regions(WOVEN).meanSize).toBeLessThan(NOISE_FLOOR)
    expect(regions(SPECKLED).meanSize).toBeGreaterThan(NOISE_FLOOR)
  })

  it('the lattice puts them back in the right order', () => {
    expect(weave(WOVEN).period).toBeGreaterThan(PERIODIC)
    expect(weave(SPECKLED).period).toBeLessThan(PERIODIC)
  })
})
