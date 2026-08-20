/**
 * **The keeper of the orrery.** A small body needs one dominant shape, so the coat is the mass
 * and the pale astronomical mask is the read. Brass is structural trim; vermilion appears only
 * on the trailing strap, which turns locomotion and the room's rotation into visible forces.
 *
 * Five clips share one skeleton and one set of parts. The room changes the keeper's physics,
 * never its pixels: motion state selects a grammar and distance selects the run frame.
 */
import type { Bone, Gait, Grammar, Palette, Part } from '../../core/types.ts'

const ORRERY_KEEPER: Palette = {
  name: 'orrery-keeper',
  colors: [
    [0, 0, 0],
    [12, 24, 42], [18, 47, 63], [27, 77, 85], [48, 111, 108], [91, 151, 134],
    [48, 31, 18], [91, 60, 25], [142, 101, 39], [196, 151, 64], [238, 205, 118],
    [44, 45, 54], [91, 91, 98], [151, 148, 142], [215, 207, 184], [249, 239, 205],
    [57, 15, 18], [106, 27, 25], [162, 43, 31], [213, 73, 43], [244, 131, 72],
    [5, 10, 20], [9, 19, 31], [15, 31, 45], [24, 46, 58], [36, 65, 72],
  ],
  ramps: [
    { material: 'coat', indices: [1, 2, 3, 4, 5] },
    { material: 'brass', indices: [6, 7, 8, 9, 10] },
    { material: 'bone', indices: [11, 12, 13, 14, 15] },
    { material: 'signal', indices: [16, 17, 18, 19, 20] },
    { material: 'ink', indices: [21, 22, 23, 24, 25] },
  ],
}

const bones: readonly Bone[] = [
  { name: 'hips', parent: null, x: 0, y: 0, z: 0, angle: 0 },
  { name: 'torso', parent: 'hips', x: 0, y: -8, z: 0, angle: 0 },
  { name: 'head', parent: 'torso', x: 0.5, y: -10, z: 0, angle: 0 },
  // Coat panels sit outside the hip joints. Besides opening the silhouette, the separation says
  // they are two pieces of cloth rather than a false mirrored limb pair.
  { name: 'coatF', parent: 'hips', x: -4, y: -1, z: 2.4, angle: 0 },
  { name: 'coatN', parent: 'hips', x: 4, y: -1, z: -2.4, angle: 0 },
  { name: 'armF', parent: 'torso', x: -3.6, y: -5, z: 3.6, angle: 0.03 },
  { name: 'armN', parent: 'torso', x: 0, y: -5, z: -3.6, angle: -0.03 },
  { name: 'legFU', parent: 'hips', x: -1.5, y: 1, z: 2.6, angle: 0 },
  { name: 'legFL', parent: 'legFU', x: 0, y: 6.5, z: 0, angle: 0 },
  { name: 'legNU', parent: 'hips', x: 1.5, y: 1, z: -2.6, angle: 0 },
  { name: 'legNL', parent: 'legNU', x: 0, y: 6.5, z: 0, angle: 0 },
  { name: 'strap', parent: 'torso', x: -3, y: -5, z: -3.8, angle: 0.42 },
]

