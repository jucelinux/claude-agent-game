import { describe, expect, it } from 'vitest'
import { PROTOTYPES, resolvePrototypeId } from '../src/ui/prototypes.ts'

describe('prototype catalog', () => {
  it('contains only the active pyramid prototype', () => {
    expect(PROTOTYPES).toHaveLength(1)
    expect(PROTOTYPES[0]?.id).toBe('pyramid-glyph-prototype')
  })

  it('accepts known deep links and rejects unknown ones', () => {
    expect(resolvePrototypeId('pyramid-glyph-prototype')).toBe('pyramid-glyph-prototype')
    expect(resolvePrototypeId('archived-prototype')).toBeNull()
    expect(resolvePrototypeId(null)).toBeNull()
  })
})
