/**
 * Run 16 — **the skull, running from Death.** His commission, 16/08:
 *
 * > *"Nesse microjogo controlamos uma caveira fugindo da morte. Será um jogo estilo a página de
 * > offline do google... a caveira pula das lápides e o diferencial aqui é que a caveira tem um
 * > pulo duplo em que ela projeta um salto mortal para frente. Quero um acabamento e
 * > familiaridade com o SOTN."*
 *
 * ## The somersault did not need 3D, and finding that out is the round's first result
 *
 * He asked for this expecting it to demand pitch and roll. It does not. **A forward somersault
 * seen from the side is a rotation in the screen plane**, and that is exactly what `Bone.angle`
 * has always been. A body tumbling toward the camera would need 3D; a body tumbling across the
 * picture does not.
 *
 * **What it did demand was something nobody had noticed was missing.** Every gait in this
 * project was periodic by construction — a walk, a sway, a tail — so the curve is a *cyclic*
 * Hermite. A full turn is not a cycle: it starts at zero and ends a whole revolution later, and
 * those are different values. Authored as a normal track it climbed to 270 degrees and then
 * **unwound**, measured at 193 then 77. The skull flipped three quarters of the way round and
 * rolled backwards out of it.
 *
 * `Gait.wrap: false` is the foundation this commission actually asked for. It cost eleven lines
 * and it unlocks every action that does not return to where it started.
 *
 * ## SOTN, and what the reference is actually asking for
 *
 * Symphony of the Night is not a palette, it is a **value structure**: near-black cool grounds,
 * a narrow band of very bright accent, and almost nothing in the middle. Its sprites read
 * because the bright end is *rationed* — a bone highlight and an eye flame, and everything else
 * falls away into indigo.
 *
 * That agrees with the 15/08 verdict rather than fighting it. The ink round selected **a wide
 * value range**; SOTN spends that range with the mass at the dark end instead of the middle.
 * So this palette runs 18 to 244 — the widest in the project — and puts four of the bone's five
 * tones below the midpoint.
 *
 * **The eye flame is the one saturated thing on the body**, and it is two pixels. That is the
 * same rule the kitten's nose obeyed, applied to a subject where the accent has to carry the
 * whole read: a skull is white shapes, and without the flame it is a white shape.
 *
 * portable — the observation that a style reference usually names a *value distribution* rather
 * than a set of colours, and that a wide range can be spent asymmetrically.
 * stack — every number.
 */
import type { Grammar, Palette } from '../../core/types.ts'

/**
 * **Bone against a crypt: cool in shadow, warm at the highlight, and the range is enormous.**
 *
 * Real bone in low light is not white. It is grey-violet in shadow and a warm ivory where the
 * light lands, and the difference between those two is what makes it read as material rather
 * than as paper. 18 to 244 in luminance.
 */
const CRYPT: Palette = {
  name: 'bones',
  colors: [
    [0, 0, 0],
    // bone — the shadow is violet, the highlight is ivory. Four of five tones sit below mid.
    [40, 36, 54],
    [72, 68, 92],
    [116, 112, 134],
    [176, 172, 182],
    [240, 238, 228],
    // shroud — the rag it runs in. Deep crimson, and it never reaches a bright tone: cloth in
    // this light is a silhouette with a rim, which is how SOTN draws every cape it has.
    [30, 14, 24],
    [56, 22, 36],
    [88, 32, 48],
    [126, 48, 62],
    [168, 74, 78],
    // ember — the eye flame, and it is the only saturated thing on the body. Two pixels.
    [96, 40, 18],
    [168, 74, 22],
    [232, 132, 34],
    [252, 196, 88],
    [255, 244, 196],
    // ink — near black with a blue cast, because the ground it sits on is indigo and a warm
    // line would separate from the scene instead of from the body.
    [10, 8, 18],
    [18, 15, 30],
    [28, 24, 44],
    [40, 35, 60],
    [54, 48, 76],
  ],
  ramps: [
    { material: 'bone', indices: [1, 2, 3, 4, 5] },
    { material: 'shroud', indices: [6, 7, 8, 9, 10] },
    { material: 'ember', indices: [11, 12, 13, 14, 15] },
    { material: 'ink', indices: [16, 17, 18, 19, 20] },
  ],
}

