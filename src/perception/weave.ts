/**
 * **The instrument for dither, and it had to be built before the dither.**
 *
 * Every lock in this repo is blind to an ordered dither by construction. The threshold added
 * before the floor has **zero mean**, so a dithered region carries the same average tone as an
 * undithered one: the value lock measures the same contrast, the silhouette lock reduces to the
 * same blob, the absence lock counts the same pixels per part. All 357 of them pass either way.
 * `TASTE.md` §2a's standing rule is to put the confidence on the axis with the weakest
 * instrument, and on this axis there was no instrument at all.
 *
 * **What separates a texture from dirt is not the amount, it is the lattice.** The retired
 * `texture.speckle` and an ordered Bayer weave produce the same histogram, the same region
 * count and the same singleton fraction. They differ in **periodicity**, and that is what the
 * three numbers below measure. This is the `swallowed` lesson applied in advance: measure the
 * quantity that carries the intent, not the quantity that is easy to count.
 *
 * portable — a fact about perceiving quantised shading, not about this project.
 */
import type { IndexedBuffer } from '../core/types.ts'
import { BAYER_N } from '../core/dither.ts'

/**
 * **The recalibration, and it cost the instrument its first threshold.**
 *
 * `PERIODIC = 0.25` was measured on a 64×64 single-material gradient and it separated a weave
 * (0.628) from the retired speckle (0.068) with margins either side. Then it met a real sprite and
 * reported **-0.22 on the rider with the weave switched on**, which reads as "this is dirt".
 *
 * The number was not wrong; it was a fact about the artifact it was calibrated on. Swept over the
 * rider, `period` moves from -0.226 at dither 0 to -0.174 at dither 1 — the weave shifts it by
 * 0.05 and cannot reach a positive value at any amplitude. Over a kerb it moves from -0.060 to
 * +0.051. **The rider is 27 parts with a drawn line, so almost no 4×4 cell of it belongs to one
 * surface; a 4 px limb's shading varies faster than the lattice, and at that scale an ordered
 * weave and random noise are the same picture.**
 *
 * That is the pattern `TASTE.md` §2b names: dominance transfers along the axis it was proven on
 * and not across it. Probe C won on a beetle and held the house style for seven runs. This
 * threshold won on a gradient and I pointed it at a body within the hour.
 *
 * **So the measure is restricted to where a lattice can physically be seen** — pixels whose whole
 * aligned 4×4 cell is owned by one part. `surface` reports how much of the subject qualifies, and
 * a subject with no surface gets told so instead of being called noisy. That is also correct pixel
 * art practice arrived at by measurement rather than by imitation: skies, roads and large masses
 * are dithered, and 4 px limbs never are.
 */
export type Weave = {
  /**
   * Share of painted pixels sitting in an aligned 4×4 cell owned entirely by one part — the only
   * pixels on which a 4×4 lattice can be read at all. **Low here means the numbers below are
   * measuring nothing**, and that is a fact about the subject rather than about the weave.
   */
  readonly surface: number
  /** Painted pixels that differ from at least one orthogonal painted neighbour, as a share. */
  readonly textured: number
  /** Painted pixels that differ from **every** orthogonal painted neighbour, as a share. */
  readonly orphans: number
  /**
   * Agreement at lag 4 minus agreement at lag 1, over textured pixels.
   *
   * A Bayer lattice of order 4 repeats exactly at lag 4 and disagrees hardest at lag 1, so an
   * ordered weave scores high. Noise has no period, so both lags agree equally often and the
   * difference collapses toward zero. **This is the number that tells a texture from dirt.**
   *
   * **Lag 2 was the first choice and it measured nothing** — the recursive Bayer matrix puts
   * *adjacent* thresholds two cells apart (0 beside 2, 8 beside 10), so lag 2 agrees almost as
   * often as lag 4 and the difference came out at -0.01 on a weave it was supposed to detect.
   * The instrument's own null case caught it before any picture was rendered, which is the
   * whole reason it was built first.
   */
  readonly period: number
}

