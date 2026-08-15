import type { IndexedBuffer, Shape } from './types.ts'
import type { Xform } from './skeleton.ts'
import { TURN } from './skeleton.ts'
import type { Rng } from './rng.ts'

export const OWNER_EMPTY = -1
export const OWNER_OUTLINE = -2

/** The buffer plus, per pixel, **who put it there**. Ownership is what makes absence countable. */
export type Painter = {
  readonly buf: IndexedBuffer
  readonly owners: Int16Array
}

export function createPainter(w: number, h: number): Painter {
  return {
    buf: { w, h, data: new Uint8Array(w * h) },
    owners: new Int16Array(w * h).fill(OWNER_EMPTY),
  }
}

type Local = { readonly inside: boolean; readonly nx: number; readonly ny: number }

/**
 * Paint one part. The shape stays in bone space and the **pixel** is transformed into it,
 * so a rotated part is sampled, never redrawn (`CLAUDE.md` §1, animation rule). portable.
 */
export function paintPart(
  painter: Painter,
  shape: Shape,
  xf: Xform,
  ramp: readonly number[],
  light: { readonly x: number; readonly y: number; readonly curve: number },
  partId: number,
  rng: Rng | null,
  speckle: number,
): void {
  const levels = ramp.length
  if (levels === 0) throw new Error('a ramp with no tones cannot paint')

  const a = xf.a * TURN
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const inv = xf.s === 0 ? 0 : 1 / xf.s

  // Light, rotated into bone space: the shading test then never leaves local space.
  const lx = cos * light.x + sin * light.y
  const ly = -sin * light.x + cos * light.y

  const { w: cw, h: ch, data } = painter.buf
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

      // Brightness: outward normal against the direction the light comes from, bent by the
      // ramp curve before it is quantised. A linear map is physics; a ramp is a decision.
      const dot = hit.nx * lx + hit.ny * ly
      const u = (dot + 1) / 2
      let level = Math.floor((light.curve === 1 ? u : Math.pow(u, 1 / light.curve)) * levels)
      if (level >= levels) level = levels - 1
      if (level < 0) level = 0
      if (rng !== null && speckle > 0 && rng() < speckle && level > 0) level -= 1

      const at = y * cw + x
      data[at] = ramp[level] as number
      painter.owners[at] = partId
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
 * The pixel that darkens is the one **behind** — lower paint order — so the part in front
 * keeps its whole shape and the one behind recedes. That is depth, and it is free.
 *
 * portable, and it is the round's first real grammar rule.
 */
export function innerOutline(painter: Painter, index: number): void {
  const { w, h, data } = painter.buf
  const { owners } = painter
  // Collected first, applied after: a line drawn during the scan would seed the next one.
  const behind: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      const owner = owners[at] as number
      if (owner < 0) continue
      const touchesInFront =
        (x > 0 && (owners[at - 1] as number) > owner) ||
        (x < w - 1 && (owners[at + 1] as number) > owner) ||
        (y > 0 && (owners[at - w] as number) > owner) ||
        (y < h - 1 && (owners[at + w] as number) > owner)
      if (touchesInFront) behind.push(at)
    }
  }
  for (const at of behind) data[at] = index
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
      writes.push([at, (lit > 0 ? ramp[ramp.length - 1] : ramp[0]) as number])
    }
  }
  for (const [at, index] of writes) data[at] = index
}

/** One dark ring on the empty pixels that touch ink. A knob, not a constant. portable. */
export function outline(painter: Painter, index: number): void {
  const { w, h, data } = painter.buf
  const edge: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const at = y * w + x
      if (data[at] !== 0) continue
      const touches =
        (x > 0 && data[at - 1] !== 0) ||
        (x < w - 1 && data[at + 1] !== 0) ||
        (y > 0 && data[at - w] !== 0) ||
        (y < h - 1 && data[at + w] !== 0)
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
  }
}

function sample(shape: Shape, px: number, py: number): Local {
  switch (shape.kind) {
    case 'ellipse': {
      const ux = (px - shape.cx) / shape.rx
      const uy = (py - shape.cy) / shape.ry
      if (ux * ux + uy * uy > 1) return MISS
      return normalize(ux / shape.rx, uy / shape.ry)
    }
    case 'capsule': {
      const ax = shape.x1 - shape.x0
      const ay = shape.y1 - shape.y0
      const len2 = ax * ax + ay * ay
      let u = len2 === 0 ? 0 : ((px - shape.x0) * ax + (py - shape.y0) * ay) / len2
      u = u < 0 ? 0 : u > 1 ? 1 : u
      const dx = px - (shape.x0 + ax * u)
      const dy = py - (shape.y0 + ay * u)
      if (dx * dx + dy * dy > shape.r * shape.r) return MISS
      return normalize(dx, dy)
    }
    case 'rect': {
      if (px < shape.x || px > shape.x + shape.w || py < shape.y || py > shape.y + shape.h) return MISS
      return normalize((px - (shape.x + shape.w / 2)) / shape.w, (py - (shape.y + shape.h / 2)) / shape.h)
    }
  }
}

const MISS: Local = { inside: false, nx: 0, ny: 0 }

function normalize(nx: number, ny: number): Local {
  const m = Math.hypot(nx, ny)
  // A pixel exactly on the centre has no normal; face it at the light's plane.
  if (m === 0) return { inside: true, nx: 0, ny: -1 }
  return { inside: true, nx: nx / m, ny: ny / m }
}
