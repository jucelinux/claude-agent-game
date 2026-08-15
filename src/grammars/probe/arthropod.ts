/**
 * The arthropod, authored **once** and sampled by three idioms (`BACKLOG.md` → next round,
 * samples A, B, C). Geometry is held constant on purpose: the round's question is which
 * *idiom* survives motion, so the body must not move between samples or the comparison
 * measures two things at once.
 *
 * Scaling is honest here and it is worth saying why: parts are analytic shapes sampled per
 * pixel in bone space, so `body.scale` **re-rasterises** at the target size — it never
 * resamples a bitmap. A 32 px sample and a 64 px sample are two renders of one grammar,
 * not one render and a resize.
 *
 * portable — the tripod gait, the near/far depth split, the two-segment leg.
 * stack — every pixel measurement below.
 */
import type { Grammar, Palette, Bone, Part, Track } from '../../core/types.ts'

/**
 * Hip stations along the body, front to back. Three per side: the arthropod bargain.
 * All three sit **under the thorax** (half-width 6), never under the abdomen — the first
 * pass hung the rear pair off the abdomen and the body then ate them: 3 painted pixels
 * against the near legs' 30, with one leg vanishing entirely in one frame. A leg the body
 * swallows is a leg that costs render time and buys nothing. portable.
 */
const HIPS = [4, 0, -4] as const

/** Femur length. The tibia is derived from it, never chosen separately. */
const FEMUR = 6
const TIBIA = Math.round(FEMUR * 0.85)

type Side = 'N' | 'F'

function legBones(side: Side): Bone[] {
  const bones: Bone[] = []
  for (let i = 0; i < HIPS.length; i++) {
    const x = HIPS[i] as number
    // Front legs reach forward, back legs trail: the rest pose already reads as a walk.
    const splay = (i - 1) * -0.04
    bones.push({ name: `hip${side}${i}`, parent: 'thorax', x, y: 4, angle: splay })
    bones.push({ name: `tib${side}${i}`, parent: `hip${side}${i}`, x: 0, y: FEMUR, angle: -0.09 + splay * 0.5 })
  }
  return bones
}

const BONES: Bone[] = [
  { name: 'thorax', parent: null, x: 0, y: 0, angle: 0 },
  { name: 'abdomen', parent: 'thorax', x: -9, y: 1, angle: 0 },
  { name: 'head', parent: 'thorax', x: 9, y: -1, angle: 0 },
  { name: 'antA', parent: 'head', x: 3, y: -3, angle: -0.1 },
  { name: 'antB', parent: 'head', x: 3, y: -2, angle: -0.03 },
  // Far side first so it is behind everything the near side owns.
  ...legBones('F'),
  ...legBones('N'),
]

function legParts(side: Side, material: string): Part[] {
  const parts: Part[] = []
  const width = side === 'N' ? 1.7 : 1.5
  for (let i = 0; i < HIPS.length; i++) {
    parts.push({
      name: `femur${side}${i}`,
      bone: `hip${side}${i}`,
      material,
      shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: FEMUR, r: width },
    })
    parts.push({
      name: `tibia${side}${i}`,
      bone: `tib${side}${i}`,
      material,
      shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: TIBIA, r: width * 0.75 },
    })
  }
  return parts
}

/**
 * Paint order is depth. The far legs go down in `ink` before the body and read as shadow;
 * the near legs go on top in `chitin`. Two materials buy a third dimension with no extra
 * tone budget — and the tone budget is the knob this round is holding open.
 */
/**
 * **The abdomen is segments, so it is modelled as segments.**
 *
 * The first pass drew one ellipse and hung two dark capsules on it as fake ridges, and the
 * moment `outline.inner` existed those hand-drawn seams doubled up with the generated ones
 * and the body turned into stripes. The fix was not to tune the seams — it was to notice
 * that an arthropod's abdomen genuinely *is* overlapping plates, and that modelling them
 * makes the ridge fall out of the render rule for free.
 *
 * Rear plate first, front plate last: the piece in front darkens the piece behind, so
 * every ridge faces backwards, which is the direction a real one faces. portable.
 */
const ABDOMEN: Part[] = [
  { name: 'abdC', bone: 'abdomen', material: 'chitin', shape: { kind: 'ellipse', cx: -6, cy: 0.8, rx: 3.6, ry: 4.2 } },
  { name: 'abdB', bone: 'abdomen', material: 'chitin', shape: { kind: 'ellipse', cx: -2.5, cy: 0.3, rx: 4.6, ry: 5.2 } },
  { name: 'abdA', bone: 'abdomen', material: 'chitin', shape: { kind: 'ellipse', cx: 2, cy: 0, rx: 5.2, ry: 5.6 } },
]

const PARTS: Part[] = [
  ...legParts('F', 'ink'),
  ...ABDOMEN,
  { name: 'thorax', bone: 'thorax', material: 'chitin', shape: { kind: 'ellipse', cx: 0, cy: -1, rx: 6, ry: 5 } },
  { name: 'head', bone: 'head', material: 'chitin', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 4, ry: 4 } },
  { name: 'antA', bone: 'antA', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -7, r: 0.8 } },
  { name: 'antB', bone: 'antB', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -5, r: 0.8 } },
  ...legParts('N', 'chitin'),
]

/**
 * The **alternating tripod**: three legs planted while three swing, always. It is the real
 * gait of a six-legged walker and the reason an arthropod is good territory — the phasing
 * is documented biology, not invention, so the timing is a fact to be got right rather
 * than a taste to be guessed at.
 *
 * Tripod 1: near-front, near-back, far-middle. Tripod 2: the other three.
 */
const TRIPOD_1 = ['hipN0', 'hipN2', 'hipF1'] as const
const TRIPOD_2 = ['hipN1', 'hipF0', 'hipF2'] as const

function gaitTracks(): Track[] {
  const tracks: Track[] = [
    // The body rises over the planted tripod and drops between them. Twice per cycle.
    { bone: 'thorax', channel: 'y', keys: [0, -1, 0, -1] },
    // The abdomen drags a beat behind the thorax: mass has opinions.
    { bone: 'abdomen', channel: 'angle', keys: [0.18, 0, -0.18, 0] },
    { bone: 'antA', channel: 'angle', keys: [0.35, 0.1, -0.35, -0.1] },
    { bone: 'antB', channel: 'angle', keys: [0.25, 0, -0.3, 0] },
  ]
  for (const hip of TRIPOD_1) {
    tracks.push({ bone: hip, channel: 'angle', keys: [1, 0, -1, 0] })
    tracks.push({ bone: `tib${hip.slice(3)}`, channel: 'angle', keys: [0, -0.7, 0, 0.7] })
  }
  for (const hip of TRIPOD_2) {
    tracks.push({ bone: hip, channel: 'angle', keys: [-1, 0, 1, 0] })
    tracks.push({ bone: `tib${hip.slice(3)}`, channel: 'angle', keys: [0, 0.7, 0, -0.7] })
  }
  return tracks
}

export function arthropod(name: string, palette: Palette): Grammar {
  return {
    name,
    palette,
    skeleton: { bones: BONES },
    parts: PARTS,
    gait: {
      name: 'tripod-walk',
      phases: [
        { name: 'plant', at: 0 },
        { name: 'load', at: 0.25 },
        { name: 'lift', at: 0.5 },
        { name: 'reach', at: 0.75 },
      ],
      tracks: gaitTracks(),
    },
  }
}
