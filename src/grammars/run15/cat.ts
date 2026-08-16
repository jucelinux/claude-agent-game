/**
 * Run 15 — **the kitten**, and it is the first quadruped this project has drawn.
 *
 * His commission, 16/08: *"um jogo de plataforma em que um gatinho pula de plataforma em
 * plataforma. O mesmo conceito do doodle jump, só que com uma estética de Cozy Game."*
 *
 * **What makes a body read as a kitten rather than as a small cat is one ratio.** The head is
 * as wide as the chest and the legs are short. An adult cat's head is about a fifth of its
 * body length; a kitten's is nearer a third, and every animator who has drawn a young animal
 * has used the same trick. So the head here is `rx 6.0` against a chest of `rx 6.2` — they
 * are the same mass, and that single decision does more for the read than any amount of
 * detail on the face.
 *
 * **This lands on `TASTE.md` §2b in the good direction.** The recorded ceiling is articulation
 * density: the beetle read because *one heavy mass* carried it, and the mantis and the scorpion
 * failed because part count stood in for form. A kitten is **two round masses and a tail**.
 * The tail is the only thing here with a chain in it, and a tail is the cheapest possible
 * signal that a body is alive.
 *
 * **The declared risk, so it is not discovered later.** 22 parts in a body 34 px tall. The
 * recorded failure — the tree's crown — was 28 parts in a 30x28 px space. This is under that
 * ceiling and not far under it, and the parts here are large: the head alone is 12 px across.
 * If the face reads as a sponge, the part count is where to look first.
 *
 * ## Cozy, and what it is NOT allowed to mean
 *
 * The 15/08 ink verdict is binding and it is the exact trap this subject sets. What he ranked
 * first was **5 tones over a wide value range with a drawn line**. What tied for last was the
 * Stardew control: real regions inside a **narrow flat range**. "Cozy" pulls straight at that
 * loser — pastel, soft, low contrast — and taking the pull would spend the verdict that
 * selected the house style.
 *
 * **So cozy is carried by hue and by subject, never by value.** This coat runs from luminance
 * 36 to 205, which is wider than the gorilla's and about as wide as the run 8 winner. What
 * makes it cozy is that every ramp is **warm** — the ink is a dark brown rather than a black,
 * the shadows go toward red instead of toward blue, and there is not one cool colour on the
 * animal. Warmth is a hue decision. Softness would have been a value decision, and this file
 * does not make it.
 *
 * portable — the head-to-body ratio for young animals, and the observation that a style word
 * usually names a hue policy while the value range stays under the read's control.
 * stack — every number.
 */
import type { Grammar, Palette } from '../../core/types.ts'

/**
 * **A ginger tabby, five tones a material, and the range is deliberately wide.**
 *
 * The highlight is a cream at 244/196/132 and the core shadow is 58/32/22. A cat sitting in
 * evening light is the most-drawn cozy image there is, and the reason it works is that the
 * light is *warm and strong* — not that the picture is flat.
 *
 * The ink is `38,22,18`, a dark warm brown. The gorilla's file already recorded why a line is
 * never pure black: a black ring reads as a sticker cut out of the page. Here it does a second
 * job — a neutral black line against a warm coat is the one cool thing in the picture and it
 * would be the first thing the eye found.
 */
const GINGER: Palette = {
  name: 'cat',
  colors: [
    [0, 0, 0],
    // coat — ginger. Warm all the way down: the shadow goes red, never blue.
    [58, 32, 22],
    [104, 58, 34],
    [163, 95, 48],
    [212, 140, 74],
    [244, 196, 132],
    // cream — the belly, the muzzle, the four socks and the tail tip. A cat's underside is
    // paler than its back everywhere, which is countershading and is why it reads as an animal.
    [104, 80, 66],
    [150, 124, 104],
    [196, 174, 152],
    [230, 214, 196],
    [252, 246, 236],
    // pink — the nose and the inner ear, and it is the only saturated thing on the body.
    // Two pixels of it, and they are the two pixels a person looks at.
    [96, 52, 52],
    [140, 80, 80],
    [188, 116, 116],
    [222, 156, 154],
    [246, 200, 196],
    // ink — the drawn line, warm dark brown.
    [38, 22, 18],
    [52, 30, 24],
    [68, 40, 31],
    [86, 52, 40],
    [106, 66, 50],
  ],
  ramps: [
    { material: 'coat', indices: [1, 2, 3, 4, 5] },
    { material: 'cream', indices: [6, 7, 8, 9, 10] },
    { material: 'pink', indices: [11, 12, 13, 14, 15] },
    { material: 'ink', indices: [16, 17, 18, 19, 20] },
  ],
}

