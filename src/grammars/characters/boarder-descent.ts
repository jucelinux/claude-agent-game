/**
 * **Run 20 — the boarder from behind: the down-slope camera's subject, and the REAL test C.**
 *
 * His correction, 17/08: the snowboard test was always about validating the camera relation.
 * So this file is the boarder authored in BACK view for a camera high behind the rider, and the
 * carve is the composition at full amplitude: **the root banks to ~36° of screen-plane angle
 * WHILE rolled children fold under it** — the exact case `Bone.roll` declares approximate
 * ("a skeleton whose rolled subtree also swings hard in the screen plane will drift"). Batch 6
 * ran it at 7–10° of lean, which the record now calls weak evidence; this clip holds it at carve
 * amplitude for the whole loop, and `tests/descent.test.ts` MEASURES the drift against matrix
 * ground truth instead of merely surviving it.
 *
 * ## The back view, in a projection with no divide
 *
 * This engine's 2.5D has no perspective: z is occlusion, never foreshortening. So the back view
 * is the classic pixel-idiom compromise his reference's own genre uses — the body in elevation,
 * the board drawn as the low wide base under the boots, the world receding by rows. The goggle
 * STRAP is what says "goggles" from behind: a marking, silhouette untouched.
 *
 * The palette is the run-19 boarder's own — one rider, two cameras.
 */
import type { Grammar } from '../../core/types.ts'
import { BOARDER_PALETTE } from './boarder.ts'

/**
 * **The bank lives on the ROOT as animated angle, not as rest pose** — the glide must be the
 * null case (upright, no roll anywhere), so the composition is entirely the carve clip's.
 */
const SKELETON = {
  bones: [
    { name: 'core', parent: null, x: 0, y: 0, z: 0, angle: 0 },
    { name: 'board', parent: 'core', x: 0, y: 12.4, z: 0, angle: 0 },
    { name: 'chest', parent: 'core', x: 0, y: -4.2, z: 0, angle: 0 },
    { name: 'head', parent: 'chest', x: 0, y: -5, z: 0, angle: 0 },
    // Arms on the CAMERA side (negative z): a back view shows the arms over the torso,
    // and the first authoring at +0.8 buried the carving mitt behind the hip — the channel
    // reported 0 px in all eight frames.
    { name: 'armL', parent: 'chest', x: -4.4, y: -1.2, z: -1.4, angle: 0 },
    { name: 'armR', parent: 'chest', x: 4.4, y: -1.2, z: -1.4, angle: 0 },
    { name: 'legL', parent: 'core', x: -3, y: 1.4, z: 0, angle: 0 },
    { name: 'legR', parent: 'core', x: 3, y: 1.4, z: 0, angle: 0 },
  ],
} as const

/**
 * Welds as run 19: one garment, welded; board against boots, mitts against sleeves, the strap
 * against the beanie keep their seams. Both arms and both legs are on-screen from behind, so
 * there is no far side and no shift.
 */
const PARTS = [
  /**
   * **The board: a low wide base under the boots — the RPG-perspective compromise, declared.**
   * Its long axis truly points down-slope (screen z), which a divide-less projection cannot
   * foreshorten; drawing the cross-section alone would put the rider on a 2 px sliver. The
   * cream edge below the slate top keeps the trick's value pair alive in this view: banked,
   * the uphill edge lifts and the pale base shows.
   */
  { weld: true, name: 'deck', bone: 'board', material: 'slate', shape: { kind: 'rect', x: -8.2, y: -1.2, w: 16.4, h: 1.6, d: 5 } },
  { weld: true, name: 'edge', bone: 'board', material: 'cream', shape: { kind: 'rect', x: -8.2, y: 0.4, w: 16.4, h: 1, d: 4.6 } },

  { name: 'bootL', bone: 'legL', material: 'teal', shape: { kind: 'ellipse', cx: 0, cy: 9.6, rx: 2.3, ry: 1.9, rz: 2 }, shift: -1 },
  { name: 'bootR', bone: 'legR', material: 'teal', shape: { kind: 'ellipse', cx: 0, cy: 9.6, rx: 2.3, ry: 1.9, rz: 2 }, shift: -1 },
  { weld: true, name: 'legL', bone: 'legL', material: 'teal', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7.6, r: 2.2, r1: 1.9 } },
  { weld: true, name: 'legR', bone: 'legR', material: 'teal', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7.6, r: 2.2, r1: 1.9 } },
  { weld: true, name: 'hips', bone: 'core', material: 'teal', shape: { kind: 'ellipse', cx: 0, cy: 0.6, rx: 4, ry: 2.6, rz: 3.2 } },
  { weld: true, name: 'jacket', bone: 'chest', material: 'jacket', shape: { kind: 'ellipse', cx: 0, cy: -0.2, rx: 4.9, ry: 4.5, rz: 4 } },
  { weld: true, name: 'armL', bone: 'armL', material: 'jacket', shape: { kind: 'capsule', x0: 0, y0: 0, x1: -2.4, y1: 5, r: 1.9, r1: 1.5 } },
  { weld: true, name: 'armR', bone: 'armR', material: 'jacket', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 2.4, y1: 5, r: 1.9, r1: 1.5 } },
  { name: 'mittL', bone: 'armL', material: 'cream', shape: { kind: 'ellipse', cx: -2.8, cy: 5.6, rx: 1.7, ry: 1.6, rz: 1.5 } },
  { name: 'mittR', bone: 'armR', material: 'cream', shape: { kind: 'ellipse', cx: 2.8, cy: 5.6, rx: 1.7, ry: 1.6, rz: 1.5 } },
  { weld: true, name: 'skull', bone: 'head', material: 'skin', shape: { kind: 'ellipse', cx: 0, cy: -1.6, rx: 4.2, ry: 3.9, rz: 3.9 } },
  // From behind the beanie owns most of the skull; the pom sits off-centre as run 19's does.
  { weld: true, name: 'beanie', bone: 'head', material: 'teal', shape: { kind: 'lobed', cx: 0, cy: -2.6, rx: 4.5, ry: 3.4, rz: 4, lobes: 3, depth: 0.1, phase: 1.4 } },
  { name: 'pom', bone: 'head', material: 'cream', shape: { kind: 'ellipse', cx: 0.6, cy: -6.2, rx: 1.7, ry: 1.7, rz: 1.7 } },
  // The goggle strap: what says "goggles" from behind. Paint, not silhouette.
  { name: 'strap', bone: 'head', material: 'slate', z: -3.2, shape: { kind: 'capsule', x0: -3.8, y0: -1.2, x1: 3.8, y1: -1.2, r: 0.9 }, marking: true },
] as const

