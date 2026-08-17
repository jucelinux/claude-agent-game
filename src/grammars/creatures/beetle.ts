/**
 * Run 3, element 1 — **the beetle**, three-quarter view.
 *
 * The articulation problem it owns: **volume**. A beetle is mostly one heavy dome, so
 * nothing here is carried by pose or by limb reach — if the body does not read as a curved
 * hard shell seen from above, there is nothing else to look at. The elytra are two plates
 * with a seam down the middle, and the seam is not drawn: it falls out of the render rule
 * that darkens whatever a part sits in front of.
 *
 * stack — every measurement. portable — plates as parts, and the seam as a consequence.
 */
import type { Grammar, Palette } from '../../core/types.ts'
import { PHASES, legBones, legParts, legTracks } from './quarter.ts'
import type { Row } from './quarter.ts'

const SHELL: Palette = {
  name: 'beetle',
  colors: [
    [0, 0, 0],
    [14, 18, 16],
    [24, 32, 26],
    [36, 48, 38],
    [50, 66, 50],
    [66, 86, 62],
    [86, 108, 74],
    [110, 134, 92],
    [140, 166, 116],
    [8, 9, 10],
    [14, 16, 18],
    [20, 23, 26],
    [28, 32, 36],
    [36, 41, 46],
    [46, 52, 58],
    [58, 64, 72],
    [72, 80, 88],
  ],
  ramps: [
    { material: 'shell', indices: [1, 2, 3, 4, 5, 6, 7, 8] },
    { material: 'ink', indices: [9, 10, 11, 12, 13, 14, 15, 16] },
  ],
}

const AT = [8, 3, -2] as const

/**
 * Front pair reach forward, middle pair sit square, **hind pair point at the rear** — the
 * human's first correction, and it is what a beetle actually looks like standing still. The
 * first pass fanned all three evenly, which gave a beetle three pairs of middle legs.
 */
const FAN = [-0.055, 0.01, 0.105] as const

const NEAR: Row = { side: 'N', at: AT, offset: 6, femur: 8, tibia: 6.5, width: 1.9, material: 'shell', splay: 0.03, fan: FAN, parent: 'body' }
/**
 * Same lamp, same shell: the far row is two steps down its own ramp, not a darker substance.
 *
 * It rises over the back, and **it stays that way because he approved it that way** — the
 * version he called very good is this one. Hanging the row downward was tried for one
 * commit on my own reading and reverted: from three-quarter the body is tall enough that a
 * downward far row disappears behind it entirely, six painted pixels out of forty, and
 * trading a row he liked for a row nobody can see is not a fix. The observation is his to
 * rule on, not mine to act on.
 */
const FARROW: Row = { side: 'F', at: AT, offset: -6.5, femur: 8, tibia: 6.5, width: 1.9, material: 'shell', shift: -2, splay: 0.5, fan: FAN.map((f) => -f), parent: 'body' }

/**
 * Two gaits, and this round exists to choose between them by eye.
 *
 * **Tripod** — three legs planted, three swinging, always. It is what a beetle does at
 * speed and it is what the arthropod grammar already knew.
 *
 * **Wave** — front pair, then middle, then hind, a quarter cycle apart. The human watched
 * video and read a wave, and he is describing the metachronal gait insects fall into when
 * they walk slowly. One note for him rather than an argument: the literature usually has
 * the wave running back to front; the direction here is one number, so flipping it and
 * looking again costs nothing.
 */
const TRIPOD = [
  ...legTracks(['hipN0', 'hipN2', 'hipF1'], 1),
  ...legTracks(['hipN1', 'hipF0', 'hipF2'], -1),
]

const WAVE = [
  ...legTracks(['hipN0', 'hipF0'], 1, 1, 0.7, 0),
  ...legTracks(['hipN1', 'hipF1'], 1, 1, 0.7, 1),
  ...legTracks(['hipN2', 'hipF2'], 1, 1, 0.7, 2),
]

export const beetle: Grammar = {
  name: 'beetle',
  palette: SHELL,
  skeleton: {
    bones: [
      { name: 'body', parent: null, x: 0, y: 0, angle: 0 },
      { name: 'head', parent: 'body', x: 13, y: 0, angle: 0 },
      // **Forward and up.** They pointed at the floor, and the reason is a sign: a capsule
      // grows down-screen at angle zero, so anything meant to rise has to sit past a half
      // turn. Everything else on this body hangs downward and inherited the habit.
      // From three-quarter the far antenna carries more of the lift and the near one more
      // of the reach, which is what keeps them from reading as one thick line.
      { name: 'antL', parent: 'head', x: 3, y: -2, angle: 0.645 },
      { name: 'antR', parent: 'head', x: 3, y: 2, angle: 0.695 },
      ...legBones(FARROW),
      ...legBones(NEAR),
    ],
  },
  parts: [
    ...legParts(FARROW),
    // The dome first, then the two plates on top of it: the seam is the render rule
    // darkening the plate behind, not a line anybody drew.
    { name: 'abdomen', bone: 'body', material: 'shell', shape: { kind: 'ellipse', cx: -5, cy: 0, rx: 12, ry: 8.5 } },
    { name: 'elytronF', bone: 'body', material: 'shell', shape: { kind: 'ellipse', cx: -5, cy: -3.6, rx: 10, ry: 4.6 } },
    { name: 'elytronN', bone: 'body', material: 'shell', shape: { kind: 'ellipse', cx: -5, cy: 3.6, rx: 10, ry: 4.6 } },
    { name: 'thorax', bone: 'body', material: 'shell', shape: { kind: 'ellipse', cx: 7, cy: 0, rx: 6.5, ry: 6 } },
    { name: 'head', bone: 'head', material: 'shell', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 4.4, ry: 4 } },
    { name: 'antL', bone: 'antL', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 0.9 } },
    { name: 'antR', bone: 'antR', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 0.9 } },
    ...legParts(NEAR),
  ],
  gait: {
    name: 'tripod-walk',
    phases: [...PHASES],
    tracks: [
      { bone: 'body', channel: 'y', keys: [0, -1, 0, -1] },
      { bone: 'antL', channel: 'angle', keys: [0.3, 0.1, -0.3, -0.1] },
      { bone: 'antR', channel: 'angle', keys: [-0.25, 0, 0.3, 0] },
      ...TRIPOD,
    ],
  },
}


/** The same beetle, walking as a wave instead of a tripod. */
export const beetleWave: Grammar = {
  ...beetle,
  name: 'beetle-wave',
  gait: { ...beetle.gait, name: 'metachronal-walk', tracks: [...beetle.gait.tracks.filter((t) => !t.bone.startsWith('hip') && !t.bone.startsWith('tib')), ...WAVE] },
}
