/**
 * Run 3, element 2 — **the mantis**, three-quarter view.
 *
 * The articulation problem it owns: **a gait that is not the tripod**. Four legs walk and
 * two are held up and forward, so the six-legged tripod the arthropod grammar knows does
 * not apply — four walkers move in diagonal pairs, the way a horse trots, and the raptorial
 * arms are carried rather than used. A grammar that can only produce one gait is a grammar
 * that produces one animal.
 *
 * stack — every measurement. portable — the diagonal pair, and limbs that are carried.
 */
import type { Grammar, Palette } from '../../core/types.ts'
import { PHASES, legBones, legParts, legTracks } from './quarter.ts'
import type { Row } from './quarter.ts'

const GREEN: Palette = {
  name: 'mantis',
  colors: [
    [0, 0, 0],
    [16, 26, 18],
    [26, 42, 26],
    [38, 60, 34],
    [52, 80, 44],
    [70, 102, 54],
    [92, 126, 66],
    [120, 152, 84],
    [154, 180, 108],
    [8, 10, 9],
    [13, 17, 14],
    [19, 24, 20],
    [26, 33, 27],
    [34, 43, 35],
    [44, 55, 45],
    [56, 68, 56],
    [70, 84, 68],
  ],
  ramps: [
    { material: 'shell', indices: [1, 2, 3, 4, 5, 6, 7, 8] },
    { material: 'ink', indices: [9, 10, 11, 12, 13, 14, 15, 16] },
  ],
}

const AT = [2, -6] as const

const NEAR: Row = { side: 'N', at: AT, offset: 4, femur: 9, tibia: 8, width: 1.5, material: 'shell', splay: 0.05, lean: 0.07, parent: 'body' }
const FARROW: Row = { side: 'F', at: AT, offset: -5, femur: 9, tibia: 8, width: 1.5, material: 'ink', splay: 0.5, lean: -0.07, parent: 'body' }

export const mantis: Grammar = {
  name: 'mantis',
  palette: GREEN,
  skeleton: {
    bones: [
      { name: 'body', parent: null, x: 0, y: 0, angle: 0 },
      { name: 'head', parent: 'body', x: 13, y: 0, angle: 0 },
      { name: 'antL', parent: 'head', x: 2, y: -2, angle: -0.19 },
      { name: 'antR', parent: 'head', x: 2, y: 2, angle: 0.19 },
      // Carried, not walking: up and forward, then folded back on itself.
      { name: 'raptF', parent: 'body', x: 9, y: -3, angle: 0.60 },
      { name: 'raptFb', parent: 'raptF', x: 0, y: 7, angle: -0.31 },
      { name: 'raptN', parent: 'body', x: 9, y: 3, angle: 0.63 },
      { name: 'raptNb', parent: 'raptN', x: 0, y: 8, angle: -0.33 },
      ...legBones(FARROW),
      ...legBones(NEAR),
    ],
  },
  parts: [
    ...legParts(FARROW),
    { name: 'raptF', bone: 'raptF', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 1.6 } },
    { name: 'raptFb', bone: 'raptFb', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.5, r: 1.3 } },
    { name: 'abdomen', bone: 'body', material: 'shell', shape: { kind: 'ellipse', cx: -10, cy: 0, rx: 10, ry: 4.6 } },
    { name: 'thorax', bone: 'body', material: 'shell', shape: { kind: 'capsule', x0: -1, y0: 0, x1: 9, y1: 0, r: 3.2 } },
    { name: 'head', bone: 'head', material: 'shell', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 3.6, ry: 3 } },
    { name: 'antL', bone: 'antL', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 0.8 } },
    { name: 'antR', bone: 'antR', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 0.8 } },
    { name: 'raptN', bone: 'raptN', material: 'shell', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 1.9 } },
    { name: 'raptNb', bone: 'raptNb', material: 'shell', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 1.5 } },
    ...legParts(NEAR),
  ],
  gait: {
    name: 'diagonal-walk',
    phases: [...PHASES],
    tracks: [
      { bone: 'body', channel: 'y', keys: [0, -1, 0, -1] },
      { bone: 'antL', channel: 'angle', keys: [0.3, 0.1, -0.3, -0.1] },
      { bone: 'antR', channel: 'angle', keys: [-0.28, 0, 0.3, 0] },
      // The arms are held. They breathe with the body and never take a step.
      { bone: 'raptN', channel: 'angle', keys: [0.12, 0, -0.12, 0] },
      { bone: 'raptNb', channel: 'angle', keys: [-0.1, 0.06, 0.1, -0.06] },
      { bone: 'raptF', channel: 'angle', keys: [0.1, 0, -0.1, 0] },
      // Diagonal pairs: front-near with back-far, then the other two.
      ...legTracks(['hipN0', 'hipF1'], 1, 1.15, 0.8),
      ...legTracks(['hipN1', 'hipF0'], -1, 1.15, 0.8),
    ],
  },
}
