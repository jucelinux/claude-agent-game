export type GuardianMood = 'watching' | 'enraged' | 'defeated'

export type GuardianPoint = {
  readonly x: number
  readonly y: number
}

export type GuardianPolygon = {
  readonly color: number
  readonly alpha?: number
  readonly points: readonly GuardianPoint[]
}

export const GUARDIAN_COLORS = {
  skin: 0xad5035,
  skinLight: 0xd2784e,
  linen: 0xe5ce91,
  linenShade: 0xb8975f,
  wig: 0x211914,
  ink: 0x53321e,
  lapis: 0x245a70,
  turquoise: 0x2f8277,
  gold: 0xdbaa43,
  rage: 0x9d3027,
  eye: 0xf0dca6,
} as const

const polygon = (
  color: number,
  points: readonly GuardianPoint[],
  alpha?: number,
): GuardianPolygon => ({ color, points, alpha })

const rectangle = (
  color: number,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha?: number,
): GuardianPolygon => polygon(color, [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
], alpha)

function segment(
  start: GuardianPoint,
  end: GuardianPoint,
  width: number,
  color: number,
  alpha?: number,
): GuardianPolygon {
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
  ], alpha)
}

/** A large painted deity, authored in screen-space pixels for the 320×180 glyph scenes. */
export function buildEgyptianGuardian(
  mood: GuardianMood,
  gaze: number,
): GuardianPolygon[] {
  const pupilShift = Math.max(-1, Math.min(1, gaze)) * 2
  const angry = mood === 'enraged'
  const subdued = mood === 'defeated' ? 0.58 : 1
  const skin = angry ? GUARDIAN_COLORS.skin : GUARDIAN_COLORS.skinLight
  const parts: GuardianPolygon[] = []

  if (angry) {
    parts.push(polygon(GUARDIAN_COLORS.rage, [
      { x: -18, y: -70 },
      { x: 18, y: -70 },
      { x: 28, y: 28 },
      { x: -30, y: 28 },
    ], 0.16))
  }

  // One monumental wing reaches across the playable mural.
  parts.push(polygon(GUARDIAN_COLORS.linen, [
    { x: -8, y: -27 },
    { x: -35, y: -40 },
    { x: -78, y: -34 },
    { x: -132, y: -12 },
    { x: -110, y: 5 },
    { x: -58, y: 8 },
    { x: -18, y: 2 },
  ], subdued))
  parts.push(polygon(GUARDIAN_COLORS.linenShade, [
    { x: -12, y: -23 },
    { x: -48, y: -30 },
    { x: -119, y: -8 },
    { x: -104, y: 1 },
    { x: -52, y: 2 },
  ], subdued))
  for (let index = 0; index < 9; index += 1) {
    const x = -111 + index * 10
    const top = -12 - index * 1.7
    parts.push(polygon(
      index % 3 === 0
        ? GUARDIAN_COLORS.lapis
        : index % 3 === 1
          ? GUARDIAN_COLORS.gold
          : GUARDIAN_COLORS.skin,
      [
        { x, y: top },
        { x: x + 5, y: top - 2 },
        { x: x + 13, y: 2 },
        { x: x + 7, y: 3 },
      ],
      subdued * 0.9,
    ))
  }

  // Throne, seated legs and patterned linen.
  parts.push(rectangle(GUARDIAN_COLORS.ink, 8, -8, 34, 45, subdued))
  parts.push(rectangle(GUARDIAN_COLORS.gold, 12, -3, 26, 4, subdued))
  parts.push(rectangle(GUARDIAN_COLORS.lapis, 13, 5, 24, 24, subdued))
  for (let y = 7; y < 29; y += 7) {
    parts.push(rectangle(GUARDIAN_COLORS.linen, 15, y, 20, 3, subdued))
  }
  parts.push(segment({ x: 1, y: -2 }, { x: -3, y: 25 }, 11, skin, subdued))
  parts.push(segment({ x: -3, y: 25 }, { x: -23, y: 27 }, 8, skin, subdued))
  parts.push(rectangle(skin, -28, 25, 27, 6, subdued))
  parts.push(polygon(GUARDIAN_COLORS.linen, [
    { x: -13, y: -29 },
    { x: 12, y: -27 },
    { x: 17, y: 5 },
    { x: -8, y: 6 },
  ], subdued))
  parts.push(polygon(GUARDIAN_COLORS.lapis, [
    { x: -11, y: -24 },
    { x: 11, y: -23 },
    { x: 13, y: -16 },
    { x: -9, y: -17 },
  ], subdued))
  parts.push(rectangle(GUARDIAN_COLORS.gold, -7, -14, 20, 3, subdued))

  // Angular arms hold a staff-like pose over the wing.
  parts.push(segment({ x: -7, y: -25 }, { x: -29, y: -9 }, 8, skin, subdued))
  parts.push(segment({ x: -29, y: -9 }, { x: -55, y: -13 }, 7, skin, subdued))
  parts.push(rectangle(skin, -62, -16, 10, 6, subdued))
  parts.push(segment({ x: 8, y: -25 }, { x: 20, y: -9 }, 8, GUARDIAN_COLORS.skin, subdued))
  parts.push(segment({ x: 20, y: -9 }, { x: 17, y: 10 }, 7, GUARDIAN_COLORS.skin, subdued))

  // Black wig, profile face, solar crown and jewelry.
  parts.push(polygon(GUARDIAN_COLORS.wig, [
    { x: -10, y: -59 },
    { x: 4, y: -62 },
    { x: 14, y: -51 },
    { x: 14, y: -25 },
    { x: -8, y: -28 },
    { x: -15, y: -45 },
  ], subdued))
  parts.push(polygon(skin, [
    { x: -9, y: -57 },
    { x: 5, y: -58 },
    { x: 8, y: -51 },
    { x: -3, y: -48 },
    { x: -12, y: -43 },
    { x: -5, y: -39 },
    { x: 5, y: -41 },
    { x: 8, y: -31 },
    { x: -8, y: -31 },
    { x: -13, y: -47 },
  ], subdued))
  parts.push(polygon(GUARDIAN_COLORS.lapis, [
    { x: -13, y: -35 },
    { x: 10, y: -36 },
    { x: 15, y: -27 },
    { x: -9, y: -27 },
  ], subdued))
  parts.push(rectangle(GUARDIAN_COLORS.gold, -7, -67, 11, 8, subdued))
  parts.push(polygon(GUARDIAN_COLORS.gold, [
    { x: -7, y: -67 },
    { x: -2, y: -80 },
    { x: 4, y: -67 },
  ], subdued))
  parts.push(polygon(angry ? GUARDIAN_COLORS.rage : GUARDIAN_COLORS.gold, [
    { x: -3, y: -80 },
    { x: 3, y: -80 },
    { x: 8, y: -75 },
    { x: 3, y: -70 },
    { x: -3, y: -70 },
    { x: -8, y: -75 },
  ], subdued))

  // The only continuously changing detail is the eye, which follows the player.
  parts.push(polygon(GUARDIAN_COLORS.eye, [
    { x: -9, y: -52 },
    { x: 1, y: -54 },
    { x: 4, y: -51 },
    { x: -5, y: -49 },
  ], subdued))
  parts.push(rectangle(
    angry ? GUARDIAN_COLORS.rage : GUARDIAN_COLORS.ink,
    -5 + pupilShift,
    -53,
    3,
    4,
    subdued,
  ))
  parts.push(segment(
    { x: -10, y: angry ? -56 : -55 },
    { x: 3, y: angry ? -59 : -55 },
    angry ? 3 : 1.5,
    angry ? GUARDIAN_COLORS.rage : GUARDIAN_COLORS.ink,
    subdued,
  ))
  parts.push(segment(
    { x: -10, y: -42 },
    { x: 1, y: angry ? -45 : -42 },
    angry ? 2.5 : 1.5,
    angry ? GUARDIAN_COLORS.rage : GUARDIAN_COLORS.ink,
    subdued,
  ))

  return parts
}
