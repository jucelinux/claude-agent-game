import type { Skeleton } from './types.ts'

export const TURN = Math.PI * 2

/** A rigid transform: position, angle in turns, uniform scale. */
export type Xform = { readonly x: number; readonly y: number; readonly a: number; readonly s: number }

/** Per-bone deltas applied on top of the rest pose. */
export type PoseDelta = { angle: number; x: number; y: number }
export type Pose = ReadonlyMap<string, PoseDelta>

export const ZERO_DELTA: PoseDelta = { angle: 0, x: 0, y: 0 }

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
      a: parent.a + bone.angle + d.angle,
      s: parent.s,
    })
  }
  return world
}
