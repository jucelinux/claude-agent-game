import type { IndexedBuffer, Shape } from './types.ts'
import type { Xform } from './skeleton.ts'
import { TURN } from './skeleton.ts'
import type { Rng } from './rng.ts'
import { ditherOffset } from './dither.ts'

/** The most irrational rotation: what you use when two periodic things must never agree. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export const OWNER_EMPTY = -1
export const OWNER_OUTLINE = -2

/**
 * The buffer plus, per pixel, **who put it there** and **how far away it is**.
 *
 * Ownership is what makes absence countable. Depth is what makes order computable: before
 * it, "in front" was the part's index in the parts list, which is a constant, while the
 * pose it was describing is a function of `t`. Three defect families came out of that one
 * mismatch — the far limb read as a lighting error, two parts of one material fused into a
 * mass, and foreshortening had to be guessed. The fix is one array. portable.
 */
export type Painter = {
  readonly buf: IndexedBuffer
  readonly owners: Int16Array
  /** Depth of the winning surface per pixel; `+Infinity` where nothing has been painted. */
  readonly depth: Float32Array
}

export function createPainter(w: number, h: number): Painter {
  return {
    buf: { w, h, data: new Uint8Array(w * h) },
    owners: new Int16Array(w * h).fill(OWNER_EMPTY),
    depth: new Float32Array(w * h).fill(Infinity),
  }
}

/**
 * A hit, in the shape's own space. `nz` completes the normal — the shading stops being a
 * distance-to-edge trick and becomes a real dot product — and `dz` is how far the surface
 * sits from the bone's plane, negative toward the viewer.
 */
type Local = { readonly inside: boolean; readonly nx: number; readonly ny: number; readonly nz: number; readonly dz: number }

/**
 * Paint one part. The shape stays in bone space and the **pixel** is transformed into it,
 * so a rotated part is sampled, never redrawn (`CLAUDE.md` §1, animation rule). portable.
 */
