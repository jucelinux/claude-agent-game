/**
 * Run 14 — **the lunar surface, and the Earth hanging over it.**
 *
 * The second half of his commission: *"o ambiente: o solo lunar, similar a vista da lua com a
 * terra ao fundo."*
 *
 * **Three facts about the moon that are numbers here rather than drawings**, and they are what
 * stop this from being a grey field with a blue ball on it:
 *
 * 1. **There is no air, so there is no aerial perspective.** Every other scene in this project
 *    expresses distance as haze. Here `scene.haze` is **zero** and depth is carried by the
 *    floor alone. A distant crater on the moon is as sharp and as dark as a near one, which is
 *    exactly why Apollo photographs are so hard to judge distance in.
 * 2. **A shadow is nearly black.** Nothing scatters light into it. `shadow.strength` is 2 ramp
 *    steps against 1 everywhere else, and `fill.weight` is 0.03 against 0.15.
 * 3. **The Earth does not move and does not set.** The moon is tidally locked, so from a fixed
 *    landing site the Earth hangs in one place in the sky, forever. It gets no drift and no
 *    motion, and that stillness is the single most alien thing available.
 *
 * **The Earth is built almost entirely out of `Part.marking`**, which is two hours old. A
 * globe is one sphere wearing continents, cloud and a terminator; not one of those is a solid,
 * and before this morning every one of them would have stood proud of the sphere and rung
 * itself in ink.
 */
import type { Gait, Grammar, Palette, Part } from '../../core/types.ts'

const SPACE: Palette = {
  name: 'space',
  colors: [
    [0, 0, 0],
    // ocean — deep, and the darkest step is the night side rather than deep water
    [6, 12, 34],
    [14, 32, 74],
    [26, 62, 122],
    [48, 104, 172],
    [92, 156, 210],
    // land — the Sahara and the Atlantic are what you actually see from lunar distance
    [40, 34, 20],
    [78, 64, 34],
    [122, 100, 54],
    [166, 140, 84],
    [206, 186, 130],
    // cloud — white, and the brightest thing in the whole scene
    [96, 104, 124],
    [148, 156, 176],
    [194, 200, 216],
    [228, 232, 242],
    [252, 253, 255],
    // regolith — the ground, the rocks and the crater rims. Grey with a warm cast, which is
    // what the samples actually are; a neutral grey moon reads as concrete.
    [24, 22, 22],
    [52, 49, 46],
    [86, 82, 76],
    [130, 124, 114],
    [178, 172, 158],
    // ink
    [6, 6, 9],
    [11, 11, 15],
    [17, 18, 23],
    [25, 26, 33],
    [35, 36, 45],
  ],
  ramps: [
    { material: 'ocean', indices: [1, 2, 3, 4, 5] },
    { material: 'land', indices: [6, 7, 8, 9, 10] },
    { material: 'cloud', indices: [11, 12, 13, 14, 15] },
    { material: 'regolith', indices: [16, 17, 18, 19, 20] },
    { material: 'ink', indices: [21, 22, 23, 24, 25] },
  ],
}

/** Nothing in the sky moves, so every gait here is one held pose. A gait needs two phases. */
const STILL: Gait = {
  name: 'still',
  phases: [{ name: 'a', at: 0 }, { name: 'b', at: 0.5 }],
  tracks: [],
}

/**
 * **The Earth.** One sphere, and everything on it is a marking.
 *
 * The terminator is the piece worth naming: from the moon you almost never see a full Earth,
 * you see a phase. It is drawn as a dark marking across one side rather than as a shading
 * trick, because the renderer's light already shades the sphere and a *second* darkness on top
 * of it is what a phase actually is — the difference between which half is lit and which half
 * is turned away.
 */