/**
 * **One body, three clips**, and the third one turns a full circle.
 *
 * The skeleton is deliberately short and wide in the shoulders: at 34 px a realistic human
 * proportion gives a head of four pixels, and a skull that small is a dot. This one is a
 * running *skull* with a body under it, which is what he asked for and also what reads.
 */
const SKELETON = {
  bones: [
    { name: 'hips', parent: null, x: 0, y: 0, z: 0, angle: 0 },
    { name: 'spine', parent: 'hips', x: 0, y: -5, z: 0, angle: 0 },
    { name: 'chest', parent: 'spine', x: 0.4, y: -4.5, z: 0, angle: 0 },
    { name: 'neck', parent: 'chest', x: 0.6, y: -4.2, z: 0, angle: 0 },
    // The skull is the subject, so it is a third of the standing height.
    { name: 'skull', parent: 'neck', x: 0.4, y: -5, z: 0, angle: 0 },
    // A hinge at the back of the jaw. It opens, and an open jaw is most of what says "running
    // for its life" on a face with no other muscle in it.
    { name: 'jaw', parent: 'skull', x: -1.2, y: 1.8, z: -0.6, angle: 0 },
    // Limb rows in depth. The chest's own depth radius is 4.2 and an upper arm's is 1.5, so at
    // 4.4 the near arm stands 1.7 px proud of the ribs and cannot sink inside them.
    { name: 'armFU', parent: 'chest', x: 0.6, y: 0.4, z: 4.4, angle: 0 },
    { name: 'armFL', parent: 'armFU', x: 0, y: 6.4, z: 0, angle: 0 },
    { name: 'armNU', parent: 'chest', x: 1, y: 0.4, z: -4.4, angle: 0 },
    { name: 'armNL', parent: 'armNU', x: 0, y: 6.4, z: 0, angle: 0 },
    { name: 'legFU', parent: 'hips', x: -0.4, y: 2, z: 3.8, angle: 0 },
    { name: 'legFL', parent: 'legFU', x: 0, y: 7, z: 0, angle: 0 },
    { name: 'legNU', parent: 'hips', x: 0.4, y: 2, z: -3.8, angle: 0 },
    { name: 'legNL', parent: 'legNU', x: 0, y: 7, z: 0, angle: 0 },
  ],
} as const

/**
 * **Every solid is welded**, which is the rule his kitten note produced: an inner line means two
 * objects, and the test is whether the real thing would have a seam.
 *
 * **A skeleton is the one subject in this project where that answer is not obvious**, and it is
 * worth writing down. A skull and a jaw genuinely are two bones with a joint between them, and
 * ribs genuinely are separate from a spine — so a seam there is *true*. But a limb built from
 * two capsules and a hand is still one arm made of three primitives, and ringing those is
 * drawing the scaffolding.
 *
 * So the weld is applied per pair rather than per body: **the jaw and the skull are NOT welded
 * to each other**, because that seam is a real jaw line and it is the most important edge on the
 * subject. Everything else is.
 */