export function paintPart(
  painter: Painter,
  shape: Shape,
  xf: Xform,
  ramp: readonly number[],
  light: { readonly x: number; readonly y: number; readonly z: number; readonly curve: number },
  fill: { readonly x: number; readonly y: number; readonly z: number; readonly weight: number },
  partId: number,
  rng: Rng | null,
  speckle: number,
  /**
   * Amplitude of the ordered dither, in tone steps. 0 is the hard cut this renderer shipped
   * with. See `src/core/dither.ts` — and note that no lock in this repo can see this number
   * change, which is why `src/perception/weave.ts` had to exist before it did.
   */
  dither = 0,
  /** Lattice size for the weave: 2 or 4. See `src/core/dither.ts` for why it is a knob. */
  lattice = 4,
  shift = 0,
  /** A marking paints only where a solid already claimed the pixel. It adds no silhouette. */
  clipToBody = false,
  /**
   * **A cut removes instead of adding.** Where it covers a painted surface it writes the darkest
   * tone of its ramp and pushes the depth back to its own far side, so the pixel becomes the
   * inside of a hollow. See `Part.cut`.
   */
  carve = false,
): void {
  const levels = ramp.length
  if (levels === 0) throw new Error('a ramp with no tones cannot paint')

  // **A part scaled to nothing paints nothing.** Without this it painted exactly one pixel:
  // at `s === 0` the inverse scale is forced to 0, so every candidate pixel maps to the
  // shape's own centre, and a centre is always inside its shape. Born with the scale channel
  // in run 6 and invisible there — one stray pixel per collapsed plate, among thirty-six
  // parts. It surfaced only when a *falling leaf* refused to reach zero on the way out, which
  // is the absence count catching the opposite of absence.
  if (xf.sx <= 0 || xf.sy <= 0) return

  const a = xf.a * TURN
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  // Two inverses now: the squash is applied in screen axes after the rotation, so undoing
  // it means dividing each world axis by its own scale *before* un-rotating.
  const invX = 1 / xf.sx
  const invY = 1 / xf.sy

  /**
   * **Roll: rotation about the horizontal screen axis, and it is the one thing 2.5D could not
   * express at all.** Non-zero here switches the whole part onto a ray-marched path, because the
   * viewing ray stops being axis-aligned in the shape's own space and every primitive's
   * closed-form solve depends on exactly that. See `marchLocal`.
   *
   * At 0, `cr` is 1 and `sr` is 0 and every expression they appear in below collapses to what it
   * was — the fast path is not a branch around the roll, it is the roll evaluated at zero.
   */
  const roll = xf.roll * TURN
  const rolled = roll !== 0
  const cr = Math.cos(roll)
  const sr = Math.sin(roll)

  // Light, normalized here rather than in the data: the tunables then carry a *direction*,
  // which is a thing with an anchor, instead of a unit vector, which is a thing with
  // arithmetic in it (`HARNESS.md` §2.7).
  const lm = Math.hypot(light.x, light.y, light.z) || 1
  // Rotated into bone space by the **inverse of the full part rotation** — the screen-plane
  // angle, and then the roll. Depth used to stay put, because the angle lived in the screen
  // plane and that was all 2.5D meant; a rolled part tilts its surface toward the viewer, so
  // the lamp has to tilt with it or a flipping board would be lit from a moving sun.
  //
  // **At roll 0 this is exactly the old expression**: `cr` is 1 and `sr` is 0, so the two extra
  // terms are `y*1 + z*0` and `-y*0 + z*1`, which are identities in floating point rather than
  // approximations of one. That is why it runs unconditionally and the baseline hash still holds.
  const lx = (cos * light.x + sin * light.y) / lm
  const ly0 = (-sin * light.x + cos * light.y) / lm
  const lz0 = light.z / lm
  const ly = ly0 * cr + lz0 * sr
  const lz = -ly0 * sr + lz0 * cr

  // The fill goes through exactly the same rotation and normalization as the key, so the
  // two are in one space and the blend below is a blend of like with like.
  const fw = fill.weight
  const fm = Math.hypot(fill.x, fill.y, fill.z) || 1
  const fx = (cos * fill.x + sin * fill.y) / fm
  const fy0 = (-sin * fill.x + cos * fill.y) / fm
  const fz0 = fill.z / fm
  const fy = fy0 * cr + fz0 * sr
  const fz = -fy0 * sr + fz0 * cr

  const { w: cw, h: ch, data } = painter.buf
  const { depth } = painter
  const [bx0, by0, bx1, by1] = localBounds(shape)

  const hd = rolled ? depthExtent(shape) : 0

  // World AABB from the transformed corners of the local bounds: four of them flat, and all
  // eight of the 3D box when the part is rolled — a rolled shape swings its depth into y, so
  // the flat box would clip the very edge the roll exists to show.
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const corners: (readonly [number, number, number])[] = rolled
    ? [
        [bx0, by0, -hd], [bx1, by0, -hd], [bx0, by1, -hd], [bx1, by1, -hd],
        [bx0, by0, hd], [bx1, by0, hd], [bx0, by1, hd], [bx1, by1, hd],
      ]
    : [
        [bx0, by0, 0], [bx1, by0, 0], [bx0, by1, 0], [bx1, by1, 0],
      ]
  for (const [lx0, ly0, lz0] of corners) {
    // Roll first, then the screen-plane angle: the same order the sampler inverts below.
    const ry = ly0 * cr - lz0 * sr
    const wx = xf.x + xf.sx * (cos * lx0 - sin * ry)
    const wy = xf.y + xf.sy * (sin * lx0 + cos * ry)
    if (wx < minX) minX = wx
    if (wx > maxX) maxX = wx
    if (wy < minY) minY = wy
    if (wy > maxY) maxY = wy
  }

  const x0 = Math.max(0, Math.floor(minX))
  const y0 = Math.max(0, Math.floor(minY))
  const x1 = Math.min(cw - 1, Math.ceil(maxX))
  const y1 = Math.min(ch - 1, Math.ceil(maxY))

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const ux = (x + 0.5 - xf.x) * invX
      const uy = (y + 0.5 - xf.y) * invY
      const px = cos * ux + sin * uy
      const py = -sin * ux + cos * uy

      /**
       * **Two solvers, and the second one exists because the first assumes the ray points
       * straight into the screen.**
       *
       * Unrolled, a screen pixel maps to one point of the shape's own x/y plane and every
       * primitive answers "where is my near surface under this point" in closed form. Rolled,
       * the same pixel traces a slanted line through the shape, and no closed form survives
       * for all four primitives — the lobed boundary alone is a summed cosine series in the
       * polar angle. So a rolled part is marched, and only a rolled part pays for it.
       */
      const hit = rolled ? marchLocal(shape, px, py, cr, sr, hd) : sample(shape, px, py)
      if (!hit.inside) continue

      const at = y * cw + x
      if (carve) {
        // A hole in nothing is nothing: a cut paints only where a solid already is, so it can
        // neither extend a silhouette nor invent one.
        if ((painter.owners[at] as number) < 0) continue
        const front = xf.z + xf.sz * hit.dz
        if (front > (depth[at] as number)) continue
        data[at] = ramp[0] as number
        painter.owners[at] = partId
        // The far side of the cut, so a solid deeper than the hollow can still win the pixel.
        depth[at] = xf.z + xf.sz * -hit.dz
        continue
      }
      // **A marking has no body of its own.** It recolours a surface, so it may only write
      // where a solid already claimed the pixel — and it therefore adds nothing to the
      // silhouette. Without this the saddle stood three pixels proud of the chest it lies on
      // and cut a notch of empty canvas into the animal's back.
      if (clipToBody && (painter.owners[at] as number) < 0) continue
      // **The depth test, and the reason this file changed.** `<=` rather than `<` is
      // deliberate: with every bone left on one plane, nearest-wins degenerates exactly
      // into paint order — which is the behaviour being replaced, and therefore the null
      // case that proves the solver is what is doing the work (`HARNESS.md` §5).
      const z = xf.z + xf.sz * hit.dz
      /**
       * **A marking wins the depth test against the surface it lies on, and that is what
       * makes it a decal rather than a solid.**
       *
       * Its own geometry has already decided whether it is visible at all: `paintPart` is
       * given `clipToBody` only when the marking sits on the near half of its bone, and is
       * not called otherwise. So a marking that is being drawn is a marking that faces the
       * viewer, and it must not then lose to the sphere three pixels behind it.
       *
       * **This is what made a turnable body possible.** Before it, a marking had to be pushed
       * artificially toward the camera to clear the solid beneath it — and that push is a
       * *position*, so it rotated with everything else, and a visor pushed 3.6 units at the
       * viewer became a visor 3.6 units to the left when the body turned a quarter. His
       * reading: *"quando ando com S... o visor está olhando para a esquerda"*.
       */
      if (!clipToBody && z > (depth[at] as number)) continue

      // Brightness: outward normal against the direction the light comes from, bent by the
      // ramp curve before it is quantised. A linear map is physics; a ramp is a decision.
      // The normal has three components now, so this is a real lambert term instead of the
      // distance-to-edge sweep it used to be — and the cost lands on `light.z`, which
      // decides how much ramp a body spends on merely facing the viewer.
      const dot = hit.nx * lx + hit.ny * ly + hit.nz * lz
      // Two lamps, blended before the curve and before the quantisation. At weight 0 this
      // reduces to the single-lamp expression exactly, which is the null case.
      let u = (dot + 1) / 2
      if (fw > 0) {
        const dotFill = hit.nx * fx + hit.ny * fy + hit.nz * fz
        u = u * (1 - fw) + ((dotFill + 1) / 2) * fw
      }
      /**
       * **The woven cut, and it is the whole pixel-art thesis in one term.**
       *
       * A zero-mean threshold from a fixed 4x4 lattice, added before the floor. In the band
       * between two tones the two tones alternate, and the eye reads a value the palette does
       * not contain. At `dither` 0 the term is exactly 0 and this expression is byte-for-byte
       * what it was, which is what lets the baseline hash stand.
       *
       * **Anchored to `x, y` — the canvas cell, not the screen cell.** A subject renders into
       * its own buffer and the buffer is blitted as one, so canvas coordinates ride with the
       * object and the weave stays welded to the surface it shades. Keyed to the screen, the
       * pattern would crawl through a moving body, which is the most-seen dither defect there
       * is. The bone-space `px, py` were the other candidate and they are wrong: a rotating
       * part maps screen pixels to fractional bone coordinates, so the lattice would be
       * resampled every frame and moiré with itself.
       */
      let level = Math.floor(
        (light.curve === 1 ? u : Math.pow(u, 1 / light.curve)) * levels + ditherOffset(dither, x, y, lattice),
      )
      if (level >= levels) level = levels - 1
      if (level < 0) level = 0
      if (rng !== null && speckle > 0 && rng() < speckle && level > 0) level -= 1
      // The cheat, applied after the shading and before the clamp: the part keeps its form
      // and only moves along its own ramp.
      if (shift !== 0) {
        level += shift
        if (level >= levels) level = levels - 1
        if (level < 0) level = 0
      }

      data[at] = ramp[level] as number
      painter.owners[at] = partId
      depth[at] = z
    }
  }
}

