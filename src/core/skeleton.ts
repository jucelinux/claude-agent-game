import type { Skeleton } from './types.ts'

export const TURN = Math.PI * 2

/**
 * A transform: position, depth, angle in turns, and scale.
 *
 * Scale is three numbers because squash is not uniform. `sx` and `sy` are screen axes and
 * carry the squash; `sz` is depth and carries only the uniform part, because flattening a
 * body on screen does not change how far away it is. portable.
 */
export type Xform = {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly a: number
  readonly sx: number
  readonly sy: number
  readonly sz: number
  /**
   * Roll in turns: rotation about the horizontal screen axis. 0 everywhere the field is absent,
   * and 0 costs nothing — `paintPart` takes its closed-form path unless this is non-zero.
   * See `Bone.roll` for what it buys and for the two declared approximations.
   */
  readonly roll: number
}

/** Per-bone deltas applied on top of the rest pose. */
export type PoseDelta = {
  angle: number
  /** Delta roll, in turns. The channel a flip is animated on. */
  roll: number
  x: number
  y: number
  z: number
  scale: number
  scaleX: number
  scaleY: number
}
export type Pose = ReadonlyMap<string, PoseDelta>

export const ZERO_DELTA: PoseDelta = { angle: 0, roll: 0, x: 0, y: 0, z: 0, scale: 0, scaleX: 0, scaleY: 0 }

/**
 * Resolve every bone to canvas space. Iteration follows declaration order, which is why
 * a parent must be declared before its child — an unordered walk would be an ambient
 * source of nondeterminism (`HARNESS.md` §2.2). portable.
 */
export function solve(skeleton: Skeleton, pose: Pose, root: Xform): Map<string, Xform> {
  const world = new Map<string, Xform>()
  for (const bone of skeleton.bones) {
    const parent = bone.parent === null ? root : world.get(bone.parent)
    if (parent === undefined) {
      throw new Error(`bone "${bone.name}" references parent "${bone.parent}" before it is declared`)
    }
    const d = pose.get(bone.name) ?? ZERO_DELTA
    const lx = bone.x + d.x
    /**
     * **A rolled parent carries its children's offsets through the roll, and forgetting this is
     * the astronaut's defect in a new place.**
     *
     * That round shipped a visor that stayed on the camera side of a turned head, because
     * `Part.z` was rotated by nothing: *"quando ando com S... o visor está olhando para a
     * esquerda"*. The recorded lesson was **not** "a gait that survives being turned" — it was
     * *"a body that survives being turned: every field that carries a position has to rotate, and
     * I had only rotated some of them"*.
     *
     * A child's rest offset is a position. Under a parent roll, an offset that is purely in depth
     * has to become an offset in `y` at a quarter turn, or a wheel bolted under a deck stays
     * behind the deck however far the deck turns over. The findings channel caught exactly that:
     * both far wheels painted **0 px in all twelve frames of the flip**, and I had written in the
     * grammar that they would be the parts carrying the read at three quarters.
     */
    const pr = parent.roll * TURN
    const prc = Math.cos(pr)
    const prs = Math.sin(pr)
    const ly0 = bone.y + d.y
    const lz0 = (bone.z ?? 0) + d.z
    const ly = ly0 * prc - lz0 * prs
    const lz = ly0 * prs + lz0 * prc
    const pa = parent.a * TURN
    const cos = Math.cos(pa)
    const sin = Math.sin(pa)
    // A scale delta of -1 collapses the bone and everything hanging off it to nothing.
    const uniform = Math.max(0, 1 + d.scale)
    world.set(bone.name, {
      x: parent.x + parent.sx * (cos * lx - sin * ly),
      y: parent.y + parent.sy * (sin * lx + cos * ly),
      // Depth does not rotate with the **screen-plane** angle: that is what 2.5D means, and a
      // limb swinging across the picture while travelling in depth is two independent facts —
      // which is exactly how a punch is authored. It does rotate with the parent's **roll**, and
      // `lz` above is where that happens.
      z: parent.z + parent.sz * lz,
      a: parent.a + bone.angle + d.angle,
      // Roll accumulates the same way the screen-plane angle does, and the two do not commute:
      // exact while the chain above is unrotated, an approximation otherwise. Declared on
      // `Bone.roll` rather than hidden here, because the honest fix is a matrix per bone.
      roll: parent.roll + (bone.roll ?? 0) + d.roll,
      sx: parent.sx * uniform * Math.max(0, 1 + d.scaleX),
      sy: parent.sy * uniform * Math.max(0, 1 + d.scaleY),
      sz: parent.sz * uniform,
    })
  }
  return world
}
