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
      { name: 'hips', parent: null, x: 0, y: 0, angle: 0 },
      // The chest rides forward and high: the sloped back is the silhouette of the animal.
      { name: 'chest', parent: 'hips', x: 11, y: -6, angle: 0 },
      { name: 'neck', parent: 'chest', x: 7, y: -3, angle: 0 },
      { name: 'head', parent: 'neck', x: 4, y: 1, angle: 0 },
      // Far limbs first: paint order is depth.
      { name: 'armFU', parent: 'chest', x: 3, y: -2, angle: -0.02 },
      { name: 'armFL', parent: 'armFU', x: 0, y: 12, angle: 0.03 },
      { name: 'legFU', parent: 'hips', x: -1, y: 3, angle: 0.02 },
      { name: 'legFL', parent: 'legFU', x: 0, y: 8, angle: -0.04 },
      { name: 'legNU', parent: 'hips', x: 2, y: 4, angle: 0.02 },
      { name: 'legNL', parent: 'legNU', x: 0, y: 8, angle: -0.04 },
      { name: 'armNU', parent: 'chest', x: 4, y: 0, angle: -0.02 },
      { name: 'armNL', parent: 'armNU', x: 0, y: 13, angle: 0.03 },
    ],
  },
  parts: [
    { name: 'armFU', bone: 'armFU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 12, r: 3.4 }, shift: -2 },
    { name: 'armFL', bone: 'armFL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 10, r: 2.9 }, shift: -2 },
    { name: 'fistF', bone: 'armFL', material: 'hide', shape: { kind: 'ellipse', cx: 0, cy: 11, rx: 2.8, ry: 2.4 }, shift: -1 },
    { name: 'legFU', bone: 'legFU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 3.6 }, shift: -2 },
    { name: 'legFL', bone: 'legFL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 2.9 }, shift: -2 },
    { name: 'footF', bone: 'legFL', material: 'hide', shape: { kind: 'ellipse', cx: 1.5, cy: 7.5, rx: 3.4, ry: 2 }, shift: -1 },

    // The two masses, and everything else hangs off them.
    { name: 'hips', bone: 'hips', material: 'fur', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 8.5, ry: 8 } },
    { name: 'chest', bone: 'chest', material: 'fur', shape: { kind: 'ellipse', cx: -1, cy: 0, rx: 10, ry: 9.5 } },
    { name: 'shoulder', bone: 'chest', material: 'fur', shape: { kind: 'ellipse', cx: 1, cy: -6, rx: 8, ry: 5 } },
    { name: 'neck', bone: 'neck', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 3, y1: 2, r: 4 } },
    { name: 'head', bone: 'head', material: 'fur', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 5.2, ry: 4.8 } },
    // The crest is what makes a silhouette read as a gorilla rather than as a bear.
    { name: 'crest', bone: 'head', material: 'fur', shape: { kind: 'ellipse', cx: -1, cy: -4, rx: 3.6, ry: 2.4 } },
    { name: 'brow', bone: 'head', material: 'hide', shape: { kind: 'capsule', x0: 2, y0: -1.5, x1: 4.5, y1: -0.5, r: 1.6 } },
    { name: 'muzzle', bone: 'head', material: 'hide', shape: { kind: 'ellipse', cx: 4.6, cy: 1.6, rx: 3, ry: 2.6 } },

    { name: 'legNU', bone: 'legNU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 4 } },
    { name: 'legNL', bone: 'legNL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 3.2 } },
    { name: 'footN', bone: 'legNL', material: 'hide', shape: { kind: 'ellipse', cx: 1.5, cy: 7.5, rx: 3.6, ry: 2.2 } },
    { name: 'armNU', bone: 'armNU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 13, r: 3.8 } },
    { name: 'armNL', bone: 'armNL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 10, r: 3.2 } },
    { name: 'fistN', bone: 'armNL', material: 'hide', shape: { kind: 'ellipse', cx: 0, cy: 11, rx: 3, ry: 2.6 } },
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