/**
 * A dark line **inside** the silhouette, wherever two parts meet.
 *
 * Born from a defect family, not from a plan: three separate occurrences of the same
 * failure — abdomen against thorax, thorax against head, legs against the body's shaded
 * side — all of them two parts of one material touching and rendering as one mass. Shading
 * cannot separate them, because shading is continuous across the seam. The third
 * occurrence is where the method says stop patching and generalise (`TASTE-LOOP.md` §3.8),
 * and three hand-placed seam parts became this.
 *
 * **The rule's intent has not changed; its predicate has become true.** It always said "the
 * pixel that darkens is the one *behind*", and it always tested paint order, because paint
 * order was the only thing that knew. Now depth knows, so the rule asks it. That matters
 * beyond tidiness: paint order is fixed for the whole cycle while the pose is a function of
 * `t`, so a limb swinging in front of a mass it was declared behind used to get the seam
 * drawn on the wrong side of itself. Nothing shipped had a pose extreme enough to show it,
 * which is the most dangerous kind of latent defect — the one whose absence from the output
 * is luck rather than correctness.
 *
 * There is deliberately **no depth threshold**. The seam condition stays "two different
 * parts touch"; depth only decides which of the two recedes. A threshold would have been a
 * knob with no anchor in the domain, and it would have fired along every curved part's own
 * silhouette, where depth falls away steeply on one part alone.
 *
 * portable.
 */
