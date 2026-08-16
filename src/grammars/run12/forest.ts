/**
 * Run 12 — **one tree becomes trees.** The first half of his forest commission.
 *
 * Run 9 produced a tree: twenty-three hand-placed bones and thirty-eight hand-placed parts.
 * That is *a* tree written as data, not a grammar for trees, and a forest needs the second
 * thing. `makeTree` is the harvest — the same body, with the numbers that were constants
 * turned into arguments and the layout that was hand-typed turned into arithmetic.
 *
 * **The rule this obeys (`CLAUDE.md` §5): harvest, do not design.** Nothing here is a
 * parameter because a parameter seemed useful. Every argument below is a number that was
 * already sitting in run 9 as a literal, and the only additions are the ones a *forest*
 * demanded and a single tree could not: a lean, a seed, and a choice of foliage ramp.
 *
 * **One palette for the whole wood, and that is the cohesion lesson applied.** The scene
 * reading of 15/08 measured eight subjects sharing zero colours and called them a
 * collection rather than a set. A forest of trees each carrying its own greens would repeat
 * that mistake at speed, so the palette is shared and a tree chooses which of three leaf
 * ramps it wears. Twenty-five colours for any number of trees.
 */
import type { Bone, Gait, Grammar, Palette, Part, Track } from '../../core/types.ts'

/**
 * **The wood's palette: one bark, one ink, three foliage ramps.**
 *
 * Three greens rather than a hue knob, because a hue knob over a five-tone ramp produces
 * colours nobody chose. These are picked: a young yellow-green, a deep shade green, and a
 * dry olive. Every ramp is five tones over a wide value range with a drawn line, which is
 * the idiom he ranked first on 15/08.
 */
export const WOOD: Palette = {
  name: 'wood',
  colors: [
    [0, 0, 0],
    // bark — warm maroon into a cool grey-green, so the lit edge of a trunk comes out teal
    [40, 22, 24],
    [62, 36, 36],
    [86, 58, 54],
    [112, 104, 90],
    [146, 156, 138],
    // ink — a maroon-black, so the line belongs to the bark's world
    [26, 14, 16],
    [34, 19, 21],
    [44, 25, 27],
    [56, 33, 35],
    [70, 42, 44],
    // leafA — young, yellow-green
    [44, 58, 34],
    [68, 88, 46],
    [96, 120, 62],
    [130, 156, 84],
    [170, 194, 118],
    // leafB — deep shade green, cooler and darker
    [28, 46, 38],
    [44, 70, 54],
    [64, 96, 72],
    [90, 126, 96],
    [124, 160, 126],
    // leafC — dry olive, the oldest tree in any wood
    [46, 48, 28],
    [72, 74, 40],
    [102, 100, 56],
    [136, 130, 78],
    [176, 166, 108],
  ],
  ramps: [
    { material: 'bark', indices: [1, 2, 3, 4, 5] },
    { material: 'ink', indices: [6, 7, 8, 9, 10] },
    { material: 'leafA', indices: [11, 12, 13, 14, 15] },
    { material: 'leafB', indices: [16, 17, 18, 19, 20] },
    { material: 'leafC', indices: [21, 22, 23, 24, 25] },
  ],
}

/**
 * - `round` — a broadleaf: three branches, foliage in one mass. Run 9's tree.
 * - `conifer` — tiers of foliage descending in width up a straight trunk, pointed at the top.
 * - `umbrella` — a bare trunk carrying everything at the very top, wide and shallow.
 * - `bushy` — splits low into three trunks, crown wide and close to the ground.
 * - `weeping` — long branches with the foliage hanging BELOW their tips rather than on them.
 */
export type TreeForm = 'round' | 'conifer' | 'umbrella' | 'bushy' | 'weeping'

export type TreeOpts = {
  readonly name: string
  /** Trunk length in bone units. Run 9's tree was 28; a wood wants 16 to 34. */
  readonly height: number
  /** Trunk thickness at the base. Scales with height in nature and does so here by default. */
  readonly girth?: number
  /** Sideways drift of the trunk, in bone units per segment. Negative leans left. */
  readonly lean: number
  /** How far the branches reach from the trunk. */
  readonly spread: number
  /** Foliage clumps around the crown. Run 9 used eleven; below six a tree reads as a shrub. */
  readonly clumps: number
  /** Which foliage ramp this tree wears. */
  readonly leaf: 'leafA' | 'leafB' | 'leafC'
  /**
   * **The crown's topology, not its size.** His reading of the first wood, 15/08: nine trees
   * varied by number only, so *"as diferenças entre elas são sutis demais, a copa de todas
   * são praticamente iguais"*. He was right and the cause was structural — every tree had
   * three branches and its clumps laid in one ellipse, so no argument could ever have made
   * two crowns a different shape. A form changes where the branches go and where the
   * foliage sits on them, which is the only thing that does.
   */
  readonly form: TreeForm
  /** Rotates every lobed boundary, so no two trees in a wood stamp alike. */
  readonly seed: number
  /** Some trees drop leaves and most do not; a wood where every tree sheds is a storm. */
  readonly falling?: number
}

