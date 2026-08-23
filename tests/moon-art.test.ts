import { describe, expect, it } from 'vitest'
import { PROJECT_ASSETS } from '../src/authoring/catalog.ts'
import { PROJECT_PARAMS } from '../src/authoring/params.ts'
import { compileProject } from '../src/authoring/project.ts'
import { LUNAR_PLACEMENTS } from '../src/game/moon/project.ts'

describe('lunar art direction locks', () => {
  const craters = PROJECT_ASSETS.filter((asset) => asset.id.startsWith('crater-'))

  it('authors craters as terrain depressions rather than outlined rocks', () => {
    expect(craters).toHaveLength(6)
    expect(PROJECT_PARAMS.crater.outline.enabled).toBe(false)
    expect(PROJECT_PARAMS.crater.outline.inner).toBe(true)
    expect(PROJECT_PARAMS.crater.shadow.steps).toBe(0)

    for (const crater of craters) {
      expect(crater.params).toBe(PROJECT_PARAMS.crater)
      expect(crater.grammar.parts.some((part) => part.name === 'cavity' && part.cut === true)).toBe(true)
      expect(crater.grammar.parts.some((part) => part.name === 'sunward-inner-wall' && (part.shift ?? 0) > 0)).toBe(true)
      expect(crater.grammar.parts.some((part) => part.name === 'bowl-floor' && (part.shift ?? 0) <= -3)).toBe(true)
    }
  })

  it('keeps the crater bowl darker than its lit wall in the compiled portable asset', () => {
    const clip = compileProject().clips.find((candidate) => candidate.id === 'crater-c')
    expect(clip).toBeDefined()
    const colors = new Set<number>()
    for (let index = 0; index < clip!.atlas.rgba.length; index += 4) {
      if (clip!.atlas.rgba[index + 3] === 0) continue
      colors.add(
        ((clip!.atlas.rgba[index] as number) << 16) |
        ((clip!.atlas.rgba[index + 1] as number) << 8) |
        (clip!.atlas.rgba[index + 2] as number),
      )
    }
    expect(colors.size).toBeGreaterThanOrEqual(4)
    expect(colors.has((24 << 16) | (22 << 8) | 22)).toBe(true)
    expect(colors.has((178 << 16) | (172 << 8) | 158)).toBe(true)
  })

  it('places generated pixel assets only at integer display scales', () => {
    expect(LUNAR_PLACEMENTS.every((placement) => Number.isInteger(placement.scale))).toBe(true)
  })
})
