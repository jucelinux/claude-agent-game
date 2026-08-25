import { describe, expect, it } from 'vitest'
import { PROTOTYPES, resolvePrototypeId } from '../src/ui/prototypes.ts'

describe('prototype catalog', () => {
  it('contains the active pyramid and post-apocalyptic prototypes', () => {
    expect(PROTOTYPES.map((prototype) => prototype.id)).toEqual([
      'pyramid-glyph-prototype',
      'ashfall-prototype',
    ])
  })

  it('accepts known deep links and rejects unknown ones', () => {
    expect(resolvePrototypeId('pyramid-glyph-prototype')).toBe('pyramid-glyph-prototype')
    expect(resolvePrototypeId('ashfall-prototype')).toBe('ashfall-prototype')
    expect(resolvePrototypeId('archived-prototype')).toBeNull()
    expect(resolvePrototypeId(null)).toBeNull()
  })
})
