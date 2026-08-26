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
    expect(bundle.project).toBe('ashfall-prototype')
    expect(bundle.clips).toHaveLength(16)
    expect(bundle.checksum).toMatch(/^[0-9a-f]{8}$/)
  })

  it('keeps the active bundle deterministic', () => {
    expect(compileProject()).toEqual(compileProject())
  })

  it('builds an explicit deterministic bundle for Ashfall Expanse', () => {
    const first = compileProject('ashfall-prototype')
    const second = compileProject('ashfall-prototype')

    expect(first.checksum).toBe(second.checksum)
    expect(first.clips.map((clip) => clip.checksum))
      .toEqual(second.clips.map((clip) => clip.checksum))
    expect(first.project).toBe('ashfall-prototype')
    expect(first.clips).toHaveLength(16)
    expect(first.clips.every((clip) => clip.kind === 'character')).toBe(true)
    expect(first.clips.some((clip) => clip.id.includes('-procedural-'))).toBe(false)
    expect(first.clips.filter((clip) => clip.id.endsWith('-idle'))
      .every((clip) => clip.frames.length === 4)).toBe(true)
    expect(first.clips.filter((clip) => clip.id.endsWith('-walk'))
      .every((clip) => clip.frames.length === 16)).toBe(true)
    expect(first.seed).toBe(PROJECT_SEED)
    expect(first).toEqual(compileProject())
  })

  it('keeps the true-3D terrain study engine-neutral and deterministic', () => {
    const first = compileProject('sunlit-earth-prototype')
    const second = compileProject('sunlit-earth-prototype')

    expect(first).toEqual(second)
    expect(first.project).toBe('sunlit-earth-prototype')
    expect(first.clips).toEqual([])
    expect(first.seed).not.toBe(PROJECT_SEED)
  })
})
