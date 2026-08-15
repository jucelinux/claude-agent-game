/**
 * D — the **declared overshoot** (`TASTE.md` §1b, `BACKLOG.md` → next round).
 *
 * A humanoid with cloth, in the Comix Zone direction. It changes subject *and* idiom on
 * purpose, and my own recorded prediction (`TASTE.md` §2b, H1) says it fails visibly:
 * Comix Zone redraws every frame with a varying line weight, and this engine transforms
 * anchored parts. A trailing scarf built from three rigid capsules is the closest this
 * grammar can come, and "closest" is exactly what is on trial.
 *
 * **If it does not fail, H1 is wrong and that is worth more than the sprite.**
 *
 * stack — all of it, and it is disposable.
 */
import type { Grammar, Palette } from '../../core/types.ts'

const CLOTH: Palette = {
  name: 'probe-d-ink',
  colors: [
    [0, 0, 0],
    [24, 26, 44],
    [40, 46, 74],
    [62, 72, 108],
    [98, 112, 152],
    [92, 54, 42],
    [140, 88, 64],
    [190, 134, 98],
    [232, 188, 148],
    [10, 10, 18],
    [18, 18, 30],
    [28, 28, 44],
    [40, 40, 60],
  ],
  ramps: [
    { material: 'cloth', indices: [1, 2, 3, 4] },
    { material: 'skin', indices: [5, 6, 7, 8] },
    { material: 'ink', indices: [9, 10, 11, 12] },
  ],
}

/** One phase of delay per scarf segment: the trail is timing, not shape. */
function shift(keys: readonly number[], by: number): number[] {
  return keys.map((_, i) => keys[(i - by + keys.length * 2) % keys.length] as number)
}

const SCARF_KEYS = [0.5, 0.15, -0.5, -0.15]

export const probeD: Grammar = {
  name: 'probe-d',
  palette: CLOTH,
  skeleton: {
    bones: [
      { name: 'pelvis', parent: null, x: 0, y: 0, angle: 0 },
      { name: 'torso', parent: 'pelvis', x: 0, y: -1, angle: 0 },
      { name: 'head', parent: 'torso', x: 0, y: -15, angle: 0 },
      // Far limbs hang off the torso before the near ones, so paint order is depth.
      { name: 'armFU', parent: 'torso', x: -1, y: -12, angle: 0.02 },
      { name: 'armFL', parent: 'armFU', x: 0, y: 7, angle: 0.06 },
      { name: 'legFU', parent: 'pelvis', x: -1, y: 1, angle: 0 },
      { name: 'legFL', parent: 'legFU', x: 0, y: 8, angle: 0.02 },
      { name: 'legNU', parent: 'pelvis', x: 2, y: 1, angle: 0 },
      { name: 'legNL', parent: 'legNU', x: 0, y: 8, angle: 0.02 },
      { name: 'scarf0', parent: 'torso', x: -2, y: -13, angle: 0.22 },
      { name: 'scarf1', parent: 'scarf0', x: 0, y: 6, angle: 0.06 },
      { name: 'scarf2', parent: 'scarf1', x: 0, y: 5, angle: 0.06 },
      { name: 'armNU', parent: 'torso', x: 2, y: -12, angle: -0.02 },
      { name: 'armNL', parent: 'armNU', x: 0, y: 7, angle: -0.06 },
    ],
  },
  parts: [
    { name: 'armFU', bone: 'armFU', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 2 } },
    { name: 'armFL', bone: 'armFL', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 1.7 } },
    { name: 'legFU', bone: 'legFU', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 2.4 } },
    { name: 'legFL', bone: 'legFL', material: 'ink', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 2 } },
    { name: 'legNU', bone: 'legNU', material: 'cloth', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 2.6 } },
    { name: 'legNL', bone: 'legNL', material: 'cloth', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 8, r: 2.1 } },
    { name: 'torso', bone: 'torso', material: 'cloth', shape: { kind: 'ellipse', cx: 0, cy: -7, rx: 5, ry: 8 } },
    { name: 'scarf0', bone: 'scarf0', material: 'cloth', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 2 } },
    { name: 'scarf1', bone: 'scarf1', material: 'cloth', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 5, r: 1.6 } },
    { name: 'scarf2', bone: 'scarf2', material: 'cloth', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 4, r: 1.2 } },
    { name: 'head', bone: 'head', material: 'skin', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 4.5, ry: 4.5 } },
    { name: 'mask', bone: 'head', material: 'cloth', shape: { kind: 'rect', x: -4.5, y: -4.5, w: 9, h: 4 } },
    { name: 'armNU', bone: 'armNU', material: 'cloth', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 7, r: 2.2 } },
    { name: 'armNL', bone: 'armNL', material: 'skin', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 6, r: 1.8 } },
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
      { bone: 'torso', channel: 'y', keys: [0, 1, 0, -1] },
      { bone: 'legNU', channel: 'angle', keys: [1, 0, -1, 0] },
      { bone: 'legNL', channel: 'angle', keys: [0, 0.8, 0.2, -0.4] },
      { bone: 'legFU', channel: 'angle', keys: [-1, 0, 1, 0] },
      { bone: 'legFL', channel: 'angle', keys: [0.2, -0.4, 0, 0.8] },
      { bone: 'armNU', channel: 'angle', keys: [-0.8, 0, 0.8, 0] },
      { bone: 'armNL', channel: 'angle', keys: [-0.3, -0.5, -0.3, -0.1] },
      { bone: 'armFU', channel: 'angle', keys: [0.8, 0, -0.8, 0] },
      { bone: 'armFL', channel: 'angle', keys: [-0.3, -0.1, -0.3, -0.5] },
      { bone: 'scarf0', channel: 'angle', keys: SCARF_KEYS },
      { bone: 'scarf1', channel: 'angle', keys: shift(SCARF_KEYS, 1) },
      { bone: 'scarf2', channel: 'angle', keys: shift(SCARF_KEYS, 2) },
      { bone: 'head', channel: 'angle', keys: [0.06, 0, -0.06, 0] },
    ],
  },
}
