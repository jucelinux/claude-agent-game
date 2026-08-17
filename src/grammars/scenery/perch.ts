/**
 * Run 15 — **the shelves the kitten climbs**, and they are the first thing in this project
 * that a body stands *on* rather than in front of.
 *
 * Every floor here until now was a plane: one contact row per depth, painted into the
 * backdrop. A platformer needs surfaces, and a surface is a sprite with a top edge that means
 * something. So these are ordinary grammars — a plank, some moss, a cushion — and what makes
 * them platforms lives in `Scene.climb`, not in the drawing.
 *
 * ## Two rules this file follows and the reason for each
 *
 * 1. **The origin is on the top surface, not at the centre.** The scene places a subject by
 *    its origin, and the top of the plank is the only row a platform has that anybody cares
 *    about. Authoring the origin anywhere else would mean the game had to know the sprite's
 *    thickness, which is the sprite leaking into the rules.
 * 2. **The plank never moves; only the ornaments do.** A gentle sway is what makes a garden
 *    read as alive, and a landing surface that drifts is a landing surface that lies. So the
 *    `plank` bone carries no track at all, and every track below belongs to a leaf, a bloom or
 *    a cushion. The four variants therefore share one collision rule and one half-width.
 *
 * portable — both. Any generated platform in any engine meets exactly these two.
 */
import type { Grammar, Palette, Part, Skeleton } from '../../core/types.ts'

/**
 * **The garden palette, and it is warm the whole way down** for the same reason the cat's is.
 *
 * The wood runs from 52/34/24 to 226/186/136 — a wide range, because the 15/08 verdict says a
 * wide range is half of what makes a sprite read, and "cozy" is not allowed to spend it. The
 * green is olive rather than emerald: a saturated green next to a ginger cat is a colour
 * fight, and evening light desaturates foliage anyway.
 */
const GARDEN: Palette = {
  name: 'perch',
  colors: [
    [0, 0, 0],
    // wood — warm, and the highlight is a pale honey rather than a white. Bare wood in low
    // sun never reaches white; it reaches the colour of the sun.
    [52, 34, 24],
    [92, 62, 40],
    [140, 98, 62],
    [186, 140, 94],
    [226, 186, 136],
    // leaf — olive, and deliberately unsaturated. Foliage at dusk is nearly grey-green, and
    // a bright green here would compete with the animal for the eye.
    [32, 44, 28],
    [58, 78, 46],
    [92, 116, 66],
    [132, 158, 94],
    [178, 200, 136],
    // bloom — a warm pink, the same family as the kitten's nose so the picture agrees with
    // itself about what its accent colour is.
    [110, 62, 66],
    [156, 92, 92],
    [204, 130, 124],
    [234, 172, 160],
    [252, 214, 200],
    // ink — the same warm dark brown the cat is drawn in. One line colour for the whole game.
    [38, 22, 18],
    [52, 30, 24],
    [68, 40, 31],
    [86, 52, 40],
    [106, 66, 50],
  ],
  ramps: [
    { material: 'wood', indices: [1, 2, 3, 4, 5] },
    { material: 'leaf', indices: [6, 7, 8, 9, 10] },
    { material: 'bloom', indices: [11, 12, 13, 14, 15] },
    { material: 'ink', indices: [16, 17, 18, 19, 20] },
  ],
}

/**
 * One skeleton for all four variants, so the game has one plank and one half-width to reason
 * about. A bone with no part on it in a given variant simply paints nothing.
 */
const SKELETON: Skeleton = {
  bones: [
    // The root sits ON the top surface of the plank. Nothing rotates it, ever.
    { name: 'plank', parent: null, x: 0, y: 0, z: 0, angle: 0 },
    // Ornament anchors, near the two ends. Both carry sway.
    { name: 'left', parent: 'plank', x: -9, y: -1, z: -2, angle: 0 },
    { name: 'right', parent: 'plank', x: 9, y: -1, z: -2, angle: 0 },
    // A sprig hanging under the right end, two segments so it can droop.
    { name: 'sprig1', parent: 'plank', x: 11, y: 4, z: -3, angle: 0.06 },
    { name: 'sprig2', parent: 'sprig1', x: 0, y: 5.5, z: 0, angle: 0.07 },
  ],
}

/**
 * **The plank, and it is identical in all four variants** — same capsule, same depth, same top
 * row. `y0` and `y1` of 3 put the bar's centre 3 px below the origin, so its top surface lands
 * exactly on the row the scene placed it at.
 *
 * 26 px between the ends plus the 3 px cap radius at each end gives a 32 px board, and the
 * game's `halfW` of 16 is that number and not a guess.
 */
