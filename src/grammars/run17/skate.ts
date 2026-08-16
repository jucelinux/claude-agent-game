/**
 * **Micro game 5: the kickflip.** His commission, 16/08, and it is the first round that carries
 * **two** capabilities under test at once because he asked for an experimental one.
 *
 * > *"Vamos de skate (sua recomendação), e posteriormente os outros 2 para validar se
 * > consolidamos a técnica. Pixel Art: pode puxar para o extremo do desafio."*
 *
 * ## Why a kickflip, out of the three themes offered
 *
 * A kickflip is rotation about the axis the skater travels along. For a figure moving across the
 * picture that axis **is** screen x, so the board tilts toward and away from the camera — and that
 * is the one rotation this vocabulary could not express at all rather than express badly. Roll
 * was recorded as *inexpressible* on 16/08, next to a note that every earlier complaint on the
 * depth axis had traced to a bug of mine instead of to the model.
 *
 * **The board is the proof and the deck's two faces are how you read it.** Rolled a quarter turn
 * the underside faces you: 8 px of pale wood where a moment ago there were 2 px of edge. Rolled
 * three quarters it is the grip tape, which is the darkest material on the subject. So one flip
 * runs thin → bright → thin → dark → thin, and nothing about that sequence is available to a
 * paint order, a ramp shift or a depth offset.
 *
 * ## The control, and it costs nothing
 *
 * The ollie is authored on `Bone.angle` alone — the board pitches nose-up in the screen plane,
 * which is the rotation that has always worked. **If the ollie degrades, the roll broke the
 * screen-plane path**, and that is the same structure run 7 used when it re-rendered run 5's walk
 * through the new depth solver to see whether the solver had damaged it.
 *
 * ## Part count, against the recorded ceiling
 *
 * `TASTE.md` §2b says articulation density is where this model fails, and the tree crown died at
 * 28 parts in a 30×28 px space. This body is 27 parts in 64×64, and **ten of them are the
 * board** — a flat plank, two kicks, two trucks and four wheels, which is furniture rather than
 * articulation. The rider is 17, between the kitten's 22 and the skeleton's 24, both of which
 * read.
 *
 * The four wheels are the count worth watching: in a still side view the far pair hides exactly
 * behind the near pair, and a part that paints 0 px in every frame is one the record says to
 * delete. They are kept because **mid-flip they are the only parts on the near side of the
 * deck** — at three quarters of a turn the trucks swing toward the camera and the wheels are what
 * sell that the board has turned over rather than merely got thinner.
 */
import type { Grammar, Palette } from '../../core/types.ts'

/**
 * **Dusk on a street, and the palette is spent the way the 15/08 verdict asked for: a wide value
 * range cut into regions, never a gradient.**
 *
 * Every ramp is hue-shifted — the shadow end turns cool and the light end turns warm — which is
 * not new here (`run16/bones.ts` runs bone from violet to ivory) and is the reason this round's
 * pixel-art work went to the quantiser instead. Hue shifting was already practice; an ordered
 * weave was not.
 *
 * **The two faces of the deck are the widest-separated pair in the palette on purpose.** Wood
 * tops out at 238 and grip tape at 56, so the flip is legible as a change of *value* and does not
 * depend on anybody reading a shape at 8 px. A flip that could only be seen by its silhouette
 * would be a flip nobody sees.
 */
const STREET: Palette = {
  name: 'skate-dusk',
  colors: [
    [0, 0, 0],
    // skin — mauve in shadow, warm at the light. 5 tones, 48 to 222.
    [48, 36, 44], [86, 60, 58], [130, 92, 78], [178, 132, 106], [222, 180, 148],
    // shirt — teal, so the rider separates from both the road and the sky.
    [18, 34, 40], [30, 58, 64], [46, 90, 94], [72, 130, 128], [122, 180, 168],
    // jeans — indigo, and it never reaches bright: denim in this light is a mass.
    [20, 22, 44], [32, 38, 70], [48, 58, 100], [74, 90, 136], [116, 132, 174],
    // wood — the deck's underside, and the brightest material on the subject.
    [56, 40, 32], [96, 68, 46], [148, 108, 70], [196, 156, 106], [238, 212, 166],
    // grip — the deck's top, and the darkest. It has no highlight because grip tape has none.
    [10, 10, 14], [18, 18, 24], [28, 28, 36], [40, 40, 50], [56, 56, 68],
    // urethane — wheels. Cream, warmer than the road so they read against it.
    [58, 50, 40], [98, 86, 66], [146, 132, 100], [194, 180, 140], [236, 228, 196],
    // ink — the drawn line. Near black with a blue cast, because the road it sits on is cool.
    [10, 9, 16], [16, 14, 26], [24, 21, 38], [34, 30, 52], [46, 40, 66],
  ],
  ramps: [
    { material: 'skin', indices: [1, 2, 3, 4, 5] },
    { material: 'shirt', indices: [6, 7, 8, 9, 10] },
    { material: 'jeans', indices: [11, 12, 13, 14, 15] },
    { material: 'wood', indices: [16, 17, 18, 19, 20] },
    { material: 'grip', indices: [21, 22, 23, 24, 25] },
    { material: 'urethane', indices: [26, 27, 28, 29, 30] },
    { material: 'ink', indices: [31, 32, 33, 34, 35] },
  ],
}