/**
 * **The glide: the null case, and it is deliberately boring.** Upright, no roll channel
 * anywhere, keys a tenth of the carve's. If the composition drifts, THIS clip is the zero the
 * drift is measured from.
 */
export const descentGlide: Grammar = {
  name: 'descent-glide',
  palette: BOARDER_PALETTE,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'glide',
    phases: [
      { name: 'settle', at: 0 },
      { name: 'rise', at: 0.25 },
      { name: 'settle2', at: 0.5 },
      { name: 'rise2', at: 0.75 },
    ],
    tracks: [
      // Asymmetric on purpose: the first authoring zero-crossed everything at the halves and
      // two frames came out byte-identical.
      { bone: 'core', channel: 'y', keys: [0.45, 0.1, -0.4, -0.12] },
      { bone: 'armL', channel: 'angle', keys: [-0.34, -0.1, -0.28, -0.06] },
      { bone: 'armR', channel: 'angle', keys: [0.08, 0.3, 0.05, 0.26] },
      { bone: 'board', channel: 'angle', keys: [0.08, -0.05, 0.06, -0.07] },
    ],
  },
}

/**
 * **The carve: the experiment, sustained.** The root swings between 30° and 36° of bank and
 * STAYS there — no rest, no return through zero — while the chest folds toward the slope on
 * `roll` and the board pitches on `roll` under the same swinging root. Every frame of the loop
 * is the non-commuting pair at carve amplitude. Mirrored by the clip-pair mechanism for the
 * other edge, so one authored composition serves both directions.
 */
export const descentCarve: Grammar = {
  name: 'descent-carve',
  palette: BOARDER_PALETTE,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'carve',
    phases: [
      { name: 'set', at: 0 },
      { name: 'bite', at: 0.25 },
      { name: 'hold', at: 0.5 },
      { name: 'load', at: 0.75 },
    ],
    tracks: [
      /** The bank: 0.60–0.72 of a 0.14-turn swing — 30° to 36°, never releasing. */
      { bone: 'core', channel: 'angle', keys: [0.62, 0.72, 0.66, 0.7] },
      /** The fold: the chest rolls toward the slope UNDER the banked root — the pair. */
      { bone: 'chest', channel: 'roll', keys: [0.3, 0.42, 0.36, 0.4] },
      /** And the board pitches on its own roll under the same root. */
      { bone: 'board', channel: 'roll', keys: [0.16, 0.24, 0.2, 0.22] },
      { bone: 'chest', channel: 'angle', keys: [-0.12, -0.18, -0.14, -0.16] },
      // The inside hand reaches for the snow, OUTSIDE the silhouette. Sign checked by probe:
      // negative keys swing this arm's tip INWARD (the channel reported the mitt buried in the
      // hip at both -0.5 and -1.0); positive at ~1.0 under the bank puts the hand at the snow.
      { bone: 'armL', channel: 'angle', keys: [0.85, 1.05, 0.9, 1.0] },
      { bone: 'armR', channel: 'angle', keys: [0.28, 0.4, 0.32, 0.36] },
      { bone: 'legL', channel: 'angle', keys: [0.1, 0.16, 0.12, 0.14] },
      { bone: 'legR', channel: 'angle', keys: [-0.06, -0.12, -0.08, -0.1] },
      { bone: 'core', channel: 'y', keys: [0.3, 0.6, 0.4, 0.55] },
    ],
  },
}

/**
 * **The launch: the screen-plane control.** A straight pop and tuck, `Bone.angle` only. If the
 * launch reads worse than the shelf's other airs, the composition work damaged the old path.
 */
export const descentLaunch: Grammar = {
  name: 'descent-launch',
  palette: BOARDER_PALETTE,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'launch',
    wrap: false,
    phases: [
      { name: 'crouch', at: 0 },
      { name: 'pop', at: 0.25 },
      { name: 'tuck', at: 0.5 },
      { name: 'level', at: 0.75 },
      { name: 'land', at: 1 },
    ],
    tracks: [
      { bone: 'core', channel: 'y', keys: [1, -0.5, -1, -0.7, 0.5] },
      { bone: 'legL', channel: 'angle', keys: [0.1, 0.04, 0.3, 0.18, 0.08] },
      { bone: 'legR', channel: 'angle', keys: [-0.08, -0.02, -0.26, -0.16, -0.06] },
      { bone: 'armL', channel: 'angle', keys: [-0.3, -0.75, -0.6, -0.45, -0.2] },
      { bone: 'armR', channel: 'angle', keys: [0.26, 0.7, 0.55, 0.4, 0.18] },
      { bone: 'chest', channel: 'angle', keys: [0.06, -0.05, 0.05, 0.02, 0.05] },
    ],
  },
}
