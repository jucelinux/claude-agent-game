import type {
  TravelerPoint,
  TravelerPolygon,
  TravelerPose,
} from './modernTraveler.ts'

export const HIEROGLYPH_COLORS = {
  skin: 0xa94f35,
  skinLight: 0xcc7650,
  wig: 0x1d1813,
  linen: 0xe3ce91,
  linenShade: 0xb9985d,
  lapis: 0x245c72,
  gold: 0xd8a43b,
  ink: 0x4a2e1c,
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

const mirror = (points: readonly TravelerPoint[], facing: -1 | 1): TravelerPoint[] =>
  points.map((point) => ({ x: point.x * facing, y: point.y }))

/**
 * A deliberately rigid side-view figure based on the visual grammar of painted reliefs:
 * profile head and limbs, frontal shoulders, flat pigment and angular articulation.
 */
export function buildHieroglyphTravelerPose(pose: TravelerPose): TravelerPolygon[] {
  const facing = pose.facing ?? 1
  const stride = pose.moving ? Math.sin(pose.walkPhase) : 0
  const bob = pose.airborne
    ? 0.02
    : pose.moving
      ? Math.abs(Math.sin(pose.walkPhase * 2)) * 0.012
      : Math.sin(pose.idlePhase * 1.4) * 0.004

  const frontKnee = pose.airborne
    ? { x: 0.22, y: 0.5 }
    : { x: 0.08 + stride * 0.13, y: 0.42 + bob }
  const backKnee = pose.airborne
    ? { x: -0.18, y: 0.55 }
    : { x: -0.08 - stride * 0.13, y: 0.42 + bob }
  const frontFoot = pose.airborne
    ? { x: 0.37, y: 0.3 }
    : { x: 0.14 + stride * 0.27, y: 0.06 }
  const backFoot = pose.airborne
    ? { x: -0.03, y: 0.29 }
    : { x: -0.12 - stride * 0.27, y: 0.06 }
  const armStep = pose.airborne ? 0.08 : stride * 0.1

  const parts: TravelerPolygon[] = [
    segment({ x: -0.04, y: 0.76 + bob }, backKnee, 0.14, HIEROGLYPH_COLORS.skin),
    segment(backKnee, backFoot, 0.11, HIEROGLYPH_COLORS.skin),
    polygon(HIEROGLYPH_COLORS.skin, [
      { x: backFoot.x - 0.04, y: backFoot.y + 0.07 },
      { x: backFoot.x + 0.22, y: backFoot.y + 0.07 },
      { x: backFoot.x + 0.26, y: backFoot.y },
      { x: backFoot.x - 0.04, y: backFoot.y },
    ]),
    segment({ x: 0.03, y: 0.76 + bob }, frontKnee, 0.15, HIEROGLYPH_COLORS.skinLight),
    segment(frontKnee, frontFoot, 0.12, HIEROGLYPH_COLORS.skinLight),
    polygon(HIEROGLYPH_COLORS.skinLight, [
      { x: frontFoot.x - 0.04, y: frontFoot.y + 0.07 },
      { x: frontFoot.x + 0.23, y: frontFoot.y + 0.07 },
      { x: frontFoot.x + 0.28, y: frontFoot.y },
      { x: frontFoot.x - 0.04, y: frontFoot.y },
    ]),

    polygon(HIEROGLYPH_COLORS.linenShade, [
      { x: -0.18, y: 0.86 + bob },
      { x: 0.18, y: 0.86 + bob },
      { x: 0.31, y: 0.48 + bob },
      { x: -0.04, y: 0.61 + bob },
    ]),
    polygon(HIEROGLYPH_COLORS.linen, [
      { x: -0.13, y: 0.87 + bob },
      { x: 0.18, y: 0.86 + bob },
      { x: 0.08, y: 0.58 + bob },
      { x: -0.19, y: 0.67 + bob },
    ]),

    segment(
      { x: -0.17, y: 1.27 + bob },
      { x: -0.34 - armStep, y: 1.02 + bob },
      0.12,
      HIEROGLYPH_COLORS.skin,
    ),
    segment(
      { x: -0.34 - armStep, y: 1.02 + bob },
      { x: -0.18 - armStep, y: 0.82 + bob },
      0.09,
      HIEROGLYPH_COLORS.skin,
    ),
    polygon(HIEROGLYPH_COLORS.skin, [
      { x: -0.23 - armStep, y: 0.86 + bob },
      { x: -0.05 - armStep, y: 0.86 + bob },
      { x: 0.01 - armStep, y: 0.8 + bob },
      { x: -0.2 - armStep, y: 0.79 + bob },
    ]),

    // The broad shoulders intentionally remain frontal while the head stays in profile.
    polygon(HIEROGLYPH_COLORS.skinLight, [
      { x: -0.28, y: 1.34 + bob },
      { x: 0.27, y: 1.34 + bob },
      { x: 0.17, y: 0.85 + bob },
      { x: -0.17, y: 0.85 + bob },
    ]),
    polygon(HIEROGLYPH_COLORS.lapis, [
      { x: -0.25, y: 1.33 + bob },
      { x: 0.24, y: 1.33 + bob },
      { x: 0.14, y: 1.18 + bob },
      { x: -0.14, y: 1.18 + bob },
    ]),
    polygon(HIEROGLYPH_COLORS.gold, [
      { x: -0.19, y: 1.29 + bob },
      { x: 0.2, y: 1.29 + bob },
      { x: 0.15, y: 1.24 + bob },
      { x: -0.15, y: 1.24 + bob },
    ]),

    segment(
      { x: 0.2, y: 1.28 + bob },
      { x: 0.35 + armStep, y: 1.03 + bob },
      0.12,
      HIEROGLYPH_COLORS.skinLight,
    ),
    segment(
      { x: 0.35 + armStep, y: 1.03 + bob },
      { x: 0.57 + armStep, y: 1.08 + bob },
      0.09,
      HIEROGLYPH_COLORS.skinLight,
    ),
    polygon(HIEROGLYPH_COLORS.skinLight, [
      { x: 0.52 + armStep, y: 1.12 + bob },
      { x: 0.69 + armStep, y: 1.12 + bob },
      { x: 0.73 + armStep, y: 1.07 + bob },
      { x: 0.53 + armStep, y: 1.04 + bob },
    ]),

    polygon(HIEROGLYPH_COLORS.wig, [
      { x: -0.19, y: 1.66 + bob },
      { x: -0.1, y: 1.82 + bob },
      { x: 0.12, y: 1.78 + bob },
      { x: 0.16, y: 1.42 + bob },
      { x: -0.16, y: 1.4 + bob },
    ]),
    polygon(HIEROGLYPH_COLORS.skinLight, [
      { x: -0.08, y: 1.72 + bob },
      { x: 0.12, y: 1.75 + bob },
      { x: 0.2, y: 1.65 + bob },
      { x: 0.34, y: 1.6 + bob },
      { x: 0.2, y: 1.54 + bob },
      { x: 0.13, y: 1.41 + bob },
      { x: -0.08, y: 1.45 + bob },
    ]),
    polygon(HIEROGLYPH_COLORS.ink, [
      { x: 0.11, y: 1.67 + bob },
      { x: 0.22, y: 1.67 + bob },
      { x: 0.18, y: 1.63 + bob },
      { x: 0.1, y: 1.64 + bob },
    ]),
    polygon(HIEROGLYPH_COLORS.gold, [
      { x: 0.06, y: 1.45 + bob },
      { x: 0.17, y: 1.45 + bob },
      { x: 0.15, y: 1.37 + bob },
      { x: 0.04, y: 1.38 + bob },
    ]),
  ]

  return parts.map((part) => polygon(part.color, mirror(part.points, facing)))
}