/**
 * **The rider and the board are one skeleton, and the board hangs off the hips.**
 *
 * That is the arrangement a trick needs rather than the one a diagram would suggest. A board
 * parented to a foot would follow one leg; parented to the hips it follows the *body*, which is
 * what actually happens in an ollie — the board comes up because the rider does. The feet then
 * ride the deck by staying where they are, and the deck's own pitch and roll are two channels on
 * one bone.
 *
 * **The stance is what makes it read as skating rather than standing.** The near leg is forward
 * and the far leg is back, 3 px apart in x, so the side view shows two legs at different angles
 * instead of one leg twice.
 */
const SKELETON = {
  bones: [
    { name: 'hips', parent: null, x: 0, y: 0, z: 0, angle: 0 },
    { name: 'spine', parent: 'hips', x: 0, y: -4.6, z: 0, angle: 0 },
    { name: 'chest', parent: 'spine', x: 0.4, y: -4.4, z: 0, angle: 0 },
    { name: 'neck', parent: 'chest', x: 0.6, y: -3.8, z: 0, angle: 0 },
    { name: 'head', parent: 'neck', x: 0.4, y: -3.4, z: 0, angle: 0 },
    /**
     * Arms out for balance, and out is what a skater's arms are.
     *
     * **±5.6 in depth, and 4.2 was arithmetic I wrote down and got wrong in the same comment.** The
     * chest's depth radius is 3.8 and an upper arm's is 1.6, so an arm clears the ribs only past
     * 5.4 — at 4.2 its near surface sits at 2.6, which is *inside* the torso. The findings channel
     * reported the consequence exactly: `armFU` painted 0 px in 7 of 8 frames and 1×1 px at its
     * largest. The far arm was buried in the chest, and no amount of looking would have told me
     * which of the two numbers was wrong.
     */
    { name: 'armFU', parent: 'chest', x: -0.6, y: 0.2, z: 5.6, angle: 0.03 },
    { name: 'armFL', parent: 'armFU', x: 0, y: 5.8, z: 0, angle: 0 },
    { name: 'armNU', parent: 'chest', x: 0.8, y: 0.2, z: -5.6, angle: 0 },
    { name: 'armNL', parent: 'armNU', x: 0, y: 5.8, z: 0, angle: 0 },
    // The far leg is the BACK foot; the near leg is the front foot, 3 px ahead of it.
    { name: 'legFU', parent: 'hips', x: -1.6, y: 2, z: 3.6, angle: 0 },
    { name: 'legFL', parent: 'legFU', x: 0, y: 6.6, z: 0, angle: 0 },
    { name: 'legNU', parent: 'hips', x: 1.6, y: 2, z: -3.6, angle: 0 },
    { name: 'legNL', parent: 'legNU', x: 0, y: 6.6, z: 0, angle: 0 },
    /**
     * **The board, and `roll` is the whole commission.**
     *
     * 18 px below the hips puts the deck under the shoes with the legs at rest. It carries two
     * rotations and they are different kinds of thing: `angle` pitches the nose up in the screen
     * plane and has always worked, `roll` turns the deck over about its own length and could not
     * be expressed at all before this round.
     */
    { name: 'board', parent: 'hips', x: 0.6, y: 18, z: 0, angle: 0, roll: 0 },
    // The kicks. A plank is not a skateboard, and the two turned-up ends are the cheapest
    // possible way to say so: one bone each, angled in the screen plane.
    { name: 'nose', parent: 'board', x: 11, y: -0.4, z: 0, angle: -0.055 },
    { name: 'tail', parent: 'board', x: -11, y: -0.4, z: 0, angle: 0.055 },
  ],
} as const

