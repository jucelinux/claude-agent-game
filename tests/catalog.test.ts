import { describe, expect, it } from 'vitest'
import { PROTOTYPES, resolvePrototypeId } from '../src/ui/prototypes.ts'

describe('prototype catalog', () => {
  it('contains every user-approved Babylon prototype', () => {
    expect(PROTOTYPES.map((prototype) => prototype.id)).toEqual([
      'ashfall-prototype',
      'sunlit-earth-prototype',
    ])
  })

  it('accepts known deep links and rejects unknown ones', () => {
    expect(resolvePrototypeId('ashfall-prototype')).toBe('ashfall-prototype')
    expect(resolvePrototypeId('sunlit-earth-prototype')).toBe('sunlit-earth-prototype')
    expect(resolvePrototypeId('pyramid-glyph-prototype')).toBeNull()
    expect(resolvePrototypeId('archived-prototype')).toBeNull()
    expect(resolvePrototypeId(null)).toBeNull()
  })
})
