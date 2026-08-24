export type TravelerPoint = {
  readonly x: number
  readonly y: number
}

export type TravelerPolygon = {
  readonly color: number
  readonly points: readonly TravelerPoint[]
}

export type TravelerPose = {
  readonly walkPhase: number
  readonly idlePhase: number
  readonly moving: boolean
  readonly airborne?: boolean
  readonly facing?: -1 | 1
}

export const TRAVELER_HEIGHT = 1.7

export const TRAVELER_COLORS = {
  shirt: 0x111315,
  shirtLight: 0x292b2c,
  denimDark: 0x18354e,
  denim: 0x285777,
  denimLight: 0x477895,
  skin: 0xb97855,
  skinLight: 0xd7a078,
  hair: 0x211915,
  shoe: 0x202427,
} as const

const polygon = (color: number, points: readonly TravelerPoint[]): TravelerPolygon => ({
  color,
  points,
})

function segment(
  start: TravelerPoint,
  end: TravelerPoint,
  width: number,
  color: number,
): TravelerPolygon {
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  const length = Math.hypot(deltaX, deltaY) || 1
  const normalX = (-deltaY / length) * width * 0.5
  const normalY = (deltaX / length) * width * 0.5
  return polygon(color, [
    { x: start.x + normalX, y: start.y + normalY },
    { x: end.x + normalX, y: end.y + normalY },
    { x: end.x - normalX, y: end.y - normalY },
    { x: start.x - normalX, y: start.y - normalY },
  ])
}

function shoe(x: number, y: number, facing: -1 | 1 = 1): TravelerPolygon {
  return polygon(TRAVELER_COLORS.shoe, [
    { x: x - 0.07 * facing, y: y + 0.1 },
    { x: x + 0.08 * facing, y: y + 0.1 },
    { x: x + 0.13 * facing, y: y + 0.025 },
    { x: x - 0.07 * facing, y: y + 0.025 },
  ])
}

function rearHead(bob: number): TravelerPolygon[] {
  return [
    polygon(TRAVELER_COLORS.skinLight, [
      { x: -0.16, y: 1.39 + bob },
      { x: -0.19, y: 1.53 + bob },
      { x: -0.13, y: 1.67 + bob },
      { x: 0, y: 1.71 + bob },
      { x: 0.13, y: 1.67 + bob },
      { x: 0.19, y: 1.53 + bob },
      { x: 0.16, y: 1.39 + bob },
    ]),
    polygon(TRAVELER_COLORS.hair, [
      { x: -0.18, y: 1.54 + bob },
      { x: -0.13, y: 1.68 + bob },
      { x: 0, y: 1.72 + bob },
      { x: 0.14, y: 1.67 + bob },
      { x: 0.18, y: 1.55 + bob },
      { x: 0.08, y: 1.6 + bob },
      { x: -0.07, y: 1.6 + bob },
    ]),
  ]
}

export function buildRearTravelerPose(pose: TravelerPose): TravelerPolygon[] {
  const stride = pose.moving ? Math.sin(pose.walkPhase) : 0
  const bob = pose.moving
    ? Math.abs(Math.sin(pose.walkPhase * 2)) * 0.025
    : Math.sin(pose.idlePhase * 1.7) * 0.008
  const armSwing = stride * 0.09
  const leftHip = { x: -0.11, y: 0.82 + bob }
  const rightHip = { x: 0.11, y: 0.82 + bob }
  const leftKnee = { x: -0.12 + stride * 0.04, y: 0.43 + bob * 0.5 }
  const rightKnee = { x: 0.12 - stride * 0.04, y: 0.43 + bob * 0.5 }
  const leftFoot = { x: -0.13 - stride * 0.15, y: 0.04 }
  const rightFoot = { x: 0.13 + stride * 0.15, y: 0.04 }

  return [
    segment(rightHip, rightKnee, 0.18, TRAVELER_COLORS.denimDark),
    segment(rightKnee, rightFoot, 0.15, TRAVELER_COLORS.denimDark),
    shoe(rightFoot.x, 0),
    segment({ x: 0.25, y: 1.28 + bob }, { x: 0.32 - armSwing, y: 0.98 + bob }, 0.15, TRAVELER_COLORS.shirt),
    segment({ x: 0.32 - armSwing, y: 0.98 + bob }, { x: 0.29 - armSwing, y: 0.72 + bob }, 0.11, TRAVELER_COLORS.skin),
    segment(leftHip, leftKnee, 0.18, TRAVELER_COLORS.denim),
    segment(leftKnee, leftFoot, 0.15, TRAVELER_COLORS.denimLight),
    shoe(leftFoot.x, 0, -1),
    polygon(TRAVELER_COLORS.shirt, [
      { x: -0.29, y: 1.31 + bob },
      { x: 0.29, y: 1.31 + bob },
      { x: 0.22, y: 0.8 + bob },
      { x: -0.22, y: 0.8 + bob },
    ]),
    polygon(TRAVELER_COLORS.shirtLight, [
      { x: -0.03, y: 1.28 + bob },
      { x: 0.18, y: 1.24 + bob },
      { x: 0.14, y: 0.84 + bob },
      { x: 0.02, y: 0.82 + bob },
    ]),
    segment({ x: -0.25, y: 1.28 + bob }, { x: -0.32 + armSwing, y: 0.98 + bob }, 0.15, TRAVELER_COLORS.shirt),
    segment({ x: -0.32 + armSwing, y: 0.98 + bob }, { x: -0.29 + armSwing, y: 0.72 + bob }, 0.11, TRAVELER_COLORS.skinLight),
    ...rearHead(bob),
  ]
}

