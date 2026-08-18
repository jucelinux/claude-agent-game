import { describe, expect, it } from 'vitest'
import { loadParams } from '../src/io/load.ts'
import { sprite } from '../src/core/render.ts'
import type { Grammar, Params, Shape } from '../src/core/types.ts'

/**
 * **The lock set for roll — the first rotation this project has that leaves the screen plane.**
 *
 * `Bone.angle` turns a part in the picture; `yaw.ts` turns a body about the vertical. Neither
 * could tilt a surface toward or away from the camera, and the record says that gap is
 * *inexpressible* rather than badly tuned (`DECISIONS.md`, 16/08). A rolled part is sampled by a
 * ray march instead of the closed form every primitive ships with, so what needs proving is not
 * that roll *does something* — anything wrong also does something — but that the march agrees
 * with the closed form where the two overlap, and that the disagreement elsewhere is the
 * geometry rather than a sign.
 *
 * Every case below is calibrated in both directions (`HARNESS.md` §5).
 */

const PALETTE = {
  name: 'roll-neutral',
  colors: [
    [0, 0, 0],
    [20, 20, 20],
    [70, 70, 70],
    [130, 130, 130],
    [200, 200, 200],
    [8, 8, 8],
  ],
  ramps: [
    { material: 'mass', indices: [1, 2, 3, 4] },
    { material: 'ink', indices: [5] },
  ],
} as const

/** One part on one bone, at whatever roll the case wants. */
function onePart(shape: Shape, roll: number, y = 0): Grammar {
  return {
    name: 'roll-fixture',
    palette: PALETTE,
    skeleton: { bones: [{ name: 'b', parent: null, x: 0, y, z: 0, angle: 0, roll }] },
    parts: [{ name: 'P', bone: 'b', material: 'mass', shape }],
    gait: { name: 'still', phases: [{ name: 'a', at: 0 }], tracks: [] },
  }
}

function bench(patch: Partial<Params> = {}): Params {
  const base = loadParams('default')
  return {
    ...base,
    canvas: { w: 48, h: 48, originX: 24, originY: 24 },
    outline: { enabled: false, material: 'ink', inner: false, rim: false },
    texture: { speckle: 0, dither: 0, lattice: 4, facet: 0 },
    frames: { walk: 1 },
    ...patch,
  }
}

/** The painted rows and columns, which is how a silhouette change is measured rather than argued. */
function extent(g: Grammar, p: Params = bench()): { rows: number; cols: number; painted: number } {
  const f = sprite(g, p, 1, 0)
  const { w, h, data } = f.buf
  const rows = new Set<number>()
  const cols = new Set<number>()
  let painted = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] === 0) continue
      painted++
      rows.add(y)
      cols.add(x)
    }
  }
  return { rows: rows.size, cols: cols.size, painted }
}

/** A deck: long across the screen, thin on it, and wide in depth. A skateboard, side on. */
const DECK: Shape = { kind: 'rect', x: -15, y: -2, w: 30, h: 4, d: 12 }
/** A limb: a sphere swept along the x axis. Rotationally symmetric about the roll axis. */
const LIMB: Shape = { kind: 'capsule', x0: -10, y0: 0, x1: 10, y1: 0, r: 5 }
const BALL: Shape = { kind: 'ellipse', cx: 0, cy: 0, rx: 8, ry: 8 }

