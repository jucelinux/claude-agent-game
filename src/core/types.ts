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
  /** Rest angle, in turns. Rotation about the depth axis — the screen plane. */
  readonly angle: number
  /**
   * **Rest roll, in turns: rotation about the horizontal screen axis.** Optional, 0 by default,
   * and 0 renders byte-for-byte what a bone without this field always did.
   *
   * This is the one rotation 2.5D could not express **at all** rather than express badly. Every
   * earlier complaint on the depth axis traced to a bug of mine; this one traced to the
   * vocabulary — `angle` lives in the screen plane, `yaw.ts` turns a body about the vertical,
   * and nothing tilted a surface toward or away from the viewer. A board that flips, a wing
   * that drops, a body that tumbles at the camera: none of them was a tuning problem.
   *
   * **Why the horizontal axis and not a general one.** A kickflip is rotation about the axis the
   * skater travels along, and for a figure moving across the picture that axis *is* screen x. So
   * the commission that asked for this needs exactly this one axis, and one axis is what it
   * gets — `CLAUDE.md` §5: harvest generality, do not design it. A second axis arrives when a
   * second subject needs it.
   *
   * **The cost, declared.** A rolled part cannot be sampled by the closed-form one-liner every
   * shape uses, because the viewing ray is no longer axis-aligned in the shape's own space. It
   * is ray-marched instead (`raster.ts`, `marchLocal`). That path runs **only** for parts whose
   * roll is non-zero, so the fast path and the baseline hash are untouched.
   *
   * **The approximation, declared.** Roll accumulates down the hierarchy as a scalar, the same
   * way `angle` does. Composing a roll with a parent's screen-plane angle is not commutative, so
   * the accumulation is exact when the parent chain is unrotated and an approximation when it is
   * not. A skeleton whose rolled subtree also swings hard in the screen plane will drift, and the
   * honest fix is a matrix per bone rather than two scalars. Not built: the board flips while its
   * parent stays flat, and the drift is unmeasurable there.
   */
  readonly roll?: number
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
   * **A marking, not a solid: a region of the surface it lies on.**
   *
   * A silverback's saddle, a blaze, a stripe, a patch of lichen, a brand. It has a *colour*
   * and no *body*, and that difference has two consequences the renderer has to honour:
   *
   * 1. **It never extends the silhouette.** A marking paints only where a solid already is.
   *    Without that rule the saddle's lobed boundary stood three pixels proud of the chest it
   *    lay on, and where the shoulder marking and the hip marking failed to meet, the gap
   *    between them was **empty canvas with the outer outline traced around it** — a notch cut
   *    into the animal's back. His words: *"as costas do gorila possui um vão na região da
   *    cintura"*, and he had to say it twice because the first fix only addressed the ink.
   * 2. **It gets no inner outline**, and casts none. The inner line says *these are two
   *    things*; a marking is one thing wearing two colours, and ringing it in ink is what
   *    turns grey hair into a painted badge.
   *
   * Markings paint after every solid, so a marking always has a body to lie on and never
   * decides what the body's outline is.
   *
   * Defaults to false, which is the null case: every part authored before this existed
   * renders byte-identical. portable — the solid/marking distinction is older than pixel art
   * and every drawing system eventually needs it.
   */
  readonly marking?: boolean
  /**
   * **This part is a piece of one continuous surface, and not a thing in its own right.**
   *
   * No inner line is drawn between two welded parts. Everything else about them is unchanged:
   * they still occlude each other, still shade separately, still own their pixels.
   *
   * ## The rule, and it is his question rather than a knob
   *
   * *"estamos refletindo aqui sobre seu discernimento de quando tratar esse contorno e quando
   * deixá-lo visível. Isso depende muito do objeto que você está desenhando."* — 16/08.
   *
   * **An inner line means "these are two objects."** The test is one question about the real
   * thing: *if somebody built this, would there be a seam there?*
   *
   * - **A pressure suit would.** Segments, joints, a hard pack, a visor. He looked at the
   *   astronaut and said the contours at the limb connections *"ficou legal"*, and they are as
   *   strong there as anywhere — 0.43 of luminance against what they lie on.
   * - **A cat would not.** A tail is one tapering rope, an ear is one flap, a leg runs into its
   *   paw. The three capsules in the kitten's tail are **scaffolding for a shape**, not parts of
   *   a tail, and ringing each one turns a live animal into a jointed puppet: *"o rabo, as
   *   pernas, as orelhas e as patas traseiras possuem o contorno das formas que montam aquele
   *   membro."*
   *
   * ## Why this took a verdict to find, and it is the useful half
   *
   * He believed the gorilla had been given this treatment deliberately and credited me for it.
   * **It never was.** The gorilla carries 135 inner-line pixels, every junction ringed like the
   * cat's — they are simply invisible, because a black coat and a near-black ink sit **0.20** of
   * luminance apart where the kitten's ginger and brown sit **0.48**. One setting, twice the
   * visibility, and it was the palette doing the deciding rather than me.
   *
   * So the knob it replaces is `outline.inner`, which is one boolean for a whole sprite and can
   * only ever say all-or-nothing. **Whether two shapes are one surface is a fact about those two
   * shapes**, so it is declared per part, the same way `marking` is — and for the same reason:
   * no measurement can infer intent from a picture.
   *
   * Defaults to false, which is the null case: every part authored before this renders
   * byte-identical. portable — the solid/surface distinction outlives this project.
   */
  readonly weld?: boolean
  /**
   * **A hole. The first primitive here that REMOVES instead of adding.**
   *
   * His reading of batch 3, 16/08: *"isso não é uma caveira. Nem de longe lembra uma."* And the
   * cause was not the palette, the part count or the resolution.
   *
   * **A skull is read by its holes** — the sockets, the nasal cavity, the gap between teeth.
   * Every primitive in this vocabulary is a *solid* and a body is their **union**, so the
   * grammar could add mass and could not remove any. What I drew as an eye socket was a
   * `marking`: a dark patch painted on a white ball, not a cavity in a bone. It read as a helmet
   * with two lights in it, which is exactly what it was.
   *
   * **This is run 9's finding in a second shape.** A tree was not hard, it was *inexpressible*,
   * because every primitive was convex — and that produced the lobed primitive. A skull is not
   * hard either. It was inexpressible while the grammar only added.
   *
   * ## What a cut does, and the declared approximation
   *
   * Where a cut covers a surface that is already painted, it writes the **darkest tone of its
   * material** and pushes the depth buffer back to its own far side. So the pixel stops being
   * the outside of the skull and becomes the inside of a hollow, the outer outline still wraps
   * the body rather than the hole, and the inner outline traces the rim — which is the bone edge
   * around a socket.
   *
   * **Declared: it paints a flat floor rather than the true inner surface.** A real CSG
   * subtraction would keep marching the ray to where it leaves the cut and re-enters the solid,
   * and light *that*. For an ellipsoid and a capsule that is reachable — the sampler already
   * computes the near surface and the far one is the same square root with the other sign — and
   * it is not built, because at the scale a socket is actually drawn (three pixels across) a lit
   * inner wall and a flat dark floor are the same picture.
   *
   * **A cut never extends a silhouette and never creates one.** It paints only where a solid
   * already is, exactly as a marking does, so a cut hanging off the edge of a body removes
   * nothing and adds nothing.
   *
   * Defaults to false: every part authored before this renders byte-identical. portable — the
   * solid/void distinction is older than pixel art and every modelling vocabulary needs it.
   */
  readonly cut?: boolean
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
/**
 * `roll` is rotation **out of** the screen plane — see `Bone.roll`. It is the only channel here
 * that no amount of 2.5D could approximate: `angle` turns a part in the picture, `z` moves it
 * through the picture, and neither tilts a surface toward the camera.
 *
 * Its amplitude is `gait.roll`, in turns, and it is a **separate** amplitude from `gait.swing`
 * for a reason the record already paid for: `swing` is a walk's range, 0.08 of a turn, and run 7
 * spent it on a jump and an attack without re-deriving it — a limb came back absent in every
 * frame of both. A flip needs a whole turn. One amplitude covering both would put a 12x factor
 * on one knob and guarantee the same defect a third time.
 */
