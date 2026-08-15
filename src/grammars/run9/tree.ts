/**
 * Run 9 — **a tree, from his reference.** Wind in the leaves, and leaves that fall.
 *
 * The first subject in this project that is not an animal, and the first whose gait is not
 * locomotion. Two reasons it is a real test rather than a change of scenery:
 *
 *  - **It lands on the strength.** A tree is an articulated body — trunk, branch, sub-branch,
 *    cluster — and wind is a **lag travelling down that chain**, which is the same rule as
 *    "the head lags the chest by a quarter" from the walk, applied recursively. Nothing here
 *    is new engine; it is the existing hierarchy pointed at a subject that happens to be
 *    made of hierarchy.
 *  - **It lands on the weakness.** Foliage reads by its **scalloped edge**, and my whole
 *    vocabulary is smooth solids. The reference's character is the wobble, and an ellipse has
 *    no wobble. The answer here is the union of overlapping lobes rather than a new
 *    primitive. **It took three passes and the first two came back as a sponge** — see `clump`
 *    below: the fix was not lobe sizes, it was authoring 28 parts into a 30x28 px crown,
 *    straight past the limitation my own capability file has recorded since run 3.
 *
 * **Authored in the Chrono idiom, because it won** (run 8, his ranking, 15/08): five tones
 * over a wide value range, an outer line and a joint line, no per-pixel noise, raking light.
 * The hues are his reference's — maroon bark with a cool grey-green highlight, two greens —
 * but the *structure* of the ink is the verdict, not the picture.
 *
 * **The depth solver does real work here for the first time outside a limb.** The reference
 * builds every cluster as a dark mass with lit foliage sitting on it. That is not two
 * colours, it is two depths: the shadow mass sits **behind** and the green lobes **in
 * front**, and the union resolves itself. Before run 7 this would have been paint order, and
 * paint order cannot survive the clusters swinging past each other in wind.
 *
 * stack — every colour and coordinate. portable — wind as lag down a hierarchy, and a
 * detached part expressed as a bone with a trajectory plus a scale window.
 */
import type { Bone, Gait, Grammar, Palette, Part, Track } from '../../core/types.ts'

const BARK = 'bark'
const LEAF = 'leaf'
const INK = 'ink'

/**
 * His reference's palette, re-cut to five tones per material.
 *
 * The bark ramp is the interesting one: it runs **warm to cool**, dark maroon up to a
 * grey-green, which is the opposite of the usual cool-shadow/warm-light and is exactly what
 * the reference does. It also means the trunk's lit side comes out teal for free — the
 * highlight in the reference image is not painted on, it is where this ramp ends.
 */
const PALETTE: Palette = {
  name: 'tree-chrono',
  colors: [
    [0, 0, 0],
    // bark — deep maroon into a cool grey-green
    [40, 22, 24],
    [62, 36, 36],
    [86, 58, 54],
    [112, 104, 90],
    [146, 156, 138],
    // leaf — two greens' worth of range, spread over five steps
    [44, 58, 34],
    [68, 88, 46],
    [96, 120, 62],
    [130, 156, 84],
    [170, 194, 118],
    // ink — a maroon-black, so the heavy line belongs to the bark's world
    [26, 14, 16],
    [34, 19, 21],
    [44, 25, 27],
    [56, 33, 35],
    [70, 42, 44],
  ],
  ramps: [
    { material: BARK, indices: [1, 2, 3, 4, 5] },
    { material: LEAF, indices: [6, 7, 8, 9, 10] },
    { material: INK, indices: [11, 12, 13, 14, 15] },
  ],
}

/**
 * **Two amplitudes, one gait, and the conflict is real.** A branch sways about 10° and a
 * falling leaf tumbles about 90°; both are the `angle` channel, which has exactly one
 * amplitude. Run 7 learned that an action needs a bigger amplitude than a walk — the same
 * lesson one level in: **the amplitude belongs to the largest motion in the gait, and
 * everything else is authored as a fraction of it.** So `gait.swing` is the leaf's tumble
 * and the wind keys below are written at branch scale and scaled down here, which keeps
 * them readable as what they are.
 */