describe('the marched path agrees with the closed form', () => {
  /**
   * **The null case, and it is the one that matters most.**
   *
   * A roll of exactly one turn is a full revolution: the geometry is identical to no roll at all,
   * but `roll !== 0`, so the whole ray-marching path runs — slab clipping, stepping, bisection,
   * the implicit field, the normal. If the march is right it must reproduce the closed-form
   * answer it bypassed. Without this case, every other assertion here would pass just as well
   * against a march that is subtly wrong everywhere.
   */
  for (const [name, shape] of [['deck', DECK], ['limb', LIMB], ['ball', BALL]] as const) {
    it(`${name}: one full turn of roll reproduces no roll at all`, () => {
      const flat = sprite(onePart(shape, 0), bench(), 1, 0)
      const round = sprite(onePart(shape, 1), bench(), 1, 0)
      let same = 0
      let painted = 0
      for (let i = 0; i < flat.buf.data.length; i++) {
        if (flat.buf.data[i] !== 0 || round.buf.data[i] !== 0) painted++
        if (flat.buf.data[i] === round.buf.data[i]) same++
      }
      expect(painted).toBeGreaterThan(100)
      // Not byte-identical, and it must not be asserted as such: `Math.sin(2*PI)` is -2.4e-16
      // rather than 0, so the ray is tilted by a quarter of a nano-degree and a pixel sitting
      // exactly on a tone boundary may fall the other way. The floor is on the share, and it is
      // high enough that a wrong sign or a lost axis could not clear it.
      expect(same / flat.buf.data.length).toBeGreaterThan(0.99)
    })
  }
})

describe('roll changes what a plate shows, and that is the capability', () => {
  it('a deck rolls from thin to wide, and the width it reaches is its depth', () => {
    // Side on, the deck is 4 px tall. Rolled a quarter turn, the face you see is the underside,
    // so the height on screen becomes the board's 12 px depth. This is the kickflip read, and no
    // paint order, no ramp shift and no z offset can express it.
    const flat = extent(onePart(DECK, 0))
    const edge = extent(onePart(DECK, 0.25))
    expect(flat.rows).toBeLessThanOrEqual(5)
    expect(edge.rows).toBeGreaterThanOrEqual(11)
    // The long axis is the axis it rotates about, so it cannot change. This is what separates a
    // roll from a scale — a squash would have shortened the deck too.
    expect(edge.cols).toBe(flat.cols)
  })

  it('the silhouette never collapses and never explodes, at any roll', () => {
    // The failure mode of a marched sampler is an empty part: one wrong slab bound and every ray
    // misses. It leaves no trace in a picture, which is exactly why it is counted.
    for (let i = 0; i <= 16; i++) {
      const e = extent(onePart(DECK, i / 16))
      expect(e.painted).toBeGreaterThan(60)
      expect(e.rows).toBeLessThanOrEqual(14)
      expect(e.cols).toBeLessThanOrEqual(32)
    }
  })

  it('half a turn takes the part to the other side of its bone, which is where the sign lives', () => {
    /**
     * **The case that can catch an inverted sign, and nothing else in this file can.**
     *
     * Every other shape here is symmetric about the roll axis, so a flipped sign renders exactly
     * the same picture. This deck sits entirely **below** its bone, so half a turn has to put it
     * entirely **above** it. An inverted sign fails only here — and that is not hypothetical: the
     * astronaut shipped with precisely this defect on the compass, and his reading of it was
     * *"o visor está olhando para a esquerda"*.
     *
     * **The silhouette mirrors and the shading does not, and that is deliberate.** I asserted the
     * whole picture first and it came back at 33% agreement. The reason is sound: mirroring the
     * screen row already undoes the geometry's flip, so what is left over is a lamp rotated 180°
     * in `y` and `z`. A surface tilted away from the sun *should* be lit differently, which is the
     * entire reason the light goes through the same inverse rotation as the geometry. Asserting a
     * mirrored picture would have locked in a bug.
     */
    const meanRow = (g: Grammar): number => {
      const f = sprite(g, bench(), 1, 0)
      const { w, h, data } = f.buf
      let sum = 0
      let n = 0
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[y * w + x] !== 0) { sum += y; n++ }
      return sum / n
    }
    // The bone is on row 32; the deck's local rows run 1..5, so it lands around row 35.
    const BELOW: Shape = { kind: 'rect', x: -15, y: 1, w: 30, h: 4, d: 12 }
    const down = meanRow(onePart(BELOW, 0, 8))
    const up = meanRow(onePart(BELOW, 0.5, 8))
    expect(down).toBeGreaterThan(33)
    expect(up).toBeLessThan(31)
    /**
     * And it lands the same distance the other side, not merely somewhere else.
     *
     * **The reflection centre is 31.5 and not 32**, and the off-by-one is a fact about the grid
     * rather than about the roll: a pixel is sampled at its centre, `r + 0.5`, so the bone's local
     * `y = 0` falls on the *boundary* between rows 31 and 32. Reflecting row indices about 32
     * lands one full pixel out, which is exactly what this assertion reported when it was written
     * that way.
     */
    expect(Math.abs((down - 31.5) - (31.5 - up))).toBeLessThan(0.6)
    // Same silhouette, moved: a sign error that also changed the shape would be a second defect.
    expect(extent(onePart(BELOW, 0.5, 8)).rows).toBe(extent(onePart(BELOW, 0, 8)).rows)
  })

  it('a positive roll takes the near edge down and away, and the sign is pinned here', () => {
    /**
     * The convention, stated once so a future subject cannot rediscover it by eye: **positive roll
     * carries local `+y` (down the screen) toward the far side, and brings the far side up.** So a
     * deck below its bone, given a quarter turn, does not go up or down — it collapses onto the
     * bone's row, because its offset has become depth and its depth has become its height.
     */
    const BELOW: Shape = { kind: 'rect', x: -15, y: 1, w: 30, h: 4, d: 12 }
    const f = sprite(onePart(BELOW, 0.25, 8), bench(), 1, 0)
    const { w, h, data } = f.buf
    let sum = 0
    let n = 0
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[y * w + x] !== 0) { sum += y; n++ }
    // Centred on the bone, within a pixel: the 4 px offset became depth and the 12 px depth
    // became height, which is the same swap the kickflip case above measures from the other side.
    expect(Math.abs(sum / n - 32)).toBeLessThan(1.5)
    expect(extent(onePart(BELOW, 0.25, 8)).rows).toBeGreaterThanOrEqual(11)
  })
})