/**
 * **One body, three clips.** The shape run 7 established and the astronaut confirmed: an
 * action costs a gait, never a redrawing. Everything below this line is shared by `cat-rise`,
 * `cat-fall` and `cat-tuck`, and only the `gait` differs.
 *
 * **The limb rows are depth, and the clearance is derived rather than chosen.** The chest's
 * own depth radius is 5.4 and a front leg's is 2.0, so at a row of 5.6 the near leg's front
 * surface stands 2.2 px proud of the chest's. Below about 3.4 it would sink inside the mass
 * and stop existing — which is the number the depth solver enforces and the paint order it
 * replaced could not even express.
 */
const SKELETON = {
  bones: [
    { name: 'hips', parent: null, x: 0, y: 0, z: 0, angle: 0 },
    // The chest rides forward and a little high. A cat's back is level and its shoulder blades
    // stand above the spine; the slope this project drew on a gorilla would be wrong here.
    { name: 'chest', parent: 'hips', x: 9, y: -1.6, z: 0, angle: 0 },
    { name: 'neck', parent: 'chest', x: 5, y: -3.4, z: 0, angle: 0 },
    { name: 'head', parent: 'neck', x: 4.2, y: -1.4, z: 0, angle: 0 },
    // Ears sit on the near and far sides of the skull rather than on its midline, because a
    // cat seen from the side shows both of them and the far one is what says "there are two".
    // The far ear leans back further than the near one and sits further back on the skull. It
    // is not symmetry that makes both ears read, it is that the far one has to clear the head
    // it is behind: at the near ear's own angle it painted 0 px in one frame of eight.
    { name: 'earN', parent: 'head', x: -1.4, y: -4.2, z: -3, angle: -0.03 },
    { name: 'earF', parent: 'head', x: -3.4, y: -4.4, z: 3, angle: -0.11 },
    /**
     * **The tail, and it is the whole animation.**
     *
     * Three segments, each hanging off the last, with the wave arriving one phase later in
     * each. That lag is what makes a tail read as a rope with weight rather than as a stick
     * being waved: the tip is always doing what the base did a moment ago.
     *
     * The rest angle of 0.36 turns points it back and up. A bone's local `+y` runs down the
     * limb, so 0.36 of a turn puts the tip at about 130 degrees round from straight down —
     * back, and above the hips.
     */
    { name: 'tail1', parent: 'hips', x: -5.4, y: -1.8, z: 0, angle: 0.36 },
    { name: 'tail2', parent: 'tail1', x: 0, y: 6, z: 0, angle: 0.05 },
    { name: 'tail3', parent: 'tail2', x: 0, y: 5.4, z: 0, angle: 0.04 },
    // Front legs on the chest, back legs on the hips. One segment each: a kitten in the air
    // reads from where its paws are, not from where its knees are, and every extra joint here
    // is part count spent against the ceiling in §2b.
    { name: 'armF', parent: 'chest', x: 2.2, y: 3.4, z: 5.6, angle: 0 },
    { name: 'armN', parent: 'chest', x: 3, y: 3.4, z: -5.6, angle: 0 },
    { name: 'legF', parent: 'hips', x: -1.4, y: 3.2, z: 5.2, angle: 0 },
    { name: 'legN', parent: 'hips', x: -0.6, y: 3.2, z: -5.2, angle: 0 },
  ],
} as const