/**
 * **Welded throughout except the board against the rider, and that is the seam test doing real
 * work** (his kitten note, 16/08: an inner line claims two things are two things).
 *
 * A shoe standing on a deck genuinely is two objects with a boundary between them, so that edge
 * stays. A thigh against a shin is one leg made of two primitives, so that edge goes. The deck
 * against its own kicks is one plank, welded; the deck against its trucks is bolted metal on
 * wood, and that seam is true.
 */
const PARTS = [
  // ---- The far side of the rider, first, so the near side wins every shared pixel.
  { weld: true, name: 'armFU', bone: 'armFU', material: 'skin', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 5.8, r: 1.6, r1: 1.3 }, shift: -1 },
  { weld: true, name: 'armFL', bone: 'armFL', material: 'skin', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 5.2, r: 1.3, r1: 1.1 }, shift: -1 },
  { weld: true, name: 'handF', bone: 'armFL', material: 'skin', shape: { kind: 'ellipse', cx: 0.2, cy: 5.9, rx: 1.5, ry: 1.6, rz: 1.4 }, shift: -1 },
  { weld: true, name: 'legFU', bone: 'legFU', material: 'jeans', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.6, r: 2, r1: 1.6 }, shift: -1 },
  { weld: true, name: 'legFL', bone: 'legFL', material: 'jeans', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 1.6, r1: 1.3 }, shift: -1 },
  { name: 'shoeF', bone: 'legFL', material: 'grip', shape: { kind: 'capsule', x0: -1, y0: 6.4, x1: 2.4, y1: 6.6, r: 1.4, r1: 1.2 }, shift: -1 },

  // ---- The rider's mass.
  { weld: true, name: 'pelvis', bone: 'hips', material: 'jeans', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 3.4, ry: 2.8, rz: 3.4 } },
  { weld: true, name: 'torso', bone: 'chest', material: 'shirt', shape: { kind: 'ellipse', cx: -0.2, cy: 0.4, rx: 3.8, ry: 4.6, rz: 3.8 } },
  { weld: true, name: 'waist', bone: 'spine', material: 'shirt', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0.2, y1: 4, r: 2.9, r1: 3.2 } },
  { weld: true, name: 'neck', bone: 'neck', material: 'skin', shape: { kind: 'capsule', x0: 0, y0: 1.6, x1: 0.3, y1: -1.4, r: 1.5 } },
  /**
   * **The head is a round skull with a cap on it, which is the one face shape the ledger has read
   * on.** `TASTE.md` §2b: "a face at small scale — proven by the kitten, one subject, one verdict;
   * does not transfer to any face that is not a round-skulled animal". A human head at 8 px is
   * outside that, so this one carries no features at all — a nose bump and a cap brim, and the
   * read is the silhouette. **Declared: this moves a mastered subject onto an axis it has not
   * been read on**, and that is the one line the ledger asks for at delivery.
   */
  { weld: true, name: 'skull', bone: 'head', material: 'skin', shape: { kind: 'ellipse', cx: 0, cy: -2.4, rx: 3.6, ry: 3.8, rz: 3.5 } },
  { weld: true, name: 'nose', bone: 'head', material: 'skin', shape: { kind: 'ellipse', cx: 3.2, cy: -1.8, rx: 1.2, ry: 1, rz: 1.1 }, z: -1.4 },
  // The cap: one lobed dome, because a cap has a soft crown and every convex primitive here has
  // a hard one. The brim is a separate capsule and it is what makes the head read as a head.
  { name: 'cap', bone: 'head', material: 'shirt', shape: { kind: 'lobed', cx: -0.2, cy: -4, rx: 3.9, ry: 3, rz: 3.7, lobes: 3, depth: 0.12, phase: 0.8 } },
  { weld: true, name: 'brim', bone: 'head', material: 'shirt', shape: { kind: 'capsule', x0: 2, y0: -4.4, x1: 5.4, y1: -4.6, r: 0.9, r1: 0.7 }, z: -2 },

  // ---- The board. Ten parts, and it is furniture rather than articulation.
  /**
   * **The deck is a `rect` with a depth of 8 and a height of 2.4, and those two numbers ARE the
   * flip.** Side on you see 2.4 px of edge. Rolled a quarter turn the 8 px of width becomes the
   * height, so the board grows to four times its thickness and shows a face that was never
   * visible. `tests/roll.test.ts` asserts exactly that swap, in both directions.
   */
  { weld: true, name: 'deck', bone: 'board', material: 'wood', shape: { kind: 'rect', x: -11.5, y: -1.2, w: 23, h: 2.4, d: 8 } },
  { weld: true, name: 'kickN', bone: 'nose', material: 'wood', shape: { kind: 'rect', x: -0.5, y: -1.1, w: 4.4, h: 2.2, d: 7.4 } },
  { weld: true, name: 'kickT', bone: 'tail', material: 'wood', shape: { kind: 'rect', x: -3.9, y: -1.1, w: 4.4, h: 2.2, d: 7.4 } },
  /**
   * **The grip tape is a solid on the deck's top face, not a marking on it.**
   *
   * A marking recolours the surface it lies on and is culled by the sign of its depth offset —
   * `part.z > 0` is dropped — so it can say "the far half" and cannot say "the top face". That is
   * the same limit that made the skull's eye sockets read as painted lights, and the answer here
   * is the same shape: if the thing is geometry, author it as geometry. 0.9 px of solid over the
   * deck costs one part and turns the flip's dark half from a shading accident into a surface.
   */
  { weld: true, name: 'grip', bone: 'board', material: 'grip', shape: { kind: 'rect', x: -11.5, y: -2, w: 23, h: 1, d: 8 } },
  { name: 'truckF', bone: 'board', material: 'grip', shape: { kind: 'rect', x: 4.6, y: 0.9, w: 3.2, h: 2.2, d: 6 } },
  { name: 'truckR', bone: 'board', material: 'grip', shape: { kind: 'rect', x: -7.8, y: 0.9, w: 3.2, h: 2.2, d: 6 } },
  // Four wheels. The far pair is invisible in a still side view and is the near side of the deck
  // at three quarters of a flip — see the header note on part count.
  { name: 'wheelFF', bone: 'board', material: 'urethane', z: 3, shape: { kind: 'ellipse', cx: 6.2, cy: 3.2, rx: 1.9, ry: 1.9, rz: 1.4 }, shift: -1 },
  { name: 'wheelFR', bone: 'board', material: 'urethane', z: 3, shape: { kind: 'ellipse', cx: -6.2, cy: 3.2, rx: 1.9, ry: 1.9, rz: 1.4 }, shift: -1 },
  { name: 'wheelNF', bone: 'board', material: 'urethane', z: -3, shape: { kind: 'ellipse', cx: 6.2, cy: 3.2, rx: 1.9, ry: 1.9, rz: 1.4 } },
  { name: 'wheelNR', bone: 'board', material: 'urethane', z: -3, shape: { kind: 'ellipse', cx: -6.2, cy: 3.2, rx: 1.9, ry: 1.9, rz: 1.4 } },

  // ---- The near side of the rider, last.
  { weld: true, name: 'legNU', bone: 'legNU', material: 'jeans', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.6, r: 2.2, r1: 1.7 } },
  { weld: true, name: 'legNL', bone: 'legNL', material: 'jeans', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 1.7, r1: 1.4 } },
  { name: 'shoeN', bone: 'legNL', material: 'grip', shape: { kind: 'capsule', x0: -1, y0: 6.4, x1: 2.6, y1: 6.6, r: 1.5, r1: 1.3 } },
  { weld: true, name: 'armNU', bone: 'armNU', material: 'skin', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 5.8, r: 1.8, r1: 1.4 } },
  { weld: true, name: 'armNL', bone: 'armNL', material: 'skin', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 5.2, r: 1.4, r1: 1.2 } },
  { weld: true, name: 'handN', bone: 'armNL', material: 'skin', shape: { kind: 'ellipse', cx: 0.2, cy: 5.9, rx: 1.7, ry: 1.8, rz: 1.6 } },
] as const