function mirrored(points: readonly TravelerPoint[], facing: -1 | 1): TravelerPoint[] {
  return points.map((point) => ({ x: point.x * facing, y: point.y }))
}

export function buildSideTravelerPose(pose: TravelerPose): TravelerPolygon[] {
  const facing = pose.facing ?? 1
  const stride = pose.moving ? Math.sin(pose.walkPhase) : 0
  const bob = pose.airborne
    ? 0
    : pose.moving
      ? Math.abs(Math.sin(pose.walkPhase * 2)) * 0.025
      : Math.sin(pose.idlePhase * 1.7) * 0.008
  const leftHip = { x: -0.02, y: 0.82 + bob }
  const rightHip = { x: 0.05, y: 0.82 + bob }
  const leftKnee = pose.airborne
    ? { x: 0.17, y: 0.54 }
    : { x: stride * 0.12, y: 0.43 + bob * 0.5 }
  const rightKnee = pose.airborne
    ? { x: -0.15, y: 0.5 }
    : { x: -stride * 0.12, y: 0.43 + bob * 0.5 }
  const leftFoot = pose.airborne
    ? { x: 0.29, y: 0.3 }
    : { x: stride * 0.28, y: 0.04 }
  const rightFoot = pose.airborne
    ? { x: -0.03, y: 0.25 }
    : { x: -stride * 0.28, y: 0.04 }
  const armSwing = pose.airborne ? -0.08 : stride * -0.18
  const parts = [
    segment(rightHip, rightKnee, 0.17, TRAVELER_COLORS.denimDark),
    segment(rightKnee, rightFoot, 0.14, TRAVELER_COLORS.denimDark),
    shoe(rightFoot.x, rightFoot.y - 0.03),
    segment({ x: 0.02, y: 1.25 + bob }, { x: -0.1 + armSwing, y: 0.96 + bob }, 0.14, TRAVELER_COLORS.shirt),
    segment({ x: -0.1 + armSwing, y: 0.96 + bob }, { x: -0.03 + armSwing, y: 0.71 + bob }, 0.1, TRAVELER_COLORS.skin),
    segment(leftHip, leftKnee, 0.18, TRAVELER_COLORS.denim),
    segment(leftKnee, leftFoot, 0.15, TRAVELER_COLORS.denimLight),
    shoe(leftFoot.x, leftFoot.y - 0.03),
    polygon(TRAVELER_COLORS.shirt, [
      { x: -0.18, y: 1.31 + bob },
      { x: 0.18, y: 1.28 + bob },
      { x: 0.14, y: 0.8 + bob },
      { x: -0.13, y: 0.8 + bob },
    ]),
    polygon(TRAVELER_COLORS.shirtLight, [
      { x: 0.07, y: 1.27 + bob },
      { x: 0.18, y: 1.2 + bob },
      { x: 0.13, y: 0.83 + bob },
      { x: 0.05, y: 0.82 + bob },
    ]),
    segment({ x: 0.12, y: 1.25 + bob }, { x: 0.2 - armSwing, y: 0.98 + bob }, 0.14, TRAVELER_COLORS.shirt),
    segment({ x: 0.2 - armSwing, y: 0.98 + bob }, { x: 0.18 - armSwing, y: 0.73 + bob }, 0.1, TRAVELER_COLORS.skinLight),
    polygon(TRAVELER_COLORS.skinLight, [
      { x: -0.13, y: 1.38 + bob },
      { x: -0.16, y: 1.57 + bob },
      { x: -0.07, y: 1.69 + bob },
      { x: 0.1, y: 1.67 + bob },
      { x: 0.17, y: 1.58 + bob },
      { x: 0.22, y: 1.54 + bob },
      { x: 0.12, y: 1.48 + bob },
      { x: 0.1, y: 1.38 + bob },
    ]),
    polygon(TRAVELER_COLORS.hair, [
      { x: -0.15, y: 1.55 + bob },
      { x: -0.08, y: 1.69 + bob },
      { x: 0.1, y: 1.68 + bob },
      { x: 0.16, y: 1.59 + bob },
      { x: 0.05, y: 1.6 + bob },
      { x: -0.08, y: 1.59 + bob },
    ]),
  ]

  return parts.map((part) => polygon(part.color, mirrored(part.points, facing)))
}