const PARTS = [
  // The far side. `shift: -1` is the deliberate extra step down the ramp that art takes past
  // what the light would do — occlusion is correct, legibility is a decision.
  { name: 'armF', bone: 'armF', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7.4, r: 2, r1: 1.6 }, shift: -1 },
  { name: 'pawF', bone: 'armF', material: 'cream', shape: { kind: 'ellipse', cx: 0.7, cy: 8.1, rx: 2, ry: 1.7, rz: 2.2 }, shift: -1 },
  { name: 'legF', bone: 'legF', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 2.3, r1: 1.8 }, shift: -1 },
  { name: 'pawLF', bone: 'legF', material: 'cream', shape: { kind: 'ellipse', cx: 0.8, cy: 7.6, rx: 2.1, ry: 1.8, rz: 2.2 }, shift: -1 },
  // The far ear is authored up the negative y axis, which is the one place in this file a
  // shape points against its bone: an ear stands up from the skull and a leg hangs down from
  // the shoulder, and both are the same bone convention seen from opposite ends.
  { name: 'earF', bone: 'earF', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: -1, y1: -5.2, r: 2.6, r1: 0.7 }, shift: -1 },

  // The tail, drawn before the masses so the hips win where they overlap.
  { name: 'tail1', bone: 'tail1', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 2.3, r1: 2 } },
  { name: 'tail2', bone: 'tail2', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 5.4, r: 2, r1: 1.6 } },
  /**
   * **The tail ends in white, and the ginger segment is cut short to make room for it.**
   *
   * The first pass ran the coat all the way to the tip and then laid the cream capsule on top
   * of it at the same depth — a coin flip per pixel, which paid out at between zero and three
   * pixels of white. **Two solids at equal depth do not compose; they contend.** The fix is
   * geometric rather than a depth nudge: the coat stops at 3.2 and the cream owns everything
   * past it, so the two share a boundary instead of a volume.
   */
  { name: 'tail3', bone: 'tail3', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 3.2, r: 1.6, r1: 1.3 } },
  { name: 'tailTip', bone: 'tail3', material: 'cream', shape: { kind: 'capsule', x0: 0, y0: 3, x1: 0, y1: 5.4, r: 1.35, r1: 0.9 } },

  // The two masses.
  { name: 'hips', bone: 'hips', material: 'coat', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 5.6, ry: 5.2, rz: 5 } },
  { name: 'chest', bone: 'chest', material: 'coat', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 6.2, ry: 5.6, rz: 5.4 } },
  { name: 'neck', bone: 'neck', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 2.6, y1: 0.4, r: 3.4 } },
  // **The head, and it is the commission.** `rx 6.0` against a chest of 6.2: the same mass.
  // An adult cat's skull is half this against the same body, and the animal stops being a
  // kitten the moment the ratio moves.
  { name: 'head', bone: 'head', material: 'coat', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 6, ry: 5.4, rz: 5.6 } },
  { name: 'muzzle', bone: 'head', material: 'cream', shape: { kind: 'ellipse', cx: 4.2, cy: 2, rx: 3, ry: 2.4, rz: 3 }, z: -1.2 },
  { name: 'nose', bone: 'head', material: 'pink', shape: { kind: 'ellipse', cx: 6.4, cy: 0.9, rx: 1.2, ry: 1, rz: 1.2 }, z: -2.6 },
  /**
   * **The eye is a marking, and that is the whole reason it can be here at all.**
   *
   * A dark disc authored as a solid would stand proud of the skull and add to the silhouette —
   * an eye stuck on the outside of the head. A marking recolours the surface it lies on, adds
   * nothing to the outline, and gets no ink ring round it.
   */
  { name: 'eye', bone: 'head', material: 'ink', marking: true, z: -1, shape: { kind: 'ellipse', cx: 2.6, cy: -0.6, rx: 1.4, ry: 1.6, rz: 1.4 } },
  /**
   * **The bib.** A pale chest patch, lobed so its boundary is ragged: the edge between two
   * colours of fur is not a clean curve, and a clean curve reads as paint. Same reasoning as
   * the silverback's saddle, and the same field — `marking: true` — for the same reason.
   */
  { name: 'bib', bone: 'chest', material: 'cream', marking: true, z: -1, shape: { kind: 'lobed', cx: 2.4, cy: 2.4, rx: 4.6, ry: 3.6, rz: 4.6, lobes: 4, depth: 0.18, phase: 1.1, octaves: 2 } },

  // The near side, and it paints last only to break ties at exactly equal depth. Depth decides.
  { name: 'legN', bone: 'legN', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 2.5, r1: 1.9 } },
  { name: 'pawLN', bone: 'legN', material: 'cream', shape: { kind: 'ellipse', cx: 0.8, cy: 7.6, rx: 2.3, ry: 1.9, rz: 2.3 } },
  { name: 'armN', bone: 'armN', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7.4, r: 2.2, r1: 1.7 } },
  { name: 'pawN', bone: 'armN', material: 'cream', shape: { kind: 'ellipse', cx: 0.7, cy: 8.1, rx: 2.2, ry: 1.8, rz: 2.3 } },
  { name: 'earN', bone: 'earN', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: -1, y1: -5.2, r: 2.8, r1: 0.8 } },
  // The inner ear, a decal on the near ear only. The far ear turns away from the viewer, and
  // its inside is not visible on any real cat either.
  { name: 'earInner', bone: 'earN', material: 'pink', marking: true, z: -1, shape: { kind: 'capsule', x0: 0.2, y0: -1, x1: -0.6, y1: -3.8, r: 1.3, r1: 0.4 } },
] as const