/**
 * **The roll: six frames, cyclic, and it is deliberately the quietest clip in this repo.**
 *
 * A rolling skater is not running. Both feet are planted and the only motion is a pump — the
 * knees flex, the hips drop and rise, the shoulders counter-sway. **The speed is reported by the
 * road, not by the body**, which is the opposite of the skeleton's sprint where the body was the
 * only thing on screen that could report it.
 *
 * It advances with distance over `strideLen`, like every other looping locomotion here, so the
 * pump and the ground can never disagree about how fast the world is moving. That rule exists
 * because a hand-picked divisor gave the skeleton **9.9 stride cycles a second** at the speed cap
 * — *"parece que ela está correndo em supervelocidade"*.
 */
export const skateRoll: Grammar = {
  name: 'skate-roll',
  palette: STREET,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'pump',
    phases: [
      // Four named phases, so the frame count has to be a multiple of four — at 6 frames the
      // quarter marks land between frames and the sprite contract refuses the manifest. That is
      // the same defect the ink probe hit on the walk, caught this time by a lock instead of by
      // looking, which is what the lock was written for.
      { name: 'compress', at: 0 },
      { name: 'rise', at: 0.25 },
      { name: 'extend', at: 0.5 },
      { name: 'settle', at: 0.75 },
    ],
    tracks: [
      // The hips carry the pump, and the board rides them: 2 px of travel, which at 36 px of body
      // is the amplitude a knee bend actually has when both feet are strapped to a plank.
      { bone: 'hips', channel: 'y', keys: [0.5, 0, -0.4, 0] },
      /**
       * Knees follow the hips a beat late, which is what makes a bob look like a bend rather than a
       * lift. The far leg is the back foot and it works slightly harder.
       *
       * **Every shin key is the same sign, and it was not until a lock said so.** I authored the
       * near leg as the mirror of the far one to give the two legs different phases, and a mirrored
       * knee is a knee bending backwards: `tests/actor.test.ts` reported *"legFL swings -7° to 32°
       * against legFU — it folds both ways"* on all three clips. Phase is an offset in TIME, not a
       * sign. A hinge has one direction and it is a fact about the body, not a knob.
       */
      { bone: 'legFU', channel: 'angle', keys: [-0.5, -0.2, 0.2, -0.1] },
      { bone: 'legFL', channel: 'angle', keys: [0.9, 0.5, 0.2, 0.4] },
      { bone: 'legNU', channel: 'angle', keys: [0.4, 0.1, -0.2, 0.1] },
      { bone: 'legNL', channel: 'angle', keys: [0.6, 0.3, 0.1, 0.35] },
      // The shoulders counter the hips. Without this the body reads as a lift on a spring.
      { bone: 'spine', channel: 'angle', keys: [0.25, 0.1, -0.15, 0.05] },
      { bone: 'armNU', channel: 'angle', keys: [-1, -0.6, -0.3, -0.7] },
      { bone: 'armFU', channel: 'angle', keys: [0.8, 0.5, 0.2, 0.6] },
      { bone: 'armNL', channel: 'angle', keys: [-0.4, -0.2, -0.1, -0.3] },
      { bone: 'armFL', channel: 'angle', keys: [0.3, 0.2, 0.1, 0.25] },
    ],
  },
}

