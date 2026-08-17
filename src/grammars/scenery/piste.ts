/**
 * **The piste furniture — run 19, heights derived from the two impulses, the street's rule.**
 *
 * The jump reaches 26 px and the rodeo 58. The snowman at ~16 and the small pine at ~22 fall to
 * the jump; the tall pine at ~37 needs the trick. Heights are read from the art by the runtime,
 * so difficulty stays a fact about the drawing.
 *
 * **From his reference, the structural numbers** (Yoshi's Island winter, supplied 17/08):
 * pines carry 2–3 foliage tiers with **snow on the top third**; crown width ≈ 0.8 of tree
 * height; trunks short and dark. Clouds are flat white puffs, width ≈ 2.2× height, OUTLINED —
 * a YI cloud is a drawn object, not a soft mass. Every column here is honestly full: the
 * batch-4 consistency verdict extended to lifecycle by batch 5's note.
 */
import type { Grammar, Palette, Part } from '../../core/types.ts'

const WINTER: Palette = {
  name: 'piste-winter',
  colors: [
    [0, 0, 0],
    // snow — white with blue shadow, never grey. The YI snow reads by its blue.
    [150, 170, 204], [178, 196, 222], [204, 220, 238], [228, 240, 248], [248, 252, 254],
    // pine — deep blue-green, nearly ink at the shadow end, as the reference's trees.
    [10, 40, 44], [16, 64, 60], [26, 92, 78], [42, 124, 98], [66, 158, 120],
    // trunk — warm dark wood.
    [50, 30, 24], [76, 46, 32], [106, 68, 42], [140, 94, 56], [176, 126, 76],
    // coal — the snowman's face, buttons and hat.
    [14, 14, 20], [24, 24, 32], [36, 38, 46], [52, 54, 64], [72, 74, 86],
    // ink — the boarder's own warm black, so one crayon draws the mountain.
    [20, 10, 14], [32, 18, 22], [46, 28, 32], [62, 40, 44], [80, 54, 58],
  ],
  ramps: [
    { material: 'snow', indices: [1, 2, 3, 4, 5] },
    { material: 'pine', indices: [6, 7, 8, 9, 10] },
    { material: 'trunk', indices: [11, 12, 13, 14, 15] },
    { material: 'coal', indices: [16, 17, 18, 19, 20] },
    { material: 'ink', indices: [21, 22, 23, 24, 25] },
  ],
}

const STILL = { name: 'still', phases: [{ name: 'a', at: 0 }], tracks: [] } as const

/**
 * A snowman, ~16 px: the cheapest thing the jump clears. Two balls, a coal hat, coal buttons —
 * and the balls are lobed, because packed snow has a ragged boundary and a perfect ellipse
 * reads as plastic.
 */
export const pisteSnowman: Grammar = {
  name: 'piste-snowman',
  palette: WINTER,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'body', bone: 'root', material: 'snow', shape: { kind: 'lobed', cx: 0, cy: -4.6, rx: 5.2, ry: 4.6, rz: 5, lobes: 5, depth: 0.06, phase: 0.3 } },
    { name: 'headball', bone: 'root', material: 'snow', shape: { kind: 'lobed', cx: 0.3, cy: -11.4, rx: 3.6, ry: 3.3, rz: 3.4, lobes: 5, depth: 0.07, phase: 1.7 } },
    { weld: true, name: 'hat', bone: 'root', material: 'coal', shape: { kind: 'rect', x: -2.3, y: -16.9, w: 4.6, h: 2.6, d: 4 } },
    { weld: true, name: 'brim', bone: 'root', material: 'coal', shape: { kind: 'rect', x: -3.4, y: -14.5, w: 6.8, h: 1, d: 5.4 } },
    { name: 'eye', bone: 'root', material: 'coal', z: -3, shape: { kind: 'ellipse', cx: 2.2, cy: -12, rx: 0.7, ry: 0.7 }, marking: true },
    { name: 'buttons', bone: 'root', material: 'coal', z: -4.4, shape: { kind: 'capsule', x0: 0.6, y0: -6.6, x1: 0.4, y1: -3, r: 0.7 }, marking: true },
    // A twig arm on the near side; the far one hides behind the body, as the reference's do.
    { name: 'twig', bone: 'root', material: 'trunk', z: -2, shape: { kind: 'capsule', x0: 4.4, y0: -7.4, x1: 8.2, y1: -9.8, r: 0.5, r1: 0.4 } },
  ],
  gait: STILL,
}

