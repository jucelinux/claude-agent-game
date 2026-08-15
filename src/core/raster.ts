import type { IndexedBuffer, Shape } from './types.ts'
import type { Xform } from './skeleton.ts'
import { TURN } from './skeleton.ts'
import type { Rng } from './rng.ts'

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
  shift = 0,
): void {
  const levels = ramp.length
  if (levels === 0) throw new Error('a ramp with no tones cannot paint')

  // **A part scaled to nothing paints nothing.** Without this it painted exactly one pixel:
  // at `s === 0` the inverse scale is forced to 0, so every candidate pixel maps to the
  // shape's own centre, and a centre is always inside its shape. Born with the scale channel
  // in run 6 and invisible there — one stray pixel per collapsed plate, among thirty-six
  // parts. It surfaced only when a *falling leaf* refused to reach zero on the way out, which
  // is the absence count catching the opposite of absence.
  if (xf.s <= 0) return

  const a = xf.a * TURN
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const inv = xf.s === 0 ? 0 : 1 / xf.s

  // Light, normalized here rather than in the data: the tunables then carry a *direction*,
  // which is a thing with an anchor, instead of a unit vector, which is a thing with
  // arithmetic in it (`HARNESS.md` §2.7).
  const lm = Math.hypot(light.x, light.y, light.z) || 1
  // Rotated into bone space — the x/y half only. Depth does not rotate, because the bone
  // angle lives in the screen plane; that is what 2.5D means here.
  const lx = (cos * light.x + sin * light.y) / lm
  const ly = (-sin * light.x + cos * light.y) / lm
  const lz = light.z / lm

  // The fill goes through exactly the same rotation and normalization as the key, so the
  // two are in one space and the blend below is a blend of like with like.
  const fw = fill.weight
  const fm = Math.hypot(fill.x, fill.y, fill.z) || 1
  const fx = (cos * fill.x + sin * fill.y) / fm
  const fy = (-sin * fill.x + cos * fill.y) / fm
  const fz = fill.z / fm

  const { w: cw, h: ch, data } = painter.buf
  const { depth } = painter
  const [bx0, by0, bx1, by1] = localBounds(shape)

  // World AABB from the four transformed corners of the local bounds.
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [px, py] of [
    [bx0, by0],
    [bx1, by0],
    [bx0, by1],
    [bx1, by1],
  ] as const) {
    const wx = xf.x + xf.s * (cos * px - sin * py)
    const wy = xf.y + xf.s * (sin * px + cos * py)
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
      const dx = x + 0.5 - xf.x
      const dy = y + 0.5 - xf.y
      const px = (cos * dx + sin * dy) * inv
      const py = (-sin * dx + cos * dy) * inv

      const hit = sample(shape, px, py)
      if (!hit.inside) continue

      const at = y * cw + x
      // **The depth test, and the reason this file changed.** `<=` rather than `<` is
      // deliberate: with every bone left on one plane, nearest-wins degenerates exactly
      // into paint order — which is the behaviour being replaced, and therefore the null
      // case that proves the solver is what is doing the work (`HARNESS.md` §5).
      const z = xf.z + xf.s * hit.dz
      if (z > (depth[at] as number)) continue

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
      let level = Math.floor((light.curve === 1 ? u : Math.pow(u, 1 / light.curve)) * levels)
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
export function innerOutline(painter: Painter, index: number): void {
  const { w, h, data } = painter.buf
  const { owners, depth } = painter
  // Collected first, applied after: a line drawn during the scan would seed the next one.
  const behind: number[] = []
  const inFront = (n: number, owner: number, z: number): boolean => {
    const other = owners[n] as number
    return other >= 0 && other !== owner && (depth[n] as number) < z
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      const owner = owners[at] as number
      if (owner < 0) continue
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
    case 'capsule':
      return [
        Math.min(shape.x0, shape.x1) - shape.r - 1,
        Math.min(shape.y0, shape.y1) - shape.r - 1,
        Math.max(shape.x0, shape.x1) + shape.r + 1,
        Math.max(shape.y0, shape.y1) + shape.r + 1,
      ]
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
      // Already a sphere swept along a segment; `r` was a depth radius all along.
      const ax = shape.x1 - shape.x0
      const ay = shape.y1 - shape.y0
      const len2 = ax * ax + ay * ay
      let u = len2 === 0 ? 0 : ((px - shape.x0) * ax + (py - shape.y0) * ay) / len2
      u = u < 0 ? 0 : u > 1 ? 1 : u
      const dx = px - (shape.x0 + ax * u)
      const dy = py - (shape.y0 + ay * u)
      const d2 = dx * dx + dy * dy
      if (d2 > shape.r * shape.r) return MISS
      const dz = -Math.sqrt(shape.r * shape.r - d2)
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
      const theta = Math.atan2(uy, ux)
      // Summed octaves, amplitude halving and frequency doubling — fractional Brownian
      // motion evaluated on a circle, in closed form because the "noise" is a cosine.
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

const MISS: Local = { inside: false, nx: 0, ny: 0, nz: 0, dz: 0 }

function normalize(nx: number, ny: number, nz: number, dz: number): Local {
  const m = Math.hypot(nx, ny, nz)
  // A pixel with no gradient at all faces the viewer — which is what the centre of a solid
  // does, and it needed a special case only while the normal was missing its third axis.
  if (m === 0) return { inside: true, nx: 0, ny: 0, nz: -1, dz }
  return { inside: true, nx: nx / m, ny: ny / m, nz: nz / m, dz }
}
