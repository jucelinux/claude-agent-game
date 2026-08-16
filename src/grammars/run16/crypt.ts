/**
 * Run 16 — **the graveyard he runs through, and the thing behind him.**
 *
 * Two subjects sharing one palette: the tombstones he jumps, and Death.
 *
 * **They share a palette on purpose and it is a cohesion decision rather than a saving.** The
 * compositor merges by exact match, so two subjects on one palette cost one copy of it. More
 * importantly, a graveyard where the stones and the reaper are lit from the same lamp and cut
 * from the same greys is a graveyard; one where they are not is two drawings in a row.
 */
import type { Grammar, Palette, Part } from '../../core/types.ts'

/**
 * **Granite under a dead sky, and moss that is barely green.**
 *
 * The stone runs 26 to 196, which is nearly as wide as the skeleton's own range — deliberately,
 * because the obstacles are the thing a player has to read at speed. An obstacle that is subtle
 * is an obstacle that kills unfairly.
 *
 * The reaper's cloth is the darkest material in the project: it tops out at 62, so Death is a
 * hole in the picture rather than a figure in it. That is the whole of how SOTN draws anything
 * that is supposed to frighten you.
 */
const GRANITE: Palette = {
  name: 'crypt',
  colors: [
    [0, 0, 0],
    // stone — cold granite, and the highlight is where the moon lands on a wet edge.
    [26, 26, 38],
    [56, 56, 74],
    [96, 98, 118],
    [146, 148, 166],
    [196, 198, 210],
    // lichen — barely green. A saturated moss in this scene would be the brightest thing in it.
    [22, 30, 26],
    [40, 54, 42],
    [64, 82, 60],
    [96, 116, 84],
    [134, 154, 112],
    // void — the reaper. It never leaves the dark end: 12 to 62, the narrowest and lowest ramp
    // in this project, so the figure is read entirely by its silhouette.
    [12, 10, 20],
    [20, 17, 30],
    [30, 26, 42],
    [44, 38, 56],
    [62, 54, 74],
    // ink
    [8, 7, 14],
    [14, 12, 24],
    [22, 19, 34],
    [32, 28, 46],
    [44, 39, 60],
  ],
  ramps: [
    { material: 'stone', indices: [1, 2, 3, 4, 5] },
    { material: 'lichen', indices: [6, 7, 8, 9, 10] },
    { material: 'void', indices: [11, 12, 13, 14, 15] },
    { material: 'ink', indices: [16, 17, 18, 19, 20] },
  ],
}

/**
 * **The tombstones, and their origin is on the ground line.**
 *
 * Same reasoning as the climb's shelves: the only row of an obstacle that anything cares about
 * is where it meets the floor, so that is the row the sprite is placed by. The game then needs
 * to know nothing about how tall a given stone is except what it declares.
 *
 * A stone is still and it says so: no gait, two phases and no tracks. The climb's planks were
 * given a sway because eight identical frames is a lie in the data — these declare **one frame**
 * instead, which is the honest way to say a thing does not move.
 */
/**
 * **One phase, and it is a pose rather than a cycle.** A gravestone does not move, and the
 * honest way to say so is one named instant and one frame. Two phases on a one-frame subject
 * failed the sprite contract: a phase at 0.5 of a single frame is an instant nobody sees.
 */
const STILL = { name: 'still', phases: [{ name: 'standing', at: 0 }], tracks: [] }
const ROOT = { bones: [{ name: 'base', parent: null, x: 0, y: 0, z: 0, angle: 0 }] }

const stone = (name: string, parts: readonly Part[]): Grammar => ({
  name, palette: GRANITE, skeleton: ROOT, parts, gait: STILL,
})

/** A round-topped slab. The commonest, and the one a player learns the height of. */
export const tombSlab = stone('tomb-slab', [
  { weld: true, name: 'body', bone: 'base', material: 'stone', shape: { kind: 'capsule', x0: 0, y0: -12, x1: 0, y1: -2, r: 5, r1: 5.4 } },
  { weld: true, name: 'foot', bone: 'base', material: 'stone', shape: { kind: 'rect', x: -6.5, y: -3, w: 13, h: 3, d: 7 } },
  { name: 'moss', bone: 'base', material: 'lichen', marking: true, z: -1, shape: { kind: 'lobed', cx: -2.6, cy: -4, rx: 4, ry: 4.4, rz: 4, lobes: 5, depth: 0.36, phase: 1.1, octaves: 2 } },
])

/** A cross. Taller and narrower, so it reads as a different jump before you reach it. */
export const tombCross = stone('tomb-cross', [
  // **24 px of post, and the height is the mechanic.** The first jump reaches 22 px and the
  // somersault reaches 36, so this stone is the one that cannot be cleared without the flip.
  // Its silhouette is deliberately unlike the other two: a player has to read it from a distance.
  { weld: true, name: 'post', bone: 'base', material: 'stone', shape: { kind: 'capsule', x0: 0, y0: -24, x1: 0, y1: -2, r: 2.4, r1: 2.6 } },
  { weld: true, name: 'arm', bone: 'base', material: 'stone', shape: { kind: 'capsule', x0: -5.4, y0: -18, x1: 5.4, y1: -18, r: 2.2 } },
  { weld: true, name: 'foot', bone: 'base', material: 'stone', shape: { kind: 'rect', x: -5, y: -3, w: 10, h: 3, d: 6 } },
  { name: 'moss', bone: 'base', material: 'lichen', marking: true, z: -1, shape: { kind: 'lobed', cx: -1.4, cy: -6, rx: 2.6, ry: 3.8, rz: 2.4, lobes: 4, depth: 0.4, phase: 2.6 } },
])

