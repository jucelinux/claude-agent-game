/**
 * **The export contract.** What a game dev receives from this repo, declared before the
 * grammar exists so the grammar cannot drift away from it.
 *
 * The exporter itself (indexed atlas PNG + this manifest on disk) ships at the vertical
 * slice — exporting disposable probe art is inventory. What ships *now* is the shape and
 * its invariants, locked, so that between here and the slice I cannot quietly author
 * something no engine can ingest.
 *
 * The bet, stated so it can be wrong: **compatibility is an output contract, not an
 * architecture.** Depending on one renderer would make this artifact *less* portable —
 * a Godot or LÖVE dev would get nothing. A fixed-size indexed atlas with named phases and
 * declared anchors is the currency every engine already speaks. portable.
 */
import type { Grammar, Params, RGB } from '../core/types.ts'

export type Manifest = {
  readonly name: string
  /** Every frame is this size. Engines want one rect, not a trimmed box per frame. */
  readonly canvas: { readonly w: number; readonly h: number }
  /** Where the sprite meets the world. Constant across frames, or the sprite skates. */
  readonly pivot: { readonly x: number; readonly y: number }
  /** Index 0 is transparent; the rest is the locked palette, recolourable by ramp. */
  readonly palette: readonly RGB[]
  readonly materials: readonly { readonly name: string; readonly indices: readonly number[] }[]
  readonly frames: readonly { readonly index: number; readonly t: number; readonly durationMs: number }[]
  /** What makes this a grammar and not a GIF: a footstep can be synced to `contact`. */
  readonly phases: readonly { readonly name: string; readonly at: number; readonly frame: number }[]
  /** Rest-pose anchors, in canvas space: where a weapon, a shadow or an effect attaches. */
  readonly anchors: readonly {
    readonly name: string
    readonly parent: string | null
    readonly x: number
    readonly y: number
    readonly angleTurns: number
  }[]
  readonly loop: true
  readonly totalMs: number
}

export function describe(grammar: Grammar, params: Params): Manifest {
  const n = params.frames.walk
  const ms = params.playback.msPerFrame
  return {
    name: grammar.name,
    canvas: { w: params.canvas.w, h: params.canvas.h },
    pivot: { x: params.canvas.originX, y: params.canvas.originY },
    palette: grammar.palette.colors,
    materials: grammar.palette.ramps.map((r) => ({ name: r.material, indices: r.indices })),
    frames: Array.from({ length: n }, (_, i) => ({ index: i, t: i / n, durationMs: ms })),
    phases: grammar.gait.phases.map((p) => ({ name: p.name, at: p.at, frame: Math.round(p.at * n) % n })),
    anchors: grammar.skeleton.bones.map((b) => ({
      name: b.name,
      parent: b.parent,
      x: b.x,
      y: b.y,
      angleTurns: b.angle,
    })),
    loop: true,
    totalMs: n * ms,
  }
}

/** Every violation, named. An empty array is the lock's green. */
export function validate(m: Manifest): string[] {
  const bad: string[] = []
  const int = (v: number) => Number.isInteger(v)

  if (!int(m.canvas.w) || !int(m.canvas.h) || m.canvas.w < 1 || m.canvas.h < 1) bad.push('canvas is not a positive integer size')
  if (!int(m.pivot.x) || !int(m.pivot.y)) bad.push('pivot is not on the pixel grid')
  if (m.pivot.x < 0 || m.pivot.x > m.canvas.w || m.pivot.y < 0 || m.pivot.y > m.canvas.h) bad.push('pivot is outside the canvas')

  if (m.palette.length < 1) bad.push('empty palette')
  if (m.palette.length > 256) bad.push(`palette of ${m.palette.length} exceeds the 256 an indexed atlas can carry`)

  const names = new Set<string>()
  for (const material of m.materials) {
    if (material.name.length === 0) bad.push('a material has no name')
    if (names.has(material.name)) bad.push(`duplicate material "${material.name}"`)
    names.add(material.name)
    if (material.indices.length === 0) bad.push(`material "${material.name}" has no tones`)
    for (const index of material.indices) {
      if (index === 0) bad.push(`material "${material.name}" claims index 0, which is transparent`)
      if (index >= m.palette.length) bad.push(`material "${material.name}" points past the palette`)
    }
  }

  if (m.frames.length < 1) bad.push('no frames')
  for (const frame of m.frames) {
    if (!int(frame.durationMs) || frame.durationMs < 1) bad.push(`frame ${frame.index} has a duration no engine can play`)
    if (frame.t < 0 || frame.t >= 1) bad.push(`frame ${frame.index} sits outside the cycle`)
  }

  if (m.phases.length < 1) bad.push('a gait with no named phase is a sine wearing a name')
  const phaseNames = new Set<string>()
  let previous = -1
  for (const phase of m.phases) {
    if (phase.name.length === 0) bad.push('an unnamed phase')
    if (phaseNames.has(phase.name)) bad.push(`duplicate phase "${phase.name}"`)
    phaseNames.add(phase.name)
    if (phase.at < 0 || phase.at >= 1) bad.push(`phase "${phase.name}" sits outside the cycle`)
    if (phase.at <= previous) bad.push(`phase "${phase.name}" is out of order`)
    previous = phase.at
    if (phase.frame < 0 || phase.frame >= m.frames.length) bad.push(`phase "${phase.name}" points at no frame`)
    // A phase between two frames is a pose nobody ever sees, and a manifest that rounds it
    // to the nearest frame lies to whoever syncs a footstep to it.
    const exact = phase.at * m.frames.length
    if (Math.abs(exact - Math.round(exact)) > 1e-9) {
      bad.push(`phase "${phase.name}" at ${phase.at} lands between frames of a ${m.frames.length}-frame cycle`)
    }
  }

  const anchors = new Set<string>()
  for (const anchor of m.anchors) {
    if (anchor.name.length === 0) bad.push('an unnamed anchor')
    if (anchors.has(anchor.name)) bad.push(`duplicate anchor "${anchor.name}"`)
    if (anchor.parent !== null && !anchors.has(anchor.parent)) {
      bad.push(`anchor "${anchor.name}" hangs off "${anchor.parent}", which is not declared before it`)
    }
    anchors.add(anchor.name)
  }

  if (m.totalMs !== m.frames.reduce((sum, f) => sum + f.durationMs, 0)) bad.push('totalMs disagrees with the frames')
  return bad
}