export function innerOutline(
  painter: Painter,
  index: number,
  marking: readonly boolean[] = [],
  weld: readonly boolean[] = [],
): void {
  const { w, h, data } = painter.buf
  const { owners, depth } = painter
  // Collected first, applied after: a line drawn during the scan would seed the next one.
  const behind: number[] = []
  /**
   * A marking is skipped on **both** sides of the test: it neither casts a line onto what it
   * lies on, nor receives one from what lies on it. Half a rule would leave the saddle ringed
   * from underneath, which is the same badge drawn from the other direction.
   *
   * **A weld is different from a marking and the difference is which side it takes.** A marking
   * is exempt against *everything*, because a decal is never a boundary. A weld is exempt only
   * against **another welded part**, because it is a statement about a pair: these two shapes
   * are one surface. A welded ear still takes a line from an unwelded helmet sitting on it, and
   * it must — that seam is real (`Part.weld`).
   */
  const inFront = (n: number, owner: number, z: number): boolean => {
    const other = owners[n] as number
    if (other < 0 || other === owner || marking[other] === true) return false
    if (weld[owner] === true && weld[other] === true) return false
    return (depth[n] as number) < z
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      const owner = owners[at] as number
      if (owner < 0 || marking[owner] === true) continue
      const z = depth[at] as number
      const touchesInFront =
        (x > 0 && inFront(at - 1, owner, z)) ||
        (x < w - 1 && inFront(at + 1, owner, z)) ||
        (y > 0 && inFront(at - w, owner, z)) ||
        (y < h - 1 && inFront(at + w, owner, z))
      if (touchesInFront) behind.push(at)
    }
  }
  for (const at of behind) data[at] = index
}

/**
 * **Shadow, marched through the depth buffer toward the lamp.**
 *
 * For each painted pixel, walk one screen pixel at a time in the direction the light comes
 * from. The ray carries its own depth. If the buffer at any step holds a surface nearer to
 * the viewer than the ray, something stands between this pixel and the lamp, and the pixel
 * loses light.
 *
 * **This is the second use of the depth buffer and the first one that changes the picture.**
 * Run 7 built it to decide who is in front, and then discarded it — which is why that round
 * bought correctness and no visible change. The arm darkens the chest. The browridge darkens
 * the eye. The crest darkens the skull.
 *
 * Three properties worth keeping:
 *
 * - **The step is one screen pixel**, not one unit of the light vector, so `steps` is a
 *   distance in pixels and can be anchored to something in the body.
 * - **The edge is hard.** A pixel is lit or it is not, and an unlit one drops whole ramp
 *   steps. The ink verdict of 15/08 said regions with a boundary beat gradient; a soft
 *   falloff would spend the middle of a ramp that is already spent.
 * - **A part never shadows itself, and that is enforced by identity rather than by
 *   tolerance.** Every primitive in this vocabulary is convex in depth, and a convex solid
 *   cannot cast onto itself under a directional light — so a ray that lands back on the
 *   part it started from has found acne, not an occluder. The first version guarded this
 *   with a depth bias and it did not work: acne scales with a surface's curvature, so a
 *   lone sphere self-shadowed 198 px at radius 18 and still self-shadowed at a bias eight
 *   times larger. The owners buffer answers exactly what the bias was approximating.
 * - **The bias still earns its place**, now for the case it can actually settle: two
 *   different parts whose surfaces meet at nearly the same depth.
 *
 * portable.
 */
export function castShadow(
  painter: Painter,
  rampAt: (index: number) => { ramp: readonly number[]; level: number } | undefined,
  light: { readonly x: number; readonly y: number; readonly z: number },
  steps: number,
  bias: number,
  strength: number,
): void {
  if (steps <= 0 || strength <= 0) return
  const flat = Math.hypot(light.x, light.y)
  // A lamp aimed straight down the barrel casts nothing: every ray leaves the screen at
  // once and there is no direction to march in.
  if (flat === 0) return

  const { w, h, data } = painter.buf
  const { depth } = painter
  // One screen pixel per step, with the depth change that goes with it. Dividing all three
  // by the *screen* length rather than the vector length is what makes a step one pixel.
  const sx = light.x / flat
  const sy = light.y / flat
  const sz = light.z / flat

  const writes: [number, number][] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      if (data[at] === 0) continue
      const here = rampAt(data[at] as number)
      if (here === undefined || here.level === 0) continue

      const self = painter.owners[at] as number
      let rx = x + 0.5
      let ry = y + 0.5
      let rz = depth[at] as number
      let blocked = false
      for (let s = 0; s < steps; s++) {
        rx += sx
        ry += sy
        rz += sz
        const ix = Math.floor(rx)
        const iy = Math.floor(ry)
        if (ix < 0 || iy < 0 || ix >= w || iy >= h) break
        const probe = iy * w + ix
        // A convex part cannot cast onto itself. Skipping rather than breaking: the ray
        // passes over its own body and may still meet a different part further along.
        if ((painter.owners[probe] as number) === self) continue
        const d = depth[probe] as number
        if (d < rz - bias) {
          blocked = true
          break
        }
      }
      if (!blocked) continue
      const level = Math.max(0, here.level - strength)
      writes.push([at, here.ramp[level] as number])
    }
  }
  for (const [at, index] of writes) data[at] = index
}

