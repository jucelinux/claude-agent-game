import type { Gait, Params } from './types.ts'
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
  if (n < 2) throw new Error(`gait "${gait.name}" needs at least 2 phases, has ${n}`)
  const at = gait.phases.map((p) => p.at)

  const cycle = ((t % 1) + 1) % 1
  // Segment i spans [at[i], at[i+1]); the last wraps past 1.
  let i = n - 1
  for (let k = 0; k < n; k++) {
    const a = at[k] as number
    const b = k + 1 < n ? (at[k + 1] as number) : 1 + (at[0] as number)
    if (cycle >= a && cycle < b) {
      i = k
      break
    }
  }
  const t0 = at[i] as number
  const t1 = i + 1 < n ? (at[i + 1] as number) : 1 + (at[0] as number)
  const h = t1 - t0
  const u = h === 0 ? 0 : (cycle - t0) / h

  const pose = new Map<string, PoseDelta>()
  for (const track of gait.tracks) {
    if (track.keys.length !== n) {
      throw new Error(`track ${track.bone}.${track.channel} has ${track.keys.length} keys for ${n} phases`)
    }
    const value = hermite(at, track.keys, i, u, h)
    const amplitude =
      track.channel === 'angle'
        ? params.gait.swing
        : track.channel === 'scale'
          ? 1
          : track.channel === 'z'
            ? params.gait.depth
            : params.gait.lift
    const delta = pose.get(track.bone) ?? { angle: 0, x: 0, y: 0, z: 0, scale: 0 }
    delta[track.channel] += value * amplitude
    pose.set(track.bone, delta)
  }
  return pose
}

/** Cyclic cubic Hermite over segment `i`, tangents by central difference in phase time. */
function hermite(at: readonly number[], keys: readonly number[], i: number, u: number, h: number): number {
  const n = keys.length
  const key = (j: number) => keys[((j % n) + n) % n] as number
  // Phase spacing, unwrapped so a wrapped neighbour keeps a positive interval.
  const span = (j: number) => {
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
