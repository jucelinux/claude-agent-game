/**
 * Run 12 — **a tree is recursive, and that is the whole correction.**
 *
 * The first pass built a tree as a *flat* structure: a trunk, three arms off it, and a
 * scatter of foliage blobs placed on a curve. Five hand-written layouts stood in for five
 * kinds of tree. His reading of it, 15/08: *"as árvores estão disformes"*, and the second
 * reading named the cause exactly — *"variações no padrão do tronco, dos ramos, da
 * circunferência da copa que trazem individualidade"*.
 *
 * **Why a flat structure could never have produced that.** With trunk → arm → tip fixed at
 * three levels, the only thing an argument can change is a *number*. Two trees differ by
 * how long an arm is, never by how the tree is put together. So every crown came out the
 * same shape, and the five "forms" were five typed-out arrangements rather than five
 * growths — the file said it was a grammar and behaved like a template.
 *
 * **What replaced it.** A branch is a smaller tree. `grow` calls itself: a limb forks into
 * children, each shorter and thinner than its parent, and foliage attaches to whatever the
 * last generation is. Three consequences, none of them designed and all of them harvested
 * from the recursion:
 *
 * 1. **The crown has no layout.** Its outline is wherever the branches ended, so it is a
 *    *consequence* of the branching and cannot disagree with it. The old crown was placed
 *    independently of the arms, which is why bark-coloured masses sat in open air.
 * 2. **Foliage sways because its branch sways.** No separate track, no risk of a clump
 *    moving against the limb carrying it.
 * 3. **Topology is now an argument.** `split`, `levels`, `divergence` and `whorls` change
 *    how the tree is *assembled*, so two trees are different structures and not two sizes
 *    of one.
 *
 * **One mechanism covers both growth habits, with no special case.** Botany separates
 * *excurrent* trees — one leader running to the top with tiers of branches off it, a pine —
 * from *decurrent* — the leader forks and disappears into the crown, an oak. Here that is
 * `whorls`: many tiers up a slow-tapering trunk is a pine, one or two high tiers on a
 * fast-tapering trunk is an oak. There is still no branch of this function that names a
 * tree.
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
 * **Every argument here is one axis of individuality, and it is grouped the way he named
 * them:** the trunk, the branching, the crown.
 *
 * No argument is here because it seemed useful. Each one is a difference visible between
 * two trees standing side by side, which is the only test that matters for a wood.
 */
export type TreeOpts = {
  readonly name: string

  // ---- the trunk ------------------------------------------------------------------
  /** Base to leader tip, in bone units. */
  readonly height: number
  /** Trunk radius at the base, before the root flare. */
  readonly girth: number
  /**
   * How fast the trunk thins. **This one number is the difference between a pine and an
   * oak's trunk**: below 1 the trunk stays thick almost to the tip and can carry tiers of
   * branches the whole way up; above 1 it spends its mass low and has nothing left at the
   * top, so the crown has to start early.
   */
  readonly taperPow: number
  /** Root swell at the very base, as a fraction of `girth`. */
  readonly flare: number
  /** Mid-height swell, as a fraction of `girth`. Negative gives a waisted trunk. */
  readonly bulge: number
  /** Sideways wander per segment, in turns. Seeded, so no two trunks kink alike. */
  readonly wander: number
  /** A constant lean, in turns per segment. Wander is irregular; this is a direction. */
  readonly lean: number

  // ---- the branching --------------------------------------------------------------
  /** Fraction of the trunk below the lowest branch. A high value is a bare trunk. */
  readonly first: number
  /** Tiers of branches between `first` and the leader tip. Many is excurrent, one is not. */
  readonly whorls: number
  /** Limbs in each tier. */
  readonly perWhorl: number
  /** Forks after the limb itself. 0 leaves bare limbs; 3 is a dense crown. */
  readonly levels: number
  /** Children at each fork. */
  readonly split: number
  /** Half the opening of a fork, in turns. */
  readonly divergence: number
  /** A child's length as a fraction of its parent's. */
  readonly shorten: number
  /** A first-tier limb's length, as a fraction of trunk height. */
  readonly reach: number
  /** Turns added to every child. Negative lifts the crown; positive lets it hang. */
  readonly droop: number

  // ---- the crown ------------------------------------------------------------------
  /**
   * Foliage radius at a twig tip, in bone units — **his "circunferência da copa"**. It is
   * not the crown's overall size, which the branching decides; it is how much leaf each
   * twig carries, and therefore whether the tips fuse into one mass or read as separate
   * tufts.
   */
  readonly crown: number
  readonly leaf: 'leafA' | 'leafB' | 'leafC'

  readonly seed: number
  /** Multiplies this tree's whole sway. A heavy old tree moves less than a sapling. */
  readonly windGain?: number
}

