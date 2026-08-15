/**
 * Run 5 — **the gorilla**, his proposal, side view.
 *
 * It lands on both halves of `TASTE.md` §2b at once, which is why it is worth doing:
 *
 *  - **On the strength.** A gorilla is two masses and four limbs. Nothing here is carried
 *    by part count — the read is the shoulder mass sitting higher than the hips and the
 *    weight moving between them. §2b says the ceiling rises when one heavy mass does the
 *    reading, and this is that shape.
 *  - **On the weakness.** Fur has no segmentation. Every body this project has drawn held
 *    its silhouette with a hard edge — chitin plates, a shell seam, a scarf against cloth —
 *    and a gorilla has none of that. If H1 has a boundary, it is here.
 *
 * The gait is a **knuckle walk**: the arms are longer than the legs and take weight on
 * closed hands, the back slopes down from shoulder to hip, and the body drops onto the
 * front limb as it lands. That drop is the whole animation; a gorilla that walks level is a
 * costume.
 *
 * One number here is a lesson rather than a choice: the coat's lightest tone had to be
 * pushed up until the rim cleared the ground. **A dark palette on a mid-grey page has
 * almost no room at the top**, and a rim light nobody can see is a rim light that is not
 * there — the edge-contrast lock caught it at 0.092 against a floor of 0.10, which is a
 * distance no eye would have named but every eye would have felt.
 *
 * stack — every measurement. portable — mass-first bodies, and weight as a drop on contact.
 */
import type { Grammar, Palette } from '../../core/types.ts'

const FUR: Palette = {
  name: 'gorilla',
  colors: [
    [0, 0, 0],
    [14, 12, 15],
    [24, 21, 24],
    [36, 31, 34],
    [50, 43, 44],
    [68, 58, 56],
    [90, 77, 70],
    [140, 122, 104],
    [182, 164, 140],
    [10, 8, 10],
    [17, 14, 16],
    [25, 21, 23],
    [34, 29, 30],
    [45, 38, 38],
    [58, 49, 48],
    [73, 62, 59],
    [90, 77, 72],
  ],
  ramps: [
    { material: 'fur', indices: [1, 2, 3, 4, 5, 6, 7, 8] },
    { material: 'hide', indices: [9, 10, 11, 12, 13, 14, 15, 16] },
  ],
}