/**
 * **Both sides of the body differ only in phase, and every clip below obeys it.**
 *
 * `DECISIONS.md` records mirrored limbs three times — probe D, the photographer, the
 * astronaut. The defect is always the same shape: two limbs authored as one pose, so the
 * animal moves like a paper doll. Every pair here is one key list read at two different
 * offsets, and the offsets are written out rather than generated, because a helper that takes
 * the lag as an argument is longer than the line it replaces.
 */

/**
 * **Going up.** Four phases over a held pose, which is the honest description of what a body
 * in flight does: nothing changes except the tail, and the tail changes constantly.
 *
 * The front paws reach up and forward, the back legs trail, the ears lie back and the body
 * stretches along its own length. Stretch on the way up and squash on the way down is the
 * oldest rule in animation and it is the one that makes a jump feel like a jump.
 */
export const catRise: Grammar = {
  name: 'cat-rise',
  palette: GINGER,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'rise',
    phases: [
      { name: 'reach', at: 0 },
      { name: 'crest', at: 0.25 },
      { name: 'hold', at: 0.5 },
      { name: 'sweep', at: 0.75 },
    ],
    tracks: [
      // Stretched along the body axis. At a swing of 0.30 these are ratios, not turns:
      // scaleX and scaleY carry no amplitude from the tunables because a ratio has no unit.
      { bone: 'hips', channel: 'scaleY', keys: [0.08, 0.05, 0.08, 0.05] },
      { bone: 'hips', channel: 'scaleX', keys: [-0.05, -0.03, -0.05, -0.03] },
      // A float on the way up. 0.25 of a 5 px amplitude is a pixel and a quarter, which is a
      // body carrying its own weight rather than a sprite being translated.
      { bone: 'hips', channel: 'y', keys: [0.3, -0.24, 0.18, -0.2] },
      /**
       * **The two front paws are 34 degrees apart, and that separation is the fix for a
       * defect the counts found before the eye could.**
       *
       * The first pass gave the pair the same pose at a phase offset, and the far limb then
       * painted between zero and four pixels in every frame — hidden behind the near one,
       * which is how a limb goes missing without leaving a trace to see. It is the fourth
       * time this project has shipped that defect (probe D, the photographer, the astronaut)
       * and the first time a number caught it rather than him. **A phase offset is not a
       * separation: two limbs at the same angle occupy the same pixels whenever the phase
       * happens to line up, and on a body 30 px wide that is most of the time.**
       *
       * 34 degrees at an 8 px limb puts the two paws 4.7 px apart, which is more than the
       * limb's own radius, so the far one is always visible past the near one.
       */
      { bone: 'armN', channel: 'angle', keys: [-0.7, -0.6, -0.54, -0.64] },
      { bone: 'armF', channel: 'angle', keys: [-0.24, -0.34, -0.4, -0.3] },
      { bone: 'legN', channel: 'angle', keys: [0.28, 0.36, 0.42, 0.32] },
      { bone: 'legF', channel: 'angle', keys: [0.66, 0.58, 0.54, 0.62] },
      /**
       * **The tail streams down and waves, and it is most of what moves.** The rest angle
       * points it back and up; a body travelling upward drags its tail below it, so the base
       * swings about 60 degrees the other way and the wave rides on top of that.
       *
       * Each segment is a quarter cycle behind the one it hangs from. That lag is the whole
       * trick — the tip is always doing what the base did a moment ago, which is what makes a
       * chain read as a rope with weight instead of as a stick being waved.
       */
      { bone: 'tail1', channel: 'angle', keys: [-0.62, -0.4, -0.48, -0.7] },
      { bone: 'tail2', channel: 'angle', keys: [-0.7, -0.52, -0.36, -0.5] },
      { bone: 'tail3', channel: 'angle', keys: [-0.46, -0.66, -0.58, -0.34] },
      // Ears back. A cat moving fast flattens its ears, and it is two pixels that say speed.
      { bone: 'earN', channel: 'angle', keys: [0.3, 0.18, 0.26, 0.36] },
      { bone: 'earF', channel: 'angle', keys: [0.2, 0.3, 0.36, 0.24] },
      { bone: 'head', channel: 'angle', keys: [-0.2, -0.08, -0.16, -0.26] },
      { bone: 'neck', channel: 'angle', keys: [-0.08, -0.02, -0.06, -0.11] },
      { bone: 'chest', channel: 'angle', keys: [-0.08, -0.04, -0.07, -0.1] },
    ],
  },
}

