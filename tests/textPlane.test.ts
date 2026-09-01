import { describe, expect, it } from 'vitest'
import {
  getProjectingSignCenterX,
  getTextPlaneOrientation,
  PROJECTING_SIGN_CLEARANCE,
  SIGN_FRAME_MARGIN,
  TEXT_TEXTURE_INVERT_Y,
  type TextPlaneFacing,
} from '../src/game/tokyoNeon/textPlane.ts'

const EXPECTED_FRONT: Readonly<Record<TextPlaneFacing, readonly [number, number]>> = {
  east: [1, 0],
  west: [-1, 0],
  north: [0, 1],
  south: [0, -1],
}

describe('Tokyo Neon text planes', () => {
  it('uploads authored canvas text without turning it upside down', () => {
    expect(TEXT_TEXTURE_INVERT_Y).toBe(true)
  })

  it('turns the readable front toward the intended viewer instead of exposing mirrored backs', () => {
    for (const facing of Object.keys(EXPECTED_FRONT) as TextPlaneFacing[]) {
      const orientation = getTextPlaneOrientation(facing, 0.17)
      const expected = EXPECTED_FRONT[facing]
      expect(orientation.frontX).toBeCloseTo(expected[0], 8)
      expect(orientation.frontZ).toBeCloseTo(expected[1], 8)
    }
  })

  it('offsets the readable surface toward that same viewer side', () => {
    for (const facing of Object.keys(EXPECTED_FRONT) as TextPlaneFacing[]) {
      const orientation = getTextPlaneOrientation(facing, 0.17)
      expect(orientation.offsetX).toBeCloseTo(orientation.frontX * 0.17, 8)
      expect(orientation.offsetZ).toBeCloseTo(orientation.frontZ * 0.17, 8)
    }
  })

  it('keeps the complete frame of projecting signs outside either alley wall', () => {
    const signWidth = 4.5
    const halfFramedWidth = (signWidth + SIGN_FRAME_MARGIN) / 2
    const leftWallX = -3.5
    const rightWallX = 3.5
    const leftCenter = getProjectingSignCenterX(leftWallX, signWidth, 'left')
    const rightCenter = getProjectingSignCenterX(rightWallX, signWidth, 'right')

    expect(leftCenter - halfFramedWidth).toBeCloseTo(leftWallX + PROJECTING_SIGN_CLEARANCE, 8)
    expect(rightCenter + halfFramedWidth).toBeCloseTo(rightWallX - PROJECTING_SIGN_CLEARANCE, 8)
  })
})
