import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { VISUAL_REVIEW_SCENARIOS } from '../scripts/visual/review-scenarios.ts'
import { PROTOTYPES } from '../src/ui/prototypes.ts'

describe('visual direction gate', () => {
  it('gives every catalog prototype a maturity-aligned brief and review scenario', async () => {
    for (const prototype of PROTOTYPES) {
      const brief = await readFile(path.resolve(prototype.visualBrief), 'utf8')
      expect(brief).toContain(`- Prototype ID: \`${prototype.id}\``)
      expect(brief).toContain(`- Maturity: \`${prototype.maturity}\``)

      const scenario = VISUAL_REVIEW_SCENARIOS.find(
        (candidate) => candidate.prototypeId === prototype.id,
      )
      expect(scenario).toMatchObject({
        maturity: prototype.maturity,
        brief: prototype.visualBrief,
      })
      expect(scenario?.views).toHaveLength(5)
    }
  })

  it('does not infer visual approval from a working scene', async () => {
    const tokyo = PROTOTYPES.find((prototype) => prototype.id === 'tokyo-neon-89')
    expect(tokyo?.maturity).toBe('art-pass')
    expect(tokyo?.format).toContain('PS1')
    if (tokyo === undefined) throw new Error('Tokyo Neon brief contract is missing')

    const brief = await readFile(path.resolve(tokyo.visualBrief), 'utf8')
    expect(brief).toContain('Target-frame approval: approved')
    expect(brief).toContain('Rendered-result approval: not approved')
    expect(brief).toMatch(/PS1\s+visual grammar/)
  })
})