/**
 * **Coming down.** The pose inverts: paws spread, tail up and curling, ears forward, body
 * squashed across its length. A falling cat spreads — it is the only animal most people have
 * seen do it, and the shape is instantly recognisable.
 */
export const catFall: Grammar = {
  name: 'cat-fall',
  palette: GINGER,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'fall',
    phases: [
      { name: 'spread', at: 0 },
      { name: 'drift', at: 0.25 },
      { name: 'settle', at: 0.5 },
      { name: 'curl', at: 0.75 },
    ],
    tracks: [
      { bone: 'hips', channel: 'scaleY', keys: [-0.07, -0.04, -0.07, -0.04] },
      { bone: 'hips', channel: 'scaleX', keys: [0.07, 0.04, 0.07, 0.04] },
      { bone: 'hips', channel: 'y', keys: [-0.22, 0.26, -0.16, 0.2] },
      // Spread, and the pair is separated by angle rather than by phase for the same reason
      // the rise clip is: two limbs at the same angle are one limb as far as the picture is
      // concerned. The near paw reaches forward and the far one hangs, which is 30 degrees.
      { bone: 'armN', channel: 'angle', keys: [-0.42, -0.5, -0.44, -0.34] },
      { bone: 'armF', channel: 'angle', keys: [-0.06, 0.02, -0.04, -0.12] },
      { bone: 'legN', channel: 'angle', keys: [0.14, 0.06, 0.12, 0.22] },
      { bone: 'legF', channel: 'angle', keys: [0.46, 0.54, 0.48, 0.4] },
      // **The tail goes up and curls**, which is the single clearest way to tell this clip
      // from the rise one at a glance. The curl accumulates down the chain: each segment
      // adds to its parent's angle, so three modest keys make one deep hook.
      { bone: 'tail1', channel: 'angle', keys: [0.2, 0.06, 0.16, 0.3] },
      { bone: 'tail2', channel: 'angle', keys: [0.42, 0.28, 0.34, 0.46] },
      { bone: 'tail3', channel: 'angle', keys: [0.34, 0.5, 0.44, 0.3] },
      { bone: 'earN', channel: 'angle', keys: [-0.14, -0.02, -0.1, -0.2] },
      { bone: 'earF', channel: 'angle', keys: [-0.04, -0.16, -0.2, -0.08] },
      { bone: 'head', channel: 'angle', keys: [0.16, 0.04, 0.12, 0.22] },
      { bone: 'neck', channel: 'angle', keys: [0.07, 0.01, 0.05, 0.1] },
      { bone: 'chest', channel: 'angle', keys: [0.08, 0.03, 0.06, 0.1] },
    ],
  },
}

