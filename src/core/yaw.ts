/**
 * **Turning a body to face somewhere else.**
 *
 * The gap named on 15/08 and never built: *"facing — one direction is rendered. Four or eight
 * need rotation in depth."* His commission of 16/08 asks for eight, so this is the round that
 * pays for it.
 *
 * **It is a grammar transform, not a renderer change**, and that is the whole design. `yaw`
 * takes a body and returns another body, rotated about its own vertical axis. Nothing in the
 * rasterizer, the solver or the depth buffer learns a new idea, and eight facings are eight
 * grammars generated from one — which is the same move `makeTree` made for a forest.
 *
 * **Why the 2.5D vocabulary can express this exactly, for the shapes that matter.**
 *
 * Every primitive here was chosen on day zero as the shadow of a solid, and a yaw is a
 * rotation of that solid about the y axis:
 *
 * - **A bone offset** is a point. `(x, z)` rotates into `(x cos - z sin, x sin + z cos)`. Exact.
 * - **A capsule** is a sphere swept along a segment. Its endpoints are points and rotate
 *   exactly; its radius is a sphere's and does not change under any rotation. **Exact**, and
 *   it is why a limb survives being turned.
 * - **An ellipsoid** has a silhouette whose x radius under a yaw of θ is
 *   `sqrt(rx²cos²θ + rz²sin²θ)`, and whose depth radius is the same expression with the
 *   angles swapped. **Exact for the silhouette**, which is all a sprite is.
 * - **A rounded box** yaws to `w' = |w cosθ| + |d sinθ|`. That is the exact bounding extent
 *   and an approximation of the corner, and at these radii the difference is under a pixel.
 * - **A lobed boundary** takes the ellipsoid's radii and keeps its lobes. The ragged rim is
 *   a texture rather than a structure; rotating it would produce a *different* raggedness,
 *   not a rotated one, and pretending otherwise would be false precision.
 *
 * **What is NOT exact, and it is the declared risk of the whole feature.** A gait is limb
 * rotation *in the screen plane*. Turn a body ninety degrees and the same rotation swings its
 * legs sideways instead of forward. `yaw` therefore decomposes every `angle` track into the
 * part that still reads as rotation — `cos θ` — and the part that has become motion in depth,
 * carried on the `z` channel. That is the right physical decomposition and it is an
 * approximation: it ignores that a limb seen end-on also shortens. **I predicted before he
 * looked that this is the half most likely to fail** (`BACKLOG.md`, batch 1).
 */
import type { Bone, Gait, Grammar, Part, Shape, Track } from './types.ts'

/** How far a limb reaches from its joint, in bone units. Sets how much depth a swing buys. */
const LIMB = 10

const yawPoint = (x: number, z: number, c: number, s: number): { x: number; z: number } => ({
  x: x * c - z * s,
  z: x * s + z * c,
})

function yawShape(shape: Shape, c: number, s: number): Shape {
  // |cos| and |sin|: a radius has no sign, and a body turned 190 degrees is as wide as one
  // turned 170. Using the signed value here silently inverted every shape past a quarter turn.
  const ac = Math.abs(c)
  const as = Math.abs(s)
  switch (shape.kind) {
    case 'ellipse': {
      const rz = shape.rz ?? Math.min(shape.rx, shape.ry)
      const p = yawPoint(shape.cx, 0, c, s)
      return {
        ...shape,
        cx: p.x,
        rx: Math.hypot(shape.rx * ac, rz * as),
        rz: Math.hypot(shape.rx * as, rz * ac),
      }
    }
    case 'lobed': {
      const rz = shape.rz ?? Math.min(shape.rx, shape.ry)
      const p = yawPoint(shape.cx, 0, c, s)
      return {
        ...shape,
        cx: p.x,
        rx: Math.hypot(shape.rx * ac, rz * as),
        rz: Math.hypot(shape.rx * as, rz * ac),
      }
    }
    case 'capsule': {
      // The exact case. A swept sphere is rotation-invariant in its radius, and its two
      // endpoints are points.
      const a = yawPoint(shape.x0, 0, c, s)
      const b = yawPoint(shape.x1, 0, c, s)
      return { ...shape, x0: a.x, x1: b.x }
    }
    case 'rect': {
      const d = shape.d ?? Math.min(shape.w, shape.h)
      const cx = shape.x + shape.w / 2
      const p = yawPoint(cx, 0, c, s)
      const w = shape.w * ac + d * as
      return { ...shape, x: p.x - w / 2, w, d: shape.w * as + d * ac }
    }
  }
}

