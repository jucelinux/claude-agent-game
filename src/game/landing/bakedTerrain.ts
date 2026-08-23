export const P66_TERRAIN_DOWNRANGE_FT = [
  900, 925, 950, 975, 1_000, 1_025, 1_050, 1_075,
  1_100, 1_125, 1_150, 1_175, 1_200, 1_225, 1_250, 1_275,
  1_300, 1_325, 1_350, 1_400, 1_450, 1_500, 1_600, 1_800, 2_200,
] as const

export const P66_TERRAIN_ALTITUDE_FT = [
  200, 175, 150, 125, 100, 80, 70, 60, 50, 40, 30, 20, 15, 10, 5, 0,
] as const

export const P66_TERRAIN_FRAME_WIDTH = 352
export const P66_TERRAIN_FRAME_HEIGHT = 198
export const P66_TERRAIN_FRAMES_PER_ATLAS = 16
export const P66_TERRAIN_FRAME_COUNT =
  P66_TERRAIN_DOWNRANGE_FT.length * P66_TERRAIN_ALTITUDE_FT.length
export const P66_TERRAIN_ATLAS_COUNT = Math.ceil(
  P66_TERRAIN_FRAME_COUNT / P66_TERRAIN_FRAMES_PER_ATLAS,
)
export const P66_TERRAIN_ATLAS_KEYS = Array.from(
  { length: P66_TERRAIN_ATLAS_COUNT },
  (_, index) => `p66-terrain-atlas-${String(index).padStart(2, '0')}`,
) as readonly string[]

// Four downrange plates cover the opening seconds of P66. Keeping only this runway in the
// blocking preload makes the first lunar frame available without waiting for the whole descent.
export const P66_TERRAIN_STARTUP_ATLAS_COUNT = 4
export const P66_TERRAIN_STARTUP_ATLAS_KEYS = P66_TERRAIN_ATLAS_KEYS.slice(
  0,
  P66_TERRAIN_STARTUP_ATLAS_COUNT,
) as readonly string[]
export const P66_TERRAIN_DEFERRED_ATLAS_KEYS = P66_TERRAIN_ATLAS_KEYS.slice(
  P66_TERRAIN_STARTUP_ATLAS_COUNT,
) as readonly string[]

export const P66_TERRAIN_DITHER_STEPS = 16
export const P66_TERRAIN_TRANSITION_MS = 280
const P66_TERRAIN_BAYER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
] as const

export type P66TerrainFrame = {
  readonly downrangeIndex: number
  readonly altitudeIndex: number
  readonly absoluteFrame: number
  readonly atlasIndex: number
  readonly atlasFrame: number
  readonly textureKey: string
  readonly referenceDownrangeFt: number
  readonly referenceAltitudeFt: number
}

export type P66TerrainPose = {
  readonly x: number
  readonly y: number
  readonly scale: number
}

const nearestIndex = (samples: readonly number[], value: number): number => {
  let nearest = 0
  let distance = Math.abs(samples[0]! - value)
  for (let index = 1; index < samples.length; index += 1) {
    const candidate = Math.abs(samples[index]! - value)
    if (candidate < distance) {
      nearest = index
      distance = candidate
    }
  }
  return nearest
}

/**
 * Selects one palette-locked render from the authored two-dimensional flight-state grid.
 * No interpolation is used: blended colors would violate the 16-bit pixel contract.
 */
export const getP66TerrainFrame = (downrangeFt: number, altitudeFt: number): P66TerrainFrame => {
  const downrangeIndex = nearestIndex(P66_TERRAIN_DOWNRANGE_FT, downrangeFt)
  const altitudeIndex = nearestIndex(P66_TERRAIN_ALTITUDE_FT, altitudeFt)
  const absoluteFrame = downrangeIndex * P66_TERRAIN_ALTITUDE_FT.length + altitudeIndex
  const atlasIndex = Math.floor(absoluteFrame / 16)
  const atlasFrame = absoluteFrame % 16
  return {
    downrangeIndex,
    altitudeIndex,
    absoluteFrame,
    atlasIndex,
    atlasFrame,
    textureKey: P66_TERRAIN_ATLAS_KEYS[atlasIndex]!,
    referenceDownrangeFt: P66_TERRAIN_DOWNRANGE_FT[downrangeIndex]!,
    referenceAltitudeFt: P66_TERRAIN_ALTITUDE_FT[altitudeIndex]!,
  }
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value))

/**
 * Reprojects a nearby baked view with pixel-snapped motion while the simulation moves between
 * authored states. This is a scene-specific presentation correction, not a second terrain model.
 */
export const getP66TerrainPose = (
  frame: P66TerrainFrame,
  downrangeFt: number,
  altitudeFt: number,
): P66TerrainPose => {
  const downrangeDelta = downrangeFt - frame.referenceDownrangeFt
  const descentDelta = frame.referenceAltitudeFt - altitudeFt
  const zoom = clamp(1 + downrangeDelta * 0.0048 + descentDelta * 0.0014, 0.94, 1.06)
  const displayScale = Math.round(3 * zoom * 64) / 64
  const verticalOverscan = Math.max(
    0,
    Math.floor((P66_TERRAIN_FRAME_HEIGHT * displayScale - 540) / 2),
  )
  const displayYOffset = clamp(
    Math.round(downrangeDelta * 0.96 - descentDelta * 1.68),
    -verticalOverscan,
    verticalOverscan,
  )
  return {
    x: 480,
    y: 270 + displayYOffset,
    scale: displayScale,
  }
}

export const getP66TerrainDitherStep = (elapsedMs: number): number =>
  clamp(
    Math.round((elapsedMs / P66_TERRAIN_TRANSITION_MS) * P66_TERRAIN_DITHER_STEPS),
    0,
    P66_TERRAIN_DITHER_STEPS,
  )

/** Returns a binary mask decision: transition pixels never become blended colors. */
export const isP66TerrainDitherPixelVisible = (x: number, y: number, step: number): boolean =>
  P66_TERRAIN_BAYER_4X4[((y % 4 + 4) % 4) * 4 + ((x % 4 + 4) % 4)]!
    < clamp(Math.round(step), 0, P66_TERRAIN_DITHER_STEPS)
