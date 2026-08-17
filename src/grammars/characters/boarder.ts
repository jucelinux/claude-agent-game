/**
 * **Run 19 — the snowboarder, and it is transfer test C reshaped by his own sentence.**
 *
 * The plan said the carve needs a camera looking down the slope. His commission — *"a mesma
 * estética e referência visual do Yoshi Island, do snes"* — forces the SIDE camera, because
 * Yoshi's Island is a side-view game. So the declared approximation gets its test in the camera
 * that exists: **the root bone carries a rest lean, and the trick composes a full roll with that
 * screen-plane angle** — `Bone.roll` accumulates as a scalar and does not commute with a parent's
 * angle, which is exactly the case the record says is only approximate. Every frame of the rodeo
 * exercises it.
 *
 * ## The aesthetic, from his reference (structural numbers extracted at intake, 16/08 rule)
 *
 * One winter Yoshi's Island screen, supplied by him. What it measures:
 * - **chibi proportion: head ≈ 0.4 of total height.** The boarder is 34 px with a 9 px skull.
 * - **outline on everything**, dark warm-black rather than blue-black — YI lines are crayon.
 * - **saturated pastels, high key**: nothing on the subject reaches true black except the line.
 * - the trick's value pair: slate topsheet against a pale base — the deck's wood/grip, in snow.
 *
 * ## Part count
 *
 * 22 parts in 44×52. Mass carried by the jacket and the skull — the chibi read IS two masses.
 * The goggles are markings (paint, not silhouette), the kitten's face-at-scale answer.
 */
import type { Grammar, Palette } from '../../core/types.ts'

/**
 * **Yoshi's Island winter, five tones per material with a drawn line** — the 15/08 idiom is
 * binding; what changes per his reference is WHERE the palette sits: high key, saturated,
 * shadows that stay coloured instead of going grey.
 */
export const BOARDER_PALETTE: Palette = {
  name: 'boarder-piste',
  colors: [
    [0, 0, 0],
    // jacket — coral red, the YI accent red. Puffy, and the brightest warm on the screen.
    [96, 28, 40], [150, 44, 52], [200, 66, 58], [236, 102, 72], [252, 150, 108],
    // teal — pants, beanie, boots. The suit's cool half, against the sky's paler teal.
    [16, 66, 72], [24, 102, 102], [38, 142, 132], [64, 182, 158], [112, 216, 186],
    // slate — the board's topsheet and bindings. The dark face of the trick.
    [22, 26, 40], [38, 46, 64], [60, 72, 92], [92, 108, 128], [132, 152, 168],
    // cream — the base, the pom, the mitts, the goggle rim. The bright face of the trick.
    [110, 88, 70], [152, 124, 92], [194, 164, 118], [226, 200, 150], [250, 236, 190],
    // skin — sunnier than the skate's dusk ramp: this is a bluebird morning.
    [92, 52, 48], [140, 78, 62], [186, 112, 80], [222, 152, 108], [248, 196, 148],
    // ink — warm black. YI's line is crayon-brown, not the street's blue.
    [20, 10, 14], [32, 18, 22], [46, 28, 32], [62, 40, 44], [80, 54, 58],
  ],
  ramps: [
    { material: 'jacket', indices: [1, 2, 3, 4, 5] },
    { material: 'teal', indices: [6, 7, 8, 9, 10] },
    { material: 'slate', indices: [11, 12, 13, 14, 15] },
    { material: 'cream', indices: [16, 17, 18, 19, 20] },
    { material: 'skin', indices: [21, 22, 23, 24, 25] },
    { material: 'ink', indices: [26, 27, 28, 29, 30] },
  ],
}

/**
 * **The rest lean is on the ROOT, and it is the experiment.** `core` carries `angle: 0.02` —
 * about 7° of forward attitude, which is what a boarder's stance is — and the rodeo's roll
 * track lands on the same bone. Parent angle composed with accumulated roll is the declared
 * approximation; a clip that runs it for thirteen frames under locks is its test.
 */