/**
 * **The silhouette edge, done with value instead of line.**
 *
 * Every pixel of the sprite that touches the background is pushed to an end of *its own*
 * material's ramp: the lightest tone where the edge faces the light, the darkest where it
 * faces away. That is a rim light and an occlusion edge, and together they are how art with
 * no outline still reads as a shape.
 *
 * The outward direction is taken from the empty neighbours — no normals needed at this
 * stage, because at the silhouette the empty side *is* the outside. portable.
 */
export function rimEdge(
  painter: Painter,
  rampOf: (owner: number) => readonly number[] | undefined,
  light: { readonly x: number; readonly y: number },
): void {
  const { w, h, data } = painter.buf
  const { owners } = painter
  const writes: [number, number][] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      if (data[at] === 0) continue
      let ox = 0
      let oy = 0
      if (x === 0 || data[at - 1] === 0) ox -= 1
      if (x === w - 1 || data[at + 1] === 0) ox += 1
      if (y === 0 || data[at - w] === 0) oy -= 1
      if (y === h - 1 || data[at + w] === 0) oy += 1
      if (ox === 0 && oy === 0) continue
      const ramp = rampOf(owners[at] as number)
      if (ramp === undefined || ramp.length < 2) continue
      const m = Math.hypot(ox, oy)
      const lit = (ox / m) * light.x + (oy / m) * light.y
      // A rim is **narrow**. The first version lit every edge pixel whose normal leaned at
      // all toward the light, which is half the silhouette, and half a silhouette in the
      // lightest tone is not a rim — it is a glow, and it flattened the body it was meant
      // to give volume to. Only a face turned decisively into the light gets the highlight;
      // everything else takes the dark end, which is what keeps the edge readable.
      writes.push([at, (lit > 0.45 ? ramp[ramp.length - 1] : ramp[0]) as number])
    }
  }
  for (const [at, index] of writes) data[at] = index
}

/**
 * One dark ring on the empty pixels that touch ink. A knob, not a constant.
 *
 * **The ring is 8-connected, and the four-connected version was a hole in the harness.**
 * A ring grown on orthogonal neighbours alone leaves the diagonal corners of every
 * staircase open, so along any 45° edge the body still touches the background — and the
 * value lock reported it honestly at 0.022 against a floor of 0.10 the moment an idiom
 * with an outline was finally built. It had been wrong since round zero and nothing had
 * caught it, because **both shipped idioms turn this function off and carry the silhouette
 * with `rim` instead**, which pushes every edge pixel to a ramp end and incidentally fixes
 * the value. Two answers in use, and each of them masking the defect in the third.
 *
 * The rule it now guarantees: **if there is a line, the line owns the whole silhouette.**
 * Locked in `tests/silhouette.test.ts`. portable.
 */
export function outline(painter: Painter, index: number): void {
  const { w, h, data } = painter.buf
  const edge: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      if (data[at] !== 0) continue
      let touches = false
      for (let dy = -1; dy <= 1 && !touches; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
          if (data[ny * w + nx] !== 0) {
            touches = true
            break
          }
        }
      }
      if (touches) edge.push(at)
    }
  }
  for (const at of edge) {
    data[at] = index
    painter.owners[at] = OWNER_OUTLINE
  }
}

function localBounds(shape: Shape): readonly [number, number, number, number] {
  switch (shape.kind) {
    case 'ellipse':
      return [shape.cx - shape.rx - 1, shape.cy - shape.ry - 1, shape.cx + shape.rx + 1, shape.cy + shape.ry + 1]
    case 'capsule': {
      // The box has to allow for the fatter of the two ends.
      const rmax = Math.max(shape.r, shape.r1 ?? shape.r)
      return [
        Math.min(shape.x0, shape.x1) - rmax - 1,
        Math.min(shape.y0, shape.y1) - rmax - 1,
        Math.max(shape.x0, shape.x1) + rmax + 1,
        Math.max(shape.y0, shape.y1) + rmax + 1,
      ]
    }
    case 'rect':
      return [shape.x - 1, shape.y - 1, shape.x + shape.w + 1, shape.y + shape.h + 1]
    case 'lobed': {
      // The bumps reach (1 + depth) of each radius, so the box has to allow for the crests.
      const kx = shape.rx * (1 + shape.depth) + 1
      const ky = shape.ry * (1 + shape.depth) + 1
      return [shape.cx - kx, shape.cy - ky, shape.cx + kx, shape.cy + ky]
    }
  }
}

