/**
 * **The sky furniture, and the three heights are derived from the two impulses — the street's
 * arithmetic, one game up.**
 *
 * The climb reaches 26 px and the barrel roll reaches 56. So the balloon at ~16 and the flock at
 * ~20 are climb obstacles, and the kite balloon at ~36 is **unreachable without the roll**. The
 * runtime reads each obstacle's height from its own art — the top row of the crop above the
 * cruise line — so an obstacle's difficulty stays a fact about how it was drawn.
 *
 * **Every obstacle fills its own column, and that is a collision-honesty rule, not a style.**
 * The runner's box is solid from the line to the crop's top; a flock drawn only at its top would
 * kill a plane flying through empty air below it — a positioning bug, which is the defect class
 * whose absence he named and rewarded on batch 4. So the flock climbs from low to high, the
 * balloon stands on its basket, and the kite balloon hangs its full cable.
 */
import type { Grammar, Palette } from '../../core/types.ts'

/**
 * Balloon fabric in dawn gold, service canvas in grey-blue, wicker, and birds in slate. The
 * ranges are deliberately narrower than the biplane's: sky furniture that carried the bright end
 * would compete with the machine for the eye — the street's rule.
 */
const ALOFT: Palette = {
  name: 'aloft',
  colors: [
    [0, 0, 0],
    // envelope — dawn-gold balloon fabric, the one saturated thing among the obstacles.
    [64, 30, 20], [110, 54, 26], [160, 86, 34], [206, 126, 52], [240, 176, 92],
    // canvas — the kite balloon's doped grey-blue, military and matte.
    [28, 32, 44], [46, 54, 68], [70, 82, 98], [104, 118, 134], [146, 162, 176],
    // wicker — baskets, ropes, the cable.
    [50, 36, 22], [82, 60, 34], [118, 90, 50], [158, 126, 72], [198, 168, 104],
    // feather — birds, dark against a bright sky: a bird at distance is a mark, not a body.
    [16, 16, 24], [28, 30, 40], [44, 48, 60], [66, 72, 86], [94, 102, 116],
    // ink — the same line as the machine, so one hand drew the sky.
    [10, 9, 16], [16, 14, 26], [24, 21, 38], [34, 30, 52], [46, 40, 66],
  ],
  ramps: [
    { material: 'envelope', indices: [1, 2, 3, 4, 5] },
    { material: 'canvas', indices: [6, 7, 8, 9, 10] },
    { material: 'wicker', indices: [11, 12, 13, 14, 15] },
    { material: 'feather', indices: [16, 17, 18, 19, 20] },
    { material: 'ink', indices: [21, 22, 23, 24, 25] },
  ],
}

const STILL = { name: 'still', phases: [{ name: 'a', at: 0 }], tracks: [] } as const

/**
 * A hot-air balloon, ~16 px to the crown: the cheapest thing the climb clears. A lobed envelope
 * — the primitive that has paid for foliage, clouds and a cap — over a wicker basket, with a
 * mooring rope trailing below the line: the one part of any obstacle that reaches below the
 * horizon, and the cheapest possible statement that the world is far beneath it.
 */
export const skyBalloon: Grammar = {
  name: 'sky-balloon',
  palette: ALOFT,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'crown', bone: 'root', material: 'envelope', shape: { kind: 'lobed', cx: 0, cy: -10.2, rx: 5.4, ry: 5.2, rz: 5.2, lobes: 6, depth: 0.08, phase: 0.4 } },
    // The throat: the envelope narrowing to the ring. A tapered capsule, as the cone was.
    { weld: true, name: 'throat', bone: 'root', material: 'envelope', shape: { kind: 'capsule', x0: 0, y0: -8, x1: 0, y1: -4.4, r: 3.4, r1: 1.4 } },
    // Gores: markings, not solids — paint on the envelope, nothing added to the silhouette.
    { name: 'gore', bone: 'root', material: 'wicker', z: -3, shape: { kind: 'capsule', x0: 0, y0: -14.6, x1: 0, y1: -5.2, r: 0.7 }, marking: true },
    { name: 'basket', bone: 'root', material: 'wicker', shape: { kind: 'rect', x: -1.9, y: -3.4, w: 3.8, h: 2.6, d: 3.4 } },
    { weld: true, name: 'mooring', bone: 'root', material: 'wicker', shape: { kind: 'capsule', x0: 0.3, y0: -0.8, x1: 1.6, y1: 6.5, r: 0.5, r1: 0.4 } },
  ],
  gait: STILL,
}

/**
 * **A climbing flock, ~20 px at the lead bird — the top of the climb's range.**
 *
 * Four chevrons from low to high, because the column has to be honestly full: a flock only at
 * altitude would end a run against empty air. The flap is `scaleY` on each bird's own bone — the
 * classic two-stroke V flattening and opening — with the phases offset so the flock never beats
 * as one object, which is the three-clouds rule.
 */