const PARTS = [
  // The far side.
  { weld: true, name: 'armFU', bone: 'armFU', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.4, r: 1.5, r1: 1.2 }, shift: -1 },
  { weld: true, name: 'armFL', bone: 'armFL', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 5.6, r: 1.2, r1: 1 }, shift: -1 },
  { weld: true, name: 'handF', bone: 'armFL', material: 'bone', shape: { kind: 'ellipse', cx: 0.3, cy: 6.4, rx: 1.5, ry: 1.7, rz: 1.4 }, shift: -1 },
  { weld: true, name: 'legFU', bone: 'legFU', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 1.8, r1: 1.4 }, shift: -1 },
  { weld: true, name: 'legFL', bone: 'legFL', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.4, r: 1.4, r1: 1.1 }, shift: -1 },
  { weld: true, name: 'footF', bone: 'legFL', material: 'bone', shape: { kind: 'capsule', x0: -0.4, y0: 6.6, x1: 2.4, y1: 6.8, r: 1.2, r1: 1 }, shift: -1 },

  /**
   * **The shroud, and it is drawn before the body so the body wins where they overlap.**
   *
   * A lobed cape rather than an ellipse: cloth has a torn boundary, and every convex primitive
   * in this vocabulary produces a smooth one. It hangs off the chest and trails behind, which
   * in a runner means it is the only thing on screen reporting how fast he is going.
   */
  { weld: true, name: 'shroud', bone: 'chest', material: 'shroud', z: 3.6, shape: { kind: 'lobed', cx: -3.4, cy: 3, rx: 6.4, ry: 7.6, rz: 3, lobes: 5, depth: 0.3, phase: 1.2, octaves: 2 }, shift: -1 },
  { weld: true, name: 'hood', bone: 'neck', material: 'shroud', z: 2.6, shape: { kind: 'lobed', cx: -1.8, cy: -0.4, rx: 4.2, ry: 3.4, rz: 2.6, lobes: 4, depth: 0.26, phase: 3.4 } },

  // The frame.
  { weld: true, name: 'pelvis', bone: 'hips', material: 'bone', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 3.6, ry: 2.8, rz: 3.4 } },
  /**
   * **One column instead of a spine and a neck, and the count is what decided it.**
   *
   * The first pass had both. The neck part painted **0 px in all eight frames** — buried inside
   * the skull above it, the ribs below it and the hood over it — and the spine ran at one to
   * five, which is a sliver rather than a bone. Neither was visible and together they were two
   * parts spent against the density ceiling `TASTE.md` §2b records.
   *
   * A skeleton's vertebrae are not readable at 34 px. What IS readable is a single column
   * carrying the skull clear of the ribs, so that is what this is: one capsule from inside the
   * ribcage to under the jaw.
   */
  { weld: true, name: 'column', bone: 'neck', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 3.4, x1: 0.4, y1: -3, r: 1.5, r1: 1.7 } },
  /**
   * **The ribcage is one lobed mass rather than five capsules**, and that is a part-count
   * decision taken against the recorded ceiling. `TASTE.md` §2b: articulation density is where
   * this model fails, and the beetle read because one heavy mass carried it. Five ribs would be
   * five parts and four seams inside 9 px.
   */
  { weld: true, name: 'ribs', bone: 'chest', material: 'bone', shape: { kind: 'lobed', cx: -0.2, cy: 0.6, rx: 4.4, ry: 5, rz: 4.2, lobes: 4, depth: 0.16, phase: 0.4 } },

  /**
   * **The skull, and it is the commission.** Wide at the cranium, narrow at the muzzle, with a
   * brow that stands proud so the sockets sit under an overhang instead of on a smooth ball.
   */
  { weld: true, name: 'skull', bone: 'skull', material: 'bone', shape: { kind: 'ellipse', cx: 0, cy: -0.6, rx: 5, ry: 4.6, rz: 4.6 } },
  { weld: true, name: 'muzzle', bone: 'skull', material: 'bone', shape: { kind: 'ellipse', cx: 3, cy: 1.4, rx: 2.6, ry: 2.2, rz: 2.6 }, z: -0.8 },
  { weld: true, name: 'brow', bone: 'skull', material: 'bone', shape: { kind: 'capsule', x0: 0.6, y0: -1.6, x1: 4, y1: -0.8, r: 1.3 }, z: -2.6 },
  /**
   * **The jaw is NOT welded, and it is the only unwelded solid on the body.** A jaw line is a
   * real seam — it is the one place a skeleton actually comes apart — and it is also the edge
   * that makes a skull read as a skull rather than as an egg.
   */
  { name: 'jaw', bone: 'jaw', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 4.6, y1: 0.6, r: 1.5, r1: 1.2 }, z: -1 },

  /**
   * **The eye flame: a marking, and the only saturated thing on the subject.**
   *
   * A solid would stand proud of the skull and add to the silhouette — a bead stuck on the
   * outside of a head. A marking recolours the surface it lies on, takes no ink ring, and
   * disappears round the back on its own if the body ever turns.
   */
  { name: 'socketN', bone: 'skull', marking: true, material: 'ember', z: -1, shape: { kind: 'ellipse', cx: 1.6, cy: 0.2, rx: 1.5, ry: 1.5, rz: 1.4 } },
  { name: 'socketF', bone: 'skull', marking: true, material: 'ember', z: -0.6, shape: { kind: 'ellipse', cx: -1.6, cy: 0.1, rx: 1.1, ry: 1.2, rz: 1.1 } },

  // The near side, last.
  { weld: true, name: 'legNU', bone: 'legNU', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 2, r1: 1.5 } },
  { weld: true, name: 'legNL', bone: 'legNL', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.4, r: 1.5, r1: 1.2 } },
  { weld: true, name: 'footN', bone: 'legNL', material: 'bone', shape: { kind: 'capsule', x0: -0.4, y0: 6.6, x1: 2.6, y1: 6.8, r: 1.3, r1: 1.1 } },
  { weld: true, name: 'armNU', bone: 'armNU', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.4, r: 1.7, r1: 1.3 } },
  { weld: true, name: 'armNL', bone: 'armNL', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 5.6, r: 1.3, r1: 1.1 } },
  { weld: true, name: 'handN', bone: 'armNL', material: 'bone', shape: { kind: 'ellipse', cx: 0.3, cy: 6.4, rx: 1.7, ry: 1.9, rz: 1.6 } },
] as const

