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

/**
 * **The coat, remade on 16/08, and both halves of it are his reading.**
 *
 * *"cara o gorila é preto"* — and it was not. The fur ran to [182, 164, 140], a warm cream,
 * which is a brown bear's highlight and not a gorilla's. **Black hair does not go warm in the
 * light; it goes blue**, because the only thing it has to reflect is the sky.
 *
 * *"a costa prateada não é literal da forma como você fez"* — and it was not. The saddle
 * topped out at [238, 241, 246], eleven points off white, on an animal whose darkest tone was
 * 14. That is a stripe painted onto a black coat. **A silverback's saddle is the same coat
 * going grey**, so its range now overlaps the fur's and reaches exactly one step past its
 * brightest tone. Grey hair on black, not white paint on black.
 *
 * **Five tones per material, in the idiom he ranked first**, which is the second half of his
 * ask: the wood, the clouds and the photographer were all in Chrono's ink and the animal a
 * person is steering was still in the incumbent — eight tones, no drawn line, a rim instead,
 * and 18% noise. The player character was the only thing in the picture from a different game.
 *
 * **The declared cost, and it is a real one.** Chrono's argument is a genuinely wide value
 * range, and a black animal cannot have one: this ramp spans 9 to 134 where the run 8 probe
 * spanned 30 to 196. The range is spent *inside the dark half* instead. Separation comes from
 * the drawn line and from the saddle rather than from reaching a cream highlight, and that is
 * a trade rather than a win.
 */
const FUR: Palette = {
  name: 'gorilla',
  colors: [
    [0, 0, 0],
    // fur — black, and the highlight is cool. Black hair reflects the sky and nothing else.
    [9, 9, 12],
    [27, 28, 34],
    [52, 54, 64],
    [84, 88, 102],
    [128, 134, 152],
    // hide — the face, knuckles and feet. Bare gorilla skin is blacker than the coat.
    [6, 6, 9],
    [18, 18, 24],
    [34, 36, 45],
    [56, 59, 72],
    [86, 91, 108],
    // silver — the saddle. **It starts inside the fur's range and ends one step above it.**
    // That is what makes it read as the same coat going grey rather than as a painted band,
    // and it is the whole of his correction.
    [24, 25, 30],
    [48, 50, 58],
    [80, 83, 94],
    [118, 122, 136],
    [158, 163, 178],
    // ink — the drawn line. Dark, never pure black: a black ring on a page reads as a sticker
    // cut out of the background rather than as a drawn edge.
    [5, 5, 8],
    [11, 11, 16],
    [17, 18, 24],
    [25, 26, 34],
    [35, 37, 47],
  ],
  ramps: [
    { material: 'fur', indices: [1, 2, 3, 4, 5] },
    { material: 'hide', indices: [6, 7, 8, 9, 10] },
    { material: 'silver', indices: [11, 12, 13, 14, 15] },
    { material: 'ink', indices: [16, 17, 18, 19, 20] },
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
      // **The shin rests folded BACK, and it used to rest folded forward.** A hinge bends to
      // one side of straight and never through it; this one spent its whole cycle between
      // -36 and +4 degrees, which is a knee bending backwards for seven frames out of eight.
      // He felt it before any number said it: "estou incomodado com o cotovelo e com o joelho".
      { name: 'legFU', parent: 'hips', x: -1, y: 3, z: 8, angle: 0.02 },
      { name: 'legFL', parent: 'legFU', x: 0, y: 8, z: 0, angle: 0.04 },
      { name: 'legNU', parent: 'hips', x: 2, y: 4, z: -8, angle: 0.02 },
      { name: 'legNL', parent: 'legNU', x: 0, y: 8, z: 0, angle: 0.04 },
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
    { name: 'armFU', bone: 'armFU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 12, r: 3.4, r1: 2.9 }, shift: -1 },
    { name: 'armFL', bone: 'armFL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 10, r: 2.9, r1: 2.6 }, shift: -1 },
    { name: 'fistF', bone: 'armFL', material: 'hide', shape: { kind: 'ellipse', cx: 0, cy: 11, rx: 2.8, ry: 2.4, rz: 3.2 }, shift: -1 },
    { name: 'legFU', bone: 'legFU', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 3.6, r1: 3 }, shift: -1 },
    { name: 'legFL', bone: 'legFL', material: 'fur', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 2.9, r1: 2.5 }, shift: -1 },
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
    // **The sagittal crest, grown for the silverback.** It was 3.6 x 2.4; a mature male's
    // skull carries a ridge of muscle and bone that makes the head read as a helmet from any
    // distance. It is the second thing after the saddle that says which animal this is, and
    // unlike the saddle it changes the SILHOUETTE — which is where a sprite is read.
    { name: 'crest', bone: 'head', material: 'fur', shape: { kind: 'ellipse', cx: -1.2, cy: -5, rx: 4.4, ry: 3.6, rz: 4 } },
    // A browridge wraps toward the viewer; without the offset the skull swallows it whole.
    { name: 'brow', bone: 'head', material: 'hide', shape: { kind: 'capsule', x0: 2, y0: -1.5, x1: 4.5, y1: -0.5, r: 1.6 }, z: -2.6 },
    { name: 'muzzle', bone: 'head', material: 'hide', shape: { kind: 'ellipse', cx: 4.6, cy: 1.6, rx: 3, ry: 2.6 }, z: -0.8 },

    /**
     * **The saddle.** Two masses rather than one, because the silver runs over the shoulders
     * and the loins and dips at the waist — a single band across the whole back reads as a
     * blanket. `lobed` rather than an ellipse so the boundary between grey hair and black is
     * ragged, which is what a coat boundary is; a clean edge reads as paint.
     *
     * They sit at z -1 so they are proud of the mass they lie on. Any deeper and the chest
     * swallows them, which is the defect `Part.z` was added for in the first place.
     */
    { name: 'saddleB', bone: 'chest', material: 'silver', z: -1, shape: { kind: 'lobed', cx: -2.6, cy: -5.2, rx: 9.4, ry: 6.2, rz: 9.5, lobes: 5, depth: 0.17, phase: 0.7, octaves: 2 } },
    { name: 'saddleH', bone: 'hips', material: 'silver', z: -1, shape: { kind: 'lobed', cx: -0.6, cy: -4.6, rx: 7.8, ry: 4.8, rz: 8, lobes: 4, depth: 0.2, phase: 2.4, octaves: 2 } },

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
      { bone: 'armNL', channel: 'angle', keys: [-0.28, -0.1, 0.5, 0.2] },
      { bone: 'legFU', channel: 'angle', keys: [0.9, 0, -0.9, 0] },
      // Knee flexion at contact / load / pass / lift: about 10, 20, 5 and 40 degrees. Most
      // folded through the swing so the foot clears the ground, straightest as it passes
      // under the body. Authored against a 14.4 deg rest and the gait's 36 deg amplitude.
      { bone: 'legFL', channel: 'angle', keys: [-0.26, 0.71, -0.12, 0.16] },
      { bone: 'armFU', channel: 'angle', keys: [-0.9, -0.2, 1, 0.1] },
      { bone: 'armFL', channel: 'angle', keys: [0.5, 0.2, -0.28, -0.1] },
      { bone: 'legNU', channel: 'angle', keys: [-0.9, 0, 0.9, 0] },
      { bone: 'legNL', channel: 'angle', keys: [-0.12, 0.16, -0.26, 0.71] },
    ],
  },
}
