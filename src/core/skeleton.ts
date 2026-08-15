import type { Skeleton } from './types.ts'

export const TURN = Math.PI * 2

/** A rigid transform: position, depth, angle in turns, uniform scale. */
export type Xform = { readonly x: number; readonly y: number; readonly z: number; readonly a: number; readonly s: number }

/** Per-bone deltas applied on top of the rest pose. */
export type PoseDelta = { angle: number; x: number; y: number; z: number; scale: number }
export type Pose = ReadonlyMap<string, PoseDelta>

export const ZERO_DELTA: PoseDelta = { angle: 0, x: 0, y: 0, z: 0, scale: 0 }

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
    world.set(bone.name, {
      x: parent.x + parent.s * (cos * lx - sin * ly),
      y: parent.y + parent.s * (sin * lx + cos * ly),
      // Depth accumulates but never rotates: this is 2.5D, and the angle lives in the
      // screen plane only. A limb swings across the picture and travels in depth as two
      // independent facts, which is exactly how a punch is authored.
      z: parent.z + parent.s * ((bone.z ?? 0) + d.z),
      a: parent.a + bone.angle + d.angle,
      // A scale delta of -1 collapses the bone and everything hanging off it to nothing.
      s: parent.s * Math.max(0, 1 + d.scale),
    })
  }
  return world
}