/**
 * Every branch is the solid the primitive was always the shadow of. The 2D hit test is
 * unchanged in each case — what is new is the third coordinate that falls out of the test
 * it already performed, which is why depth cost a line per shape and not a rewrite.
 */
function sample(shape: Shape, px: number, py: number): Local {
  switch (shape.kind) {
    case 'ellipse': {
      // An ellipsoid. `rz` defaults to the smaller screen radius: a body authored without
      // an opinion about its depth is round rather than a slab, and round is the safer
      // default for a limb.
      const ux = (px - shape.cx) / shape.rx
      const uy = (py - shape.cy) / shape.ry
      const d2 = ux * ux + uy * uy
      if (d2 > 1) return MISS
      const rz = shape.rz ?? Math.min(shape.rx, shape.ry)
      const uz = -Math.sqrt(1 - d2)
      return normalize(ux / shape.rx, uy / shape.ry, rz === 0 ? -1 : uz / rz, uz * rz)
    }
    case 'capsule': {
      // Already a sphere swept along a segment; `r` was a depth radius all along. With a
      // taper the swept radius varies, so the nearest sphere is no longer the perpendicular
      // projection — it slides along the axis by the taper's slope. Minimising
      //   |q - u*ba|² - (r + u*Δr)²
      // over u is one quadratic, and at Δr = 0 every term below collapses back to the plain
      // projection, which is why the untapered case stays byte-identical.
      const ax = shape.x1 - shape.x0
      const ay = shape.y1 - shape.y0
      const len2 = ax * ax + ay * ay
      const dr = (shape.r1 ?? shape.r) - shape.r
      const qx = px - shape.x0
      const qy = py - shape.y0
      const denom = len2 - dr * dr
      let u = denom === 0 ? 0 : (qx * ax + qy * ay + shape.r * dr) / denom
      u = u < 0 ? 0 : u > 1 ? 1 : u
      const dx = qx - ax * u
      const dy = qy - ay * u
      const d2 = dx * dx + dy * dy
      const ru = shape.r + dr * u
      if (ru <= 0 || d2 > ru * ru) return MISS
      const dz = -Math.sqrt(ru * ru - d2)
      return normalize(dx, dy, dz, dz)
    }
    case 'lobed': {
      // Same test as the ellipse, with the boundary moved: instead of comparing the
      // normalized radius against 1, compare it against a radius that waves. Everything
      // downstream — the depth bulge, the normal, the shading — then works exactly as it
      // does for an ellipse, which is why a ragged silhouette cost fifteen lines and not a
      // second renderer.
      const ux = (px - shape.cx) / shape.rx
      const uy = (py - shape.cy) / shape.ry
      const d2 = ux * ux + uy * uy
      if (d2 === 0) return { inside: true, nx: 0, ny: 0, nz: -1, dz: -(shape.rz ?? Math.min(shape.rx, shape.ry)) }
      // Summed octaves, amplitude halving and frequency doubling — fractional Brownian
      // motion evaluated on a circle, in closed form because the "noise" is a cosine.
      const boundary = lobedBoundary(shape, Math.atan2(uy, ux))
      if (boundary <= 0) return MISS
      const t = Math.sqrt(d2) / boundary
      if (t > 1) return MISS
      const rz = shape.rz ?? Math.min(shape.rx, shape.ry)
      const uz = -Math.sqrt(1 - t * t)
      return normalize(ux / shape.rx, uy / shape.ry, rz === 0 ? -1 : uz / rz, uz * rz)
    }
    case 'rect': {
      // A **rounded** box, and the rounding is the point: a mathematically flat face takes
      // one tone across its whole width, which is a panel with no bevel and reads as a
      // sticker. The face stays flat in the middle — `m` is 0 at the centre, so the normal
      // is straight at the viewer — and turns outward only as it approaches the border.
      if (px < shape.x || px > shape.x + shape.w || py < shape.y || py > shape.y + shape.h) return MISS
      const hw = shape.w / 2
      const hh = shape.h / 2
      const hd = (shape.d ?? Math.min(shape.w, shape.h)) / 2
      const ux = hw === 0 ? 0 : (px - (shape.x + hw)) / hw
      const uy = hh === 0 ? 0 : (py - (shape.y + hh)) / hh
      const m = Math.max(Math.abs(ux), Math.abs(uy))
      const dz = -hd * Math.sqrt(Math.max(0, 1 - m * m))
      return normalize(ux * m, uy * m, hd === 0 ? -1 : dz / hd, dz)
    }
  }
}

