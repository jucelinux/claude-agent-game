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
}

/** Per-bone deltas applied on top of the rest pose. */
export type PoseDelta = { angle: number; x: number; y: number; z: number; scale: number; scaleX: number; scaleY: number }
export type Pose = ReadonlyMap<string, PoseDelta>

export const ZERO_DELTA: PoseDelta = { angle: 0, x: 0, y: 0, z: 0, scale: 0, scaleX: 0, scaleY: 0 }

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
    const ly = bone.y + d.y
    const pa = parent.a * TURN
    const cos = Math.cos(pa)
    const sin = Math.sin(pa)
    // A scale delta of -1 collapses the bone and everything hanging off it to nothing.
    const uniform = Math.max(0, 1 + d.scale)
    world.set(bone.name, {
      x: parent.x + parent.sx * (cos * lx - sin * ly),
      y: parent.y + parent.sy * (sin * lx + cos * ly),
      // Depth accumulates but never rotates: this is 2.5D, and the angle lives in the
      // screen plane only. A limb swings across the picture and travels in depth as two
      // independent facts, which is exactly how a punch is authored.
      z: parent.z + parent.sz * ((bone.z ?? 0) + d.z),
      a: parent.a + bone.angle + d.angle,
      sx: parent.sx * uniform * Math.max(0, 1 + d.scaleX),
      sy: parent.sy * uniform * Math.max(0, 1 + d.scaleY),
      sz: parent.sz * uniform,
    })
  }
  return world
}