const EMPTY: Weave = { surface: 0, textured: 0, orphans: 0, period: 0 }

/**
 * Measure one buffer. Painted pixels only — index 0 is transparent, and a weave that counted
 * the background would report the shape of the silhouette instead of the shape of the shading.
 *
 * **Pass `owners` whenever they are available.** Without them every painted pixel is measured, and
 * on a many-part body the answer is dominated by the boundaries between parts and by the drawn
 * line rather than by the shading. With them, the periodicity is read only where a 4×4 lattice
 * fits inside one surface, which is the only place it exists.
 */
export function weave(buf: IndexedBuffer, owners?: Int16Array, lattice: number = BAYER_N): Weave {
  const n = lattice === 2 ? 2 : BAYER_N
  const { w, h, data } = buf
  let painted = 0
  let surface = 0
  let textured = 0
  let orphans = 0

  /**
   * Is the aligned 4×4 cell containing this pixel owned by a single part?
   *
   * Aligned rather than centred, because the lattice itself is aligned: a cell straddling two
   * lattice periods would ask whether a pattern repeats across a boundary it never crosses.
   */
  const oneSurface = (x: number, y: number): boolean => {
    if (owners === undefined) return true
    const bx = x & ~(n - 1)
    const by = y & ~(n - 1)
    if (bx + n > w || by + n > h) return false
    const first = owners[by * w + bx] as number
    if (first < 0) return false
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        if (owners[(by + j) * w + bx + i] !== first) return false
      }
    }
    return true
  }
  // Agreement counters, over textured pixels only: an untextured pixel agrees with everything
  // at every lag and would drown the signal in flat area.
  let lag4 = 0
  let lag4n = 0
  let lag1 = 0
  let lag1n = 0

  const at = (x: number, y: number): number => (x < 0 || x >= w || y < 0 || y >= h ? 0 : (data[y * w + x] as number))

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const here = data[y * w + x] as number
      if (here === 0) continue
      painted++
      // Everything below reads the shading, so it is restricted to pixels where the shading is
      // what is actually there. A pixel on a seam or on the drawn line is not shading.
      if (!oneSurface(x, y)) continue
      surface++
      let differs = 0
      let neighbours = 0
      for (const [dx, dy] of ORTHO) {
        const side = at(x + dx, y + dy)
        if (side === 0) continue
        neighbours++
        if (side !== here) differs++
      }
      if (differs === 0) continue
      textured++
      if (neighbours > 0 && differs === neighbours) orphans++

      // Both lags are sampled on both axes so an anisotropic pattern cannot hide on one of
      // them. A neighbour off the canvas or unpainted is not a sample, not a disagreement.
      for (const [dx, dy] of AXES) {
        const period = at(x + dx * n, y + dy * n)
        if (period !== 0) {
          lag4n++
          if (period === here) lag4++
        }
        const one = at(x + dx, y + dy)
        if (one !== 0) {
          lag1n++
          if (one === here) lag1++
        }
      }
    }
  }

  if (painted === 0) return EMPTY
  const a4 = lag4n === 0 ? 0 : lag4 / lag4n
  const a1 = lag1n === 0 ? 0 : lag1 / lag1n
  return {
    surface: surface / painted,
    // Shares of the measurable surface, not of the whole subject: dividing by `painted` would make
    // a body with no surface look untextured rather than unmeasurable.
    textured: surface === 0 ? 0 : textured / surface,
    orphans: surface === 0 ? 0 : orphans / surface,
    period: a4 - a1,
  }
}

const ORTHO: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

const AXES: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, 1],
]

/**
 * The threshold that says "this is a woven texture and not noise".
 *
 * **Measured, not chosen.** Over one identical gradient at four tones: a hard cut scores
 * -0.006, the retired speckle at p=0.25 scores 0.068, a half-amplitude weave 0.589 and a
 * full-amplitude weave 0.628. 0.25 is clear of both neighbours by 0.18 and 0.34, and
 * `tests/dither.test.ts` asserts **both** margins — a threshold with one margin is a number
 * tuned to one sample.
 */
export const PERIODIC = 0.25
