import { describe, expect, it } from 'vitest'
import {
  buildRearTravelerPose,
  buildSideTravelerPose,
  TRAVELER_COLORS,
} from '../src/game/character/modernTraveler.ts'
import {
  buildHieroglyphTravelerPose,
  HIEROGLYPH_COLORS,
} from '../src/game/character/hieroglyphTraveler.ts'

const WALKING_POSE = {
  walkPhase: 1.25,
  idlePhase: 0.5,
  moving: true,
} as const

describe('modern traveler procedural character', () => {
  it('builds deterministic rear-view polygons with the approved outfit palette', () => {
    const first = buildRearTravelerPose(WALKING_POSE)
    const second = buildRearTravelerPose(WALKING_POSE)
    const colors = new Set(first.map((part) => part.color))

    expect(first).toEqual(second)
    expect(colors).toContain(TRAVELER_COLORS.shirt)
    expect(colors).toContain(TRAVELER_COLORS.denim)
    expect(colors).toContain(TRAVELER_COLORS.skinLight)
    expect(colors).toContain(TRAVELER_COLORS.hair)
  })

  it('mirrors the side-view pose without changing its materials', () => {
    const right = buildSideTravelerPose({ ...WALKING_POSE, facing: 1 })
    const left = buildSideTravelerPose({ ...WALKING_POSE, facing: -1 })

    expect(left.map((part) => part.color)).toEqual(right.map((part) => part.color))
    expect(left).toHaveLength(right.length)
    for (let partIndex = 0; partIndex < right.length; partIndex += 1) {
      const rightPart = right[partIndex]
      const leftPart = left[partIndex]
      expect(leftPart?.points).toHaveLength(rightPart?.points.length ?? 0)
      for (let pointIndex = 0; pointIndex < (rightPart?.points.length ?? 0); pointIndex += 1) {
        expect(leftPart?.points[pointIndex]?.x).toBeCloseTo(-(rightPart?.points[pointIndex]?.x ?? 0))
        expect(leftPart?.points[pointIndex]?.y).toBeCloseTo(rightPart?.points[pointIndex]?.y ?? 0)
      }
    }
  })
})

describe('hieroglyph traveler procedural character', () => {
  it('uses flat Egyptian pigments and remains deterministic', () => {
    const first = buildHieroglyphTravelerPose({ ...WALKING_POSE, facing: 1 })
    const second = buildHieroglyphTravelerPose({ ...WALKING_POSE, facing: 1 })
    const colors = new Set(first.map((part) => part.color))

    expect(first).toEqual(second)
    expect(colors).toContain(HIEROGLYPH_COLORS.skinLight)
    expect(colors).toContain(HIEROGLYPH_COLORS.wig)
    expect(colors).toContain(HIEROGLYPH_COLORS.lapis)
    expect(colors).toContain(HIEROGLYPH_COLORS.gold)
  })

  it('mirrors the painted profile for either travel direction', () => {
    const right = buildHieroglyphTravelerPose({ ...WALKING_POSE, facing: 1 })
    const left = buildHieroglyphTravelerPose({ ...WALKING_POSE, facing: -1 })

    for (let partIndex = 0; partIndex < right.length; partIndex += 1) {
      const rightPart = right[partIndex]
      const leftPart = left[partIndex]
      expect(leftPart?.color).toBe(rightPart?.color)
      for (let pointIndex = 0; pointIndex < (rightPart?.points.length ?? 0); pointIndex += 1) {
        expect(leftPart?.points[pointIndex]?.x).toBeCloseTo(-(rightPart?.points[pointIndex]?.x ?? 0))
        expect(leftPart?.points[pointIndex]?.y).toBeCloseTo(rightPart?.points[pointIndex]?.y ?? 0)
      }
    }
  })
})