const SKELETON = {
  bones: [
    { name: 'core', parent: null, x: 0, y: 0, z: 0, angle: 0.02 },
    { name: 'board', parent: 'core', x: 0.4, y: 13, z: 0, angle: 0 },
    { name: 'nose', parent: 'board', x: 11.5, y: -0.3, z: 0, angle: -0.07 },
    { name: 'tail', parent: 'board', x: -11.5, y: -0.3, z: 0, angle: 0.07 },
    { name: 'chest', parent: 'core', x: 0.4, y: -4.6, z: 0, angle: 0 },
    // ±6.2 in depth: the jacket's rz is 4.2 and an arm's r is 2, so an arm clears the torso only
    // past 6.2 — the skate-arm arithmetic, done BEFORE the channel had to report it this time
    // (it still caught the first authoring at ±4.6: armF painted 0-1 px in every frame).
    { name: 'head', parent: 'chest', x: 0.8, y: -5.2, z: 0, angle: 0 },
    { name: 'armF', parent: 'chest', x: -0.4, y: -1.6, z: 6.2, angle: 0 },
    { name: 'armN', parent: 'chest', x: 0.6, y: -1.6, z: -6.2, angle: 0 },
    { name: 'legF', parent: 'core', x: -2.6, y: 1.6, z: 2.6, angle: 0 },
    { name: 'legN', parent: 'core', x: 3, y: 1.6, z: -2.6, angle: 0 },
  ],
} as const

/**
 * **Welds by the seam test.** The suit is one garment: jacket to pants to beanie, welded. The
 * board against the boots, the bindings against the topsheet, the mitts against the sleeves,
 * the face against the beanie — real seams, and they keep their line.
 */