/**
 * **Turn a body by `turns` about its own vertical axis.** 0 is the authored facing; 0.25 puts
 * the body's left side toward the viewer; 0.5 is its back.
 *
 * `name` is the new grammar's name, because a facing is a different grammar and every grammar
 * in this project is addressed by name.
 *
 * `swing` is the tunables' angle amplitude, and the transform needs it because foreshortening
 * is not linear in the key: a limb at 10 degrees barely shortens and one at 60 shortens by
 * half. A track key is a fraction of an amplitude, so turning one into a length needs the
 * amplitude. It is passed rather than read, because `src/core` may not load a tunables file.
 */
export function yaw(grammar: Grammar, turns: number, name: string, swing = 0.26): Grammar {
  const a = turns * Math.PI * 2
  const c = Math.cos(a)
  const s = Math.sin(a)

  const bones: Bone[] = grammar.skeleton.bones.map((b) => {
    const p = yawPoint(b.x, b.z ?? 0, c, s)
    return { ...b, x: p.x, z: p.z }
  })

  const parts: Part[] = grammar.parts.map((p) => ({ ...p, shape: yawShape(p.shape, c, s) }))

  /**
   * **The gait, decomposed.** An `angle` key is a rotation about the axis running left-right
   * through the body. Seen from the authored side that rotation is entirely on screen; seen
   * from the front it is entirely in depth; in between it is both.
   *
   * So each `angle` track keeps `cos θ` of its amplitude and grows a `z` companion carrying
   * `sin θ` of it, scaled by how far a limb reaches — because a rotation becomes a
   * *translation* in depth only once you multiply by a radius.
   *
   * The `z` channel's amplitude lives in `gait.depth` (pixels) while `angle`'s lives in
   * `gait.swing` (turns), so the conversion has to go through both. It is done at the ratio
   * the tunables declare, which keeps the decomposition anchored rather than tuned.
   */
  const tracks: Track[] = []
  for (const t of grammar.gait.tracks) {
    if (t.channel !== 'angle' || Math.abs(s) < 1e-6) {
      tracks.push(t)
      continue
    }
    if (Math.abs(c) > 1e-6) tracks.push({ ...t, keys: t.keys.map((k) => k * c) })
    // A turn of exactly a quarter leaves no on-screen rotation at all, and pushing a zeroed
    // track would be a track that paints nothing but still costs a lookup.
    tracks.push({ bone: t.bone, channel: 'z', keys: t.keys.map((k) => k * s * LIMB) })
    /**
     * **The third component, and leaving it out was the first version's real defect.**
     *
     * A limb swinging toward the camera does two things: it moves in depth, and **it gets
     * shorter on screen**. Only the first was carried, so a body turned to face away had legs
     * that did not visibly move at all — the leap at `n` measured the same bounding box as the
     * idle at `n`, which is a jump nobody can see.
     *
     * The projected length of a limb rotated by φ and viewed at yaw θ is
     * `sqrt(cos²φ + sin²φ·cos²θ)`, and at a quarter turn that is `|cos φ|`. `scaleY` carries
     * it, which is the one channel in the vocabulary that takes a bare ratio.
     *
     * **Declared approximation, and it is why the delta is taken at 0.6.** `scaleY`
     * multiplies down the bone chain, so a thigh and a shin that each shorten by 0.8 leave the
     * shin at 0.64 rather than 0.8. Compensating properly means solving the chain, which the
     * solver runs later and this transform cannot see. Six tenths puts a two-segment limb
     * close to right and a one-segment limb slightly under, and under-foreshortening reads as
     * a stiff limb where over-foreshortening reads as a broken one.
     */
    tracks.push({
      bone: t.bone,
      channel: 'scaleY',
      keys: t.keys.map((k) => {
        const phi = k * swing * Math.PI * 2
        return 0.6 * (Math.hypot(Math.cos(phi), Math.sin(phi) * c) - 1)
      }),
    })
  }

  const gait: Gait = { ...grammar.gait, tracks }
  return { name, palette: grammar.palette, skeleton: { bones }, parts, gait }
}

/**
 * **The eight facings of a body, by compass point.** `e` is the authored one.
 *
 * Only five are generated: the runtime mirrors `e`, `ne` and `se` to reach the western three,
 * because a mirror is free and a render is not — and mirroring is *correct* here in a way it
 * is not for lighting, since a body turned to the west genuinely is a body turned to the east
 * seen in a mirror. The lamp is the part that has to be re-rendered, and `layers.ts` already
 * does exactly that.
 */
export const FACINGS = ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'] as const
export type Facing = (typeof FACINGS)[number]

/** Turns of yaw for each compass point, measured from the authored facing. */
export const YAW_OF: Readonly<Record<Facing, number>> = {
  e: 0,
  ne: -0.125,
  n: -0.25,
  nw: -0.375,
  w: -0.5,
  sw: 0.375,
  s: 0.25,
  se: 0.125,
}