export const skyFlock: Grammar = {
  name: 'sky-flock',
  palette: ALOFT,
  skeleton: {
    bones: [
      { name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 },
      { name: 'b0', parent: 'root', x: -4.5, y: -4.5, z: 1.5, angle: 0 },
      { name: 'b1', parent: 'root', x: 3.5, y: -9.5, z: -1, angle: 0 },
      { name: 'b2', parent: 'root', x: -2.5, y: -14, z: 0.5, angle: 0 },
      { name: 'b3', parent: 'root', x: 2, y: -18.5, z: 0, angle: 0 },
    ],
  },
  parts: [
    { weld: true, name: 'b0L', bone: 'b0', material: 'feather', shape: { kind: 'capsule', x0: 0.2, y0: 0, x1: -2.4, y1: -1.5, r: 0.55, r1: 0.4 } },
    { weld: true, name: 'b0R', bone: 'b0', material: 'feather', shape: { kind: 'capsule', x0: -0.2, y0: 0, x1: 2.4, y1: -1.5, r: 0.55, r1: 0.4 } },
    { weld: true, name: 'b1L', bone: 'b1', material: 'feather', shape: { kind: 'capsule', x0: 0.2, y0: 0, x1: -2.6, y1: -1.6, r: 0.6, r1: 0.4 } },
    { weld: true, name: 'b1R', bone: 'b1', material: 'feather', shape: { kind: 'capsule', x0: -0.2, y0: 0, x1: 2.6, y1: -1.6, r: 0.6, r1: 0.4 } },
    { weld: true, name: 'b2L', bone: 'b2', material: 'feather', shape: { kind: 'capsule', x0: 0.2, y0: 0, x1: -2.5, y1: -1.5, r: 0.55, r1: 0.4 } },
    { weld: true, name: 'b2R', bone: 'b2', material: 'feather', shape: { kind: 'capsule', x0: -0.2, y0: 0, x1: 2.5, y1: -1.5, r: 0.55, r1: 0.4 } },
    // The lead bird, and the runtime reads the obstacle's height off its wingtips.
    { weld: true, name: 'b3L', bone: 'b3', material: 'feather', shape: { kind: 'capsule', x0: 0.2, y0: 0, x1: -2.8, y1: -1.7, r: 0.65, r1: 0.45 } },
    { weld: true, name: 'b3R', bone: 'b3', material: 'feather', shape: { kind: 'capsule', x0: -0.2, y0: 0, x1: 2.8, y1: -1.7, r: 0.65, r1: 0.45 } },
  ],
  gait: {
    name: 'flap',
    phases: [
      { name: 'down', at: 0 },
      { name: 'flat', at: 0.25 },
      { name: 'up', at: 0.5 },
      { name: 'flat2', at: 0.75 },
    ],
    tracks: [
      // scaleY folds the V flat and opens it: a wingbeat at four pixels is a change of angle
      // read as a change of height, and this is the cheapest true way to draw it.
      { bone: 'b0', channel: 'scaleY', keys: [0.35, -0.55, 0.35, -0.1] },
      { bone: 'b1', channel: 'scaleY', keys: [-0.55, 0.35, -0.1, 0.35] },
      { bone: 'b2', channel: 'scaleY', keys: [0.35, -0.1, 0.35, -0.55] },
      { bone: 'b3', channel: 'scaleY', keys: [-0.1, 0.35, -0.55, 0.35] },
      // And the flock breathes vertically, each bird on its own beat.
      { bone: 'b0', channel: 'y', keys: [0.3, 0, -0.3, 0] },
      { bone: 'b1', channel: 'y', keys: [-0.3, 0, 0.3, 0] },
      { bone: 'b2', channel: 'y', keys: [0, 0.3, 0, -0.3] },
      { bone: 'b3', channel: 'y', keys: [0, -0.3, 0, 0.3] },
    ],
  },
}

/**
 * **The kite balloon: ~36 px to the envelope's back, and the climb cannot clear it.**
 *
 * 26 px of climb against 36 of balloon is the gate on the second press, set from the impulse
 * rather than the impulse from it — the rail's arithmetic. A moored observation sausage: the
 * envelope at the top, fins so it reads as a machine of air rather than a whale, an observer's
 * basket under it, and the cable running the whole way down past the horizon. The cable is what
 * makes the column honestly full: fly under a kite balloon and it is the cable you hit.
 */
export const skyKite: Grammar = {
  name: 'sky-kite',
  palette: ALOFT,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'envelope', bone: 'root', material: 'canvas', shape: { kind: 'capsule', x0: -5.8, y0: -30.6, x1: 5.2, y1: -31.4, r: 4.3, r1: 3.4 } },
    /**
     * Fins at the tail, upper and lower — the silhouette that says "dirigible" at 20 px. They sit
     * PAST the envelope's own surface: the first authoring put them at x -8.6 inside the tail's
     * 4.3 px radius, and the channel reported both at 0 px — the envelope's depth swallowed them,
     * the skate-arm arithmetic error in a new place. Beyond -10.1 they own their pixels.
     */
    { weld: true, name: 'finUp', bone: 'root', material: 'canvas', shape: { kind: 'rect', x: -13.2, y: -37, w: 4.4, h: 3, d: 1 } },
    { weld: true, name: 'finLo', bone: 'root', material: 'canvas', shape: { kind: 'rect', x: -13.2, y: -28.4, w: 4.4, h: 3, d: 1 } },
    { name: 'stripe', bone: 'root', material: 'envelope', z: -3, shape: { kind: 'capsule', x0: 3.2, y0: -33.8, x1: 5.6, y1: -30.2, r: 1.1 }, marking: true },
    // The basket hangs on the cable; a separate sling was authored and the channel reported it
    // swallowed by the envelope's belly, so the cable is the whole suspension now.
    { name: 'basket', bone: 'root', material: 'wicker', shape: { kind: 'rect', x: -1.4, y: -25.4, w: 2.8, h: 2.2, d: 2.6 } },
    // The cable: the whole column, past the horizon. Thin, and honestly lethal.
    { weld: true, name: 'cable', bone: 'root', material: 'wicker', shape: { kind: 'capsule', x0: 0, y0: -25, x1: 1.2, y1: 6.5, r: 0.5, r1: 0.4 } },
  ],
  gait: STILL,
}
