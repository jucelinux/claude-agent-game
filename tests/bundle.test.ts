import { describe, expect, it } from 'vitest'
import { compileProject, PROJECT_ID, PROJECT_SEED } from '../src/authoring/project.ts'

describe('portable bundle contract', () => {
  it('builds the active project bundle', () => {
    const bundle = compileProject()

    expect(bundle).toMatchObject({
      format: 'agent-game-bundle',
      version: 1,
      project: PROJECT_ID,
      seed: PROJECT_SEED,
    })
    expect(bundle.project).toBe('tokyo-neon-89')
    expect(bundle.checksum).toMatch(/^[0-9a-f]{8}$/)
  })

  it('keeps the active bundle deterministic', () => {
    expect(compileProject()).toEqual(compileProject())
  })

  it('keeps the Babylon-authored environment outside the raster bundle', () => {
    const bundle = compileProject('tokyo-neon-89')

    expect(bundle.clips).toEqual([])
    expect(bundle).toEqual(compileProject())
  })
})