/**
 * **The same four solids, written as one implicit function, and this is what made roll cheap.**
 *
 * Every primitive in this vocabulary turns out to be `Q(x, y) + (z / H(x, y))² ≤ 1` — an
 * ellipsoid trivially, a rounded box with `Q` the squared max-norm, a lobed body with `Q` the
 * squared radius over its waving boundary, a tapered capsule with `Q` the squared distance from
 * the swept axis over the local radius. That shared form was not designed; it fell out of
 * `sample()` already computing the depth bulge for each of them, and it is why a full 3D
 * rotation cost one function rather than four ray-vs-primitive derivations.
 *
 * Returns the signed field **and** its outward normal in one pass. The normal is the same
 * expression `sample()` uses for the unrolled case, so the two paths agree where they overlap
 * instead of agreeing approximately.
 */
type Probe = { readonly f: number; readonly nx: number; readonly ny: number; readonly nz: number }

/**
 * The thinnest a solid is allowed to be on the marched path.
 *
 * A shape authored with zero depth is a mathematical disc, and a mathematical disc seen edge-on
 * is invisible: a slanted ray passes through it in zero distance and the march finds nothing.
 * Half a pixel is the smallest thickness an integer grid can represent, so that is the floor.
 * **This affects the rolled path only** — an unrolled zero-depth part is sampled in closed form
 * exactly as it always was.
 */
const MIN_DEPTH = 0.5

function probe3(shape: Shape, qx: number, qy: number, qz: number): Probe {
  switch (shape.kind) {
    case 'ellipse': {
      const ux = (qx - shape.cx) / shape.rx
      const uy = (qy - shape.cy) / shape.ry
      const rz = Math.max(MIN_DEPTH, shape.rz ?? Math.min(shape.rx, shape.ry))
      const uz = qz / rz
      return { f: ux * ux + uy * uy + uz * uz - 1, nx: ux / shape.rx, ny: uy / shape.ry, nz: uz / rz }
    }
    case 'lobed': {
      const ux = (qx - shape.cx) / shape.rx
      const uy = (qy - shape.cy) / shape.ry
      const d2 = ux * ux + uy * uy
      const rz = Math.max(MIN_DEPTH, shape.rz ?? Math.min(shape.rx, shape.ry))
      const uz = qz / rz
      const boundary = lobedBoundary(shape, Math.atan2(uy, ux))
      if (boundary <= 0) return OUTSIDE
      const t = Math.sqrt(d2) / boundary
      return { f: t * t + uz * uz - 1, nx: ux / shape.rx, ny: uy / shape.ry, nz: uz / rz }
    }
    case 'rect': {
      const hw = shape.w / 2
      const hh = shape.h / 2
      const hdr = Math.max(MIN_DEPTH, (shape.d ?? Math.min(shape.w, shape.h)) / 2)
      const ux = hw === 0 ? 0 : (qx - (shape.x + hw)) / hw
      const uy = hh === 0 ? 0 : (qy - (shape.y + hh)) / hh
      const m = Math.max(Math.abs(ux), Math.abs(uy))
      const uz = qz / hdr
      return { f: m * m + uz * uz - 1, nx: ux * m, ny: uy * m, nz: uz }
    }
    case 'capsule': {
      // The axis lies in the x/y plane, so the `u` that minimises the distance to a tapered
      // sweep does not involve `z` at all — every term carrying `qz` is constant in `u`. That is
      // why this is the exact 3D solve and not an approximation of one.
      const ax = shape.x1 - shape.x0
      const ay = shape.y1 - shape.y0
      const len2 = ax * ax + ay * ay
      const dr = (shape.r1 ?? shape.r) - shape.r
      const px0 = qx - shape.x0
      const py0 = qy - shape.y0
      const denom = len2 - dr * dr
      let u = denom === 0 ? 0 : (px0 * ax + py0 * ay + shape.r * dr) / denom
      u = u < 0 ? 0 : u > 1 ? 1 : u
      const dx = px0 - ax * u
      const dy = py0 - ay * u
      const ru = shape.r + dr * u
      if (ru <= 0) return OUTSIDE
      return { f: (dx * dx + dy * dy + qz * qz) / (ru * ru) - 1, nx: dx, ny: dy, nz: qz }
    }
  }
}

const OUTSIDE: Probe = { f: Infinity, nx: 0, ny: 0, nz: 0 }

/** Half-thickness along the depth axis, for the rolled part's 3D bounding box. */
function depthExtent(shape: Shape): number {
  switch (shape.kind) {
    case 'ellipse':
    case 'lobed':
      return Math.max(MIN_DEPTH, shape.rz ?? Math.min(shape.rx, shape.ry))
    case 'rect':
      return Math.max(MIN_DEPTH, (shape.d ?? Math.min(shape.w, shape.h)) / 2)
    case 'capsule':
      return Math.max(MIN_DEPTH, shape.r, shape.r1 ?? shape.r)
  }
}