/** One snow-capped tier: pine below, snow lying on its top — the reference's snow-on-top-third. */
const tier = (cy: number, rx: number, name: string): readonly Part[] => [
  { weld: true, name: `${name}P`, bone: 'root', material: 'pine', shape: { kind: 'lobed', cx: 0, cy, rx, ry: rx * 0.62, rz: rx * 0.85, lobes: 6, depth: 0.14, phase: cy * 0.7 } },
  // The snow DRAPES: wider than its tier and sunk into it, or it reads as a floating disc —
  // which is what the look caught on the first authoring (counts saw nothing; both painted).
  { name: `${name}S`, bone: 'root', material: 'snow', shape: { kind: 'lobed', cx: 0, cy: cy - rx * 0.32, rx: rx * 1.04, ry: rx * 0.32, rz: rx * 0.82, lobes: 5, depth: 0.14, phase: cy * 1.3 } },
]

/**
 * The small pine, ~22 px: the top of the jump's range. Two tiers, capped — crown width ≈ 0.8
 * of height, the reference's ratio.
 */
export const pisteSapling: Grammar = {
  name: 'piste-sapling',
  palette: WINTER,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'trunk', bone: 'root', material: 'trunk', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -6, r: 1.5, r1: 1.2 } },
    ...tier(-9, 6.4, 'lo'),
    ...tier(-15.2, 4.6, 'mid'),
    { name: 'capS', bone: 'root', material: 'snow', shape: { kind: 'lobed', cx: 0, cy: -19.6, rx: 3, ry: 1.9, rz: 2.6, lobes: 4, depth: 0.12, phase: 2.2 } },
  ],
  gait: STILL,
}

/**
 * **The tall pine, ~37 px: the jump cannot clear it.** 26 px of jump against 37 of tree is the
 * gate on the second press — the rail's arithmetic, on the reference's biggest silhouette.
 * Three tiers, all capped, height ≈ 1.6× the boarder as the reference's trees stand to Yoshi.
 */
export const pistePine: Grammar = {
  name: 'piste-pine',
  palette: WINTER,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'trunk', bone: 'root', material: 'trunk', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -9, r: 1.9, r1: 1.4 } },
    ...tier(-13, 8.4, 'lo'),
    ...tier(-21.4, 6.6, 'mid'),
    ...tier(-28.6, 4.8, 'hi'),
    { name: 'capS', bone: 'root', material: 'snow', shape: { kind: 'lobed', cx: 0, cy: -34.4, rx: 3.2, ry: 2.1, rz: 2.8, lobes: 4, depth: 0.12, phase: 0.9 } },
  ],
  gait: STILL,
}

/**
 * A YI cloud: a flat white puff, width ≈ 2.2× height, OUTLINED — his reference draws clouds
 * with the same crayon as everything else, which is what separates this sky from the aero's
 * soft storm layer. Lives in the drift bands.
 */
export const pistePuff: Grammar = {
  name: 'piste-puff',
  palette: WINTER,
  skeleton: { bones: [{ name: 'root', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { weld: true, name: 'puffA', bone: 'root', material: 'snow', shape: { kind: 'lobed', cx: -4.6, cy: 0.4, rx: 5.4, ry: 3.2, rz: 4, lobes: 5, depth: 0.16, phase: 0.2 } },
    { weld: true, name: 'puffB', bone: 'root', material: 'snow', shape: { kind: 'lobed', cx: 4.2, cy: 0.9, rx: 4.6, ry: 2.6, rz: 3.6, lobes: 5, depth: 0.16, phase: 1.9 } },
    { weld: true, name: 'puffC', bone: 'root', material: 'snow', shape: { kind: 'lobed', cx: 0.2, cy: -1.8, rx: 4.2, ry: 2.8, rz: 3.4, lobes: 5, depth: 0.14, phase: 3.4 } },
  ],
  gait: {
    name: 'breathe',
    phases: [
      { name: 'a', at: 0 },
      { name: 'b', at: 0.5 },
    ],
    tracks: [{ bone: 'root', channel: 'scaleX', keys: [0.01, -0.01] }],
  },
}