/**
 * **The ollie, and it is this round's control.**
 *
 * Every rotation in it is `Bone.angle` — the board pitches nose-up in the screen plane, exactly
 * as the skeleton's somersault did and as run 5's walk did before that. **Nothing here uses
 * roll.** So if the ollie comes back worse than the clips that preceded it, the roll work damaged
 * the screen-plane path, and that is a rollback rather than a tuning problem.
 *
 * Plays once and holds, because a jump does not return to where it started inside its own cycle.
 */
export const skateOllie: Grammar = {
  name: 'skate-ollie',
  palette: STREET,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'ollie',
    wrap: false,
    phases: [
      // **Every phase lands on a real frame, and the contract lock is what enforces it.** With 8
      // frames the legal positions are eighths; 0.22 and 0.78 were the beats I wanted and they
      // fall between frames, which `src/core/contract.ts` refuses. Quarters are the nearest legal
      // pair and the beat is unchanged to within an eighth of the clip.
      { name: 'crouch', at: 0 },
      { name: 'pop', at: 0.25 },
      { name: 'tuck', at: 0.5 },
      { name: 'level', at: 0.75 },
      { name: 'land', at: 1 },
    ],
    tracks: [
      // Crouch, then the whole body extends. The board hangs off the hips, so it follows without
      // a track of its own — which is the reason it is parented there.
      { bone: 'hips', channel: 'y', keys: [1, -0.4, -1.2, -0.9, 0.6] },
      // The tail hits first, so the nose comes up and then levels out for the landing. This is
      // the pitch that has always worked, and it is what the roll is measured against.
      { bone: 'board', channel: 'angle', keys: [0, -1, -0.6, -0.1, 0.3] },
      // Knees fold up under the body at the tuck.
      { bone: 'legFU', channel: 'angle', keys: [-1, -0.3, -1.6, -1, -0.8] },
      { bone: 'legFL', channel: 'angle', keys: [1.7, 0.5, 2.6, 1.6, 1.3] },
      { bone: 'legNU', channel: 'angle', keys: [0.8, 0.2, -1.2, -0.6, 0.5] },
      { bone: 'legNL', channel: 'angle', keys: [1.2, 0.4, 2.2, 1.4, 0.9] },
      // Arms lift on the pop and come down on the landing: anticipation up, absorption down.
      { bone: 'armNU', channel: 'angle', keys: [-0.7, -2.2, -1.8, -1.4, -0.5] },
      { bone: 'armFU', channel: 'angle', keys: [0.6, 2, 1.6, 1.2, 0.4] },
      { bone: 'spine', channel: 'angle', keys: [0.5, -0.3, 0.4, 0.2, 0.6] },
    ],
  },
}