const parts: readonly Part[] = [
  { weld: true, name: 'coatF', bone: 'coatF', material: 'coat', shift: -1, shape: { kind: 'lobed', cx: -2, cy: 5, rx: 4.2, ry: 8, rz: 2.8, lobes: 4, depth: 0.13, phase: 0.7 } },
  { weld: true, name: 'armF', bone: 'armF', material: 'coat', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: -1.4, y1: 8.5, r: 2.1, r1: 1.6 } },
  { name: 'handF', bone: 'armF', material: 'bone', shift: -1, shape: { kind: 'ellipse', cx: -1.4, cy: 9, rx: 1.8, ry: 2, rz: 1.6 } },
  { weld: true, name: 'legFU', bone: 'legFU', material: 'coat', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.5, r: 2.4, r1: 2 } },
  { weld: true, name: 'legFL', bone: 'legFL', material: 'bone', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 1.9, r1: 1.5 } },
  { weld: true, name: 'bootF', bone: 'legFL', material: 'brass', shift: -1, shape: { kind: 'capsule', x0: -0.5, y0: 6.2, x1: 2.4, y1: 6.2, r: 1.7, r1: 1.3 } },
  { weld: true, name: 'coatN', bone: 'coatN', material: 'coat', shape: { kind: 'lobed', cx: 2, cy: 5, rx: 4.2, ry: 8, rz: 2.8, lobes: 4, depth: 0.13, phase: 2.2 } },
  { weld: true, name: 'torso', bone: 'torso', material: 'coat', shape: { kind: 'lobed', cx: 0, cy: 1.5, rx: 6.2, ry: 9, rz: 4.4, lobes: 5, depth: 0.08, phase: 1.4 } },
  { name: 'collar', bone: 'torso', material: 'brass', z: -4.5, marking: true, shape: { kind: 'capsule', x0: -4.3, y0: -5.3, x1: 4.3, y1: -5.3, r: 1 } },
  { name: 'crossStrap', bone: 'torso', material: 'brass', z: -4.6, marking: true, shape: { kind: 'capsule', x0: -4.2, y0: -4, x1: 3.4, y1: 6, r: 0.75 } },
  { weld: true, name: 'armN', bone: 'armN', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: -0.7, y1: 8.5, r: 2.1, r1: 1.6 } },
  { weld: true, name: 'handN', bone: 'armN', material: 'bone', shape: { kind: 'ellipse', cx: -0.7, cy: 9, rx: 1.8, ry: 2, rz: 1.6 } },
  { weld: true, name: 'legNU', bone: 'legNU', material: 'coat', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.5, r: 2.4, r1: 2 } },
  { weld: true, name: 'legNL', bone: 'legNL', material: 'bone', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 1.9, r1: 1.5 } },
  { weld: true, name: 'bootN', bone: 'legNL', material: 'brass', shape: { kind: 'capsule', x0: -0.5, y0: 6.2, x1: 2.4, y1: 6.2, r: 1.7, r1: 1.3 } },
  { weld: true, name: 'mask', bone: 'head', material: 'bone', shape: { kind: 'ellipse', cx: 0, cy: -0.6, rx: 5.8, ry: 6.5, rz: 4.8 } },
  { name: 'visor', bone: 'head', material: 'coat', z: -5, marking: true, shape: { kind: 'ellipse', cx: 1.2, cy: -0.8, rx: 3.5, ry: 2.4, rz: 0.6 } },
  { name: 'visorGlint', bone: 'head', material: 'bone', z: -5.7, marking: true, shape: { kind: 'capsule', x0: 0.2, y0: -2, x1: 2.2, y1: -2.3, r: 0.55 } },
  { weld: true, name: 'strap', bone: 'strap', material: 'signal', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 0.9, r1: 0.45 } },
]

const phases = [
  { name: 'contact', at: 0 }, { name: 'pass', at: 0.25 },
  { name: 'contact2', at: 0.5 }, { name: 'pass2', at: 0.75 },
] as const

const IDLE: Gait = {
  name: 'idle', phases,
  tracks: [
    { bone: 'hips', channel: 'y', keys: [0, -0.15, 0, 0.15] },
    { bone: 'head', channel: 'angle', keys: [-0.04, 0, 0.04, 0] },
    { bone: 'strap', channel: 'angle', keys: [-0.08, 0.03, 0.08, -0.03] },
  ],
}