/**
 * **The wind, authored once at six named phases, and sampled with a lag per level.**
 *
 * A gust: a slow build, a hard peak, a long settle and a small recoil past rest. It is data
 * rather than a sine, so it can be shaped by hand — and the lag is a *fractional* index
 * into it, so a branch four levels out is genuinely behind the trunk instead of being
 * quantised to the nearest phase.
 */
const GUST: readonly number[] = [0, 0.12, 0.42, 1.0, 0.55, -0.1]

const PHASES = [
  { name: 'calm', at: 0 },
  { name: 'rise', at: 3 / 16 },
  { name: 'gust', at: 5 / 16 },
  { name: 'peak', at: 8 / 16 },
  { name: 'ease', at: 11 / 16 },
  { name: 'settle', at: 13 / 16 },
] as const

/** Cyclic linear sample of an authored key list at a fractional index. */
function at(keys: readonly number[], x: number): number {
  const n = keys.length
  const u = ((x % n) + n) % n
  const i = Math.floor(u)
  const f = u - i
  return (keys[i] as number) * (1 - f) + (keys[(i + 1) % n] as number) * f
}

/** The gust, delayed by `lag` phases and scaled to `gain`. */
const gust = (lag: number, gain: number): number[] => GUST.map((_, i) => gain * at(GUST, i - lag))

/**
 * **Sway amplitude by level.** A trunk barely moves, a limb moves, a twig whips. The
 * exponent is what makes the tree read as flexible rather than as one hinged object: equal
 * amplitude at every level is a windscreen wiper.
 */
const levelGain = (level: number): number => 0.06 * level ** 1.15

/** The golden angle: the cheapest way to make N things not agree with each other. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/**
 * A deterministic value in [-1, 1) from a seed and an index. This is grammar *construction*,
 * not render, so it runs once per tree and never inside a frame — the render stays a pure
 * function of the grammar it is handed (`HARNESS.md` §2.2).
 */
function jitter(seed: number, i: number): number {
  let h = Math.imul(((seed * 4096) | 0) ^ Math.imul(i + 1, 2654435761), 2246822519)
  h ^= h >>> 13
  h = Math.imul(h, 3266489917)
  h ^= h >>> 16
  return (h >>> 0) / 2147483648 - 1
}

/** Trunk segments. Five is what a bulge needs to read as a curve rather than as a kink. */
const SEGS = 5

/**
 * **The physical ceiling on a trunk, and it throws rather than clamps.**
 *
 * His reading of the third pass: *"você exagerou na base do tronco... precisamos garantir os
 * limites físicos dessa diversidade"*. He was pointing at `tree-broad`, whose flared base
 * measured **0.57 of the whole tree's height** — five times past a baobab, which is the
 * stoutest tree that exists.
 *
 * Real base diameter over total height:
 *
 * | tree | ratio |
 * |---|---|
 * | forest conifer | 0.02 – 0.04 |
 * | open-grown oak | 0.06 – 0.10 |
 * | veteran, baobab | 0.15 – 0.25 |
 *
 * Pixel art runs stouter than life and should, so the bound is set at the *upper* end of
 * what exists rather than at the middle. `BASE_MAX` is against the **trunk** height, which
 * is always less than the tree's, and the lock in `tests/forest.test.ts` checks the
 * measured ratio against the whole tree — argument here, pixels there.
 *
 * **It throws.** A clamp would quietly redraw a tree the author asked for and the author
 * would never learn, which is how `tree-broad` survived a reading. The skeleton's
 * parent-before-child rule is the precedent: a loud failure at build time found a defect
 * that a compiler could not.
 */
const BASE_MAX = 0.17

/**
 * Build a tree. Everything is derived from the arguments — there is no branch of this
 * function that special-cases a particular tree, because the moment there is, a forest
 * stops being generated and starts being typed out again.
 */
