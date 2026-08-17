/**
 * Run 3, element 3 — **the scorpion**, three-quarter view.
 *
 * The articulation problem it owns: **a long chain with follow-through**. The tail is six
 * segments carried over the back, and it is the first thing in this project where the
 * animation has to look like mass moving through a chain rather than parts rotating on
 * cue. Each segment lags the one before it by a quarter of the cycle; without the lag the
 * tail whips like rubber, and with too much of it the tail comes loose from the body.
 *
 * Eight legs, four a side, and the same tripod-ish alternation split into two groups of
 * four — which is what a scorpion actually does.
 *
 * stack — every measurement. portable — the lagged chain, and the pincer as arm plus claw.
 */
import type { Grammar, Palette } from '../../core/types.ts'
import { PHASES, legBones, legParts, legTracks } from './quarter.ts'
import type { Row } from './quarter.ts'

const AMBER: Palette = {
  name: 'scorpion',
  colors: [
    [0, 0, 0],
    [28, 16, 14],
    [46, 26, 20],
    [68, 40, 26],
    [94, 58, 34],
    [124, 80, 44],
    [156, 108, 58],
    [188, 142, 82],
    [216, 180, 118],
    [10, 8, 9],
    [16, 13, 14],
    [23, 19, 20],
    [31, 26, 27],
    [40, 34, 34],
    [51, 44, 43],
    [64, 56, 54],
    [78, 69, 66],
  ],
  ramps: [
    { material: 'shell', indices: [1, 2, 3, 4, 5, 6, 7, 8] },
    { material: 'ink', indices: [9, 10, 11, 12, 13, 14, 15, 16] },
  ],
}

const AT = [7, 3, -1, -5] as const

const NEAR: Row = { side: 'N', at: AT, offset: 5, femur: 7, tibia: 6, width: 1.5, material: 'shell', splay: 0.04, fan: [-0.08, -0.03, 0.03, 0.09], parent: 'body' }
const FARROW: Row = { side: 'F', at: AT, offset: -6, femur: 7, tibia: 6, width: 1.5, material: 'shell', shift: -2, splay: 0.5, fan: [0.08, 0.03, -0.03, -0.09], parent: 'body' }

/** Six segments, each lagging the one in front by a quarter cycle. */
const TAIL = [0, 1, 2, 3, 4, 5]
const SWAY = [0.6, 0.2, -0.6, -0.2]
const lag = (by: number): number[] => SWAY.map((_, i) => SWAY[((i - by) % 4 + 4) % 4] as number)

export const scorpion: Grammar = {
  name: 'scorpion',
  palette: AMBER,
  skeleton: {
    bones: [
      { name: 'body', parent: null, x: 0, y: 0, angle: 0 },
      { name: 'head', parent: 'body', x: 9, y: 0, angle: 0 },
      // Pincers: an arm forward, a claw at the end of it.
      { name: 'pinF', parent: 'body', x: 10, y: -4, angle: 0.70 },
      { name: 'pinFc', parent: 'pinF', x: 0, y: 6, angle: -0.12 },
      { name: 'pinN', parent: 'body', x: 10, y: 4, angle: 0.78 },
      { name: 'pinNc', parent: 'pinN', x: 0, y: 6.5, angle: -0.12 },
      // The tail leaves the abdomen pointing up and back, then curves forward over it.
      ...TAIL.map((i) => ({
        name: `tail${i}`,
        parent: i === 0 ? 'body' : `tail${i - 1}`,
        x: i === 0 ? -12 : 0,
        y: i === 0 ? -1 : 4.2,
        // Positive, and the sign is the whole shape: the first pass curved the chain
        // backwards and produced a tail arcing away from the body instead of over it.
        angle: i === 0 ? 0.52 : 0.05,
      })),
      ...legBones(FARROW),
      ...legBones(NEAR),
    ],
  },
  parts: [
    ...legParts(FARROW),
    { name: 'pinF', bone: 'pinF', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 1.5 } },
    { name: 'pinFc', bone: 'pinFc', material: 'ink', shape: { kind: 'ellipse', cx: 0, cy: 2.5, rx: 2.2, ry: 3.4 } },
    ...TAIL.map((i) => ({
      name: `tail${i}`,
      bone: `tail${i}`,
      material: 'shell',
      shape: { kind: 'capsule' as const, x0: 0, y0: 0, x1: 0, y1: 4.2, r: 2.4 - i * 0.22 },
    })),
    { name: 'stinger', bone: 'tail5', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 4, x1: 0, y1: 8, r: 1.1 } },
    { name: 'abdomen', bone: 'body', material: 'shell', shape: { kind: 'ellipse', cx: -6, cy: 0, rx: 8, ry: 6.5 } },
    { name: 'thorax', bone: 'body', material: 'shell', shape: { kind: 'ellipse', cx: 4, cy: 0, rx: 7, ry: 6 } },
    { name: 'head', bone: 'head', material: 'shell', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 3.4, ry: 3.2 } },
    { name: 'pinN', bone: 'pinN', material: 'shell', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6.5, r: 1.8 } },
    { name: 'pinNc', bone: 'pinNc', material: 'shell', shape: { kind: 'ellipse', cx: 0, cy: 2.8, rx: 2.6, ry: 3.8 } },
    ...legParts(NEAR),
  ],
  gait: {
    name: 'eight-leg-walk',
    phases: [...PHASES],
    tracks: [
      { bone: 'body', channel: 'y', keys: [0, -1, 0, -1] },
      { bone: 'pinN', channel: 'angle', keys: [0.14, 0, -0.14, 0] },
      { bone: 'pinF', channel: 'angle', keys: [-0.12, 0, 0.12, 0] },
      // The lag is the whole trick: segment n follows segment n-1 a quarter cycle later.
      ...TAIL.map((i) => ({ bone: `tail${i}`, channel: 'angle' as const, keys: lag(i) })),
      ...legTracks(['hipN0', 'hipN2', 'hipF1', 'hipF3'], 1, 0.9),
      ...legTracks(['hipN1', 'hipN3', 'hipF0', 'hipF2'], -1, 0.9),
    ],
  },
}