export const earth: Grammar = {
  name: 'earth',
  palette: SPACE,
  skeleton: { bones: [{ name: 'core', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
  parts: [
    { name: 'globe', bone: 'core', material: 'ocean', shape: { kind: 'ellipse', cx: 0, cy: 0, rx: 21, ry: 21, rz: 21 } },
    // Continents, and they are lobed because a coastline is the same fractal a foliage rim is.
    // The same primitive that was built for a tree crown pays here for the third time.
    { name: 'landA', bone: 'core', material: 'land', marking: true, z: -19, shape: { kind: 'lobed', cx: -4, cy: -7, rx: 9, ry: 7, rz: 6, lobes: 5, depth: 0.34, phase: 1.1, octaves: 3 } },
    { name: 'landB', bone: 'core', material: 'land', marking: true, z: -19, shape: { kind: 'lobed', cx: 6, cy: 6, rx: 7, ry: 8, rz: 6, lobes: 4, depth: 0.4, phase: 3.4, octaves: 3 } },
    { name: 'landC', bone: 'core', material: 'land', marking: true, z: -19, shape: { kind: 'lobed', cx: -11, cy: 8, rx: 4.5, ry: 4, rz: 4, lobes: 4, depth: 0.36, phase: 5.2, octaves: 2 } },
    // Cloud. Two bands and a swirl, brighter than anything else in the scene.
    { name: 'cloudA', bone: 'core', material: 'cloud', marking: true, z: -20, shape: { kind: 'lobed', cx: -8, cy: 3, rx: 10, ry: 3.4, rz: 5, lobes: 6, depth: 0.42, phase: 0.4, octaves: 3 } },
    { name: 'cloudB', bone: 'core', material: 'cloud', marking: true, z: -20, shape: { kind: 'lobed', cx: 7, cy: -9, rx: 8, ry: 4, rz: 5, lobes: 5, depth: 0.38, phase: 2.7, octaves: 3 } },
    { name: 'cloudC', bone: 'core', material: 'cloud', marking: true, z: -20, shape: { kind: 'lobed', cx: 2, cy: 14, rx: 9, ry: 3, rz: 5, lobes: 7, depth: 0.34, phase: 4.9, octaves: 2 } },
    /**
     * **The terminator.** A crescent of night laid over the lit globe, offset so it eats the
     * limb the sun has turned away from. It is `ocean` at its darkest end rather than `ink`,
     * because the night side of the Earth is not a line drawn round it — it is the same planet,
     * unlit.
     */
    { name: 'night', bone: 'core', material: 'ocean', marking: true, shift: -4, z: -21, shape: { kind: 'ellipse', cx: 15, cy: 4, rx: 15, ry: 22, rz: 8 } },
  ],
  gait: STILL,
}

/**
 * A crater is authored as a terrain decal, never as a loose ellipsoid. The outer apron is an
 * almost-flat patch of disturbed soil. The cut owns the cavity, two bright shapes describe the
 * sun-facing wall and the last dark shape leaves a deep floor. Their offsets deliberately expose
 * a bright crescent at lower-right and a dark overhang at upper-left: with the sun at upper-left,
 * that is the lighting logic of a depression rather than a boulder.
 */
function makeCrater(name: string, r: number, seed: number): Grammar {
  const ellipse = (cx: number, cy: number, rx: number, ry: number, rz: number) =>
    ({ kind: 'ellipse', cx, cy, rx, ry, rz } as const)

  return {
    name,
    palette: SPACE,
    skeleton: { bones: [{ name: 'c', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
    parts: [
      {
        name: 'ejecta-apron',
        bone: 'c',
        material: 'regolith',
        shift: -1,
        shape: {
          kind: 'lobed', cx: 0, cy: 0, rx: r * 0.94, ry: r * 0.54, rz: 0.8,
          lobes: 7, depth: 0.075, phase: seed, octaves: 3,
        },
      },
      {
        name: 'cavity',
        bone: 'c',
        material: 'regolith',
        cut: true,
        z: -0.2,
        shape: {
          kind: 'lobed', cx: 0, cy: 0, rx: r * 0.76, ry: r * 0.43, rz: r * 0.28,
          lobes: 7, depth: 0.055, phase: seed + 0.65, octaves: 2,
        },
      },
      // Broken highlights keep the rim geological rather than turning it into a perfect ring.
      {
        name: 'rim-west', bone: 'c', material: 'regolith', marking: true, shift: 2, z: -0.3,
        shape: {
          kind: 'capsule', x0: -r * 0.86, y0: -r * 0.02,
          x1: -r * 0.46, y1: -r * 0.37, r: Math.max(1, r * 0.085), r1: Math.max(0.8, r * 0.06),
        },
      },
      {
        name: 'rim-crown', bone: 'c', material: 'regolith', marking: true, shift: 2, z: -0.3,
        shape: {
          kind: 'capsule', x0: -r * 0.38, y0: -r * 0.39,
          x1: r * 0.24, y1: -r * 0.43, r: Math.max(1, r * 0.075), r1: Math.max(0.8, r * 0.055),
        },
      },
      // A larger bright wall followed by a smaller dark floor leaves the lit inner crescent.
      {
        name: 'sunward-inner-wall', bone: 'c', material: 'regolith', marking: true, shift: 2, z: -0.4,
        shape: ellipse(r * 0.07, r * 0.09, r * 0.68, r * 0.34, r * 0.2),
      },
      {
        name: 'bowl-floor', bone: 'c', material: 'regolith', marking: true, shift: -4, z: -0.5,
        shape: ellipse(-r * 0.08, -r * 0.07, r * 0.57, r * 0.255, r * 0.16),
      },
      {
        name: 'floor-glint', bone: 'c', material: 'regolith', marking: true, shift: -2, z: -0.6,
        shape: ellipse(r * 0.08, r * 0.045, r * 0.24, r * 0.075, r * 0.08),
      },
    ],
    gait: STILL,
  }
}

/** A boulder. Lobed, so it is a rock rather than a pebble-shaped blob. */
function makeRock(name: string, r: number, seed: number): Grammar {
  return {
    name,
    palette: SPACE,
    skeleton: { bones: [{ name: 'c', parent: null, x: 0, y: 0, z: 0, angle: 0 }] },
    parts: [
      { name: 'mass', bone: 'c', material: 'regolith', shape: { kind: 'lobed', cx: 0, cy: -r * 0.5, rx: r, ry: r * 0.72, rz: r * 0.8, lobes: 5, depth: 0.26, phase: seed, octaves: 3 } },
      { name: 'chip', bone: 'c', material: 'regolith', z: -2, shape: { kind: 'lobed', cx: r * 0.4, cy: -r * 0.15, rx: r * 0.42, ry: r * 0.34, rz: r * 0.4, lobes: 4, depth: 0.3, phase: seed + 2.1, octaves: 2 } },
    ],
    gait: STILL,
  }
}

/**
 * **Six craters and three small rocks**, and the ratio is his: *"acho válido manter algumas
 * pedras, e trocar essas pedras maiores por crateras circulares"*. A boulder on the moon is a
 * rare thing; a crater is what the ground is made of.
 */
export const MOON: readonly Grammar[] = [
  earth,
  // **Smaller, at his instruction**, and it is the same note he gave about the rocks: a crater
  // wide enough to hold the player is a crater he walks inside rather than past. At these radii
  // the largest is 34 px across against a 46 px figure, so the ground reads as pitted rather
  // than as a set of arenas.
  makeCrater('crater-a', 15, 0.4),
  makeCrater('crater-b', 9, 2.2),
  makeCrater('crater-c', 21, 4.1),
  makeCrater('crater-d', 7, 5.6),
  makeCrater('crater-e', 17, 1.9),
  makeCrater('crater-f', 12, 3.3),
  // **Small, at his instruction: "diminua o tamanho de todas as pedras, pode deixá-las
  // pequenas".** A boulder standing on a plain competes with the figure for the eye; a scatter
  // of stones is texture. The craters do the work of saying where you are.
  makeRock('rock-a', 4.2, 1.3),
  makeRock('rock-b', 2.8, 3.7),
  makeRock('rock-c', 3.4, 5.9),
]
