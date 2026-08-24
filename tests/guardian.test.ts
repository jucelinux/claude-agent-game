import { describe, expect, it } from 'vitest'
import {
  buildEgyptianGuardian,
  GUARDIAN_COLORS,
} from '../src/game/glyph/egyptianGuardian.ts'

describe('Egyptian guardian procedural figure', () => {
  it('is deterministic and contains the monumental wing palette', () => {
    const first = buildEgyptianGuardian('watching', -0.5)
    const second = buildEgyptianGuardian('watching', -0.5)
    const colors = new Set(first.map((part) => part.color))

    expect(first).toEqual(second)
    expect(colors).toContain(GUARDIAN_COLORS.linen)
    expect(colors).toContain(GUARDIAN_COLORS.lapis)
    expect(colors).toContain(GUARDIAN_COLORS.gold)
    expect(first.length).toBeGreaterThan(30)
  })

  it('changes expression when the vessel enrages it', () => {
    const watching = buildEgyptianGuardian('watching', 0)
    const enraged = buildEgyptianGuardian('enraged', 0)

    expect(enraged).not.toEqual(watching)
    expect(enraged.some((part) => part.color === GUARDIAN_COLORS.rage)).toBe(true)
  })

  it('moves its painted pupil with the player', () => {
    const lookingLeft = buildEgyptianGuardian('watching', -1)
    const lookingRight = buildEgyptianGuardian('watching', 1)

    expect(lookingLeft).not.toEqual(lookingRight)
  })
})
