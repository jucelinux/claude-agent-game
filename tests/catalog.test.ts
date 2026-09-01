import { describe, expect, it } from 'vitest'
import {
  PROTOTYPES,
  PROTOTYPE_MATURITY_LABELS,
  resolvePrototypeId,
} from '../src/ui/prototypes.ts'

describe('prototype catalog', () => {
  it('contains every user-approved Babylon prototype', () => {
    expect(PROTOTYPES.map((prototype) => prototype.id)).toEqual([
      'tokyo-neon-89',
    ])
  })

  it('keeps the target-driven but unreviewed render at art-pass maturity', () => {
    expect(PROTOTYPES).toContainEqual(expect.objectContaining({
      id: 'tokyo-neon-89',
      maturity: 'art-pass',
    }))
    expect(PROTOTYPE_MATURITY_LABELS['art-pass']).toBe('Art pass')
    expect(PROTOTYPES.filter((prototype) => prototype.maturity === 'review-candidate')).toEqual([])
    expect(PROTOTYPES.filter((prototype) => prototype.maturity === 'approved')).toEqual([])
  })

  it('accepts known deep links and rejects unknown ones', () => {
    expect(resolvePrototypeId('tokyo-neon-89')).toBe('tokyo-neon-89')
    expect(resolvePrototypeId('new-project-prototype')).toBeNull()
    expect(resolvePrototypeId('ashfall-prototype')).toBeNull()
    expect(resolvePrototypeId('sunlit-earth-prototype')).toBeNull()
    expect(resolvePrototypeId('pyramid-glyph-prototype')).toBeNull()
    expect(resolvePrototypeId(null)).toBeNull()
  })
})
