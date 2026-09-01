export type TextPlaneFacing = 'east' | 'west' | 'north' | 'south'
export type ProjectingSignSide = 'left' | 'right'

/** Babylon DynamicTextures need their canvas upload inverted to keep authored text upright. */
export const TEXT_TEXTURE_INVERT_Y = true
export const SIGN_FRAME_MARGIN = 0.16
export const PROJECTING_SIGN_CLEARANCE = 0.12

export type TextPlaneOrientation = {
  readonly rotationY: number
  readonly offsetX: number
  readonly offsetZ: number
  readonly frontX: number
  readonly frontZ: number
}

/**
 * Babylon planes face local -Z. This maps the readable front of a text plane toward the named
 * viewer side and offsets that front away from its backing frame.
 */
export function getTextPlaneOrientation(
  facing: TextPlaneFacing,
  surfaceOffset: number,
): TextPlaneOrientation {
  const rotationY = {
    east: -Math.PI / 2,
    west: Math.PI / 2,
    north: Math.PI,
    south: 0,
  }[facing]
  const frontX = -Math.sin(rotationY)
  const frontZ = -Math.cos(rotationY)
  return {
    rotationY,
    offsetX: frontX * surfaceOffset,
    offsetZ: frontZ * surfaceOffset,
    frontX,
    frontZ,
  }
}

/**
 * Places a sign that projects across an alley with its complete frame outside the wall volume.
 */
export function getProjectingSignCenterX(
  wallX: number,
  signWidth: number,
  side: ProjectingSignSide,
  frameMargin = SIGN_FRAME_MARGIN,
  clearance = PROJECTING_SIGN_CLEARANCE,
): number {
  const halfFramedWidth = (signWidth + frameMargin) / 2
  const direction = side === 'left' ? 1 : -1
  return wallX + direction * (halfFramedWidth + clearance)
}