export function makeTree(opts: TreeOpts): Grammar {
  const {
    name, height, girth, taperPow, flare, bulge, wander, lean,
    first, whorls, perWhorl, levels, split, divergence, shorten, reach, droop,
    crown, leaf, seed,
  } = opts
  const gain = opts.windGain ?? 1

  const base = girth * (1 + flare)
  if (base > BASE_MAX * height) {
    throw new Error(
      `${name}: flared base radius ${base.toFixed(1)} is ${(base / height).toFixed(3)} of the ` +
        `trunk height ${height}, past the physical ceiling of ${BASE_MAX}. A tree is made wide ` +
        `by its branches, not by its trunk — raise \`height\` or \`reach\`, or lower \`girth\`.`,
    )
  }

  const bones: Bone[] = []
  const parts: Part[] = []
  const tracks: Track[] = []

  /**
   * **The trunk's profile, and it is the first thing here a number could not change
   * before.** The old trunk was a linear taper in three pieces, so every trunk in the wood
   * was the same cone at a different size. This is a curve with three independent terms —
   * a root flare that dies off fast, a mid-height swell, and a power taper — and each one
   * is visible on its own from ten paces.
   */
  const radiusAt = (u: number): number =>
    girth *
    Math.max(0.06, (1 - u * 0.94) ** taperPow) *
    (1 + flare * Math.exp(-u * 7)) *
    (1 + bulge * Math.sin(Math.PI * u))

  const segLen = height / SEGS
  for (let i = 0; i < SEGS; i++) {
    const nm = `t${i}`
    bones.push({
      name: nm,
      parent: i === 0 ? null : `t${i - 1}`,
      x: 0,
      y: i === 0 ? 0 : -segLen,
      z: 0,
      angle: i === 0 ? 0 : lean + wander * jitter(seed, i * 31),
    })
    parts.push({
      name: `${nm}p`,
      bone: nm,
      material: 'bark',
      shape: {
        kind: 'capsule',
        x0: 0, y0: i === 0 ? 2 : 0, x1: 0, y1: -segLen,
        r: radiusAt(i / SEGS), r1: radiusAt((i + 1) / SEGS),
      },
    })
    // The trunk carries the gust with almost no amplitude and no lag: it is the thing
    // everything else is late relative to.
    if (i > 0) tracks.push({ bone: nm, channel: 'angle', keys: gust(0, 0.004 * i * gain) })
  }

  // Roots, in front of the trunk so the flare reads. Behind it the trunk's own mass wins.
  // They scale with `flare`, so a tree with no swell has no visible root either.
  const rootR = girth * (1 + flare)
  parts.push(
    { name: 'rootL', bone: 't0', material: 'bark', z: -2, shift: -1, shape: { kind: 'capsule', x0: 1, y0: -3, x1: -rootR * 1.25, y1: 4, r: rootR * 0.46 } },
    { name: 'rootR', bone: 't0', material: 'bark', z: -2, shift: -1, shape: { kind: 'capsule', x0: -1, y0: -3, x1: rootR * 1.25, y1: 4, r: rootR * 0.42 } },
  )

  let n = 0
  let leaves = 0

  /**
   * **Foliage sits on whatever the last generation of branch turned out to be.** Two lobed
   * masses per tip, the second offset and smaller, so a tip has an inner and an outer face
   * rather than one flat disc. Nothing here chooses where the crown goes — the branches
   * already did.
   */
  const foliate = (bone: string, tipY: number, zAcc: number): void => {
    const k = ++leaves
    const r = crown * (0.84 + 0.34 * Math.abs(jitter(seed, k * 11)))
    const shift = zAcc > 2.5 ? -1 : 0
    parts.push(
      {
        name: `f${k}a`, bone, material: leaf, z: -6, shift,
        shape: {
          kind: 'lobed',
          cx: jitter(seed, k * 13) * r * 0.28, cy: tipY - r * 0.3,
          rx: r, ry: r * 0.84, rz: r * 0.85,
          lobes: 5, depth: 0.3, phase: k * GOLDEN + seed, octaves: 3,
        },
      },
      {
        name: `f${k}b`, bone, material: leaf, z: -10, shift,
        shape: {
          kind: 'lobed',
          cx: jitter(seed, k * 17) * r * 0.5, cy: tipY + r * (0.1 + 0.3 * Math.abs(jitter(seed, k * 19))),
          rx: r * 0.66, ry: r * 0.58, rz: r * 0.55,
          lobes: 4, depth: 0.34, phase: k * GOLDEN + seed + 1.3, octaves: 3,
        },
      },
    )
  }

  /**
   * **One branch, and then the same function again for its children.** The recursion is
   * eleven lines and it is the whole of what the old file had five hand-written layouts to
   * approximate.
   *
   * `zAcc` is carried rather than read back out of the solver, because the *shift* — the
   * deliberate darkening of the far side, `Part.shift` — has to be decided while the parts
   * are being written and the solver has not run yet.
   */
  const grow = (host: string, ox: number, oy: number, angle: number, len: number, rad: number, level: number, zAcc: number): void => {
    const my = `b${++n}`
    const dz = jitter(seed, n * 7) * rad * 1.6
    bones.push({ name: my, parent: host, x: ox, y: oy, z: dz, angle })
    parts.push({
      name: `${my}p`,
      bone: my,
      material: 'bark',
      shift: zAcc + dz > 2.5 ? -1 : 0,
      shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: -len, r: rad, r1: rad * 0.72 },
    })
    // The lag runs down the chain, so the tree is in several states of the same gust at
    // once. That is what a wave through a structure looks like, and what one shared key
    // list never does however well it is shaped.
    tracks.push({ bone: my, channel: 'angle', keys: gust(level * 0.7, levelGain(level) * gain) })

    if (level >= levels + 1) {
      foliate(my, -len, zAcc + dz)
      return
    }
    for (let k = 0; k < split; k++) {
      const t = split === 1 ? 0 : k / (split - 1) - 0.5
      const a = t * 2 * divergence + droop + jitter(seed, n * 101 + k) * divergence * 0.5
      grow(my, 0, -len, a, len * shorten * (0.9 + 0.2 * Math.abs(jitter(seed, n * 53 + k))), rad * 0.72, level + 1, zAcc + dz)
    }
  }

  /**
   * **The whorls: where limbs leave the trunk.** Many tiers spread up a slow-tapering trunk
   * is a conifer; one or two high tiers on a fast-tapering trunk is a broadleaf. A tier's
   * limbs get shorter the higher they are, which is the entire silhouette of a conifer
   * written as one multiplication.
   */
  for (let w = 0; w < whorls; w++) {
    const u = first + (1 - first) * (whorls === 1 ? 0 : w / (whorls - 1)) * 0.94
    const si = Math.min(SEGS - 1, Math.floor(u * SEGS))
    const local = -segLen * (u * SEGS - si)
    const limb = height * reach * (1 - u * 0.6)
    const rad = Math.max(0.9, radiusAt(u) * 0.62)
    // **A limb leaves the trunk wider than its own forks do, but never past horizontal.**
    // The cap is 0.19 turn = 68 degrees and it is not a taste: at 2.1x, a divergence of
    // 0.135 put tree-bush's outer limbs at 102 degrees, which points down and out — a fallen
    // branch, not a growing one. It carried its foliage below the trunk base and the outline
    // lock read it as the cell being too short, which was the wrong diagnosis of a real
    // defect. Bounded here rather than per tree, so no argument can ask for it again.
    const wide = Math.min(0.19, divergence * 2.1)
    for (let k = 0; k < perWhorl; k++) {
      const t = perWhorl === 1 ? 0 : k / (perWhorl - 1) - 0.5
      // Each tier is rotated against the last by the golden angle, so no two tiers stack
      // their limbs in the same places and the trunk never shows a ladder.
      const spin = Math.cos(w * GOLDEN + k * 2.1)
      const a = t * 2 * wide + droop * 0.6 + jitter(seed, w * 211 + k) * divergence * 0.7
      grow(`t${si}`, Math.sign(t || spin) * radiusAt(u) * 0.6, local, a, limb, rad, 1, spin * radiusAt(u) * 1.4)
    }
  }

  const gait: Gait = { name: 'wind', phases: [...PHASES], tracks }
  return { name, palette: WOOD, skeleton: { bones }, parts, gait }
}

