/**
 * **Ordered dithering, and it exists because the quantiser was the whole idiom.**
 *
 * A lit surface produces a continuous brightness. `raster.ts` turned that into a tone with a
 * hard `Math.floor`, which is the pipeline of a 3D render reduced to a small canvas — and it
 * is exactly what the human named twice, as *"um aspecto mais mecânico"*. Pixel art answers
 * the same continuous value with a **woven** cut: in the band between two tones the two tones
 * alternate on a fixed lattice, and the eye reads a value the palette does not contain.
 *
 * **This is not the speckle that was retired.** `texture.speckle` perturbed the level from an
 * injected RNG, and his verdict of 15/08 put it last: random orphans read as dirt. The
 * difference is not the amount of perturbation, it is that this one is **periodic**. Dirt and
 * pattern are the same histogram and a different lattice, which is why the instrument that
 * separates them measures the lattice (`src/perception/weave.ts`).
 *
 * **The anchor, and it is the decision most likely to be a bug** (`HARNESS.md` §2.7). The
 * threshold is a function of the **canvas** cell, never of the screen cell. A subject renders
 * into its own buffer and the whole buffer is then blitted, so canvas coordinates ride with
 * the object: the weave stays welded to the surface it shades. Keyed to the screen instead, a
 * moving body would have the pattern crawl through it, which is the most-seen dither defect
 * there is.
 *
 * portable.
 */

/**
 * **The lattice has two sizes, and the second one was earned by measurement rather than designed.**
 *
 * 4×4 is the classic matrix: sixteen thresholds, so a weave synthesises fifteen apparent levels
 * between two tones. It needs a 4×4 patch of one surface to be visible at all, and
 * `src/perception/weave.ts` measured how much of that this project's subjects actually have:
 *
 * | subject | share of painted pixels in a single-owner 4×4 cell |
 * |---|---|
 * | the rider at 36 px, 27 parts | **0.000** |
 * | the skeleton at 34 px | 0.080 |
 * | the kitten at 34 px | 0.068 |
 * | a kerb | 0.432 |
 * | the rider at double scale | 0.177 |
 *
 * **Zero.** Not few — none. And the cause is not the drawn line: switching both outlines off moved
 * it not at all, while doubling the body's scale moved it to 0.177. **A character built from
 * two-dozen primitives at 36 px has no flat patch four pixels across, so a 4×4 lattice on it is
 * noise by construction** — which is the shape of his own retired verdict on speckle.
 *
 * 2×2 is what fits: four thresholds, three apparent levels, and it needs a 2×2 patch. That is the
 * register low-resolution pixel art has always used for exactly this reason.
 *
 * **Two subjects that measurably want different lattices is what earns the knob** (`CLAUDE.md` §5:
 * harvest generality, do not design it). A road is hundreds of pixels of one surface and wants 4;
 * a 36 px rider wants 2.
 */
export const BAYER_N = 4

/** The recursive Bayer matrix of order 2. Thresholds maximally spread: neighbours are far apart. */
const BAYER_4: readonly number[] = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
]

/** Order 1. The same recursion one level down, and the smallest lattice that is still ordered. */
const BAYER_2: readonly number[] = [0, 2, 3, 1]

/**
 * The threshold for one canvas cell, in `-0.5 .. +0.5`.
 *
 * Centred on zero on purpose: added to a level before the floor, a zero-mean offset leaves the
 * **average** tone of a region exactly where the undithered cut put it. So the weave spends
 * apparent range without moving the value the silhouette locks measure — which is also the
 * reason those locks cannot see it at all.
 */
export function bayer(x: number, y: number, n: number = BAYER_N): number {
  if (n === 2) {
    const cell = BAYER_2[(y & 1) * 2 + (x & 1)] as number
    return (cell + 0.5) / 4 - 0.5
  }
  const cell = BAYER_4[(y & 3) * 4 + (x & 3)] as number
  return (cell + 0.5) / 16 - 0.5
}

/**
 * The offset to add to a continuous level before it is floored.
 *
 * `amount` is the knob. **At 0 this returns 0 and the caller is byte-for-byte what it was**,
 * which is the null case the baseline hash enforces: no sample that does not ask for the weave
 * can be changed by its arrival. At 1 the weave spans a full tone step, which is the strongest
 * ordered dither the lattice can express.
 */
export function ditherOffset(amount: number, x: number, y: number, n: number = BAYER_N): number {
  if (amount <= 0) return 0
  return amount * bayer(x, y, n)
}