describe('what roll must NOT do', () => {
  it('a body of revolution is unchanged by rolling about its own axis', () => {
    // A capsule is a sphere swept along a segment, so rolling it about that segment is the
    // identity in geometry. Any silhouette change here is the march inventing one — and a
    // marched sampler that drifts would show it first on the case where the answer is known.
    const flat = extent(onePart(LIMB, 0))
    for (const roll of [0.05, 0.125, 0.25, 0.375, 0.5]) {
      const rolled = extent(onePart(LIMB, roll))
      expect(rolled.rows).toBe(flat.rows)
      expect(rolled.cols).toBe(flat.cols)
      // The silhouette is exact; the shading is not asserted equal, because the lamp rolls with
      // the part on purpose. A tilted surface under a fixed sun is lit differently, and that is
      // the whole reason the light goes through the same inverse rotation as the geometry.
      expect(Math.abs(rolled.painted - flat.painted) / flat.painted).toBeLessThan(0.02)
    }
  })

  it('roll accumulates down the hierarchy, the way the screen-plane angle does', () => {
    const child = (parentRoll: number, childRoll: number): Grammar => ({
      name: 'roll-chain',
      palette: PALETTE,
      skeleton: {
        bones: [
          { name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0, roll: parentRoll },
          { name: 'kid', parent: 'root', x: 0, y: 0, z: 0, angle: 0, roll: childRoll },
        ],
      },
      parts: [{ name: 'P', bone: 'kid', material: 'mass', shape: DECK }],
      gait: { name: 'still', phases: [{ name: 'a', at: 0 }], tracks: [] },
    })
    // A quarter on the parent and nothing on the child must equal nothing on the parent and a
    // quarter on the child. Two halves that do not add up is a hierarchy that drops a term.
    expect(extent(child(0.25, 0)).rows).toBe(extent(child(0, 0.25)).rows)
    // And an eighth each has to reach the same place as a quarter on one of them.
    expect(extent(child(0.125, 0.125)).rows).toBe(extent(child(0.25, 0)).rows)
  })
})
