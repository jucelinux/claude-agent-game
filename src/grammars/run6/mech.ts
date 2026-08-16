/**
 * Run 6 — **the gorilla that becomes a robot**, his proposal.
 *
 * The most ambitious thing this project has attempted, and it is ambitious for a reason
 * that is not spectacle: **it forces the vocabulary the model does not have.** A robot
 * built from ellipses and capsules reads as a soft toy. Mechanical means hard corners,
 * panel seams and things that end abruptly, and the moment the animation demands both
 * bodies on one skeleton it stops being possible to hide inside round shapes.
 *
 * Four decisions, and each is the cheap answer to a problem that looked expensive:
 *
 * 1. **The cycle is a ping-pong, not a one-way trip.** ape → unfold → mech → fold, back to
 *    ape. A transformation that played once would snap at the loop point; played both ways
 *    it is a genuine cycle, it shows both bodies, and the audience sees the mechanism twice.
 *    No engine change at all — the existing closed form in `t` already does it.
 * 2. **The plates were already there.** A transformation is parts rotating on hinges into a
 *    new arrangement, which is the exact cut this project was founded on (`CLAUDE.md` §1,
 *    animation by transforming anchored parts). Nothing morphs shape; things swing.
 * 3. **Mechanical is `rect`.** The shape has existed since round zero and has been used
 *    once, on a ninja's mask. Hard corners plus the inner-outline rule *is* a panel seam,
 *    so the metal vocabulary needed no new primitive — only the nerve to use the one that
 *    was already there.
 * 4. **Fur leaves by scale, metal arrives by scale.** The one genuinely new capability, and
 *    it is four lines in the skeleton solver: a bone at scale 0 takes everything hanging off
 *    it with it.
 *
 * stack — every measurement. portable — the ping-pong transformation, and swap-by-scale.
 */
import type { Grammar, Palette, Part, Track } from '../../core/types.ts'
import { gorilla } from '../run5/gorilla.ts'

/**
 * Fur, hide, silver and ink come from the gorilla unchanged; steel and the eye are what this
 * adds.
 *
 * **The indices are derived rather than typed, and that is a repair.** They were written out
 * by hand — 17 through 24 — against a gorilla palette that had two ramps of eight. When the
 * coat became black in five tones on 16/08 and grew a saddle and a line, the count moved and
 * every hand-typed index pointed at the wrong colour. A palette that borrows another one has
 * to borrow its length too.
 */
/** Where the borrowed ramps end, so nothing downstream has to know how long they are. */
const BORROWED = gorilla.palette.colors.length
const STEEL = [0, 1, 2, 3, 4].map((i) => BORROWED + i)
const CORE = [0, 1, 2, 3, 4].map((i) => BORROWED + 5 + i)

const ALLOY: Palette = {
  name: 'gorilla-mech',
  colors: [
    ...gorilla.palette.colors,
    // steel: cool, and the top step is a specular that only the rim ever reaches
    [22, 27, 36],
    [48, 58, 74],
    [82, 98, 120],
    [128, 146, 170],
    [196, 212, 230],
    // core: the light inside, and the only saturated ramp in the whole project
    [52, 14, 10],
    [110, 28, 16],
    [176, 56, 24],
    [226, 104, 38],
    [250, 190, 104],
  ],
  ramps: [
    ...gorilla.palette.ramps,
    { material: 'steel', indices: STEEL },
    { material: 'core', indices: CORE },
  ],
}

/**
 * Phase 0 is the ape and phase 2 is the machine; 1 and 3 are the two halves of the change.
 * Everything below reads as a column of four numbers: what this part is doing at ape, at
 * unfold, at mech, at fold.
 */
const PHASES = [
  { name: 'ape', at: 0 },
  { name: 'unfold', at: 0.25 },
  { name: 'mech', at: 0.5 },
  { name: 'fold', at: 0.75 },
] as const

/** Present as an ape, gone as a machine. */
const ORGANIC: number[] = [0, -0.55, -1, -0.55]
/** The mirror: nothing, arriving, whole, leaving. */
const MECHANICAL: number[] = [-1, -0.55, 0, -0.55]

const HIDDEN = ['crest', 'brow', 'muzzle', 'fistF', 'fistN', 'footF', 'footN']

const swap = (bones: readonly string[], keys: number[]): Track[] =>
  bones.map((bone) => ({ bone, channel: 'scale' as const, keys }))