// **0.09, down from 0.2 — his note: the tree should move more discreetly.** A canopy in
// wind mostly shimmers; a canopy that visibly leans is a canopy in a storm, and the storm
// was reading as the tree being waved by hand.
const SWAY = 0.09
const BOB = 0.025
const sway = (...keys: number[]): number[] => keys.map((k) => k * SWAY)
const bob = (...keys: number[]): number[] => keys.map((k) => k * BOB)

/** Bones grow **upward** — a tree is the first body here that does. */
const SKELETON: Bone[] = [
  { name: 'trunk0', parent: null, x: 0, y: 0, z: 0, angle: 0 },
  // The sinuous line of the reference's trunk is two small lateral offsets, not a curve.
  { name: 'trunk1', parent: 'trunk0', x: 1.5, y: -15, z: 0, angle: 0.008 },
  { name: 'trunk2', parent: 'trunk1', x: -1, y: -13, z: 0, angle: -0.01 },

  { name: 'branchL', parent: 'trunk2', x: -3, y: -4, z: 2, angle: -0.088 },
  { name: 'branchLt', parent: 'branchL', x: 0, y: -10, z: 0, angle: -0.03 },
  { name: 'branchR', parent: 'trunk2', x: 3, y: -4, z: -2, angle: 0.082 },
  { name: 'branchRt', parent: 'branchR', x: 0, y: -10, z: 0, angle: 0.03 },
  { name: 'branchC', parent: 'trunk2', x: 0, y: -5, z: 0, angle: 0.005 },
  { name: 'branchCt', parent: 'branchC', x: 0, y: -11, z: 0, angle: 0 },

  // **Eleven clumps, up from seven, spread wider.** His note: more leaves. A canopy is dense
  // — the gaps between foliage should be holes in a mass, not space between objects.
  { name: 'cLo', parent: 'branchL', x: -11, y: -2, z: 3, angle: 0 },
  { name: 'cLx', parent: 'branchL', x: -7, y: -9, z: -1, angle: 0 },
  { name: 'cLm', parent: 'branchLt', x: -9, y: -4, z: -1, angle: 0 },
  { name: 'cLt', parent: 'branchLt', x: -3, y: -10, z: 1, angle: 0 },
  { name: 'cCl', parent: 'branchCt', x: -5, y: -3, z: -3, angle: 0 },
  { name: 'cC', parent: 'branchCt', x: 0, y: -8, z: -3, angle: 0 },
  { name: 'cCr', parent: 'branchCt', x: 5, y: -3, z: -2, angle: 0 },
  { name: 'cRt', parent: 'branchRt', x: 3, y: -10, z: 2, angle: 0 },
  { name: 'cRm', parent: 'branchRt', x: 9, y: -4, z: -2, angle: 0 },
  { name: 'cRx', parent: 'branchR', x: 7, y: -9, z: 1, angle: 0 },
  { name: 'cRo', parent: 'branchR', x: 11, y: -2, z: 4, angle: 0 },

  // The three that come off. Parented to the root so their fall is in the tree's space and
  // not in a swaying branch's — a detached leaf stops caring what the branch is doing.
  { name: 'fall0', parent: 'trunk0', x: -9, y: -36, z: -7, angle: 0 },
  { name: 'fall1', parent: 'trunk0', x: 7, y: -32, z: -5, angle: 0 },
  { name: 'fall2', parent: 'trunk0', x: 1, y: -28, z: -8, angle: 0 },
]

/**
 * **The crown is three masses with foliage on them, not seven self-contained clumps.**
 *
 * The first two passes gave every cluster its own shadow — seven clusters of three, then of
 * four — and both came back as one mottled sponge. Twice was enough: the defect was not the
 * lobe sizes, it was **28 foliage parts inside a 30×28 px crown**, which is less than a
 * pixel of separation per part. `TASTE.md` §2b has said since run 3 that articulation
 * density is my ceiling and that what raises it is *fewer parts with one heavy mass doing
 * the reading* — and I authored straight past my own recorded limitation, twice, before
 * measuring it.
 *
 * So the shadow becomes three big overlapping masses that own the crown's whole silhouette,
 * and the green becomes small clumps sitting on top with the dark showing between them —
 * which is also what the reference actually is, rather than what a description of it sounds
 * like. Ten parts instead of twenty-eight.
 */