export type Channel = 'angle' | 'roll' | 'x' | 'y' | 'z' | 'scale' | 'scaleX' | 'scaleY'

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
  /**
   * **Whether the last phase leads back into the first. Default true, which is a cycle.**
   *
   * Every gait in this project until 16/08 was periodic by construction — a walk, a sway, a
   * tail. The curve is a *cyclic* Hermite, so the segment after the last phase interpolates
   * back toward the first key, and the tangents are computed as though the motion returns.
   *
   * **A somersault is not a cycle.** It starts at zero and ends a whole turn later, and those
   * are different values. Authored as a cyclic track it climbs to 270 degrees and then
   * *unwinds* — measured, at `t` 0.83 and 0.92: 193 degrees, then 77. The body flips
   * three-quarters of the way round and rolls backwards out of it.
   *
   * With `wrap: false` the phases span **[0, 1] inclusive** rather than [0, 1): the last phase
   * is the end of the motion rather than the step before the beginning, and the end tangents
   * are clamped instead of wrapped. A clip that plays once and holds its last frame — which
   * the runtime already does for an attack, a landing tuck and now a flip — then arrives
   * where it was authored to arrive.
   *
   * It unlocks more than a flip: any action that does not return to its start. A death, a
   * door opening, a transformation. portable, and the default keeps every gait written before
   * it byte-identical.
   */
  readonly wrap?: boolean
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
  readonly gait: { readonly swing: number; readonly lift: number; readonly depth: number; readonly roll: number }
  /**
   * How a continuous brightness becomes one of a handful of tones.
   *
   * - `speckle` — probability a painted pixel drops one tone, from the injected RNG. 0 disables
   *   the RNG entirely. **Retired by his verdict of 15/08:** random orphans read as dirt.
   * - `dither` — amplitude of the **ordered** Bayer weave, in tone steps. Same histogram as
   *   speckle and a different lattice, and the lattice is the difference between a texture and
   *   dirt (`src/core/dither.ts`). 0 is the hard cut every sample before 16/08 shipped with.
   *
   * The two are not variants of one knob. Speckle is aperiodic and destroys the region
   * structure the 15/08 verdict selected; the weave is periodic and preserves it at a scale
   * below one tone step. `src/perception/weave.ts` is the only instrument that can tell them
   * apart, and every other lock in the repo is blind to both.
   */
  readonly texture: { readonly speckle: number; readonly dither: number; readonly lattice: number }
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