const PARTS = [
  // ---- Far side first, one ramp step down.
  { weld: true, name: 'armF', bone: 'armF', material: 'jacket', shape: { kind: 'capsule', x0: 0, y0: 0, x1: -1.4, y1: 5.4, r: 1.9, r1: 1.5 }, shift: -1 },
  { name: 'mittF', bone: 'armF', material: 'cream', shape: { kind: 'ellipse', cx: -1.8, cy: 6, rx: 1.7, ry: 1.6, rz: 1.5 }, shift: -1 },
  { weld: true, name: 'legF', bone: 'legF', material: 'teal', shape: { kind: 'capsule', x0: 0, y0: 0, x1: -0.6, y1: 7.4, r: 2.3, r1: 1.9 }, shift: -1 },
  { name: 'bootF', bone: 'legF', material: 'teal', shape: { kind: 'ellipse', cx: -0.6, cy: 9.4, rx: 2.4, ry: 1.9, rz: 1.9 }, shift: -2 },

  // ---- The board. The trick's two faces: slate above, cream below — wood/grip, in snow.
  { weld: true, name: 'topsheet', bone: 'board', material: 'slate', shape: { kind: 'rect', x: -11.8, y: -1.4, w: 23.6, h: 1.5, d: 7 } },
  { weld: true, name: 'base', bone: 'board', material: 'cream', shape: { kind: 'rect', x: -11.8, y: 0.1, w: 23.6, h: 1.1, d: 7 } },
  { weld: true, name: 'kickN', bone: 'nose', material: 'slate', shape: { kind: 'rect', x: -0.4, y: -1.2, w: 3.6, h: 2.2, d: 6.2 } },
  { weld: true, name: 'kickT', bone: 'tail', material: 'slate', shape: { kind: 'rect', x: -3.2, y: -1.2, w: 3.6, h: 2.2, d: 6.2 } },
  { name: 'bindF', bone: 'board', material: 'slate', z: 2.2, shape: { kind: 'rect', x: -6.6, y: -2.6, w: 3, h: 1.4, d: 2.4 }, shift: -1 },
  { name: 'bindN', bone: 'board', material: 'slate', z: -2.2, shape: { kind: 'rect', x: 3.6, y: -2.6, w: 3, h: 1.4, d: 2.4 } },

  // ---- The body's mass: jacket and skull, the two chibi masses.
  { weld: true, name: 'hips', bone: 'core', material: 'teal', shape: { kind: 'ellipse', cx: 0, cy: 0.6, rx: 3.6, ry: 2.6, rz: 3.4 } },
  { weld: true, name: 'jacket', bone: 'chest', material: 'jacket', shape: { kind: 'ellipse', cx: 0, cy: -0.4, rx: 4.6, ry: 4.4, rz: 4.2 } },
  /**
   * **The skull is 9 px on a 34 px body — the chibi 0.4, measured off his reference.** No
   * features: the goggles are markings and the beanie's brim is the hairline. The kitten rule
   * (a face at small scale does not transfer) is respected by not drawing one.
   */
  { weld: true, name: 'skull', bone: 'head', material: 'skin', shape: { kind: 'ellipse', cx: 0.4, cy: -1.8, rx: 4.4, ry: 4, rz: 4 } },
  { weld: true, name: 'beanie', bone: 'head', material: 'teal', shape: { kind: 'lobed', cx: 0.2, cy: -3.6, rx: 4.6, ry: 3, rz: 4.2, lobes: 3, depth: 0.1, phase: 0.6 } },
  { name: 'pom', bone: 'head', material: 'cream', shape: { kind: 'ellipse', cx: -0.6, cy: -6.6, rx: 1.7, ry: 1.7, rz: 1.7 } },
  // Goggles: a cream rim with a slate lens, both paint — nothing added to the silhouette.
  { name: 'rim', bone: 'head', material: 'cream', z: -3.4, shape: { kind: 'capsule', x0: 0.6, y0: -1.6, x1: 4.4, y1: -1.8, r: 1.9 }, marking: true },
  { name: 'lens', bone: 'head', material: 'slate', z: -3.6, shape: { kind: 'capsule', x0: 1.4, y0: -1.6, x1: 4.2, y1: -1.8, r: 1.3 }, marking: true },

  // ---- Near side, last.
  { weld: true, name: 'legN', bone: 'legN', material: 'teal', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0.6, y1: 7.4, r: 2.4, r1: 2 } },
  { name: 'bootN', bone: 'legN', material: 'teal', shape: { kind: 'ellipse', cx: 0.6, cy: 9.4, rx: 2.5, ry: 2, rz: 2 }, shift: -2 },
  { weld: true, name: 'armN', bone: 'armN', material: 'jacket', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 1.8, y1: 5.4, r: 2, r1: 1.6 } },
  { name: 'mittN', bone: 'armN', material: 'cream', shape: { kind: 'ellipse', cx: 2.2, cy: 6, rx: 1.8, ry: 1.7, rz: 1.6 } },
] as const

/**
 * **The carve: the loop, and it is a pump between edges.** The body rises and sinks, the board
 * pitches a few degrees each way, the arms counter — a boarder holding a line. Advances with
 * distance over strideLen, as every locomotion here.
 */
export const snowCarve: Grammar = {
  name: 'snow-carve',
  palette: BOARDER_PALETTE,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'carve',
    phases: [
      { name: 'set', at: 0 },
      { name: 'press', at: 0.25 },
      { name: 'release', at: 0.5 },
      { name: 'float', at: 0.75 },
    ],
    tracks: [
      { bone: 'core', channel: 'y', keys: [0.5, 0, -0.5, 0] },
      { bone: 'board', channel: 'angle', keys: [0.16, -0.1, 0.14, -0.14] },
      { bone: 'chest', channel: 'angle', keys: [-0.1, 0.12, -0.08, 0.1] },
      /**
       * The two arms and the two legs are offset in TIME, never mirrored in sign — the
       * mirrored-knee lesson, caught by the pairs lock on this very clip's first authoring:
       * the first keys were exact negations and the lock reported one limb drawn twice.
       */
      { bone: 'armN', channel: 'angle', keys: [-0.65, -0.1, -0.5, -0.3] },
      { bone: 'armF', channel: 'angle', keys: [0.4, 0.6, 0.1, 0.55] },
      { bone: 'legF', channel: 'angle', keys: [0.12, -0.04, 0.09, -0.08] },
      { bone: 'legN', channel: 'angle', keys: [-0.05, 0.11, -0.09, 0.07] },
    ],
  },
}