export const gorilla: Grammar = {
  name: 'gorilla',
  palette: FUR,
  skeleton: {
    bones: [
      { name: 'hips', parent: null, x: 0, y: 0, z: 0, angle: 0 },
      // The chest rides forward and high: the sloped back is the silhouette of the animal.
      { name: 'chest', parent: 'hips', x: 11, y: -6, z: 0, angle: 0 },
      { name: 'neck', parent: 'chest', x: 7, y: -3, z: 0, angle: 0 },
      { name: 'head', parent: 'neck', x: 4, y: 1, z: 0, angle: 0 },
      // **The limb rows are depth now, not paint order.** ±9 for the arms is derived: the
      // chest's own depth radius is 9.5 and the upper arm's is 3.8, so at 9 the near arm's
      // front surface stands 3.3 px proud of the chest's. Below about 5.7 it would sink
      // inside the mass and stop existing, which is the number the solver enforces and the
      // old paint order could not even express. Legs at ±8 against the hips' 8.
      { name: 'armFU', parent: 'chest', x: 3, y: -2, z: 9, angle: -0.02 },
      { name: 'armFL', parent: 'armFU', x: 0, y: 12, z: 0, angle: 0.03 },
      { name: 'legFU', parent: 'hips', x: -1, y: 3, z: 8, angle: 0.02 },
      { name: 'legFL', parent: 'legFU', x: 0, y: 8, z: 0, angle: -0.04 },
      { name: 'legNU', parent: 'hips', x: 2, y: 4, z: -8, angle: 0.02 },
      { name: 'legNL', parent: 'legNU', x: 0, y: 8, z: 0, angle: -0.04 },
      { name: 'armNU', parent: 'chest', x: 4, y: 0, z: -9, angle: -0.02 },
      { name: 'armNL', parent: 'armNU', x: 0, y: 13, z: 0, angle: 0.03 },
    ],
  },
  /**
   * **The order below no longer decides anything, and that is the change.** It used to be
   * the depth system — far row first, near row last — and it is kept in the same sequence
   * only so this file reads as the same animal. Depth decides now; declaration order breaks
   * ties between surfaces at exactly equal depth, which on this body never happens.
   *
   * `shift` stays on the far row, and it changed meaning with the solver: it is no longer
   * how the far side is *made* far, it is the deliberate extra step down the ramp that art
   * takes past what the light would do. Occlusion is correct; legibility is a decision.
   */
  parts: [
    // Every limb tapers now: thick at the joint it hangs from, narrow at the one it ends
    // in. A gorilla's forearm is not a cylinder and neither is anything else on a body.
    { name: 'armFU', bone: 'armFU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 12, r: 3.4, r1: 2.9 }, shift: -2 },
    { name: 'armFL', bone: 'armFL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 10, r: 2.9, r1: 2.6 }, shift: -2 },
    { name: 'fistF', bone: 'armFL', material: 'hide', shape: { kind: 'ellipse', cx: 0, cy: 11, rx: 2.8, ry: 2.4, rz: 3.2 }, shift: -1 },
    { name: 'legFU', bone: 'legFU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 3.6, r1: 3 }, shift: -2 },
    { name: 'legFL', bone: 'legFL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 2.9, r1: 2.5 }, shift: -2 },
    { name: 'footF', bone: 'legFL', material: 'hide', shape: { kind: 'ellipse', cx: 1.5, cy: 7.5, rx: 3.4, ry: 2, rz: 3.2 }, shift: -1 },

    // The two masses, and everything else hangs off them.
    { name: 'hips', bone: 'hips', material: 'fur', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 8.5, ry: 8 } },
    { name: 'chest', bone: 'chest', material: 'fur', shape: { kind: 'ellipse', cx: -1, cy: 0, rx: 10, ry: 9.5 } },
    // **The widest thing on the animal, and now it can say so.** `rz` of 10 against a
    // screen height of 5: from the side a gorilla's shoulder girdle is a slab across the
    // body, and at the default depth — the smaller screen radius — it would have been a
    // flat disc buried inside a chest 9.5 deep, painting nothing.
    { name: 'shoulder', bone: 'chest', material: 'fur', shape: { kind: 'ellipse', cx: 1, cy: -6, rx: 8, ry: 5, rz: 10 } },
    { name: 'neck', bone: 'neck', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 3, y1: 2, r: 4 } },
    { name: 'head', bone: 'head', material: 'fur', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 5.2, ry: 4.8 } },
    // The crest is what makes a silhouette read as a gorilla rather than as a bear. It is a
    // blade on the midline, so it keeps its shallow default depth and earns its keep purely
    // by standing above the skull — where the two overlap, the skull correctly wins.
    { name: 'crest', bone: 'head', material: 'fur', shape: { kind: 'ellipse', cx: -1, cy: -4, rx: 3.6, ry: 2.4 } },
    // A browridge wraps toward the viewer; without the offset the skull swallows it whole.
    { name: 'brow', bone: 'head', material: 'hide', shape: { kind: 'capsule', x0: 2, y0: -1.5, x1: 4.5, y1: -0.5, r: 1.6 }, z: -2.6 },
    { name: 'muzzle', bone: 'head', material: 'hide', shape: { kind: 'ellipse', cx: 4.6, cy: 1.6, rx: 3, ry: 2.6 }, z: -0.8 },

    { name: 'legNU', bone: 'legNU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 4, r1: 3.3 } },
    { name: 'legNL', bone: 'legNL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 3.2, r1: 2.8 } },
    { name: 'footN', bone: 'legNL', material: 'hide', shape: { kind: 'ellipse', cx: 1.5, cy: 7.5, rx: 3.6, ry: 2.2, rz: 3.4 } },
    { name: 'armNU', bone: 'armNU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 13, r: 3.8, r1: 3.2 } },
    { name: 'armNL', bone: 'armNL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 10, r: 3.2, r1: 2.8 } },
    // Knuckles stand proud of the forearm, or a knuckle-walker has no hands.
    { name: 'fistN', bone: 'armNL', material: 'hide', shape: { kind: 'ellipse', cx: 0, cy: 11, rx: 3, ry: 2.6, rz: 3.5 } },
  ],
  gait: {
    name: 'knuckle-walk',
    phases: [
      { name: 'contact', at: 0 },
      { name: 'load', at: 0.25 },
      { name: 'pass', at: 0.5 },
      { name: 'lift', at: 0.75 },
    ],
    tracks: [
      // The weight. The body drops onto the limb that just landed and rises off the one
      // that is leaving — twice a cycle, and out of phase with the legs, which is what
      // makes it read as mass rather than as bouncing.
      { bone: 'hips', channel: 'y', keys: [0.7, 1, -0.2, 0.4] },
      { bone: 'chest', channel: 'y', keys: [1, 0.5, -0.4, 0] },
      { bone: 'chest', channel: 'angle', keys: [0.012, 0, -0.012, 0] },
      // The head lags the chest by a quarter: mass at the end of a neck arrives late.
      { bone: 'neck', channel: 'angle', keys: [0, 0.02, 0.008, -0.02] },
      { bone: 'head', channel: 'angle', keys: [-0.014, 0, 0.014, 0.006] },
      // Diagonal: near arm with far leg, then the other pair.
      { bone: 'armNU', channel: 'angle', keys: [1, 0.1, -0.9, -0.2] },
      { bone: 'armNL', channel: 'angle', keys: [-0.35, -0.1, 0.5, 0.2] },
      { bone: 'legFU', channel: 'angle', keys: [0.9, 0, -0.9, 0] },
      { bone: 'legFL', channel: 'angle', keys: [-0.2, -0.6, 0.1, 0.5] },
      { bone: 'armFU', channel: 'angle', keys: [-0.9, -0.2, 1, 0.1] },
      { bone: 'armFL', channel: 'angle', keys: [0.5, 0.2, -0.35, -0.1] },
      { bone: 'legNU', channel: 'angle', keys: [-0.9, 0, 0.9, 0] },
      { bone: 'legNL', channel: 'angle', keys: [0.1, 0.5, -0.2, -0.6] },
    ],
  },
}