/**
 * **The sprint.** Eight frames, cyclic, and it is the only clip here that wraps.
 *
 * A skeleton has no muscle to absorb anything, so it runs *high and rigid* — the hips barely
 * drop and the whole read is in the limbs. That is the opposite of the gorilla, whose entire
 * animation was weight dropping onto a landing limb, and it is deliberate: a thing with no flesh
 * should not move like a thing with flesh.
 */
export const bonesRun: Grammar = {
  name: 'bones-run',
  palette: CRYPT,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'sprint',
    phases: [
      { name: 'contact', at: 0 },
      { name: 'drive', at: 0.25 },
      { name: 'pass', at: 0.5 },
      { name: 'reach', at: 0.75 },
    ],
    tracks: [
      // A short, hard bounce rather than a drop. Two per stride, and the amplitude is a third
      // of the gorilla's for the same body height.
      { bone: 'hips', channel: 'y', keys: [0.4, -0.5, 0.4, -0.5] },
      { bone: 'hips', channel: 'angle', keys: [-0.03, -0.05, -0.03, -0.05] },
      { bone: 'spine', channel: 'angle', keys: [-0.04, -0.02, -0.04, -0.02] },
      { bone: 'chest', channel: 'angle', keys: [-0.05, -0.03, -0.05, -0.03] },
      // The skull counter-rotates against the chest, so the head stays level while the body
      // pumps. A runner's head is the steadiest thing on them.
      { bone: 'skull', channel: 'angle', keys: [0.06, 0.03, 0.06, 0.03] },
      // The jaw hangs open and rattles. It is two pixels of travel and it is most of the
      // character on a face that cannot make an expression.
      { bone: 'jaw', channel: 'angle', keys: [0.1, 0.16, 0.1, 0.16] },
      // Diagonal: near arm with far leg. The pairs are separated by angle and not merely by
      // phase, which is the rule the kitten's far legs produced.
      { bone: 'armNU', channel: 'angle', keys: [-0.62, -0.1, 0.55, 0.1] },
      { bone: 'armNL', channel: 'angle', keys: [-0.5, -0.62, -0.28, -0.4] },
      { bone: 'armFU', channel: 'angle', keys: [0.5, 0.06, -0.58, -0.14] },
      { bone: 'armFL', channel: 'angle', keys: [-0.3, -0.42, -0.52, -0.64] },
      { bone: 'legNU', channel: 'angle', keys: [-0.52, 0.1, 0.6, 0.02] },
      // A knee bends to one side of straight and never through it: every key is positive.
      { bone: 'legNL', channel: 'angle', keys: [0.12, 0.5, 0.16, 0.72] },
      { bone: 'legFU', channel: 'angle', keys: [0.58, 0.04, -0.5, 0.08] },
      { bone: 'legFL', channel: 'angle', keys: [0.18, 0.7, 0.14, 0.48] },
    ],
  },
}

/**
 * **The first jump, and it plays once.** `wrap: false`, so the phases span [0, 1] inclusive and
 * the last one is where the pose arrives rather than the step before it starts.
 *
 * A skeleton launching pulls its knees up and throws its arms back — there is no crouch, because
 * a crouch is muscle loading and this thing has none.
 */