const PLANK: Part = {
  name: 'plank',
  bone: 'plank',
  material: 'wood',
  shape: { kind: 'capsule', x0: -13, y0: 3, x1: 13, y1: 3, r: 3, r1: 3 },
}

/** Two short pegs under the board. They say "this is a shelf" rather than "this is a stick". */
const PEGS: readonly Part[] = [
  { name: 'pegL', bone: 'plank', material: 'wood', shape: { kind: 'capsule', x0: -8, y0: 5, x1: -8, y1: 8.5, r: 1.4, r1: 1.1 }, shift: -1 },
  { name: 'pegR', bone: 'plank', material: 'wood', shape: { kind: 'capsule', x0: 8, y0: 5, x1: 8, y1: 8.5, r: 1.4, r1: 1.1 }, shift: -1 },
]

/**
 * **The sway, and it is the same four keys everywhere.**
 *
 * One list, read at four different offsets, so the left ornament, the right ornament and the
 * two sprig segments are never in step. Two things swaying together read as one object with
 * two parts — the finding that put three clouds on three different periods in the forest.
 *
 * **The keys reach ±1 and the restraint lives in the amplitude.** That is the whole point of
 * the split between a normalized track and a tunable: a key is a fraction of a swing, so
 * writing small keys AND a small swing multiplies two kinds of restraint together and arrives
 * at nothing. The first pass did exactly that — keys of 0.16 against a swing of 0.06 turns is
 * three degrees — and produced eight byte-identical frames.
 */
const SWAY = [1, 0.34, -1, -0.34] as const
const swayAt = (lag: number): number[] => SWAY.map((_, i) => SWAY[(i + lag) % SWAY.length] as number)

const breeze = (bones: readonly { readonly bone: string; readonly lag: number }[]) => ({
  name: 'breeze',
  phases: [
    { name: 'out', at: 0 },
    { name: 'over', at: 0.25 },
    { name: 'back', at: 0.5 },
    { name: 'under', at: 0.75 },
  ],
  tracks: bones.map((b) => ({ bone: b.bone, channel: 'angle' as const, keys: swayAt(b.lag) })),
})

/**
 * **The plainest board, and it still moves.** A tuft of grass on a real stem, and it is here
 * for an honest reason rather than a decorative one: the first version of this variant had no
 * tracks at all, so its eight frames were byte-identical and the perception channel reported a
 * minimum pair distance of exactly zero. **Eight copies of one picture is a lie in the data**,
 * and the fix is either one frame or something that moves. Something that moves is also the
 * cozier answer.
 */
export const perchPlank: Grammar = {
  name: 'perch-plank',
  palette: GARDEN,
  skeleton: SKELETON,
  parts: [
    PLANK,
    ...PEGS,
    { name: 'bladeA', bone: 'left', material: 'leaf', shape: { kind: 'capsule', x0: 0, y0: 0, x1: -1.4, y1: -5.4, r: 0.9, r1: 0.5 } },
    { name: 'bladeB', bone: 'left', material: 'leaf', shape: { kind: 'capsule', x0: 1, y0: 0, x1: 2.2, y1: -4.4, r: 0.9, r1: 0.5 }, shift: -1 },
    { name: 'bladeC', bone: 'right', material: 'leaf', shape: { kind: 'capsule', x0: 1.6, y0: 0, x1: 2.8, y1: -3.6, r: 0.8, r1: 0.5 } },
  ],
  gait: breeze([{ bone: 'left', lag: 0 }, { bone: 'right', lag: 2 }]),
}

/**
 * Moss along the top, with two blooms in it. `lobed` rather than an ellipse: moss has a ragged
 * boundary and every convex primitive in this vocabulary produces a smooth one, which is the
 * hole run 9 found and the reason the lobed primitive exists.
 *
 * **The stems are 5 px long and they used to be 2.** At 2 they sat entirely inside the moss and
 * painted **zero pixels in every frame** — the absence defect, caught by the count and not by
 * looking, because a part that is not there leaves no trace to see. The length is now set by
 * what it has to clear rather than by what looks right in isolation: the moss reaches 3.2 px
 * above the board, so a stem rooted at the board must exceed that before it exists at all.
 */
