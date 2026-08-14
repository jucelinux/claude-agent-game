/**
 * The grammar's vocabulary. Everything here is data — no behaviour, no imports.
 *
 * Angles are in **turns** (1 = full revolution) everywhere, never radians and never
 * degrees. Rationale: every angle in a gait is a fraction of a cycle, so turns keep the
 * numbers derived from the domain instead of hand-calibrated (`HARNESS.md` §2.7).
 * portable.
 */

export type RGB = readonly [number, number, number]

/** Index 0 is reserved: background / transparent. A part never paints it. portable. */
export type Palette = {
  readonly name: string
  readonly colors: readonly RGB[]
  readonly ramps: readonly Ramp[]
}

/** A material's tone ramp, dark -> light. Its **length is the tone budget**. portable. */
export type Ramp = {
  readonly material: string
  readonly indices: readonly number[]
}

export type IndexedBuffer = {
  readonly w: number
  readonly h: number
  /** One palette index per pixel, row-major. */
  readonly data: Uint8Array
}

/** A named anchor. Parents are always declared before their children. portable. */
export type Bone = {
  readonly name: string
  readonly parent: string | null
  /** Rest offset in the parent's space, in pixels. */
  readonly x: number
  readonly y: number
  /** Rest angle, in turns. */
  readonly angle: number
}

export type Skeleton = { readonly bones: readonly Bone[] }

/** Shapes live in **bone space**. Animation transforms them; it never redraws them. */
export type Shape =
  | { readonly kind: 'ellipse'; readonly cx: number; readonly cy: number; readonly rx: number; readonly ry: number }
  | { readonly kind: 'capsule'; readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number; readonly r: number }
  | { readonly kind: 'rect'; readonly x: number; readonly y: number; readonly w: number; readonly h: number }

export type Part = {
  readonly name: string
  readonly bone: string
  readonly material: string
  readonly shape: Shape
}

/** A named instant of the cycle. The gait is a set of named phases, never a bare sine. */
export type Phase = { readonly name: string; readonly at: number }

export type Channel = 'angle' | 'x' | 'y'

/**
 * One key per phase, in phase order, **normalized to [-1, 1]**. The amplitude that turns
 * a key into pixels or turns lives in the tunables file, so a gait is retimed and
 * re-scaled without touching the grammar. portable.
 */
export type Track = {
  readonly bone: string
  readonly channel: Channel
  readonly keys: readonly number[]
}

export type Gait = {
  readonly name: string
  readonly phases: readonly Phase[]
  readonly tracks: readonly Track[]
}

export type Grammar = {
  readonly name: string
  readonly palette: Palette
  readonly skeleton: Skeleton
  /** Paint order, and therefore deterministic. */
  readonly parts: readonly Part[]
  readonly gait: Gait
}

/**
 * The tunables file, typed. Every number the render reads is here — no magic constants
 * in code (`HARNESS.md` §2.3). `_anchors` names where each number came from (§2.7).
 */
export type Params = {
  readonly canvas: { readonly w: number; readonly h: number; readonly originX: number; readonly originY: number }
  readonly tones: { readonly perMaterial: number }
  readonly frames: { readonly walk: number }
  /** Direction the light comes **from**, in canvas space (y grows down). Unit vector. */
  readonly light: { readonly x: number; readonly y: number }
  readonly outline: { readonly enabled: boolean; readonly material: string }
  readonly body: { readonly scale: number }
  /** Amplitudes applied to the grammar's normalized track keys. */
  readonly gait: { readonly swing: number; readonly lift: number }
  /** Probability a painted pixel drops one tone. 0 disables the injected RNG entirely. */
  readonly texture: { readonly speckle: number }
  /** Read by the viewer, never by the core. Lives here so it is anchored like any number. */
  readonly playback: { readonly msPerFrame: number; readonly scale: number }
  readonly _anchors: Readonly<Record<string, string>>
}