/**
 * **The jump: this round's control, wholly in the screen plane.** Crouch, pop, tuck, land —
 * every rotation is `Bone.angle`. If the jump reads worse than the shelf's other airs, the
 * composition work damaged the old path: a rollback, not a tune.
 */
export const snowJump: Grammar = {
  name: 'snow-jump',
  palette: BOARDER_PALETTE,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'air',
    wrap: false,
    phases: [
      { name: 'crouch', at: 0 },
      { name: 'pop', at: 0.25 },
      { name: 'tuck', at: 0.5 },
      { name: 'level', at: 0.75 },
      { name: 'land', at: 1 },
    ],
    tracks: [
      { bone: 'core', channel: 'y', keys: [1, -0.6, -1.1, -0.8, 0.6] },
      { bone: 'core', channel: 'angle', keys: [0, 0.16, 0.1, 0.02, -0.04] },
      { bone: 'board', channel: 'angle', keys: [0, -0.4, -0.2, 0, 0.12] },
      { bone: 'legF', channel: 'angle', keys: [0.3, 0.1, 0.7, 0.4, 0.2] },
      { bone: 'legN', channel: 'angle', keys: [-0.25, -0.1, -0.6, -0.35, -0.15] },
      { bone: 'armN', channel: 'angle', keys: [-0.4, -1.3, -1, -0.7, -0.3] },
      { bone: 'armF', channel: 'angle', keys: [0.4, 1.2, 0.9, 0.6, 0.3] },
      { bone: 'chest', channel: 'angle', keys: [0.2, -0.15, 0.15, 0.05, 0.15] },
    ],
  },
}

/**
 * **The rodeo: a full roll on the root that already leans.** Thirteen frames, played once.
 * The composition is not incidental — the angle track keeps the lean CHANGING through the
 * turn, so the non-commuting pair is exercised at a different value every frame. If the
 * approximation drifts, parts detach or vanish, and the locks on this clip are where that
 * shows first.
 */
export const snowRodeo: Grammar = {
  name: 'snow-rodeo',
  palette: BOARDER_PALETTE,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'rodeo',
    wrap: false,
    phases: [
      { name: 'wind', at: 0 },
      { name: 'quarter', at: 0.25 },
      { name: 'inverted', at: 0.5 },
      { name: 'coming', at: 0.75 },
      { name: 'stomp', at: 1 },
    ],
    tracks: [
      /** The whole turn on the leaning root: the transfer test's one load-bearing line. */
      { bone: 'core', channel: 'roll', keys: [0, -0.25, -0.5, -0.75, -1] },
      // And the lean keeps moving under it, so the composition never sits at one value.
      { bone: 'core', channel: 'angle', keys: [0.12, 0.2, 0.1, 0.04, 0.02] },
      { bone: 'legF', channel: 'angle', keys: [0.4, 0.9, 1, 0.7, 0.3] },
      { bone: 'legN', channel: 'angle', keys: [-0.35, -0.8, -0.9, -0.6, -0.25] },
      { bone: 'armN', channel: 'angle', keys: [-0.8, -1.6, -1.4, -1, -0.4] },
      { bone: 'armF', channel: 'angle', keys: [0.7, 1.5, 1.3, 0.9, 0.4] },
      { bone: 'chest', channel: 'angle', keys: [0.1, 0.25, 0.15, 0.08, 0.05] },
    ],
  },
}