const SWAY = 0.09
const BOB = 0.025
const sway = (...keys: number[]): number[] => keys.map((k) => k * SWAY)
const bob = (...keys: number[]): number[] => keys.map((k) => k * BOB)

const PHASES = [
  { name: 'calm', at: 0 },
  { name: 'rise', at: 3 / 16 },
  { name: 'gust', at: 5 / 16 },
  { name: 'peak', at: 8 / 16 },
  { name: 'ease', at: 11 / 16 },
  { name: 'settle', at: 13 / 16 },
] as const

/** The golden angle again: the cheapest way to make N things not agree with each other. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/**
 * Build a tree. Everything is derived from the arguments — there is no branch of this
 * function that special-cases a particular tree, because the moment there is, a forest
 * stops being generated and starts being typed out again.
 */
export function makeTree(opts: TreeOpts): Grammar {
  const { name, height, lean, spread, clumps, leaf, seed } = opts
  // Capped at 8: girth grew linearly with height and a 62-unit conifer came out with a
  // trunk 12 units thick, which is an oak wearing a conifer's crown. Real trunks do not
  // scale linearly with height, and the outline lock found it as a clipped cell.
  const girth = opts.girth ?? Math.min(8, Math.max(2.6, height * 0.19))
  const seg = height / 3
  const bones: Bone[] = [
    { name: 'trunk0', parent: null, x: 0, y: 0, z: 0, angle: 0 },
    { name: 'trunk1', parent: 'trunk0', x: lean, y: -seg, z: 0, angle: 0.008 * Math.sign(lean || 1) },
    { name: 'trunk2', parent: 'trunk1', x: -lean * 0.7, y: -seg, z: 0, angle: -0.01 * Math.sign(lean || 1) },
  ]
  const parts: Part[] = []
  const tracks: Track[] = []

  // Roots, in front of the trunk so the flare reads. Behind it the trunk's own mass wins.
  parts.push(
    { name: 'rootL', bone: 'trunk0', material: 'bark', z: -2, shift: -1, shape: { kind: 'capsule', x0: 1, y0: -3, x1: -girth * 1.3, y1: 4, r: girth * 0.52 } },
    { name: 'rootR', bone: 'trunk0', material: 'bark', z: -2, shift: -1, shape: { kind: 'capsule', x0: -1, y0: -3, x1: girth * 1.3, y1: 4, r: girth * 0.48 } },
    // Tapered, each segment ending at the radius the next begins with, so three cylinders
    // read as one cone with a bend in it.
    { name: 'trunkBase', bone: 'trunk0', material: 'bark', shape: { kind: 'capsule', x0: 0, y0: 2, x1: 0, y1: -seg, r: girth, r1: girth * 0.78 } },
    { name: 'trunkMid', bone: 'trunk1', material: 'bark', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -seg, r: girth * 0.78, r1: girth * 0.59 } },
    { name: 'trunkTop', bone: 'trunk2', material: 'bark', shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -seg * 0.45, r: girth * 0.59, r1: girth * 0.44 } },
  )
  tracks.push(
    { bone: 'trunk1', channel: 'angle', keys: sway(0, 0.12, 0.3, 0.24, 0.06, -0.06) },
    { bone: 'trunk2', channel: 'angle', keys: sway(0, 0.18, 0.42, 0.36, 0.1, -0.08) },
    { bone: 'trunk2', channel: 'y', keys: bob(0, -0.2, -0.6, -0.5, -0.15, 0.1) },
  )

  // Three branches off the fork, leaning left, centre and right. The lag runs down the
  // chain — trunk peaks at `gust`, branches at `peak`, clumps at `ease` — so the tree is in
  // three states at once, which is what a wave through a structure looks like.
  /**
   * **The branches, and their number and reach are the form.** A conifer's are short and
   * many; an umbrella's carry everything at the top; a bushy tree's split from the base.
   */
  const armSpec: Record<TreeForm, { dir: number; at: number; len: number; angle: number }[]> = {
    round: [
      { dir: -1, at: 0.3, len: 0.62, angle: -0.088 },
      { dir: 0, at: 0.3, len: 0.62, angle: 0.005 },
      { dir: 1, at: 0.3, len: 0.62, angle: 0.082 },
    ],
    // Five short tiers up the trunk. The reach shrinks with height, which is the whole
    // silhouette of a conifer expressed as one number per tier.
    conifer: [
      { dir: -1, at: 0.05, len: 0.34, angle: -0.16 },
      { dir: 1, at: 0.15, len: 0.3, angle: 0.16 },
      { dir: -1, at: 0.34, len: 0.24, angle: -0.15 },
      { dir: 1, at: 0.52, len: 0.18, angle: 0.14 },
      { dir: 0, at: 0.72, len: 0.12, angle: 0 },
    ],
    // Everything at the very top, reaching wide and level.
    umbrella: [
      { dir: -1, at: 0.86, len: 0.86, angle: -0.2 },
      { dir: 0, at: 0.9, len: 0.5, angle: 0 },
      { dir: 1, at: 0.86, len: 0.86, angle: 0.2 },
    ],
    // Three trunks from near the base, so the crown starts low and spreads.
    bushy: [
      { dir: -1, at: -0.35, len: 0.95, angle: -0.16 },
      { dir: 0, at: -0.25, len: 0.85, angle: 0.01 },
      { dir: 1, at: -0.35, len: 0.95, angle: 0.15 },
    ],
    // Long reaching branches; the foliage hangs under them rather than sitting on them.
    weeping: [
      { dir: -1, at: 0.5, len: 1.05, angle: -0.13 },
      { dir: 0, at: 0.62, len: 0.55, angle: 0 },
      { dir: 1, at: 0.5, len: 1.05, angle: 0.12 },
    ],
  }
  const arms = armSpec[opts.form].map((a, i) => ({ ...a, id: String.fromCharCode(65 + i) }))

  /**
   * The branches themselves. The lag runs down the chain — trunk peaks at `gust`, branches
   * at `peak`, clumps at `ease` — so the tree is in three states at once, which is what a
   * wave through a structure looks like and what a synchronised sway never does.
   */
  for (const arm of arms) {
    const b = `br${arm.id}`
    const t = `br${arm.id}t`
    // `at` is the fraction of the trunk the branch leaves from, so a conifer's tiers climb
    // it and a bushy tree's split below the fork.
    const host = arm.at < 0 ? 'trunk0' : arm.at < 0.45 ? 'trunk1' : 'trunk2'
    const local = arm.at < 0 ? -seg * (1 + arm.at) : arm.at < 0.45 ? -seg * (arm.at / 0.45) : -seg * ((arm.at - 0.45) / 0.55) * 0.45
    bones.push({ name: b, parent: host, x: arm.dir * girth * 0.7, y: local, z: arm.dir * 2, angle: arm.angle })
    bones.push({ name: t, parent: b, x: 0, y: -spread * arm.len, z: 0, angle: arm.angle * 0.38 })
    parts.push(
      { name: `${b}p`, bone: b, material: 'bark', shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -spread * arm.len, r: girth * 0.4, r1: girth * 0.27 } },
      { name: `${t}p`, bone: t, material: 'bark', z: -9.5, shift: -1, shape: { kind: 'capsule', x0: 0, y0: 0, x1: arm.dir * 2, y1: -spread * arm.len * 0.8, r: girth * 0.27, r1: girth * 0.13 } },
    )
    tracks.push(
      { bone: b, channel: 'angle', keys: sway(0, 0.11, 0.57, 1.02, 0.41, -0.11) },
      { bone: t, channel: 'angle', keys: sway(-0.11, 0.06, 0.47, 1.18, 0.72, 0.03) },
    )
  }

  // The crown's shadow: three masses that own the silhouette from behind, so the foliage
  // has something to sit on and the gaps between clumps read as depth rather than as holes.
  for (const [i, arm] of arms.entries()) {
    parts.push({
      name: `mass${arm.id}`,
      bone: `br${arm.id}t`,
      material: 'bark',
      z: 4,
      shift: -1,
      shape: { kind: 'lobed', cx: arm.dir * spread * 0.18, cy: -spread * 0.08, rx: spread * 0.62 * arm.len, ry: spread * 0.46 * arm.len, rz: 9, lobes: 7, depth: 0.2, phase: seed + i * GOLDEN, octaves: 2 },
    })
  }

  /**
   * The clumps, laid out around the crown by angle rather than by hand. The golden angle
   * spaces them so no two land in line, which is the same trick a plant uses for the same
   * reason — and here it means a wood of trees never shows a repeated arrangement.
   */
  for (let i = 0; i < clumps; i++) {
    const a = i * GOLDEN + seed
    const u = clumps === 1 ? 0 : i / (clumps - 1)
    const arm = arms[i % arms.length]!
    let cx: number
    let cy: number
    let s = 0.82 + 0.3 * (((i * 3) % 4) / 4)

    // **Each form places its foliage differently, and that is what a crown's structure is.**
    if (opts.form === 'conifer') {
      // Tiers: wide at the bottom, narrow at the top, foliage sitting ON the branch.
      cx = (arm.dir || (i % 2 ? 1 : -1)) * spread * 0.4 * (1 - u * 0.75)
      cy = -spread * 0.1
      s = 1.05 - u * 0.55
    } else if (opts.form === 'umbrella') {
      // A shallow disc: everything spread sideways and almost nothing vertical.
      cx = (u - 0.5) * spread * 1.7
      cy = -spread * 0.08 + Math.abs(u - 0.5) * spread * 0.3
      s = 0.9 - Math.abs(u - 0.5) * 0.5
    } else if (opts.form === 'bushy') {
      // A wide low dome, denser toward the middle.
      cx = Math.cos(a) * spread * (0.5 + 0.45 * u)
      cy = -spread * 0.2 + Math.sin(a) * spread * 0.3
      s = 0.85 + 0.35 * (1 - u)
    } else if (opts.form === 'weeping') {
      // Hanging BELOW the branch tip, and further down the further out it is.
      cx = (u - 0.5) * spread * 1.3
      cy = spread * (0.1 + u * 0.55)
      s = 0.7 + 0.3 * (1 - u)
    } else {
      const r = spread * (0.42 + 0.34 * ((i * 7) % 5) / 5)
      cx = Math.cos(a) * r
      cy = -spread * 0.35 + Math.sin(a) * r * 0.55
    }

    const near = arms.reduce((best, cand) => (Math.abs(cand.dir * spread - cx) < Math.abs(best.dir * spread - cx) ? cand : best), arms[0]!)
    const bone = `c${i}`
    bones.push({ name: bone, parent: `br${near.id}t`, x: cx * 0.55, y: cy * 0.5, z: ((i % 3) - 1) * 3, angle: 0 })
    parts.push(
      { name: `${bone}A`, bone, material: leaf, z: -5, shape: { kind: 'lobed', cx: 0, cy: 0, rx: spread * 0.42 * s, ry: spread * 0.33 * s, rz: 7, lobes: 5, depth: 0.3, phase: a, octaves: 3 } },
      { name: `${bone}B`, bone, material: leaf, z: -8, shape: { kind: 'lobed', cx: spread * 0.17 * s, cy: spread * 0.14 * s, rx: spread * 0.25 * s, ry: spread * 0.21 * s, rz: 5, lobes: 4, depth: 0.32, phase: a + 1.1, octaves: 3 } },
    )
    const off = ((i % 5) - 2) * 0.04
    tracks.push({ bone, channel: 'angle', keys: sway(-0.2 + off, 0 + off, 0.36 + off, 1.08 + off, 1.18 + off, 0.3 + off) })
  }

  const gait: Gait = { name: 'wind', phases: [...PHASES], tracks }
  return { name, palette: WOOD, skeleton: { bones }, parts, gait }
}

