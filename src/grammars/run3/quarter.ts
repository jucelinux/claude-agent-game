/**
 * **Three-quarter view.** Run 3's whole bet, and the reason it is a ceiling attempt rather
 * than a repair: a side view resolves a walk but never passes for published art, because
 * nothing the bar games ship is drawn from the side. Chrono and Stardew are seen from above
 * and in front at once, and that is what makes a sprite read as a body in a world instead
 * of a diagram of one.
 *
 * What the view costs, and it is all new here:
 *  - **both sides visible.** Six legs, not three, and the far row has to sit *higher* on
 *    the canvas and be *shorter* — that is foreshortening, and without it the far legs read
 *    as a second creature standing behind the first.
 *  - **depth by paint order and by length**, never by colour alone. The side view could
 *    cheat with a dark ramp; from 3/4 the eye wants the far leg to be smaller.
 *  - **volume from shading**, since the body is now a form seen from above rather than a
 *    silhouette seen edge-on.
 *
 * portable — the row builder and the foreshortening ratio.
 */
import type { Bone, Part, Track } from '../../core/types.ts'

/**
 * How much of its near-side length a far-side limb keeps. **Half**, and the first attempt
 * at 0.7 was wrong for a reason worth writing down: from three-quarter, the far row is
 * mostly *behind the body*. What reaches the eye is the tips, not the limbs — a far leg
 * drawn at 70% reads as a second creature standing behind the first.
 */
export const FAR = 0.5

export type Row = {
  readonly side: 'N' | 'F'
  /** Hip stations along the body, front to back. */
  readonly at: readonly number[]
  /** Distance from the body axis. Near is positive (down-screen), far negative (up-screen). */
  readonly offset: number
  readonly femur: number
  readonly tibia: number
  readonly width: number
  readonly material: string
  /**
   * Rest angle of the row. A capsule points down-screen at 0, so the near row sits near 0
   * and the far row near half a turn — that is what puts one row below the body and the
   * other above it.
   */
  readonly splay: number
  /** Per-station fan, signed: the front leg reaches forward and the back one trails. */
  readonly lean: number
  readonly parent: string
}

export function legBones(row: Row): Bone[] {
  const bones: Bone[] = []
  const scale = row.side === 'F' ? FAR : 1
  for (let i = 0; i < row.at.length; i++) {
    const lean = (i - (row.at.length - 1) / 2) * row.lean
    bones.push({
      name: `hip${row.side}${i}`,
      parent: row.parent,
      x: row.at[i] as number,
      y: row.offset,
      angle: row.splay + lean,
    })
    bones.push({
      name: `tib${row.side}${i}`,
      parent: `hip${row.side}${i}`,
      x: 0,
      y: row.femur * scale,
      angle: -0.08 + lean * 0.6,
    })
  }
  return bones
}

export function legParts(row: Row): Part[] {
  const parts: Part[] = []
  const scale = row.side === 'F' ? FAR : 1
  for (let i = 0; i < row.at.length; i++) {
    parts.push({
      name: `femur${row.side}${i}`,
      bone: `hip${row.side}${i}`,
      material: row.material,
      shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: row.femur * scale, r: row.width * scale },
    })
    parts.push({
      name: `tibia${row.side}${i}`,
      bone: `tib${row.side}${i}`,
      material: row.material,
      shape: { kind: 'capsule', x0: 0, y0: 0, x1: 0, y1: row.tibia * scale, r: row.width * 0.72 * scale },
    })
  }
  return parts
}

/**
 * Legs in `group` swing together. For six legs that is the alternating tripod; for four it
 * is the diagonal pair. Both are real gaits, and naming which one a creature uses is the
 * difference between animating a body and animating a set of sticks.
 */
export function legTracks(group: readonly string[], phase: 1 | -1, reach = 1, knee = 0.7): Track[] {
  const tracks: Track[] = []
  for (const hip of group) {
    tracks.push({ bone: hip, channel: 'angle', keys: [reach * phase, 0, -reach * phase, 0] })
    tracks.push({ bone: `tib${hip.slice(3)}`, channel: 'angle', keys: [0, -knee * phase, 0, knee * phase] })
  }
  return tracks
}

export const PHASES = [
  { name: 'plant', at: 0 },
  { name: 'load', at: 0.25 },
  { name: 'lift', at: 0.5 },
  { name: 'reach', at: 0.75 },
] as const