export const perchMoss: Grammar = {
  name: 'perch-moss',
  palette: GARDEN,
  skeleton: SKELETON,
  parts: [
    PLANK,
    ...PEGS,
    { name: 'moss', bone: 'plank', material: 'leaf', z: -2, shape: { kind: 'lobed', cx: -1, cy: -0.6, rx: 11, ry: 2.6, rz: 3.4, lobes: 7, depth: 0.34, phase: 0.4, octaves: 2 } },
    { name: 'stemL', bone: 'left', material: 'leaf', shape: { kind: 'capsule', x0: 0, y0: 0, x1: -0.6, y1: -5, r: 0.8, r1: 0.6 } },
    { name: 'bloomL', bone: 'left', material: 'bloom', z: -3, shape: { kind: 'lobed', cx: -0.8, cy: -6.2, rx: 2.4, ry: 2.1, rz: 2.1, lobes: 5, depth: 0.3, phase: 1.7 } },
    { name: 'stemR', bone: 'right', material: 'leaf', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 1, y1: -6, r: 0.8, r1: 0.6 } },
    { name: 'bloomR', bone: 'right', material: 'bloom', z: -3, shape: { kind: 'lobed', cx: 1.3, cy: -7.2, rx: 2.1, ry: 1.9, rz: 1.9, lobes: 5, depth: 0.32, phase: 3.1 } },
  ],
  gait: breeze([{ bone: 'left', lag: 0 }, { bone: 'right', lag: 2 }]),
}

/** A leafy sprig hanging off the right end. The one variant that paints below its own board. */
export const perchFern: Grammar = {
  name: 'perch-fern',
  palette: GARDEN,
  skeleton: SKELETON,
  parts: [
    PLANK,
    ...PEGS,
    { name: 'sprig1', bone: 'sprig1', material: 'leaf', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 5.5, r: 0.9, r1: 0.7 }, shift: -1 },
    { name: 'leafA', bone: 'sprig1', material: 'leaf', z: -2, shape: { kind: 'lobed', cx: 2.4, cy: 3, rx: 3, ry: 1.8, rz: 1.6, lobes: 3, depth: 0.3, phase: 0.9 } },
    { name: 'sprig2', bone: 'sprig2', material: 'leaf', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: 4.6, r: 0.8, r1: 0.6 }, shift: -1 },
    { name: 'leafB', bone: 'sprig2', material: 'leaf', z: -2, shape: { kind: 'lobed', cx: -2.2, cy: 2.4, rx: 2.8, ry: 1.7, rz: 1.5, lobes: 3, depth: 0.32, phase: 2.2 } },
    { name: 'leafC', bone: 'sprig2', material: 'leaf', z: -3, shape: { kind: 'lobed', cx: 1.6, cy: 4.6, rx: 2.4, ry: 1.5, rz: 1.4, lobes: 3, depth: 0.34, phase: 4 } },
    { name: 'tuft', bone: 'plank', material: 'leaf', z: -2, shape: { kind: 'lobed', cx: -7, cy: -1, rx: 4.4, ry: 2, rz: 2.4, lobes: 5, depth: 0.34, phase: 1.3, octaves: 2 } },
  ],
  gait: breeze([{ bone: 'sprig1', lag: 0 }, { bone: 'sprig2', lag: 1 }]),
}

/**
 * A cushion on the board, and it is the most explicitly cozy object in the game. It also does
 * a job: at a glance it is the widest, softest silhouette of the four, so a player learns to
 * read the shelf shapes without being told anything.
 */
export const perchCushion: Grammar = {
  name: 'perch-cushion',
  palette: GARDEN,
  skeleton: SKELETON,
  parts: [
    PLANK,
    ...PEGS,
    { name: 'cushion', bone: 'plank', material: 'bloom', z: -2, shape: { kind: 'ellipse', cx: -1, cy: -2.2, rx: 8.4, ry: 3.2, rz: 4.2 } },
    // A tuck at each end, which is the whole of what makes a shape read as stuffed fabric
    // rather than as a bar of soap.
    { name: 'tuckL', bone: 'plank', material: 'bloom', z: -1, shape: { kind: 'ellipse', cx: -9, cy: -1.4, rx: 1.6, ry: 1.6, rz: 2 }, shift: -1 },
    { name: 'tuckR', bone: 'plank', material: 'bloom', z: -1, shape: { kind: 'ellipse', cx: 7, cy: -1.4, rx: 1.6, ry: 1.6, rz: 2 }, shift: -1 },
    { name: 'sprigA', bone: 'right', material: 'leaf', shape: { kind: 'capsule', x0: 2, y0: 0, x1: 3.8, y1: -5.6, r: 0.8, r1: 0.6 } },
    { name: 'leafD', bone: 'right', material: 'leaf', z: -3, shape: { kind: 'lobed', cx: 4.4, cy: -6.6, rx: 2.4, ry: 1.6, rz: 1.5, lobes: 3, depth: 0.3, phase: 5.1 } },
  ],
  gait: breeze([{ bone: 'right', lag: 0 }]),
}

export const PERCHES: readonly Grammar[] = [perchPlank, perchMoss, perchFern, perchCushion]