/**
 * A broken stump, and it is the low one. Three heights of obstacle is what lets a runner have a
 * rhythm: a player who has learnt one jump can read the next by its silhouette alone.
 */
export const tombBroken = stone('tomb-broken', [
  { weld: true, name: 'body', bone: 'base', material: 'stone', shape: { kind: 'lobed', cx: 0, cy: -4.4, rx: 5, ry: 5, rz: 4.4, lobes: 5, depth: 0.24, phase: 4.2 } },
  { weld: true, name: 'foot', bone: 'base', material: 'stone', shape: { kind: 'rect', x: -6, y: -3, w: 12, h: 3, d: 7 } },
  { name: 'moss', bone: 'base', material: 'lichen', marking: true, z: -1, shape: { kind: 'lobed', cx: 1.4, cy: -3, rx: 3.4, ry: 3, rz: 3, lobes: 4, depth: 0.4, phase: 0.3 } },
])

/**
 * **Death, and she is drawn as an absence.**
 *
 * Six parts, no legs, no face. The cloth ramp never leaves the dark end, so at any distance she
 * is a shape cut out of the graveyard rather than a figure standing in it — which is both the
 * SOTN idiom and the cheapest way to make something read as wrong.
 *
 * **The scythe is the only part that is allowed a bright tone**, because a curved highlight is
 * the fastest way to say "blade" and because a player needs to see the thing that is going to
 * reach him. It is authored on its own bone so it can swing without the cloak moving.
 *
 * She is **not** a body with a gait in the sense everything else here is: she drifts. A reaper
 * that walks has feet, and feet make a thing mortal.
 */
export const death: Grammar = {
  name: 'death',
  palette: GRANITE,
  skeleton: {
    bones: [
      { name: 'core', parent: null, x: 0, y: 0, z: 0, angle: 0 },
      { name: 'hood', parent: 'core', x: 0, y: -13, z: 0, angle: 0 },
      { name: 'haft', parent: 'core', x: 5, y: -10, z: -5, angle: 0.02 },
    ],
  },
  parts: [
    /**
     * The cloak: two lobed masses rather than one, so the hem tatters independently of the
     * shoulders. `octaves: 2` because cloth is self-similar — big folds carrying small ones —
     * and a single octave reads as a cog.
     */
    { weld: true, name: 'skirt', bone: 'core', material: 'void', shape: { kind: 'lobed', cx: 0, cy: 1, rx: 7.6, ry: 10, rz: 5.4, lobes: 6, depth: 0.34, phase: 0.8, octaves: 2 } },
    { weld: true, name: 'shoulders', bone: 'core', material: 'void', shape: { kind: 'lobed', cx: -0.4, cy: -9, rx: 7, ry: 5.4, rz: 5, lobes: 5, depth: 0.24, phase: 2.2 } },
    { weld: true, name: 'hood', bone: 'hood', material: 'void', shape: { kind: 'lobed', cx: 0.4, cy: 0, rx: 4.6, ry: 5, rz: 4.2, lobes: 4, depth: 0.22, phase: 4.6 } },
    /**
     * **The hollow inside the hood, and it is a marking.** Two ramp steps darker than the cloth
     * it lies on, which at this range is the difference between a hood with a head in it and a
     * hood with nothing in it. A solid would have stood proud of the cowl.
     */
    { name: 'hollow', bone: 'hood', material: 'ink', marking: true, z: -1, shape: { kind: 'ellipse', cx: 1.4, cy: 0.6, rx: 2.6, ry: 3, rz: 2.4 } },
    // The haft crosses the whole figure, so the blade clears the cloak at the top.
    { weld: true, name: 'haft', bone: 'haft', material: 'void', shape: { kind: 'capsule', x0: 0, y0: 10, x1: -1.6, y1: -12, r: 0.9 } },
    /**
     * The blade, and it is the only bright thing on her. A tapered capsule swept forward from
     * the top of the haft: a curve is what says scythe, and a straight bar says spear.
     */
    { weld: true, name: 'blade', bone: 'haft', material: 'stone', shape: { kind: 'capsule', x0: -1.6, y0: -12, x1: -9.5, y1: -8.5, r: 1.6, r1: 0.5 } },
  ],
  gait: {
    name: 'drift',
    phases: [
      { name: 'in', at: 0 },
      { name: 'over', at: 0.25 },
      { name: 'out', at: 0.5 },
      { name: 'under', at: 0.75 },
    ],
    tracks: [
      // She rises and falls without a step in it. Two pixels, on a twelve-frame cycle, which is
      // slower than anything else on screen — the one thing in the scene that is not hurrying.
      { bone: 'core', channel: 'y', keys: [0.5, 0, -0.5, 0] },
      { bone: 'core', channel: 'angle', keys: [0.03, 0.05, 0.03, 0.01] },
      // The cloak leans a beat behind the body, and the hood a beat behind the cloak.
      { bone: 'hood', channel: 'angle', keys: [-0.04, -0.02, -0.04, -0.06] },
      { bone: 'haft', channel: 'angle', keys: [-0.03, 0.02, 0.04, -0.01] },
    ],
  },
}

export const CRYPT_PROPS: readonly Grammar[] = [tombSlab, tombCross, tombBroken, death]
