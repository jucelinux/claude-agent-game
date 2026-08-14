/**
 * **Harness fixture — not content.**
 *
 * A deliberately dumb two-legged stick. It exists so the determinism test, the baseline
 * test and the channel's null case have a subject, and for no other reason. The arthropod
 * grammar (`CLAUDE.md` §1) does not start until round zero is closed, and it must not
 * start by growing out of this file.
 *
 * stack — every number below is a fixture number, portable to nothing.
 */
import type { Grammar } from '../core/types.ts'

export const fixture: Grammar = {
  name: 'fixture',
  palette: {
    name: 'fixture-neutral',
    colors: [
      [0, 0, 0], // 0 — background, never painted by a part
      [40, 44, 52], // 1 — shell, darkest
      [78, 84, 96], // 2
      [126, 132, 148], // 3
      [186, 192, 205], // 4 — shell, lightest
      [14, 15, 20], // 5 — ink, darkest
      [26, 28, 36], // 6
      [40, 42, 52], // 7
      [58, 60, 74], // 8 — ink, lightest
    ],
    ramps: [
      { material: 'shell', indices: [1, 2, 3, 4] },
      { material: 'ink', indices: [5, 6, 7, 8] },
    ],
  },
  skeleton: {
    bones: [
      { name: 'trunk', parent: null, x: 0, y: 0, angle: 0 },
      { name: 'head', parent: 'trunk', x: 0, y: -14, angle: 0 },
      { name: 'legL', parent: 'trunk', x: -4, y: 6, angle: 0 },
      { name: 'legR', parent: 'trunk', x: 4, y: 6, angle: 0 },
    ],
  },
  parts: [
    { name: 'legR', bone: 'legR', material: 'shell', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 12, r: 2 } },
    { name: 'trunk', bone: 'trunk', material: 'shell', shape: { kind: 'ellipse', cx: 0, cy: -2, rx: 7, ry: 9 } },
    { name: 'head', bone: 'head', material: 'shell', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 5, ry: 5 } },
    { name: 'legL', bone: 'legL', material: 'shell', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 12, r: 2 } },
  ],
  gait: {
    name: 'walk',
    phases: [
      { name: 'contact', at: 0 },
      { name: 'down', at: 0.25 },
      { name: 'pass', at: 0.5 },
      { name: 'up', at: 0.75 },
    ],
    tracks: [
      { bone: 'legL', channel: 'angle', keys: [1, 0, -1, 0] },
      { bone: 'legR', channel: 'angle', keys: [-1, 0, 1, 0] },
      { bone: 'trunk', channel: 'y', keys: [0, 1, 0, -1] },
    ],
  },
}