function clump(bone: string, s: number, ax: number, ay: number, phase: number): Part[] {
  return [
    { name: `${bone}A`, bone, material: LEAF, z: -5, shape: { kind: 'lobed', cx: ax, cy: ay, rx: 9.6 * s, ry: 7.6 * s, rz: 7, lobes: 5, depth: 0.3, phase, octaves: 3 } },
    { name: `${bone}B`, bone, material: LEAF, z: -8, shape: { kind: 'lobed', cx: ax + 4 * s, cy: ay + 3.4 * s, rx: 5.8 * s, ry: 4.8 * s, rz: 5, lobes: 4, depth: 0.32, phase: phase + 1.1, octaves: 3 } },
  ]
}

const PARTS: Part[] = [
  // **The roots are in FRONT of the trunk now.** Behind it, the trunk's own mass won every
  // pixel they shared and the flare never appeared — correct occlusion, wrong composition,
  // which is the same mistake as the crown one level down.
  { name: 'rootL', bone: 'trunk0', material: BARK, z: -2, shift: -1, shape: { kind: 'capsule', x0: 1, y0: -3, x1: -7, y1: 4, r: 2.8 } },
  { name: 'rootR', bone: 'trunk0', material: BARK, z: -2, shift: -1, shape: { kind: 'capsule', x0: -1, y0: -3, x1: 7, y1: 4, r: 2.6 } },

  // Thicker, and **shifted a step down its ramp**. The bark ramp runs warm-dark to cool-light,
  // and on a column only 14 px wide the lit half was half the trunk — so the tree's spine read
  // as pale grey-green when the reference's is the darkest thing in the picture. The cheat
  // knob is exactly the right tool: the form is correct, the value was not. **The shift came
  // back off after measuring**: curve 0.75 alone drops the trunk to a dark maroon body with a
  // narrow lit edge, and stacking a step on top of it killed the highlight the reference is
  // built on. Two fixes for one defect is one fix too many.
  // **Tapered, all of them.** A trunk narrows and so does every branch, and until taper
  // existed the only way to say so was to stack capsules of decreasing radius and let the
  // seam show. Each segment now ends at the radius the next one begins with, so the three
  // trunk pieces read as one cone with a bend in it rather than as three cylinders.
  { name: 'trunkBase', bone: 'trunk0', material: BARK, shape: { kind: 'capsule', x0: 0, y0: 2, x1: 0, y1: -15, r: 5.4, r1: 4.2 } },
  { name: 'trunkMid', bone: 'trunk1', material: BARK, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -13, r: 4.2, r1: 3.2 } },
  { name: 'trunkTop', bone: 'trunk2', material: BARK, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -6, r: 3.2, r1: 2.4 } },

  { name: 'brL', bone: 'branchL', material: BARK, shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -10, r: 2.2, r1: 1.5 } },
  { name: 'brLt', bone: 'branchLt', material: BARK, z: -9.5, shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: -2, y1: -8, r: 1.5, r1: 0.7 } },
  { name: 'brR', bone: 'branchR', material: BARK, shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -10, r: 2.1, r1: 1.45 } },
  { name: 'brRt', bone: 'branchRt', material: BARK, z: -9.5, shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 2, y1: -8, r: 1.45, r1: 0.7 } },
  // brCt is gone for the same reason as massC: at eleven clumps the centre of the canopy is
  // the densest place on the tree, and a sub-branch buried there rendered nothing. The bone
  // stays — it carries three clumps — which is the point of bones and parts being separate.
  { name: 'brC', bone: 'branchC', material: BARK, z: -9, shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -11, r: 2, r1: 1.4 } },

  // **The shadow masses sit INSIDE the foliage now, not around it.** In the last pass they
  // owned the crown's whole outline and the green sat on them like spots — a mushroom cap.
  // The reference is the other way up: the leaves are the outline and the dark shows in the
  // gaps *between* them. Smaller than the green union on purpose, so nothing dark reaches the
  // silhouette except where two clumps part.
  { name: 'massL', bone: 'branchLt', material: BARK, z: 4, shift: -1, shape: { kind: 'lobed', cx: -7, cy: -1, rx: 11, ry: 8, rz: 9, lobes: 7, depth: 0.2, phase: 0.4, octaves: 2 } },
  { name: 'massR', bone: 'branchRt', material: BARK, z: 4, shift: -1, shape: { kind: 'lobed', cx: 7, cy: -1, rx: 11, ry: 8, rz: 9, lobes: 7, depth: 0.2, phase: 1.3, octaves: 2 } },
  // massC was here and rendered 0 px once the canopy went to eleven clumps: fully covered,
  // so it was doing nothing but existing. Deleted rather than nudged — the absence count's
  // job is to find parts that are not earning their keep, not only parts that broke.
  { name: 'massB', bone: 'trunk2', material: BARK, z: 4, shift: -1, shape: { kind: 'lobed', cx: 0, cy: -13, rx: 13, ry: 7, rz: 9, lobes: 6, depth: 0.18, phase: 3.4, octaves: 2 } },

  // Eleven clumps, each with its own phase so no two stamp alike. These own the silhouette.
  ...clump('cLo', 0.95, -2, 0, 0),
  ...clump('cLx', 0.9, -2, -1, 0.57),
  ...clump('cLm', 1.05, -2, -1, 1.14),
  ...clump('cLt', 0.92, -2, -1, 1.71),
  ...clump('cCl', 1.0, -2, -1, 2.28),
  ...clump('cC', 1.12, -2, -1, 2.85),
  ...clump('cCr', 1.0, -2, -1, 3.42),
  ...clump('cRt', 0.92, -2, -1, 3.99),
  ...clump('cRm', 1.05, -2, 0, 4.56),
  ...clump('cRx', 0.9, -2, -1, 5.13),
  ...clump('cRo', 0.95, -2, 0, 5.7),

  { name: 'fall0', bone: 'fall0', material: LEAF, shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 2.3, ry: 1.4, rz: 1.2 } },
  { name: 'fall1', bone: 'fall1', material: LEAF, shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 2.1, ry: 1.3, rz: 1.2 } },
  { name: 'fall2', bone: 'fall2', material: LEAF, shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 2.4, ry: 1.5, rz: 1.2 } },
]