/** The metal body: rectangles, and the seams come from the render rule. */
const PLATES: Part[] = [
  { name: 'plateArmF', bone: 'armFU', material: 'steel', shape: { kind: 'rect', x: -3.2, y: 0, w: 6.4, h: 12 }, shift: -2 },
  { name: 'plateForeF', bone: 'armFL', material: 'steel', shape: { kind: 'rect', x: -2.7, y: 0, w: 5.4, h: 10 }, shift: -2 },
  { name: 'plateLegF', bone: 'legFU', material: 'steel', shape: { kind: 'rect', x: -3.4, y: 0, w: 6.8, h: 8 }, shift: -2 },
  { name: 'plateShinF', bone: 'legFL', material: 'steel', shape: { kind: 'rect', x: -2.8, y: 0, w: 5.6, h: 8 }, shift: -2 },
  { name: 'hull', bone: 'chest', material: 'steel', shape: { kind: 'rect', x: -12, y: -10.5, w: 22.5, h: 21 } },
  { name: 'pauldron', bone: 'chest', material: 'steel', shape: { kind: 'rect', x: -9, y: -13, w: 18, h: 7 } },
  { name: 'core', bone: 'chest', material: 'core', shape: { kind: 'rect', x: -2, y: -3, w: 5, h: 6 } },
  { name: 'pelvis', bone: 'hips', material: 'steel', shape: { kind: 'rect', x: -9.5, y: -9, w: 19, h: 18 } },
  { name: 'skull', bone: 'head', material: 'steel', shape: { kind: 'rect', x: -6, y: -6.5, w: 12.5, h: 12 } },
  { name: 'visor', bone: 'head', material: 'core', shape: { kind: 'rect', x: 1, y: -2, w: 4, h: 2.5 } },
  { name: 'plateLegN', bone: 'legNU', material: 'steel', shape: { kind: 'rect', x: -4.5, y: -0.5, w: 9, h: 9.5 } },
  { name: 'plateShinN', bone: 'legNL', material: 'steel', shape: { kind: 'rect', x: -3.7, y: -0.5, w: 7.4, h: 9 } },
  { name: 'footPlate', bone: 'legNL', material: 'steel', shape: { kind: 'rect', x: -2, y: 6.5, w: 7, h: 3 } },
  { name: 'plateArmN', bone: 'armNU', material: 'steel', shape: { kind: 'rect', x: -4.3, y: -1, w: 8.6, h: 14.5 } },
  { name: 'plateForeN', bone: 'armNL', material: 'steel', shape: { kind: 'rect', x: -3.7, y: -0.5, w: 7.4, h: 11 } },
  { name: 'clawN', bone: 'armNL', material: 'steel', shape: { kind: 'rect', x: -2.4, y: 9.5, w: 4.8, h: 4 } },
]

/**
 * Every plate hangs off a **new bone of its own**, parented to the gorilla's bone, so the
 * plate can be scaled away without collapsing the limb it rides on. The alternative —
 * scaling the gorilla's own bones — would have taken the arm with the fur.
 */
const PLATE_BONES = PLATES.map((p) => ({ name: `${p.name}B`, parent: p.bone, x: 0, y: 0, angle: 0 }))

export const gorillaMech: Grammar = {
  name: 'gorilla-mech',
  palette: ALLOY,
  skeleton: { bones: [...gorilla.skeleton.bones, ...PLATE_BONES] },
  parts: [
    // The whole ape first, then the whole machine over it. **Each plate is larger than the
    // flesh it covers**, which is what lets the mechanical silhouette be a union of hard
    // rectangles rather than a soft body with panels stuck on: at the mech phase nothing
    // round reaches the outline. Cheaper than scaling the flesh away, and it leaves the
    // animal intact underneath, which is what a transformation is.
    ...gorilla.parts,
    ...PLATES.map((p) => ({ ...p, bone: `${p.name}B` })),
  ],
  gait: {
    name: 'transform',
    phases: [...PHASES],
    tracks: [
      // The body squares up: the ape's sloped back straightens as the machine takes over.
      { bone: 'chest', channel: 'angle', keys: [0.012, 0.006, -0.02, 0.006] },
      { bone: 'chest', channel: 'y', keys: [1, 0.2, -1.4, 0.2] },
      { bone: 'hips', channel: 'y', keys: [0.7, 0.2, -0.6, 0.2] },
      { bone: 'neck', channel: 'angle', keys: [0, 0.03, -0.03, 0.03] },
      { bone: 'head', channel: 'angle', keys: [-0.014, 0.02, 0.02, 0.02] },
      // The arms rise out of the knuckle stance and lock into a standing machine.
      { bone: 'armNU', channel: 'angle', keys: [1, 0.4, -0.35, 0.4] },
      { bone: 'armNL', channel: 'angle', keys: [-0.35, 0.2, 0.2, 0.2] },
      { bone: 'armFU', channel: 'angle', keys: [-0.9, -0.3, -0.3, -0.3] },
      { bone: 'armFL', channel: 'angle', keys: [0.5, 0.25, 0.15, 0.25] },
      { bone: 'legNU', channel: 'angle', keys: [-0.9, -0.3, 0.1, -0.3] },
      { bone: 'legNL', channel: 'angle', keys: [0.1, 0.3, -0.1, 0.3] },
      { bone: 'legFU', channel: 'angle', keys: [0.9, 0.3, 0.1, 0.3] },
      { bone: 'legFL', channel: 'angle', keys: [-0.2, -0.3, -0.1, -0.3] },
      // Flesh leaves, metal arrives, and the two crossings are what the eye follows.
      ...swap(HIDDEN, ORGANIC),
      ...swap(PLATE_BONES.map((b) => b.name), MECHANICAL),
    ],
  },
}