/**
 * **The bounce, and it plays once.** Four frames, 220 ms: contact, compress, drive, off.
 *
 * The runtime holds the last frame of a once-clip until the state clears, exactly as the
 * gorilla's attack does. So the last phase here is authored to arrive at the rise pose — the
 * clip hands over rather than snapping.
 *
 * Squash and stretch live on `hips` alone. It is the root bone, so its scale propagates to
 * the chest, the head, the tail and all four legs: the whole animal compresses against the
 * shelf and springs off it, which is what a single scale channel buys and what a per-limb
 * one never could.
 */
export const catTuck: Grammar = {
  name: 'cat-tuck',
  palette: GINGER,
  skeleton: SKELETON,
  parts: PARTS,
  gait: {
    name: 'tuck',
    phases: [
      { name: 'touch', at: 0 },
      { name: 'press', at: 0.25 },
      { name: 'drive', at: 0.5 },
      { name: 'off', at: 0.75 },
    ],
    tracks: [
      /**
       * 0.78 of its height at the deepest, 1.09 at the top of the drive. A cat absorbs a
       * landing with its whole body and there is no frame in which it is a rigid shape.
       *
       * **The first pass squashed to 0.72 and the findings channel flagged it**: mean tone
       * region 4.7 px, under the 5 px floor where shading stops being shading and becomes
       * noise. A squash compresses the rows the ramp is spread across, so past a point the
       * five tones have nowhere to live. This is the ratio that keeps the drop readable and
       * the shading intact, and the trade is named rather than tuned away.
       */
      { bone: 'hips', channel: 'scaleY', keys: [-0.22, -0.11, 0.09, 0.07] },
      { bone: 'hips', channel: 'scaleX', keys: [0.17, 0.09, -0.06, -0.04] },
      { bone: 'hips', channel: 'y', keys: [0.7, 0.3, -0.4, -0.2] },
      // Paws under the body at contact, thrown up and forward on the drive.
      { bone: 'armN', channel: 'angle', keys: [0.24, 0.06, -0.44, -0.56] },
      { bone: 'armF', channel: 'angle', keys: [0.3, 0.1, -0.4, -0.5] },
      { bone: 'legN', channel: 'angle', keys: [-0.06, 0.08, 0.34, 0.36] },
      { bone: 'legF', channel: 'angle', keys: [-0.02, 0.12, 0.3, 0.4] },
      { bone: 'tail1', channel: 'angle', keys: [0.22, 0.06, -0.36, -0.5] },
      { bone: 'tail2', channel: 'angle', keys: [0.3, 0.14, -0.3, -0.56] },
      { bone: 'tail3', channel: 'angle', keys: [0.34, 0.2, -0.24, -0.5] },
      { bone: 'earN', channel: 'angle', keys: [0.26, 0.3, 0.14, 0.2] },
      { bone: 'earF', channel: 'angle', keys: [0.28, 0.3, 0.16, 0.22] },
      { bone: 'head', channel: 'angle', keys: [0.1, 0.04, -0.14, -0.12] },
      { bone: 'chest', channel: 'angle', keys: [0.06, 0.02, -0.06, -0.05] },
    ],
  },
}

export const CAT: readonly Grammar[] = [catRise, catFall, catTuck]