/**
 * **A rolled part, sampled by marching the viewing ray through the shape's own space.**
 *
 * Roll tilts the shape about the horizontal screen axis, so the inverse map takes the camera's
 * straight-in ray and slants it: origin `Rx(-roll)·(px, py, 0)` and direction
 * `Rx(-roll)·(0, 0, 1)`, which is `(0, sin roll, cos roll)`. What comes back is the **nearest**
 * surface along that ray, in the same `Local` shape the closed-form sampler returns, so
 * everything downstream — depth test, lambert, quantiser, ownership — is untouched.
 *
 * **Bounded first, then marched.** The ray is clipped to the shape's own 3D box by two slab
 * tests, so the march never walks empty space and never starts inside the solid it is looking
 * for. Two samples per pixel of span find the first crossing; twelve bisections then put the
 * surface inside a hundredth of a pixel, which is two orders of magnitude below anything an
 * integer grid can show.
 *
 * **The declared limit, and it is a sampling limit rather than a geometric one:** a feature
 * thinner than half a pixel along the ray can fall between two steps and be missed. Nothing in
 * this vocabulary is that thin — `MIN_DEPTH` is the floor — but a future primitive with a slot
 * cut through it would need the step count raised, not the method changed.
 */
function marchLocal(shape: Shape, px: number, py: number, cr: number, sr: number, hd: number): Local {
  const ox = px
  const oy = py * cr
  const oz = -py * sr

  const [bx0, by0, bx1, by1] = localBounds(shape)
  // The ray has no x component — roll cannot move a point along the axis it rotates about — so
  // x is a plain interval test rather than a slab.
  if (ox < bx0 || ox > bx1) return MISS

  let s0 = -Infinity
  let s1 = Infinity
  if (sr === 0) {
    if (oy < by0 || oy > by1) return MISS
  } else {
    const a1 = (by0 - oy) / sr
    const a2 = (by1 - oy) / sr
    s0 = Math.max(s0, Math.min(a1, a2))
    s1 = Math.min(s1, Math.max(a1, a2))
  }
  if (cr === 0) {
    if (oz < -hd || oz > hd) return MISS
  } else {
    const b1 = (-hd - oz) / cr
    const b2 = (hd - oz) / cr
    s0 = Math.max(s0, Math.min(b1, b2))
    s1 = Math.min(s1, Math.max(b1, b2))
  }
  if (!(s1 > s0)) return MISS

  const span = s1 - s0
  const steps = Math.max(16, Math.ceil(span * 2))
  const at = (s: number): Probe => probe3(shape, ox, oy + sr * s, oz + cr * s)

  let lo = s0
  if (at(s0).f <= 0) return hitAt(shape, ox, oy, oz, sr, cr, s0)
  for (let i = 1; i <= steps; i++) {
    const s = s0 + (span * i) / steps
    if (at(s).f > 0) {
      lo = s
      continue
    }
    let hi = s
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2
      if (at(mid).f <= 0) hi = mid
      else lo = mid
    }
    return hitAt(shape, ox, oy, oz, sr, cr, hi)
  }
  return MISS
}

/** The surface at ray parameter `s`: the outward normal in bone space, and `s` itself as depth. */
function hitAt(shape: Shape, ox: number, oy: number, oz: number, sr: number, cr: number, s: number): Local {
  const p = probe3(shape, ox, oy + sr * s, oz + cr * s)
  // `s` **is** the depth: it parametrises the ray along the camera's own axis, so the distance
  // from the bone's plane to the surface is exactly the distance the ray travelled.
  return normalize(p.nx, p.ny, p.nz, s)
}

/**
 * The lobed silhouette's radius at one polar angle: summed octaves, amplitude halving and
 * frequency doubling. Factored out of `sample()` when the marched path needed the same series —
 * two copies of a closed-form fBm would have been two primitives with one name.
 */
function lobedBoundary(shape: Extract<Shape, { kind: 'lobed' }>, theta: number): number {
  const octaves = Math.max(1, Math.round(shape.octaves ?? 1))
  let norm = 0
  for (let o = 0, a = 1; o < octaves; o++, a *= 0.5) norm += a
  let boundary = 1
  let amp = shape.depth / norm
  let freq = shape.lobes
  for (let o = 0; o < octaves; o++) {
    boundary += amp * Math.cos(freq * theta + (shape.phase ?? 0) + o * GOLDEN_ANGLE)
    amp *= 0.5
    freq *= 2
  }
  return boundary
}

const MISS: Local = { inside: false, nx: 0, ny: 0, nz: 0, dz: 0 }

function normalize(nx: number, ny: number, nz: number, dz: number): Local {
  const m = Math.hypot(nx, ny, nz)
  // A pixel with no gradient at all faces the viewer — which is what the centre of a solid
  // does, and it needed a special case only while the normal was missing its third axis.
  if (m === 0) return { inside: true, nx: 0, ny: 0, nz: -1, dz }
  return { inside: true, nx: nx / m, ny: ny / m, nz: nz / m, dz }
}