const RUN: Gait = {
  name: 'run', phases,
  tracks: [
    { bone: 'hips', channel: 'y', keys: [0, -0.35, 0, -0.35] },
    { bone: 'torso', channel: 'angle', keys: [0.08, 0.1, 0.08, 0.1] },
    { bone: 'legNU', channel: 'angle', keys: [0.72, 0, -0.72, 0] },
    { bone: 'legNL', channel: 'angle', keys: [0.1, 0.35, 0.12, 0.55] },
    { bone: 'legFU', channel: 'angle', keys: [-0.72, 0, 0.72, 0] },
    { bone: 'legFL', channel: 'angle', keys: [0.12, 0.55, 0.1, 0.35] },
    { bone: 'armN', channel: 'angle', keys: [-0.6, 0, 0.6, 0] },
    { bone: 'armF', channel: 'angle', keys: [0.6, 0, -0.6, 0] },
    { bone: 'strap', channel: 'angle', keys: [0.7, 0.5, 0.72, 0.55] },
  ],
}

// A non-wrapping eight-frame clip has seven intervals; 4/7 is a real frame, while 1/2 is not.
const AIR_PHASES = [{ name: 'take', at: 0 }, { name: 'hold', at: 4 / 7 }, { name: 'end', at: 1 }] as const
const RISE: Gait = {
  name: 'rise', phases: AIR_PHASES, wrap: false,
  tracks: [
    { bone: 'torso', channel: 'angle', keys: [-0.08, -0.04, 0] },
    { bone: 'legNU', channel: 'angle', keys: [-0.42, -0.36, -0.28] },
    { bone: 'legNL', channel: 'angle', keys: [0.62, 0.48, 0.3] },
    { bone: 'legFU', channel: 'angle', keys: [0.4, 0.32, 0.24] },
    { bone: 'legFL', channel: 'angle', keys: [0.5, 0.42, 0.3] },
    { bone: 'strap', channel: 'angle', keys: [0.74, 0.68, 0.55] },
  ],
}
const FALL: Gait = {
  name: 'fall', phases: AIR_PHASES, wrap: false,
  tracks: [
    { bone: 'torso', channel: 'angle', keys: [0, 0.06, 0.1] },
    { bone: 'legNU', channel: 'angle', keys: [-0.22, -0.12, 0.05] },
    { bone: 'legNL', channel: 'angle', keys: [0.3, 0.4, 0.52] },
    { bone: 'legFU', channel: 'angle', keys: [0.24, 0.12, -0.05] },
    { bone: 'legFL', channel: 'angle', keys: [0.3, 0.42, 0.52] },
    { bone: 'strap', channel: 'angle', keys: [0.5, 0.2, -0.15] },
  ],
}
const BRACE: Gait = {
  name: 'brace', phases,
  tracks: [
    { bone: 'hips', channel: 'scaleY', keys: [-0.1, -0.16, -0.1, -0.14] },
    { bone: 'torso', channel: 'angle', keys: [-0.16, -0.2, -0.16, -0.2] },
    { bone: 'armN', channel: 'angle', keys: [-0.82, -0.88, -0.82, -0.88] },
    { bone: 'armF', channel: 'angle', keys: [0.78, 0.84, 0.78, 0.84] },
    { bone: 'legNU', channel: 'angle', keys: [0.38, 0.44, 0.38, 0.44] },
    { bone: 'legFU', channel: 'angle', keys: [-0.38, -0.44, -0.38, -0.44] },
    { bone: 'strap', channel: 'angle', keys: [0.9, 0.7, 0.9, 0.7] },
  ],
}

const of = (name: string, gait: Gait): Grammar => ({
  name, palette: ORRERY_KEEPER, skeleton: { bones }, parts, gait,
})

export const keeperIdle = of('keeper-idle', IDLE)
export const keeperRun = of('keeper-run', RUN)
export const keeperRise = of('keeper-rise', RISE)
export const keeperFall = of('keeper-fall', FALL)
export const keeperBrace = of('keeper-brace', BRACE)
export const KEEPER: readonly Grammar[] = [keeperIdle, keeperRun, keeperRise, keeperFall, keeperBrace]
