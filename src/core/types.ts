/**
 * The grammar's vocabulary. Everything here is data — no behaviour, no imports.
 *
 * Angles are in **turns** (1 = full revolution) everywhere, never radians and never
 * degrees. Rationale: every angle in a gait is a fraction of a cycle, so turns keep the
 * numbers derived from the domain instead of hand-calibrated (`HARNESS.md` §2.7).
 * portable.
 */

export type RGB = readonly [number, number, number]

/** Index 0 is reserved: background / transparent. A part never paints it. portable. */
export type Palette = {
  readonly name: string
  readonly colors: readonly RGB[]
  readonly ramps: readonly Ramp[]
}

/** A material's tone ramp, dark -> light. Its **length is the tone budget**. portable. */
export type Ramp = {
  readonly material: string
  readonly indices: readonly number[]
}

export type IndexedBuffer = {
  readonly w: number
  readonly h: number
  /** One palette index per pixel, row-major. */
  readonly data: Uint8Array
}

/** A named anchor. Parents are always declared before their children. portable. */
export type Bone = {
  readonly name: string
  readonly parent: string | null
  /** Rest offset in the parent's space, in pixels. */
  readonly x: number
  readonly y: number
  /**
   * Rest depth in the parent's space, positive **away from the viewer**. Optional, and 0
   * means "on the body's centre plane".
   *
   * This is 2.5D on purpose: depth resolves *who is in front*, and nothing else. There is
   * no projection divide, so a bone's `z` never moves a pixel on screen — it only decides
   * which surface wins where two overlap. That is the whole of what the far-limb defect
   * family needed, and a full 3D transform would have been a bigger promise than the
   * problem. portable.
   */
  readonly z?: number
  /** Rest angle, in turns. */
  readonly angle: number
}

export type Skeleton = { readonly bones: readonly Bone[] }

/**
 * Shapes live in **bone space**. Animation transforms them; it never redraws them.
 *
 * Every primitive here was always the 2D shadow of a solid, and the depth field is what
 * admits it: an ellipse is an ellipsoid, a capsule is already a sphere swept along a
 * segment, a rect is a rounded box. That is why depth cost a field rather than a rewrite —
 * the vocabulary was chosen, on day zero, out of shapes that have a third dimension for
 * free. portable.
 */
export type Shape =
  /** `rz` is the depth radius; it defaults to the smaller of `rx` and `ry`. */
  | { readonly kind: 'ellipse'; readonly cx: number; readonly cy: number; readonly rx: number; readonly ry: number; readonly rz?: number }
  /** A sphere of radius `r` swept along the segment: `r` is the depth radius too. */
  | { readonly kind: 'capsule'; readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number; readonly r: number }
  /** `d` is the full depth of the box; it defaults to the smaller of `w` and `h`. */
  | { readonly kind: 'rect'; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly d?: number }
  /**
   * **An ellipse whose radius waves as it goes round: `r(θ) = R · (1 + depth · cos(lobes·θ + phase))`.**
   *
   * The first new primitive since round zero, and it exists because run 9 proved the
   * vocabulary had a hole rather than a tuning problem. Every other shape here is **convex**,
   * and the union of convex solids is smooth — so a body whose form lives in a *ragged
   * boundary* (foliage, a cloud, a rock, a flame, torn cloth) could not be built at all. It
   * was not that a tree was hard; it was that a tree was inexpressible, and two rounds of
   * moving ellipses around could never have found that out.
   *
   * `lobes` is how many bumps go round, `depth` is how far they swing as a fraction of the
   * radius, `phase` rotates the pattern so neighbouring clumps do not stamp identically.
   * Closed form in θ — no noise, no seed, nothing to make deterministic after the fact.
   * portable, and it is the most portable thing in this file: silhouette is where every
   * organic subject lives.
   */
  | {
      readonly kind: 'lobed'
      readonly cx: number
      readonly cy: number
      readonly rx: number
      readonly ry: number
      readonly rz?: number
      readonly lobes: number
      readonly depth: number
      readonly phase?: number
    }

export type Part = {
  readonly name: string
  readonly bone: string
  readonly material: string
  readonly shape: Shape
  /**
   * Depth offset from the bone's plane, positive away from the viewer. Structural depth —
   * which limb row a part belongs to — belongs on the bone; this is for a part that has to
   * sit **proud of the mass it is attached to**: a browridge, a knuckle, a plate.
   *
   * It exists because the first authoring pass under the solver found the same defect four
   * times over — brow, fist, foot, shoulder — and it is one defect: a small part's default
   * depth is its smaller screen radius, a big part's is *its* bigger one, so detail sinks
   * inside mass and vanishes. The old renderer hid this behind paint order, which is
   * another way of saying paint order was carrying meaning nobody had declared. portable.
   */
  readonly z?: number
  /**
   * Steps to slide this part along its material's ramp, negative for darker.
   *
   * **It used to be how depth was expressed, and since the depth solver it is the cheat
   * knob instead** — which is the correct job for it and always was. Real occlusion is now
   * computed from `Bone.z`; what stays here is the deliberate lie: art that ships pushes
   * the far side down a step past what the light would do, because *legible* and *correct*
   * are not the same target. A solver only ever gives the second one, so the knob that
   * gives the first has to survive it.
   *
   * The rule it still enforces is the one the human found before I did: a limb on the far
   * side is lit by the same lamp, so it moves along its **own** ramp, never into a
   * different material. portable.
   */
  readonly shift?: number
}