/**
 * **A gust, not a metronome.** The phases are unevenly spaced on a 16-frame grid: the wind
 * builds over three frames, arrives over two, holds, and takes five to let go. Evenly spaced
 * phases would give a tree waving hello.
 *
 * The lag is the whole design. Trunk peaks at `gust`, branches at `peak`, clusters at `ease`
 * — so at any instant the tree is in three states at once, which is what a wave through a
 * structure looks like and what a synchronised sway never does.
 */
const PHASES = [
  { name: 'calm', at: 0 },
  { name: 'rise', at: 3 / 16 },
  { name: 'gust', at: 5 / 16 },
  { name: 'peak', at: 8 / 16 },
  { name: 'ease', at: 11 / 16 },
  { name: 'settle', at: 13 / 16 },
] as const

/** A leaf's window: full size while it falls, gone for the rest of the cycle. */
const fallScale = (from: number): number[] =>
  [0, 1, 2, 3, 4, 5].map((i) => {
    const d = (i - from + 6) % 6
    return d <= 2 ? 0 : -1
  })

const WIND: Track[] = [
  { bone: 'trunk1', channel: 'angle', keys: sway(0, 0.12, 0.3, 0.24, 0.06, -0.06) },
  { bone: 'trunk2', channel: 'angle', keys: sway(0, 0.18, 0.42, 0.36, 0.1, -0.08) },

  { bone: 'branchL', channel: 'angle', keys: sway(0, 0.1, 0.55, 1, 0.4, -0.12) },
  { bone: 'branchLt', channel: 'angle', keys: sway(-0.12, 0.05, 0.45, 1.15, 0.7, 0.02) },
  { bone: 'branchR', channel: 'angle', keys: sway(0.02, 0.14, 0.6, 1.05, 0.42, -0.1) },
  { bone: 'branchRt', channel: 'angle', keys: sway(-0.1, 0.08, 0.5, 1.2, 0.74, 0.04) },
  { bone: 'branchC', channel: 'angle', keys: sway(0, 0.12, 0.57, 1.02, 0.41, -0.11) },
  { bone: 'branchCt', channel: 'angle', keys: sway(-0.11, 0.06, 0.47, 1.18, 0.72, 0.03) },

  // Clusters peak a phase after the branches and each one is a hair out of step with its
  // neighbours. Identical keys across seven clusters would read as one sheet of foliage.
  { bone: 'cLo', channel: 'angle', keys: sway(-0.2, 0, 0.35, 1.05, 1.2, 0.3) },
  { bone: 'cLm', channel: 'angle', keys: sway(-0.16, 0.04, 0.4, 1.15, 1.1, 0.24) },
  { bone: 'cLt', channel: 'angle', keys: sway(-0.24, -0.04, 0.3, 0.95, 1.3, 0.36) },
  { bone: 'cC', channel: 'angle', keys: sway(-0.18, 0.02, 0.38, 1.1, 1.15, 0.28) },
  { bone: 'cRt', channel: 'angle', keys: sway(-0.22, -0.02, 0.32, 1, 1.26, 0.34) },
  { bone: 'cRm', channel: 'angle', keys: sway(-0.14, 0.06, 0.42, 1.18, 1.05, 0.22) },
  { bone: 'cRo', channel: 'angle', keys: sway(-0.19, 0.01, 0.36, 1.08, 1.18, 0.31) },
  { bone: 'cLx', channel: 'angle', keys: sway(-0.21, -0.01, 0.33, 1.02, 1.24, 0.33) },
  { bone: 'cCl', channel: 'angle', keys: sway(-0.17, 0.03, 0.39, 1.12, 1.12, 0.26) },
  { bone: 'cCr', channel: 'angle', keys: sway(-0.2, 0, 0.34, 1.06, 1.22, 0.32) },
  { bone: 'cRx', channel: 'angle', keys: sway(-0.15, 0.05, 0.41, 1.16, 1.08, 0.23) },

  // A crown lifts as well as leans — without it the foliage slides sideways like a curtain.
  { bone: 'trunk2', channel: 'y', keys: bob(0, -0.2, -0.6, -0.5, -0.15, 0.1) },
  { bone: 'cLm', channel: 'y', keys: bob(0.2, -0.1, -0.7, -1, -0.6, 0.1) },
  { bone: 'cRm', channel: 'y', keys: bob(0.15, -0.15, -0.75, -1, -0.55, 0.05) },
  { bone: 'cC', channel: 'y', keys: bob(0.1, -0.2, -0.8, -0.95, -0.5, 0.08) },
]

