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
    expect(bundle.project).toBe('new-project-prototype')
    expect(bundle.checksum).toMatch(/^[0-9a-f]{8}$/)
  })

  it('keeps the active bundle deterministic', () => {
    expect(compileProject()).toEqual(compileProject())
  })

  it('leaves the blank scaffold without compiled assets', () => {
    const bundle = compileProject('new-project-prototype')

    expect(bundle.clips).toEqual([])
    expect(bundle).toEqual(compileProject())
  })
})