/** A named instant of the cycle. The gait is a set of named phases, never a bare sine. */
export type Phase = { readonly name: string; readonly at: number }

/**
 * `scale` is what makes one body become another: a part at scale 0 is gone, a part at
 * scale 1 is whole, and everything between is a thing arriving or leaving. Unlike the
 * others it carries **no amplitude from the tunables** — a scale key is already a ratio and
 * has no unit in the domain to be anchored against, where an angle is a fraction of a turn
 * and an offset is pixels.
 *
 * `z` is the newest, and it is the one that buys an action rather than a look: a limb that
 * travels in depth passes in front of the mass it was behind, and the solver resolves that
 * without anybody choosing a paint order. A punch is the case that needs it — a fist is
 * behind the shoulder at the wind-up and in front of the chest at the strike, and no
 * static ordering expresses both. Its amplitude is `gait.depth`, in pixels, like `x`
 * and `y`. portable.
 */
export type Channel = 'angle' | 'x' | 'y' | 'z' | 'scale'

/**
 * One key per phase, in phase order, **normalized to [-1, 1]**. The amplitude that turns
 * a key into pixels or turns lives in the tunables file, so a gait is retimed and
 * re-scaled without touching the grammar. portable.
 */
export type Track = {
  readonly bone: string
  readonly channel: Channel
  readonly keys: readonly number[]
}

export type Gait = {
  readonly name: string
  readonly phases: readonly Phase[]
  readonly tracks: readonly Track[]
}

export type Grammar = {
  readonly name: string
  readonly palette: Palette
  readonly skeleton: Skeleton
  /** Paint order, and therefore deterministic. */
  readonly parts: readonly Part[]
  readonly gait: Gait
}

/**
 * The tunables file, typed. Every number the render reads is here — no magic constants
 * in code (`HARNESS.md` §2.3). `_anchors` names where each number came from (§2.7).
 */
export type Params = {
  readonly canvas: { readonly w: number; readonly h: number; readonly originX: number; readonly originY: number }
  readonly tones: { readonly perMaterial: number }
  readonly frames: { readonly walk: number }
  /**
   * Direction the light comes **from**, in canvas space (y grows down, z away from the
   * viewer), and the curve that maps brightness onto the ramp. `curve` of 1 is linear,
   * which is the physical answer and the wrong one: it spends half the sprite on the shadow
   * side, and the shadow side is where the silhouette goes to die. Above 1 the dark end
   * compresses into a rim.
   *
   * `z` is negative for a lamp on the viewer's side, and it is the knob that decides how
   * much of the ramp a body spends on facing-the-camera. At `z` near -1 almost every pixel
   * faces the light and the sprite flattens into one bright tone; near 0 the light grazes
   * and the form comes back. The vector is normalized at use, so the three numbers may be
   * authored as a direction rather than as a unit.
   */
  readonly light: { readonly x: number; readonly y: number; readonly z: number; readonly curve: number }
  /**
   * How the silhouette is made to read. `enabled` draws a line outside it; `rim` pushes the
   * sprite's own edge pixels to the ends of their ramps instead. They are the two answers
   * this round is comparing, and they are independent knobs so that "both" and "neither"
   * are also expressible — a round that can only express its two hypotheses is a round
   * that cannot be surprised.
   */
  readonly outline: {
    readonly enabled: boolean
    readonly material: string
    readonly inner: boolean
    readonly rim: boolean
  }
  readonly body: { readonly scale: number }
  /**
   * Amplitudes applied to the grammar's normalized track keys. `swing` is turns, `lift` is
   * pixels across the screen, `depth` is pixels into it.
   */
  readonly gait: { readonly swing: number; readonly lift: number; readonly depth: number }
  /** Probability a painted pixel drops one tone. 0 disables the injected RNG entirely. */
  readonly texture: { readonly speckle: number }
  /** Read by the viewer, never by the core. Lives here so it is anchored like any number. */
  readonly playback: { readonly msPerFrame: number; readonly scale: number }
  readonly _anchors: Readonly<Record<string, string>>
}
