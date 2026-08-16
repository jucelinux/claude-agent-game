import type { Gait, Params, Track } from './types.ts'
import type { Pose, PoseDelta } from './skeleton.ts'

/**
 * Sample a gait at cycle position `t` in [0, 1).
 *
 * The curve is a **cyclic Hermite through the named phase keys**, with tangents from
 * central differences over the phases' own positions. Two consequences, and both are the
 * point: an unevenly timed gait (contact, down, pass, up at 0 / .25 / .5 / .75 or not)
 * is expressed in the phase positions rather than in the curve, and the interpolation
 * carries an arc instead of a straight line between poses. It is not a sine, and a
 * four-phase gait cannot silently collapse into a two-state flip. portable.
 */
export function evaluate(gait: Gait, params: Params, t: number): Pose {
  const n = gait.phases.length
  if (n < 1) throw new Error(`gait "${gait.name}" needs at least one phase, has ${n}`)
  /**
   * **One phase is a pose, and a pose is a legitimate gait.**
   *
   * The rule used to demand two, which was right while every subject moved. A gravestone does
   * not. Two phases on a one-frame subject then failed the sprite contract — *phase "b" at 0.5
   * lands between frames of a 1-frame cycle* — because a second phase on a still object is a
   * named instant nobody can ever see.
   *
   * With one phase there is nothing to interpolate: every track contributes its single key.
   */
  if (n === 1) {
    const pose = new Map<string, PoseDelta>()
    for (const track of gait.tracks) {
      const delta = pose.get(track.bone) ?? { angle: 0, x: 0, y: 0, z: 0, scale: 0, scaleX: 0, scaleY: 0 }
      delta[track.channel] += (track.keys[0] ?? 0) * amplitudeOf(track.channel, params)
      pose.set(track.bone, delta)
    }
    return pose
  }
  const at = gait.phases.map((p) => p.at)

  /**
   * **A gait that does not wrap ends where it was authored to end.** Its phases span [0, 1]
   * inclusive, so the last one is the finish rather than the step before the start, and there
   * is no segment after it. See `Gait.wrap`.
   */
  const wrap = gait.wrap !== false
  const cycle = wrap ? ((t % 1) + 1) % 1 : Math.max(0, Math.min(1, t))
  // Segment i spans [at[i], at[i+1]); with wrap, the last one runs past 1 back to the first.
  let i = wrap ? n - 1 : n - 2
  for (let k = 0; k < (wrap ? n : n - 1); k++) {
    const a = at[k] as number
    const b = k + 1 < n ? (at[k + 1] as number) : 1 + (at[0] as number)
    if (cycle >= a && cycle < b) {
      i = k
      break
    }
  }
  if (i < 0) i = 0
  const t0 = at[i] as number
  const t1 = i + 1 < n ? (at[i + 1] as number) : 1 + (at[0] as number)
  const h = t1 - t0
  const u = h === 0 ? 0 : (cycle - t0) / h

  const pose = new Map<string, PoseDelta>()
  for (const track of gait.tracks) {
    if (track.keys.length !== n) {
      throw new Error(`track ${track.bone}.${track.channel} has ${track.keys.length} keys for ${n} phases`)
    }
    const value = hermite(at, track.keys, i, u, h, wrap)
    const amplitude = amplitudeOf(track.channel, params)
    const delta = pose.get(track.bone) ?? { angle: 0, x: 0, y: 0, z: 0, scale: 0, scaleX: 0, scaleY: 0 }
    delta[track.channel] += value * amplitude
    pose.set(track.bone, delta)
  }
  return pose
}

/**
 * The amplitude a normalized track key is multiplied by. Angles are turns, offsets are pixels,
 * and a scale key is already a ratio with no unit in the domain to be anchored against.
 */
function amplitudeOf(channel: Track['channel'], params: Params): number {
  if (channel === 'angle') return params.gait.swing
  if (channel === 'scale' || channel === 'scaleX' || channel === 'scaleY') return 1
  if (channel === 'z') return params.gait.depth
  return params.gait.lift
}

/**
 * Cubic Hermite over segment `i`, tangents by central difference in phase time.
 *
 * **Cyclic by default and clamped when the gait does not wrap.** Clamping is the whole of the
 * difference: an index past either end returns the end key instead of walking round, so the
 * tangent at the last phase is computed from the motion that arrived there rather than from the
 * motion that would return to the start. That is what stops a somersault unwinding.
 */
function hermite(at: readonly number[], keys: readonly number[], i: number, u: number, h: number, wrap = true): number {
  const n = keys.length
  const key = (j: number) => (wrap ? (keys[((j % n) + n) % n] as number) : (keys[Math.max(0, Math.min(n - 1, j))] as number))
  // Phase spacing, unwrapped so a wrapped neighbour keeps a positive interval.
  const span = (j: number) => {
    if (!wrap) {
      const k = Math.max(0, Math.min(n - 2, j))
      return (at[k + 1] as number) - (at[k] as number)
    }
    const a = at[((j % n) + n) % n] as number
    const b = at[(((j + 1) % n) + n) % n] as number
    return b > a ? b - a : b + 1 - a
  }

  const p0 = key(i)
  const p1 = key(i + 1)
  const m0 = (key(i + 1) - key(i - 1)) / (span(i - 1) + span(i))
  const m1 = (key(i + 2) - key(i)) / (span(i) + span(i + 1))

  const u2 = u * u
  const u3 = u2 * u
  return (
    (2 * u3 - 3 * u2 + 1) * p0 +
    (u3 - 2 * u2 + u) * h * m0 +
    (-2 * u3 + 3 * u2) * p1 +
    (u3 - u2) * h * m1
  )
}