/**
 * **The kickflip. Twelve frames, played once, and one track in it is the commission.**
 *
 * `{ bone: 'board', channel: 'roll', keys: [0, -0.25, -0.5, -0.75, -1] }` at an amplitude of one
 * turn. That single line is the thing nine rounds of this project could not write.
 *
 * **The direction is chosen so the bright face comes first.** Positive roll carries local `+y`
 * away from the camera; the deck's underside is on `+y`, so a *negative* roll brings the wood
 * toward the viewer. A quarter of the way through the flip the board is 8 px of pale wood, half
 * way it is back to an edge, three quarters through it is grip tape at the dark end of the
 * palette. Thin, bright, thin, dark, thin — and the middle of that sequence is what a player
 * actually sees, so it had better be the flash rather than the void.
 *
 * **Twelve frames rather than eight, and the reason is measured rather than felt.** A full turn
 * across eight frames puts 45° between neighbours; the deck is 2.4 px thick, so between two
 * frames it goes from an edge to nearly a full face with nothing in between. Twelve gives 30°,
 * which is three readable widths inside each quarter turn.
 */
export const skateFlip: Grammar = {
  name: 'skate-flip',
  palette: STREET,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'kickflip',
    wrap: false,
    phases: [
      { name: 'pop', at: 0 },
      { name: 'flick', at: 0.25 },
      { name: 'belly', at: 0.5 },
      { name: 'catch', at: 0.75 },
      { name: 'ride', at: 1 },
    ],
    tracks: [
      /**
       * **The one line this whole round exists for.** A full turn about the board's own length,
       * and the keys are monotone rather than eased at the ends: a flip that slowed down at the
       * quarters would read as four separate poses instead of one rotation.
       */
      { bone: 'board', channel: 'roll', keys: [0, -0.25, -0.5, -0.75, -1] },
      // The deck stays level in the screen plane while it turns over. A kickflip is roll, and
      // pitching it as well would hide which of the two rotations is doing the work.
      { bone: 'board', channel: 'angle', keys: [-0.5, -0.1, 0, 0, 0.2] },
      { bone: 'hips', channel: 'y', keys: [-0.5, -1.4, -1.4, -1, 0.5] },
      /**
       * **The knees have to clear the board, and that is a real constraint rather than a pose.**
       *
       * The deck turns through 8 px of width where it was 2.4, so a leg left in the rolling stance
       * would be inside it for half the clip. The tuck is what makes room for the rotation — which
       * is also why a kickflip looks the way it does in life.
       */
      { bone: 'legFU', channel: 'angle', keys: [-0.6, -2, -2.2, -1.6, -0.9] },
      { bone: 'legFL', channel: 'angle', keys: [1.2, 3.2, 3.4, 2.4, 1.5] },
      { bone: 'legNU', channel: 'angle', keys: [0.4, -1.8, -2, -1.4, 0.6] },
      { bone: 'legNL', channel: 'angle', keys: [0.9, 2.8, 3, 2, 1] },
      { bone: 'armNU', channel: 'angle', keys: [-1.6, -2.4, -2.2, -1.6, -0.6] },
      { bone: 'armFU', channel: 'angle', keys: [1.4, 2.2, 2, 1.4, 0.5] },
      { bone: 'armNL', channel: 'angle', keys: [-0.6, -1.2, -1, -0.6, -0.3] },
      { bone: 'spine', channel: 'angle', keys: [-0.2, 0.5, 0.6, 0.3, 0.5] },
    ],
  },
}