/**
 * The falling leaves. Each is a bone with a trajectory and a **scale window** — the machinery
 * that let the gorilla's plates arrive and leave in run 6, doing a different job: a part that
 * is not there is a part at scale 0, so "detached" needs no new concept.
 *
 * They are staggered a third of a cycle apart, and each drifts sideways while it tumbles,
 * because a leaf that falls straight down is a stone.
 */
const FALLING: Track[] = [
  { bone: 'fall0', channel: 'y', keys: [-0.4, 0.05, 0.5, 0.95, 0.95, 0.95] },
  { bone: 'fall0', channel: 'x', keys: [0, -0.1, 0.06, -0.14, -0.14, -0.14] },
  { bone: 'fall0', channel: 'angle', keys: [0, 0.35, -0.5, 0.9, 0.9, 0.9] },
  { bone: 'fall0', channel: 'scale', keys: fallScale(0) },

  { bone: 'fall1', channel: 'y', keys: [0.9, 0.9, -0.35, 0.1, 0.55, 0.9] },
  { bone: 'fall1', channel: 'x', keys: [0.12, 0.12, 0, 0.09, -0.05, 0.12] },
  { bone: 'fall1', channel: 'angle', keys: [-0.8, -0.8, 0, -0.4, 0.45, -0.8] },
  { bone: 'fall1', channel: 'scale', keys: fallScale(2) },

  { bone: 'fall2', channel: 'y', keys: [0.45, 0.85, 0.85, 0.85, -0.3, 0.05] },
  { bone: 'fall2', channel: 'x', keys: [-0.04, -0.11, -0.11, -0.11, 0, -0.08] },
  { bone: 'fall2', channel: 'angle', keys: [0.5, 0.85, 0.85, 0.85, 0, 0.3] },
  { bone: 'fall2', channel: 'scale', keys: fallScale(4) },
  // One of the three drifts in depth as well, so it passes behind a branch on its way down.
  { bone: 'fall2', channel: 'z', keys: [0.3, 0.6, 0.6, 0.6, -0.5, -0.1] },
]

const GAIT: Gait = { name: 'wind', phases: [...PHASES], tracks: [...WIND, ...FALLING] }

export const tree: Grammar = {
  name: 'tree',
  palette: PALETTE,
  skeleton: { bones: SKELETON },
  parts: PARTS,
  gait: GAIT,
}