export const bonesLeap: Grammar = {
  name: 'bones-leap',
  palette: CRYPT,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'leap',
    wrap: false,
    phases: [
      { name: 'launch', at: 0 },
      { name: 'rise', at: 0.4 },
      { name: 'apex', at: 1 },
    ],
    tracks: [
      { bone: 'hips', channel: 'angle', keys: [-0.1, -0.06, -0.02] },
      { bone: 'spine', channel: 'angle', keys: [-0.06, -0.04, 0] },
      { bone: 'chest', channel: 'angle', keys: [-0.08, -0.05, -0.02] },
      { bone: 'skull', channel: 'angle', keys: [0.1, 0.06, 0.02] },
      { bone: 'jaw', channel: 'angle', keys: [0.22, 0.3, 0.24] },
      // Arms thrown back and up on the launch, settling forward at the apex.
      { bone: 'armNU', channel: 'angle', keys: [0.62, 0.3, -0.2] },
      { bone: 'armNL', channel: 'angle', keys: [-0.2, -0.44, -0.6] },
      { bone: 'armFU', channel: 'angle', keys: [0.4, 0.12, -0.42] },
      { bone: 'armFL', channel: 'angle', keys: [-0.34, -0.56, -0.7] },
      // Knees up, and the far leg trails a quarter behind the near one.
      { bone: 'legNU', channel: 'angle', keys: [-0.5, -0.66, -0.5] },
      { bone: 'legNL', channel: 'angle', keys: [0.5, 0.8, 0.62] },
      { bone: 'legFU', channel: 'angle', keys: [0.2, -0.24, -0.14] },
      { bone: 'legFL', channel: 'angle', keys: [0.34, 0.62, 0.86] },
    ],
  },
}

/**
 * **The somersault, and it is the commission's differentiator.**
 *
 * `wrap: false` and the root's angle track runs **0 → 1 at a swing of 1**: one whole turn, in
 * `tunables/bones-flip.json`, which exists only so this clip can spend an amplitude no cycle
 * would ever want.
 *
 * **Authored as a cyclic gait it did not work and the failure was invisible in a still.** It
 * climbed to 270 degrees and unwound to 77 — the body flips three quarters round and rolls
 * backwards out of it. Measured before a pixel was drawn, which is the only reason it was fixed
 * in the grammar rather than patched in the runtime.
 *
 * The limbs tuck as the turn starts and open on the way out, so the spin reads as *driven* and
 * not as a sprite being spun. A tuck accelerates a real somersault; the pose is the physics.
 */
export const bonesFlip: Grammar = {
  name: 'bones-flip',
  palette: CRYPT,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'somersault',
    wrap: false,
    phases: [
      // **On frame boundaries, and the span is 11 rather than 12.** A once-played clip's n
      // frames are n-1 steps from start to end, so a named phase lands on a real frame only at
      // a multiple of 1/11. The sprite contract caught 0.3 and 0.62 sitting between two poses,
      // which is a phase nobody can sync a sound to.
      { name: 'kick', at: 0 },
      { name: 'tuck', at: 3 / 11 },
      { name: 'over', at: 7 / 11 },
      { name: 'open', at: 1 },
    ],
    tracks: [
      /**
       * **One full turn, forward.** Positive is clockwise on screen and the body runs to the
       * right, so this is a front somersault. At `gait.swing` 1 the key IS the fraction of a
       * revolution, which is the only place in this project where a track key is a turn rather
       * than a fraction of one.
       */
      { bone: 'hips', channel: 'angle', keys: [0, 0.34, 0.68, 1] },
      // Everything else is authored small, because it is multiplied by the same swing of 1.
      { bone: 'spine', channel: 'angle', keys: [-0.02, -0.05, -0.05, -0.01] },
      { bone: 'chest', channel: 'angle', keys: [-0.03, -0.07, -0.07, -0.01] },
      { bone: 'skull', channel: 'angle', keys: [0.03, 0.08, 0.08, 0.02] },
      { bone: 'jaw', channel: 'angle', keys: [0.06, 0.03, 0.03, 0.07] },
      // The tuck: arms in tight through the middle of the turn, thrown open on the exit.
      { bone: 'armNU', channel: 'angle', keys: [-0.12, -0.2, -0.2, 0.06] },
      { bone: 'armNL', channel: 'angle', keys: [-0.14, -0.24, -0.24, -0.06] },
      { bone: 'armFU', channel: 'angle', keys: [-0.06, -0.17, -0.17, 0.12] },
      { bone: 'armFL', channel: 'angle', keys: [-0.18, -0.26, -0.26, -0.04] },
      { bone: 'legNU', channel: 'angle', keys: [-0.1, -0.2, -0.2, 0.04] },
      { bone: 'legNL', channel: 'angle', keys: [0.1, 0.24, 0.24, 0.04] },
      { bone: 'legFU', channel: 'angle', keys: [-0.05, -0.17, -0.17, 0.1] },
      { bone: 'legFL', channel: 'angle', keys: [0.14, 0.26, 0.26, 0.06] },
    ],
  },
}

export const BONES: readonly Grammar[] = [bonesRun, bonesLeap, bonesFlip]