/**
 * **The wood.** Nine trees, no two the same, and every number below is an argument rather
 * than a shape — which is the whole difference between this file and run 9.
 */
export const FOREST: readonly Grammar[] = [
  makeTree({ name: 'tree-a', form: 'round', height: 44, lean: 1.6, spread: 24, clumps: 13, leaf: 'leafB', seed: 0.0 }),
  makeTree({ name: 'tree-b', form: 'conifer', height: 52, lean: -0.4, spread: 20, clumps: 12, leaf: 'leafB', seed: 1.1 }),
  makeTree({ name: 'tree-c', form: 'umbrella', height: 40, lean: 0.6, spread: 21, clumps: 9, leaf: 'leafC', seed: 2.2 }),
  makeTree({ name: 'tree-d', form: 'bushy', height: 14, lean: -1.1, spread: 15, clumps: 10, leaf: 'leafA', seed: 3.3 }),
  makeTree({ name: 'tree-e', form: 'conifer', height: 62, lean: 0.3, spread: 23, clumps: 14, leaf: 'leafC', seed: 4.4 }),
  makeTree({ name: 'tree-f', form: 'weeping', height: 34, lean: -0.9, spread: 19, clumps: 10, leaf: 'leafA', seed: 5.5 }),
  makeTree({ name: 'tree-g', form: 'bushy', height: 11, lean: 1.4, spread: 12, clumps: 8, leaf: 'leafB', seed: 6.6 }),
  makeTree({ name: 'tree-h', form: 'round', height: 30, lean: -1.7, spread: 17, clumps: 10, leaf: 'leafA', seed: 7.7 }),
  makeTree({ name: 'tree-i', form: 'umbrella', height: 50, lean: 0.9, spread: 18, clumps: 8, leaf: 'leafB', seed: 8.8 }),
]
