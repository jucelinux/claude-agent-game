import { describe, expect, it } from 'vitest'
import { compileProject, PROJECT_ID, PROJECT_SEED } from '../src/authoring/project.ts'

describe('portable bundle contract', () => {
  it('starts as a valid neutral project bundle', () => {
    const bundle = compileProject()

    expect(bundle).toMatchObject({
      format: 'agent-game-bundle',
      version: 1,
      project: PROJECT_ID,
      seed: PROJECT_SEED,
      clips: [],
    })
    expect(bundle.project).toBe('untitled-game')
    expect(bundle.checksum).toMatch(/^[0-9a-f]{8}$/)
  })

  it('keeps an empty catalog deterministic', () => {
    expect(compileProject()).toEqual(compileProject())
  })
})