/**
 * **The wood.** Fourteen trees, and the difference between any two of them is structural
 * rather than dimensional: they do not have the same number of tiers, the same number of
 * forks, the same trunk curve or the same crown density. That is what he asked for on the
 * second reading, and no amount of re-tuning the first pass could have supplied it.
 */
export const FOREST: readonly Grammar[] = [
  // A big decurrent broadleaf: the leader gives up early and two high tiers carry a
  // heavy crown. The reference image's foreground trees are this.
  makeTree({ name: 'tree-oak', height: 54, girth: 5.6, taperPow: 1.6, flare: 0.45, bulge: 0.12, wander: 0.006, lean: 0.004,
    first: 0.48, whorls: 2, perWhorl: 3, levels: 2, split: 2, divergence: 0.075, shorten: 0.7, reach: 0.5, droop: -0.005,
    crown: 9.5, leaf: 'leafB', seed: 0.13, windGain: 0.75 }),

  // Excurrent: a leader that runs the whole height under seven tiers of short limbs.
  // Nothing but `taperPow` and `whorls` separates it from the oak above.
  makeTree({ name: 'tree-pine', height: 62, girth: 5, taperPow: 0.5, flare: 0.32, bulge: 0, wander: 0.003, lean: -0.002,
    first: 0.12, whorls: 8, perWhorl: 2, levels: 1, split: 2, divergence: 0.1, shorten: 0.62, reach: 0.3, droop: 0.035,
    crown: 5.6, leaf: 'leafC', seed: 1.7, windGain: 0.6 }),

  // Slim, tall, waisted, and it wanders: a birch reads by its trunk, not its crown.
  makeTree({ name: 'tree-birch', height: 56, girth: 3.2, taperPow: 1.1, flare: 0.16, bulge: -0.08, wander: 0.014, lean: 0.006,
    first: 0.58, whorls: 3, perWhorl: 2, levels: 2, split: 2, divergence: 0.06, shorten: 0.72, reach: 0.34, droop: -0.015,
    crown: 6.2, leaf: 'leafA', seed: 2.9, windGain: 1.35 }),

  // Weeping: the same recursion with a positive droop, so every generation turns further
  // down and the crown hangs instead of standing.
  makeTree({ name: 'tree-willow', height: 42, girth: 4.4, taperPow: 1.25, flare: 0.45, bulge: 0.06, wander: 0.008, lean: -0.008,
    first: 0.46, whorls: 2, perWhorl: 3, levels: 2, split: 2, divergence: 0.1, shorten: 0.82, reach: 0.58, droop: 0.075,
    crown: 7, leaf: 'leafA', seed: 3.4, windGain: 1.5 }),

  // A vase: one high tier of four limbs that lift as they fork. Three levels, so this is
  // the densest crown in the wood.
  makeTree({ name: 'tree-elm', height: 48, girth: 5.2, taperPow: 1.45, flare: 0.35, bulge: 0.1, wander: 0.005, lean: 0.003,
    first: 0.62, whorls: 1, perWhorl: 4, levels: 3, split: 2, divergence: 0.068, shorten: 0.66, reach: 0.6, droop: -0.022,
    crown: 6.4, leaf: 'leafB', seed: 4.1, windGain: 0.85 }),

  // Narrow spire: nine tiers of two on a trunk that barely tapers, the limbs almost level.
  makeTree({ name: 'tree-spruce', height: 70, girth: 4.4, taperPow: 0.45, flare: 0.25, bulge: 0, wander: 0.002, lean: 0.001,
    first: 0.08, whorls: 9, perWhorl: 2, levels: 1, split: 2, divergence: 0.055, shorten: 0.6, reach: 0.22, droop: 0.05,
    crown: 5.7, leaf: 'leafC', seed: 5.2, windGain: 0.5 }),

  // Round and dense: three mid tiers of three, short forks, fat tips. The tips fuse.
  makeTree({ name: 'tree-maple', height: 42, girth: 4.6, taperPow: 1.35, flare: 0.38, bulge: 0.14, wander: 0.007, lean: -0.005,
    first: 0.42, whorls: 3, perWhorl: 3, levels: 2, split: 2, divergence: 0.09, shorten: 0.68, reach: 0.42, droop: 0,
    crown: 8, leaf: 'leafA', seed: 6.6, windGain: 1 }),

  // A bare trunk carrying everything at the very top, and it fans rather than forks.
  makeTree({ name: 'tree-crown', height: 50, girth: 3.6, taperPow: 0.85, flare: 0.22, bulge: 0.05, wander: 0.006, lean: 0.007,
    first: 0.88, whorls: 1, perWhorl: 5, levels: 1, split: 2, divergence: 0.13, shorten: 0.76, reach: 0.5, droop: 0.055,
    crown: 6, leaf: 'leafB', seed: 7.3, windGain: 1.2 }),

  // **Broad means wide branches, not a fat trunk** — his correction of the third pass, and
  // the tree that provoked it. It was height 28 on a girth of 8 with a 0.75 flare, so its
  // base measured 0.57 of the whole tree's height. The width stays; the trunk goes back
  // inside what a trunk can be.
  //
  // **`reach` came down with the trunk, and the first attempt forgot that it had to.**
  // `reach` is a fraction of `height`, so raising the trunk to clear the girth ceiling
  // stretched every limb by the same 57% and the tree filled the whole cell edge to edge.
  // Two arguments, one number underneath — which is the shape of coupling the outline lock
  // exists to catch.
  //
  // **Its lowest whorl was at 0.34 and drooping, and the outline lock caught what that
  // means.** A limb that leaves low and turns down carries its foliage below the trunk base
  // — which is below the ground once a scene stands the tree on a floor, so the trunk gets
  // pushed up off it. That is the floating-tree defect arriving by a second route, and no
  // amount of cell height fixes it. The whorl goes up and the droop goes flat.
  makeTree({ name: 'tree-broad', height: 44, girth: 4.8, taperPow: 1.5, flare: 0.5, bulge: 0.16, wander: 0.009, lean: 0.006,
    first: 0.44, whorls: 2, perWhorl: 4, levels: 2, split: 2, divergence: 0.11, shorten: 0.74, reach: 0.58, droop: -0.005,
    crown: 8.4, leaf: 'leafB', seed: 8.8, windGain: 0.8 }),

  // A shrub: no trunk to speak of, tiers starting almost at the ground. Same correction as
  // tree-broad, and it is the tree the correction matters most on — a shrub has the least
  // height to spare between its lowest branch and the floor.
  makeTree({ name: 'tree-bush', height: 16, girth: 2, taperPow: 1.4, flare: 0.25, bulge: 0.1, wander: 0.012, lean: -0.01,
    first: 0.42, whorls: 2, perWhorl: 3, levels: 2, split: 2, divergence: 0.135, shorten: 0.74, reach: 1.0, droop: -0.012,
    crown: 5.8, leaf: 'leafA', seed: 9.5, windGain: 1.6 }),

  // A sapling: the same growth at a tenth of the mass, which is what a young tree is.
  makeTree({ name: 'tree-sapling', height: 20, girth: 2, taperPow: 1.2, flare: 0.2, bulge: 0, wander: 0.016, lean: 0.012,
    first: 0.4, whorls: 2, perWhorl: 2, levels: 2, split: 2, divergence: 0.1, shorten: 0.7, reach: 0.55, droop: -0.01,
    crown: 5.3, leaf: 'leafA', seed: 10.4, windGain: 1.8 }),

  // Old and dying: bare forks and a thin scatter of leaf on them, so the structure of the
  // branching is the subject. A wood with no dead tree in it is a plantation.
  //
  // **It was three levels and a 2.6 crown, and the region check called it.** Mean same-tone
  // region 3.6 px against 6.8 for the idiom he ranked first, and 62% of them single pixels —
  // which is the measurement that says "this is noise, not shading". Foliage smaller than
  // its own outline cannot make a region. Two levels and a wider tip, and the structure is
  // still the subject.
  makeTree({ name: 'tree-snag', height: 40, girth: 4.5, taperPow: 1.55, flare: 0.4, bulge: -0.06, wander: 0.013, lean: -0.011,
    first: 0.5, whorls: 2, perWhorl: 3, levels: 2, split: 2, divergence: 0.095, shorten: 0.66, reach: 0.52, droop: 0.01,
    crown: 3.9, leaf: 'leafC', seed: 11.2, windGain: 0.9 }),

  // Tall, high-crowned, leaning hard: the tree that closes a canopy over a clearing.
  makeTree({ name: 'tree-tall', height: 58, girth: 5.8, taperPow: 1.15, flare: 0.35, bulge: 0.08, wander: 0.008, lean: -0.013,
    first: 0.6, whorls: 2, perWhorl: 3, levels: 2, split: 3, divergence: 0.085, shorten: 0.66, reach: 0.44, droop: -0.01,
    crown: 7, leaf: 'leafB', seed: 12.6, windGain: 1.05 }),

  // Five tiers of three that fork once: airy, and the only tree here whose crown you can
  // see through. Density is a knob, and a wood needs both ends of it.
  makeTree({ name: 'tree-airy', height: 48, girth: 4.2, taperPow: 0.95, flare: 0.28, bulge: 0.04, wander: 0.007, lean: 0.009,
    first: 0.3, whorls: 5, perWhorl: 3, levels: 1, split: 2, divergence: 0.115, shorten: 0.7, reach: 0.36, droop: 0.03,
    crown: 6, leaf: 'leafC', seed: 13.9, windGain: 1.25 }),
]
