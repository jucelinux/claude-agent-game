import { describe, expect, it } from 'vitest'
import { PROTOTYPES, resolvePrototypeId } from '../src/ui/prototypes.ts'

describe('prototype catalog', () => {
  it('contains every user-approved Babylon prototype', () => {
    expect(PROTOTYPES.map((prototype) => prototype.id)).toEqual([
      'lcd-platformer-prototype',
    ])
  })

  it('accepts known deep links and rejects unknown ones', () => {
    expect(resolvePrototypeId('lcd-platformer-prototype')).toBe('lcd-platformer-prototype')
    expect(resolvePrototypeId('new-project-prototype')).toBeNull()
    expect(resolvePrototypeId('ashfall-prototype')).toBeNull()
    expect(resolvePrototypeId('sunlit-earth-prototype')).toBeNull()
    expect(resolvePrototypeId('pyramid-glyph-prototype')).toBeNull()
    expect(resolvePrototypeId(null)).toBeNull()
  })
})
