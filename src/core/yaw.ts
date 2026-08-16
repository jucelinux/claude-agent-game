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

/**
 * **How far a limb reaches from its joint, in bone units.**
 *
 * A rotation only becomes a *translation* in depth once you multiply it by a radius, and this
 * is that radius. 7.5 is measured rather than picked: the upper arm and the thigh of every
 * body in this project run between 7 and 8.5 units.
 */
const LIMB = 7.5

const yawPoint = (x: number, z: number, c: number, s: number): { x: number; z: number } => ({
  x: x * c - z * s,
  z: x * s + z * c,
})

/**
 * **A part rotates as a rigid thing, and its `z` is half of where it is.**
 *
 * The first version rotated only the shape's own `cx` and left `Part.z` alone — so the
 * astronaut's visor, which sits at `z: -3.6` on the front of the helmet, **stayed on the
 * camera side in every facing**. He walked away from the camera and looked straight at it.
 * His words: *"quando ando para cima (W), deveria ver as costas do astronauta. Ao invés
 * disso vejo o visor dele"*.
 *
 * A part's position in its bone is the pair `(x along the body, z into it)`, and a yaw
 * rotates that pair. Leaving one of the two out is not an approximation, it is half a
 * rotation.
 */
function yawPart(part: Part, c: number, s: number): Part {
  const z = part.z ?? 0
  const shape = part.shape
  // |cos| and |sin|: a radius has no sign, and a body turned 190 degrees is as wide as one
  // turned 170. Using the signed value here silently inverted every shape past a quarter turn.
  const ac = Math.abs(c)
  const as = Math.abs(s)

  switch (shape.kind) {
    case 'ellipse':
    case 'lobed': {
      const rz = shape.rz ?? Math.min(shape.rx, shape.ry)
      const p = yawPoint(shape.cx, z, c, s)
      return {
        ...part,
        z: p.z,
        shape: {
          ...shape,
          cx: p.x,
          rx: Math.hypot(shape.rx * ac, rz * as),
          rz: Math.hypot(shape.rx * as, rz * ac),
        },
      }
    }
    case 'capsule': {
      // **The exact case.** A swept sphere is rotation-invariant in its radius, and its two
      // endpoints are points. They can end at different depths — an arm pointing forward
      // recedes when you look at it from the front — and `Part.z` holds one number, so the
      // part takes their mean. On this vocabulary's limbs the two ends share an x, so the
      // mean is exact; on a limb authored across the body it is a half-pixel.
      const a = yawPoint(shape.x0, z, c, s)
      const b = yawPoint(shape.x1, z, c, s)
      return { ...part, z: (a.z + b.z) / 2, shape: { ...shape, x0: a.x, x1: b.x } }
    }
    case 'rect': {
      const d = shape.d ?? Math.min(shape.w, shape.h)
      const p = yawPoint(shape.x + shape.w / 2, z, c, s)
      const w = shape.w * ac + d * as
      return { ...part, z: p.z, shape: { ...shape, x: p.x - w / 2, w, d: shape.w * as + d * ac } }
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
 *
 * `depth` is the same story for the other end: the `z` channel's keys are read back through
 * `gait.depth` in pixels, so a distance has to be divided by it to become a key.
 */
export function yaw(grammar: Grammar, turns: number, name: string, swing = 0.26, depth = 7): Grammar {
  const a = turns * Math.PI * 2
  const c = Math.cos(a)
  const s = Math.sin(a)

  /**
   * **The rest angle turns too, and forgetting it is why he saw the arms crooked.**
   *
   * A bone's `angle` is a rotation in the screen plane, exactly like a gait key — an arm hung
   * at 11 degrees out from the body is splayed *forward and back*, in the plane the author was
   * looking at. Seen from the front that splay is depth, not a slant, and an arm that keeps
   * its 11 degrees on screen is an arm sticking out sideways for no reason.
   *
   * `cos θ` of it survives as rotation. The rest of it becomes a fixed depth offset, folded
   * into the bone's own `z` at the radius a limb reaches.
   */
  const angleOf = new Map(grammar.skeleton.bones.map((b) => [b.name, b.angle]))
  const bones: Bone[] = grammar.skeleton.bones.map((b) => {
    const p = yawPoint(b.x, b.z ?? 0, c, s)
    // **A bone's own rotation moves its CHILDREN in depth, never itself**, and the first
    // version folded it into the bone's own `z`. A joint's origin does not move when the joint
    // turns; what hangs off it does. Folding it the wrong way put the forearm two units
    // further from the camera than the elbow it hangs from — *"parece que o antebraço está
    // atrás do braço"* — and stacked down the chain, so the error grew with every segment.
    const parent = b.parent === null ? 0 : (angleOf.get(b.parent) ?? 0)
    return { ...b, x: p.x, z: p.z + Math.sin(parent * Math.PI * 2) * b.y * s, angle: b.angle * c }
  })

  /** Which bones hang off each bone, so a rotation can be pushed down to them. */
  const children = new Map<string, { readonly name: string; readonly reach: number }[]>()
  for (const b of grammar.skeleton.bones) {
    if (b.parent === null) continue
    const list = children.get(b.parent) ?? []
    list.push({ name: b.name, reach: b.y })
    children.set(b.parent, list)
  }

  const parts: Part[] = grammar.parts.map((p) => yawPart(p, c, s))

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
  /**
   * **The conversion runs through BOTH amplitudes, and the first version ran through
   * neither.** It read `key × sin θ × 10`, and the runtime then multiplied that by
   * `gait.depth`. So a key of -0.22 — an arm hanging twenty degrees out — became **eleven
   * pixels of depth travel** on a body whose limb rows are six and a half apart. Every limb in
   * every turned facing was flung clean through the torso, which is why he could not even
   * describe what was wrong with the south-east view.
   *
   * A track key is a *fraction of an amplitude*. Turning one into a distance needs the
   * amplitude it is a fraction of (`swing`, in turns), the radius the rotation acts at
   * (`LIMB`), and the amplitude the answer will be read back through (`depth`, in pixels).
   * Leaving any of the three out is a unit error wearing a plausible number.
   */
  const toDepth = (k: number, reach: number): number =>
    (Math.sin(k * swing * Math.PI * 2) * reach * s) / depth

  const tracks: Track[] = []
  for (const t of grammar.gait.tracks) {
    if (t.channel !== 'angle' || Math.abs(s) < 1e-6) {
      tracks.push(t)
      continue
    }
    if (Math.abs(c) > 1e-6) tracks.push({ ...t, keys: t.keys.map((k) => k * c) })
    /**
     * **The depth goes on the CHILDREN, at each child's own reach.**
     *
     * Rotating a shoulder does not move the shoulder. It moves the elbow, by the length of the
     * upper arm; and the wrist, by the elbow's travel plus its own. Putting the displacement
     * on the rotating bone itself moved that bone's origin — so the whole limb slid in depth
     * and the segments came apart in the ordering even while they touched on screen.
     *
     * A turn of exactly a quarter leaves no on-screen rotation at all, so the `angle` track is
     * dropped there rather than pushed as a row of zeroes.
     *
     * **Declared approximation, and it is the one this transform cannot avoid.** The *parts*
     * on the rotating bone are not tilted into depth — a capsule carries one depth for its
     * whole length, and a tilted limb's far end is genuinely deeper than its near end. So a
     * limb swung toward the camera moves its joints correctly and keeps its own segments flat.
     * At the amplitudes a walk uses, that is under two pixels; a limb thrown straight at the
     * viewer would show it.
     */
    for (const kid of children.get(t.bone) ?? []) {
      tracks.push({ bone: kid.name, channel: 'z', keys: t.keys.map((k) => toDepth(k, kid.reach)) })
    }
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
/**
 * Turns of yaw for each compass point, measured from the authored facing.
 *
 * **The signs were inverted and he found it in one look.** `n` is walking *away* from the
 * camera, so it has to turn the body's face to +z — away — and it was turning it to -z. He
 * walked north and saw the visor. The transform was right and the compass was reading it
 * backwards, which is the cheapest kind of defect to have and the easiest to ship.
 */
export const YAW_OF: Readonly<Record<Facing, number>> = {
  e: 0,
  ne: 0.125,
  n: 0.25,
  nw: 0.375,
  w: 0.5,
  sw: -0.375,
  s: -0.25,
  se: -0.125,
}
