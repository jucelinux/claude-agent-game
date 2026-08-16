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
  /**
   * A sphere of radius `r` swept along the segment: `r` is the depth radius too.
   *
   * `r1` tapers it — the sphere's radius runs linearly from `r` at the start to `r1` at the
   * end, which makes a round cone. Omit it and the two are equal, which is the null case and
   * renders byte-identical to every capsule authored before taper existed.
   *
   * It exists because a limb, a horn, a tail, a branch and a blade all narrow, and the only
   * way to say so was to stack capsules of decreasing radius — three parts to describe one
   * shape, each one a seam the render then had to reconcile.
   */
  | {
      readonly kind: 'capsule'
      readonly x0: number
      readonly y0: number
      readonly x1: number
      readonly y1: number
      readonly r: number
      readonly r1?: number
    }
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
      /**
       * **How many octaves of bump, each half the size and twice the frequency of the last.**
       * One octave is a single wave around the rim — a flower, a cog, a simple blob. Real
       * foliage, coastline, rock and cloud are *self-similar*: big lobes carrying smaller
       * lobes carrying smaller still, which is a summed series and not a shape.
       *
       * `depth` stays the total swing whatever this is set to — the amplitudes are
       * normalized — so the two knobs are orthogonal: `depth` is how ragged, `octaves` is at
       * how many scales. That separation is the whole reason to have it, because otherwise
       * adding detail silently changes the size.
       *
       * Octaves are offset from each other by the **golden angle**, the most irrational
       * rotation there is, so no two of them ever line up and produce a false symmetry. It
       * is the same constant that governs where a plant actually puts its leaves, which is a
       * coincidence worth exactly nothing mathematically and is nevertheless the right
       * number for "make these not agree".
       */
      readonly octaves?: number
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
  /**
   * **Whether this part gets an inner outline. A marking does not.**
   *
   * The inner line exists to say *these are two things*: a limb across a chest, a fist against
   * a torso, a plate on a hull. It is drawn wherever a nearer part borders a farther one, and
   * that rule is right for every part that is a **solid**.
   *
   * It is wrong for a part that is a **marking** — a silverback's saddle, a blaze, a stripe, a
   * patch of lichen. A marking has no silhouette of its own; it is a region of the surface it
   * lies on, and ringing it in ink is what turns grey hair into a painted badge. Worse, where
   * a ragged marking's boundary folds back on itself the ring closes into a solid patch, which
   * is what he saw: *"e esse buraco nas costas do gorila?"* — 18 px of ink in the upper back,
   * against 6 px for the sample he ranked first.
   *
   * Defaults to true, which is the null case: every part authored before this existed behaves
   * exactly as it did. portable — the solid/marking distinction is older than pixel art.
   */
  readonly line?: boolean
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
 * `scaleX` and `scaleY` are squash and stretch. They scale in **screen axes**, applied
 * after the rotation, so a body flattens downward whatever angle its limbs happen to be at
 * — which is what a landing does and what a per-limb scale could never express. Like
 * `scale` they carry no amplitude from the tunables, because a ratio has no unit.
 *
 * **Declared approximation.** Shading is computed before the squash and painted onto the
 * squashed shape, so a stretched body keeps the shading of an unstretched one. The exact
 * answer is an inverse-transpose on the normal; the approximation is the one 2D animation
 * has always used, and at the ratios squash actually runs the two are indistinguishable.
 *
 * `z` buys an action rather than a look: a limb that
 * travels in depth passes in front of the mass it was behind, and the solver resolves that
 * without anybody choosing a paint order. A punch is the case that needs it — a fist is
 * behind the shoulder at the wind-up and in front of the chest at the strike, and no
 * static ordering expresses both. Its amplitude is `gait.depth`, in pixels, like `x`
 * and `y`. portable.
 */
export type Channel = 'angle' | 'x' | 'y' | 'z' | 'scale' | 'scaleX' | 'scaleY'

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
   * **The fill light: a second, weaker lamp that keeps the shadow side from going flat.**
   *
   * With one lamp, every surface turned away from it lands on the darkest tone of its ramp
   * and stays there — so the shadow half of a body is one colour and carries no form at all.
   * A fill is what a photographer puts opposite the key, and what a painter calls bounce.
   *
   * `weight` blends the two, and at 0 the render is byte-identical to a single lamp — which
   * is the null case and the reason the field is a weight rather than a switch.
   *
   * **Declared cost.** A fill compresses the value range: it lifts the dark end and pulls
   * the light end down. The ink verdict of 15/08 says a wide value range is half of what
   * makes a sprite read, so this knob spends the exact thing that verdict selected. It is
   * paid for only if the form it returns on the shadow side is worth more than the range it
   * costs, and that trade is measured, not assumed.
   *
   * **Known limitation, and it points at a gap rather than a bug.** A real fill is a
   * different *colour* from the key, usually cooler. A material here has one ramp, so a
   * fill can only lift value and never shift hue. Colour temperature needs more than one
   * ramp per part, which is a vocabulary the grammar does not have yet.
   */
  readonly fill: { readonly x: number; readonly y: number; readonly z: number; readonly weight: number }
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
  /**
   * **Shadow cast by the body onto itself**, marched through the depth buffer.
   *
   * The buffer was built in run 7 and then thrown away after it had decided paint order.
   * This is the second use of it, and it is the one that changes the picture: an arm that
   * darkens the chest behind it is the difference between shaded shapes and a drawing.
   *
   * There is deliberately **no ground shadow here**. A sprite has no ground; the game has
   * one. That is the same rule the jump obeys — the sprite carries the pose and the game
   * carries the world — and putting a floor inside a 64 px cell would bake a decision that
   * belongs to whoever places the sprite.
   *
   * `strength` is in **ramp steps**, not in opacity, and the edge is hard. That follows the
   * ink verdict of 15/08: regions with a boundary beat gradient. A soft falloff would add
   * intermediate tones to the middle of a ramp that is already spent.
   */
  readonly shadow: {
    /** How far light can be blocked, in screen pixels. 0 disables the pass. */
    readonly steps: number
    /** Depth tolerance, so a curved surface does not shadow itself along its own tangent. */
    readonly bias: number
    /** Ramp steps to drop where light is blocked. 0 disables the pass. */
    readonly strength: number
  }
  /** Read by the viewer, never by the core. Lives here so it is anchored like any number. */
  readonly playback: { readonly msPerFrame: number; readonly scale: number }
  readonly _anchors: Readonly<Record<string, string>>
}
